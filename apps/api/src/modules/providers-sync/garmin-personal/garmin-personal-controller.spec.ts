import { ExecutionContext, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';

import {
  GarminPersonalController,
  GarminPersonalEnabledGuard,
} from './garmin-personal-controller';
import { GarminPersonalService } from './garmin-personal-service';

jest.mock('./garmin-personal-service', () => ({
  GarminPersonalService: class {},
}));

describe('GarminPersonalController feature flag', () => {
  let app: INestApplication;
  let origin: string;
  let enabled = false;
  const disconnected = { status: 'disconnected' };
  const service = {
    status: jest.fn().mockResolvedValue(disconnected),
    disconnect: jest.fn().mockResolvedValue(disconnected),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [GarminPersonalController],
      providers: [
        GarminPersonalEnabledGuard,
        { provide: GarminPersonalService, useValue: service },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'GARMIN_PERSONAL_API_ENABLED' ? enabled : undefined,
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { userId: 7 };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(() => app.close());
  beforeEach(() => {
    enabled = false;
    jest.clearAllMocks();
  });

  it('still lets users delete their stored key when the feature is off', async () => {
    const r = await fetch(`${origin}/provider/garmin-personal`, {
      method: 'DELETE',
    });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual(disconnected);
    expect(service.disconnect).toHaveBeenCalledWith(7);
  });

  it('answers 503 on the other routes when the feature is off', async () => {
    const r = await fetch(`${origin}/provider/garmin-personal`);
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({
      message: 'PROVIDER_NOT_CONFIGURED',
    });
    expect(service.status).not.toHaveBeenCalled();
  });

  it('serves the other routes when the feature is on', async () => {
    enabled = true;
    const r = await fetch(`${origin}/provider/garmin-personal`);
    expect(r.status).toBe(200);
    expect(service.status).toHaveBeenCalledWith(7);
  });
});
