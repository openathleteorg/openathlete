import { Agent } from '@mastra/core/agent';
import type { MastraModelConfig } from '@mastra/core/llm';
import type { z } from 'zod';

import { Injectable, Logger } from '@nestjs/common';

import { AiErrorCode, instructionTaskFor } from '@openathlete/shared';

import {
  ClaudeEffort,
  claudeEffortFor,
} from 'src/common/constants/ai-models.constant';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AiProviderException, toAiProviderException } from '../ai.errors';
import { withCustomInstructions } from '../custom-instructions';
import { AiModelConfig, ResolvedAiModel } from './ai-model-resolver.service';
import { AiUsageService, TokenUsage } from './ai-usage.service';

/** What an agent is, independently of the model it runs on. */
export interface AgentSpec {
  id: string;
  name: string;
  description?: string;
  instructions: string;
}

/** Long structured generations (full workouts) can take a while. */
const CALL_TIMEOUT_MS = 120_000;

/**
 * The provider SDK already retries transient failures (3 attempts with
 * backoff), so callers only retry invalid answers, never provider errors.
 */
const callSettings = () => ({
  abortSignal: AbortSignal.timeout(CALL_TIMEOUT_MS),
});

/** Claude's reasoning effort for the feature, where the model takes one */
const anthropicOptions = (
  model: ResolvedAiModel,
): { anthropic?: { effort: ClaudeEffort } } => {
  const effort = claudeEffortFor(model.task, model.provider, model.modelId);
  return effort ? { anthropic: { effort } } : {};
};

/**
 * Runs AI agents on the model the resolver picked: the user's own key or the
 * instance's. Every model call of the API goes through here, so errors are
 * translated once (rejected key, quota...) and keys' health is tracked.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: AiUsageService,
  ) {}

  async generateText(
    agent: AgentSpec,
    model: ResolvedAiModel,
    prompt: string,
  ): Promise<string> {
    const spec = await this.withUserInstructions(agent, model);
    const result = await this.run(model, () =>
      this.createAgent(spec, model.config).generate(prompt, {
        ...callSettings(),
        providerOptions: anthropicOptions(model),
      }),
    );
    if (!result.text) {
      throw new AiProviderException(
        AiErrorCode.PROVIDER_ERROR,
        'The AI model returned an empty answer',
      );
    }
    return result.text;
  }

  /**
   * Generates a value matching the schema. Models without native JSON output,
   * and Claude, get the schema in the prompt instead; OpenAI's strict mode
   * stays off as it rejects recursive schemas (workout repeat blocks).
   */
  async generateObject<S extends z.ZodTypeAny>(
    agent: AgentSpec,
    model: ResolvedAiModel,
    prompt: string,
    schema: S,
  ): Promise<z.output<S>> {
    const spec = await this.withUserInstructions(agent, model);
    const result = await this.run(model, () =>
      this.createAgent(spec, model.config).generate(prompt, {
        ...callSettings(),
        structuredOutput: {
          schema,
          // Claude's native JSON output refuses recursive schemas (workout
          // repeat blocks): the schema goes in the prompt and the answer is
          // validated against it here
          jsonPromptInjection: model.provider === 'anthropic' ? true : 'auto',
        },
        providerOptions: {
          openai: { strictJsonSchema: false },
          ...anthropicOptions(model),
        },
      }),
    );
    if (result.object === undefined || result.object === null) {
      throw new AiProviderException(
        AiErrorCode.PROVIDER_ERROR,
        'The AI model did not return a valid result',
      );
    }
    return result.object as z.output<S>;
  }

  /** A minimal call checking that a key and model work together. */
  async ping(config: AiModelConfig): Promise<void> {
    await this.createAgent(
      {
        id: 'credential-check',
        name: 'Credential check',
        instructions: 'Answer with the single word OK.',
      },
      config,
    ).generate('Say OK.', { abortSignal: AbortSignal.timeout(30_000) });
  }

  /**
   * The key's owner can tell a feature how to work for them (Settings > AI).
   * Their instructions never reach the instance keys: those run the generic
   * prompts only, and stay within the cost the allowance was sized for.
   */
  private async withUserInstructions(
    agent: AgentSpec,
    model: ResolvedAiModel,
  ): Promise<AgentSpec> {
    const task = instructionTaskFor(model.task);
    if (model.source !== 'own_key' || !task) return agent;
    const custom = await this.prisma.aiCustomInstruction.findUnique({
      where: { userId_task: { userId: model.userId, task } },
      select: { instructions: true },
    });
    if (!custom) return agent;
    return {
      ...agent,
      instructions: withCustomInstructions(
        agent.instructions,
        custom.instructions,
      ),
    };
  }

  private createAgent(spec: AgentSpec, config: AiModelConfig) {
    return new Agent({
      id: spec.id,
      name: spec.name,
      description: spec.description,
      instructions: spec.instructions,
      model: config as MastraModelConfig,
    });
  }

  private async run<T extends { totalUsage?: TokenUsage; usage?: TokenUsage }>(
    model: ResolvedAiModel,
    call: () => Promise<T>,
  ): Promise<T> {
    const started = Date.now();
    try {
      const result = await call();
      this.logger.debug(
        `${model.task} ran on ${model.provider}/${model.modelId} (${model.source}) in ${Date.now() - started}ms`,
      );
      await this.recordCredentialUse(model, null);
      // Across all steps; failed calls are not counted, their usage is unknown
      await this.usage.record(model, result.totalUsage ?? result.usage);
      return result;
    } catch (error) {
      const failure = toAiProviderException(error);
      this.logger.warn(
        `${model.task} failed on ${model.provider}/${model.modelId} (${model.source}): ${failure.code} ${failure.providerStatus ?? ''} ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.recordCredentialUse(model, failure);
      throw failure;
    }
  }

  /** Lets the settings show which keys work, without failing the call. */
  private async recordCredentialUse(
    model: ResolvedAiModel,
    failure: AiProviderException | null,
  ) {
    if (model.credentialId === null) return;
    const keyProblem =
      failure?.code === AiErrorCode.CREDENTIAL_REJECTED ||
      failure?.code === AiErrorCode.QUOTA_EXCEEDED;
    if (failure && !keyProblem) return;
    try {
      await this.prisma.aiCredential.update({
        where: { aiCredentialId: model.credentialId },
        data: failure
          ? { lastError: failure.code, lastErrorAt: new Date() }
          : { lastUsedAt: new Date(), lastError: null, lastErrorAt: null },
      });
    } catch (error) {
      this.logger.warn(
        `Could not record use of AI credential ${model.credentialId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
