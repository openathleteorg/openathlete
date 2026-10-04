import { INestApplication } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';

import { ManualFitImportService } from '../services/manual-fit-import.service';
import { ManualFitImportController } from './manual-fit-import.controller';

jest.mock('@garmin/fitsdk', () =>
  process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  ),
);

// Exercise the real multipart interceptor and Zod body pipe over local HTTP.
// File decoding/persistence is covered by manual-fit-import.spec.ts.
describe('Manual FIT multipart upload', () => {
  let app: INestApplication;
  let origin: string;
  const service = { import: jest.fn().mockResolvedValue({ eventId: 90 }) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ManualFitImportController],
      providers: [{ provide: ManualFitImportService, useValue: service }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = { userId: 4 };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    service.import.mockClear();
  });
  const form = () => {
    const data = new FormData();
    data.append('file', new Blob(['fixture']), 'test.fit');
    data.append('name', 'My activity');
    return data;
  };
  test('accepts exactly one file and its activity name', async () => {
    const response = await fetch(origin + '/activity-import/fit', {
      method: 'POST',
      body: form(),
    });
    expect(response.status).toBe(201);
    expect(service.import).toHaveBeenCalledWith(
      { userId: 4 },
      expect.objectContaining({
        originalname: 'test.fit',
        buffer: Buffer.from('fixture'),
      }),
      'My activity',
    );
  });
  test('rejects a supplied athlete ID instead of trusting form ownership', async () => {
    const data = form();
    data.append('athleteId', '999');
    const response = await fetch(origin + '/activity-import/fit', {
      method: 'POST',
      body: data,
    });
    expect(response.status).toBe(400);
    expect(service.import).not.toHaveBeenCalled();
  });
});
