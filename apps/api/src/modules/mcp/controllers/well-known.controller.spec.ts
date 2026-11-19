import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { OAuthService } from '../auth/oauth.service';
import { WellKnownController } from './well-known.controller';

function controller(token?: string) {
  const config = {
    get: () => token,
  } as unknown as ConfigService<ApiEnvSchemaType, true>;
  return new WellKnownController({} as OAuthService, config);
}

describe('WellKnownController.openAiAppsChallengeToken', () => {
  it('serves the configured token', () => {
    expect(controller('abc-123').openAiAppsChallengeToken()).toBe('abc-123');
  });

  it.each([undefined, ''])(
    'answers 404 when the token is %p, as on self-hosted instances',
    (token) => {
      expect(() => controller(token).openAiAppsChallengeToken()).toThrow(
        NotFoundException,
      );
    },
  );
});
