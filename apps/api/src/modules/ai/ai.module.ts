import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiEnvSchemaType } from '@openathlete/shared';

import { SubscriptionModule } from '../subscription/subscription.module';
import { AiSettingsController } from './controllers/ai-settings.controller';
import { mastraModelRegistry } from './model-registry';
import { AiCredentialCipher } from './services/ai-credential-cipher';
import {
  AI_CREDENTIAL_CIPHER,
  AI_ENV,
  AiModelResolverService,
} from './services/ai-model-resolver.service';
import { AiPolicyService } from './services/ai-policy.service';
import {
  AiProviderCatalogService,
  MODEL_REGISTRY,
} from './services/ai-provider-catalog.service';
import { AiSettingsService } from './services/ai-settings.service';
import { AiUsageService } from './services/ai-usage.service';
import { AiService } from './services/ai.service';

@Module({
  imports: [forwardRef(() => SubscriptionModule)],
  controllers: [AiSettingsController],
  providers: [
    AiPolicyService,
    AiProviderCatalogService,
    AiModelResolverService,
    AiService,
    AiSettingsService,
    AiUsageService,
    { provide: MODEL_REGISTRY, useValue: mastraModelRegistry },
    // Instance keys of any provider (ANTHROPIC_API_KEY...) are read as-is
    { provide: AI_ENV, useValue: process.env },
    {
      provide: AI_CREDENTIAL_CIPHER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<ApiEnvSchemaType, true>) =>
        new AiCredentialCipher(config.getOrThrow('HASH_PEPPER')),
    },
  ],
  exports: [AiModelResolverService, AiService],
})
export class AiModule {}
