import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

/**
 * Service for managing AI model configurations
 * Provides centralized access to AI model names with fallbacks to defaults
 */
@Injectable()
export class AiModelsService {
  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  getEventGenerationModel(): string {
    return (
      this.configService.get('AI_MODEL_EVENT_GENERATION') || 'openai/gpt-5.1'
    );
  }

  getEventModificationModel(): string {
    return (
      this.configService.get('AI_MODEL_EVENT_MODIFICATION') || 'openai/gpt-5.1'
    );
  }

  getExtractInjuryModel(): string {
    return (
      this.configService.get('AI_MODEL_EXTRACT_INJURY') || 'openai/gpt-5.1'
    );
  }

  getExtractRpeModel(): string {
    return this.configService.get('AI_MODEL_EXTRACT_RPE') || 'openai/gpt-5.1';
  }

  getPostActivityFeedbackModel(): string {
    return (
      this.configService.get('AI_MODEL_POST_ACTIVITY_FEEDBACK') ||
      'google/gemini-3-pro-preview'
    );
  }

  getQnaModel(): string {
    return this.configService.get('AI_MODEL_QNA') || 'openai/gpt-4o';
  }

  getTrimpEstimationModel(): string {
    return (
      this.configService.get('AI_MODEL_TRIMP_ESTIMATION') || 'openai/gpt-5.1'
    );
  }
}
