import { Body, Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { configureBodyParsers } from './body-parsers';

@Controller()
class BodyParsingController {
  @Post([
    'auth/login',
    'auth/refresh-token',
    'activity-import/healthkit',
    'oauth/token',
    'signed-webhook',
  ])
  echo(
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Record<string, unknown>>,
  ) {
    return { body, rawBody: request.rawBody?.toString('utf8') };
  }
}

describe('production request body parsers', () => {
  let app: NestExpressApplication;
  let origin: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [BodyParsingController],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>({
      rawBody: true,
    });
    configureBodyParsers(app);
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });

  afterAll(() => app.close());

  const send = (path: string, body: unknown) =>
    fetch(origin + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it.each([
    [
      '/auth/login',
      { email: 'athlete@example.org', password: 'test-password' },
    ],
    ['/auth/refresh-token', { refreshToken: 'test-refresh-token' }],
  ])('parses JSON on %s alongside the workout parser', async (path, body) => {
    const response = await send(path as string, body);
    expect(response.status).toBe(201);
    expect((await response.json()).body).toEqual(body);
  });

  it('accepts workout JSON larger than the default limit', async () => {
    const body = { samples: 'x'.repeat(200 * 1024) };
    const response = await send('/activity-import/healthkit', body);
    expect(response.status).toBe(201);
    expect((await response.json()).body).toEqual(body);
  });

  it('retains the normal JSON limit outside workout ingestion', async () => {
    const response = await send('/auth/login', {
      data: 'x'.repeat(200 * 1024),
    });
    expect(response.status).toBe(413);
  });

  it('rejects workout bodies above 20 MB', async () => {
    const response = await send('/activity-import/healthkit', {
      samples: 'x'.repeat(20 * 1024 * 1024),
    });
    expect(response.status).toBe(413);
  });

  it('preserves the raw JSON bytes needed by signed webhooks', async () => {
    const rawBody = '{ "signed": true }';
    const response = await fetch(origin + '/signed-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody,
    });
    expect(await response.json()).toEqual({ body: { signed: true }, rawBody });
  });

  it('still parses form-encoded OAuth token requests', async () => {
    const response = await fetch(origin + '/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=authorization_code&code=test-code',
    });
    expect((await response.json()).body).toEqual({
      grant_type: 'authorization_code',
      code: 'test-code',
    });
  });
});
