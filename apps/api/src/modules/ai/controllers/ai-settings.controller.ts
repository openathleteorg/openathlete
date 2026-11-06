import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  CreateAiCredentialDto,
  TestAiCredentialDto,
  UpdateAiModelPreferencesDto,
  createAiCredentialDtoSchema,
  testAiCredentialDtoSchema,
  updateAiModelPreferencesDtoSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';
// Direct paths: the auth module index is still loading when the AI module
// is reached through the queue module
import { AuthUser, JwtUser } from 'src/modules/auth/decorators/user.decorator';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';

import { AiSettingsService } from '../services/ai-settings.service';

@ApiTags('AI settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('ai')
export class AiSettingsController {
  constructor(private readonly settings: AiSettingsService) {}

  @Get('providers')
  @ApiOperation({
    summary: 'List AI providers and models',
    description:
      'Providers users can add a key for, featured ones first, with their known models. Includes "custom" (any OpenAI-compatible endpoint) when the instance allows custom endpoints.',
  })
  listProviders() {
    return this.settings.listProviders();
  }

  @Get('credentials')
  @ApiOperation({
    summary: "List the user's AI keys",
    description:
      'Keys and custom header values are never returned, only the key hint, the custom header names and the last error, if any.',
  })
  listCredentials(@JwtUser() user: AuthUser) {
    return this.settings.listCredentials(user.userId);
  }

  @Post('credentials')
  @ApiOperation({
    summary: 'Add an AI key',
    description:
      'Stores an API key for a provider, encrypted at rest, with optional custom headers for gateways that require them. A base URL is only accepted when the instance allows custom endpoints.',
  })
  @ApiResponse({ status: 201, description: 'Key stored' })
  @ApiResponse({
    status: 400,
    description:
      'Unknown or disallowed provider, missing key, or too many keys',
  })
  createCredential(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAiCredentialDtoSchema))
    body: CreateAiCredentialDto,
  ) {
    return this.settings.createCredential(user.userId, body);
  }

  @Delete('credentials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an AI key',
    description: 'Model choices using the key are removed with it.',
  })
  async deleteCredential(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.settings.deleteCredential(user.userId, id);
  }

  @Post('credentials/:id/test')
  @HttpCode(HttpStatus.OK)
  @Throttle(RATE_LIMITS.aiCheck)
  @ApiOperation({
    summary: 'Test an AI key with a model',
    description:
      'Sends a one-word prompt to the model with the key, through the same endpoint and custom headers as real generations. Returns ok, or the error code (AI_CREDENTIAL_REJECTED, AI_QUOTA_EXCEEDED, AI_PROVIDER_ERROR).',
  })
  testCredential(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(testAiCredentialDtoSchema))
    body: TestAiCredentialDto,
  ) {
    return this.settings.testCredential(user.userId, id, body.modelId);
  }

  @Get('models')
  @ApiOperation({
    summary: "Get the user's model choices",
    description:
      'One entry per task with a chosen model; DEFAULT applies to tasks without their own entry.',
  })
  getModelPreferences(@JwtUser() user: AuthUser) {
    return this.settings.getModelPreferences(user.userId);
  }

  @Put('models')
  @ApiOperation({
    summary: "Replace the user's model choices",
    description:
      'Sets the model and key used per task. Tasks left out use the DEFAULT entry, or the instance keys when the plan includes hosted AI.',
  })
  updateModelPreferences(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateAiModelPreferencesDtoSchema))
    body: UpdateAiModelPreferencesDto,
  ) {
    return this.settings.updateModelPreferences(user.userId, body);
  }

  @Get('access')
  @ApiOperation({
    summary: 'Which AI features are available, and on which model',
    description:
      "For each feature: whether it can run, on the user's own key or the instance keys, and with which model. With athleteId, background features (feedback questions, analysis, load estimation) consider the athlete and their coaches.",
  })
  @ApiQuery({ name: 'athleteId', required: false, type: Number })
  getAccess(
    @JwtUser() user: AuthUser,
    @Query('athleteId', new ParseIntPipe({ optional: true }))
    athleteId?: number,
  ) {
    return this.settings.getAccess(user.userId, athleteId);
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Allow data to be sent to AI providers',
    description:
      "Records that the user allows their training data (planned sessions, activity summaries, metrics, the notes and feedback they write, voice notes) to be sent to the AI providers listed by GET /ai/access. No AI feature runs on the user's data without it, as App Store guideline 5.1.2(i) and the GDPR require. Returns the updated access.",
  })
  @ApiResponse({ status: 200, description: 'The updated AI access' })
  allowDataSharing(@JwtUser() user: AuthUser) {
    return this.settings.setDataSharingConsent(user.userId, true);
  }

  @Delete('consent')
  @ApiOperation({
    summary: 'Withdraw the permission to send data to AI providers',
    description:
      "From now on, no AI feature runs on the user's data, in the background or on demand, until they allow it again. Returns the updated access.",
  })
  @ApiResponse({ status: 200, description: 'The updated AI access' })
  withdrawDataSharing(@JwtUser() user: AuthUser) {
    return this.settings.setDataSharingConsent(user.userId, false);
  }
}
