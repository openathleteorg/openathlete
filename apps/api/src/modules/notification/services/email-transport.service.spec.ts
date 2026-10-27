import { AddressInfo } from 'node:net';
import { SMTPServer } from 'smtp-server';

import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { EmailTransportService } from './email-transport.service';

// The parsed configuration: SMTP_PORT is a number, SMTP_SECURE a boolean
function createService(env: Partial<ApiEnvSchemaType>) {
  const config = {
    get: (key: keyof ApiEnvSchemaType) => env[key],
  } as unknown as ConfigService;
  return new EmailTransportService(config as never);
}

const email = { to: 'athlete@example.com', subject: 'Hi', html: '<p>Hi</p>' };

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('EmailTransportService', () => {
  it('is disabled and sends nothing without Brevo or SMTP', async () => {
    const service = createService({});

    expect(service.isEnabled()).toBe(false);
    await expect(service.send(email)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the email to Brevo', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));
    const service = createService({
      BREVO_API_KEY: 'key',
      BREVO_FROM_EMAIL: 'team@example.com',
    });

    await expect(
      service.send({ ...email, senderName: 'OpenAthlete' }),
    ).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers).toMatchObject({ 'api-key': 'key' });
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { email: 'team@example.com', name: 'OpenAthlete' },
      to: [{ email: 'athlete@example.com' }],
      subject: 'Hi',
      htmlContent: '<p>Hi</p>',
    });
  });

  it('falls back to the default sender address', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));
    await createService({ BREVO_API_KEY: 'key' }).send(email);

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.sender.email).toBe('noreply@openathlete.org');
  });

  it('throws when Brevo rejects the request', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"unauthorized"}', { status: 401 }),
    );

    await expect(
      createService({ BREVO_API_KEY: 'bad' }).send(email),
    ).rejects.toThrow('HTTP 401');
  });

  it('prefers EMAIL_FROM as the sender address', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));
    await createService({
      BREVO_API_KEY: 'key',
      BREVO_FROM_EMAIL: 'old@example.com',
      EMAIL_FROM: 'team@example.com',
    }).send(email);

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.sender.email).toBe('team@example.com');
  });
});

// A real SMTP server on a local port, so the test covers the whole exchange
describe('EmailTransportService over SMTP', () => {
  let server: SMTPServer;
  let port: number;
  const received: { from?: string; to: string[]; data: string }[] = [];
  const logins: { username?: string; password?: string }[] = [];

  beforeAll(async () => {
    server = new SMTPServer({
      // Plain text on localhost: no certificate to trust in the test
      disabledCommands: ['STARTTLS'],
      allowInsecureAuth: true,
      authOptional: true,
      logger: false,
      onAuth(auth, _session, callback) {
        // smtp-server 3.21 types both as possibly null
        logins.push({
          username: auth.username ?? undefined,
          password: auth.password ?? undefined,
        });
        if (auth.password !== 'secret') {
          return callback(new Error('Invalid username or password'));
        }
        callback(null, { user: auth.username });
      },
      onData(stream, session, callback) {
        let data = '';
        stream.on('data', (chunk: Buffer) => (data += chunk.toString()));
        stream.on('end', () => {
          received.push({
            from: session.envelope.mailFrom
              ? session.envelope.mailFrom.address
              : undefined,
            to: session.envelope.rcptTo.map((rcpt) => rcpt.address),
            data,
          });
          callback();
        });
      },
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    port = (server.server.address() as AddressInfo).port;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(resolve)));

  beforeEach(() => {
    received.length = 0;
    logins.length = 0;
  });

  const smtpEnv = (
    extra: Partial<ApiEnvSchemaType> = {},
  ): Partial<ApiEnvSchemaType> => ({
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: port,
    SMTP_SECURE: false,
    EMAIL_FROM: 'team@example.com',
    ...extra,
  });

  it('delivers the email to the SMTP server', async () => {
    const service = createService(smtpEnv());
    expect(service.isEnabled()).toBe(true);

    await expect(
      service.send({ ...email, senderName: 'OpenAthlete' }),
    ).resolves.toBe(true);

    expect(received).toHaveLength(1);
    expect(received[0].from).toBe('team@example.com');
    expect(received[0].to).toEqual(['athlete@example.com']);
    expect(received[0].data).toContain('From: OpenAthlete <team@example.com>');
    expect(received[0].data).toContain('Subject: Hi');
    expect(received[0].data).toContain('<p>Hi</p>');
    expect(logins).toEqual([]);
  });

  it('signs in when credentials are set', async () => {
    await createService(
      smtpEnv({ SMTP_USER: 'mailer', SMTP_PASSWORD: 'secret' }),
    ).send(email);

    expect(logins).toEqual([{ username: 'mailer', password: 'secret' }]);
    expect(received).toHaveLength(1);
  });

  it('throws when the server refuses the credentials', async () => {
    await expect(
      createService(
        smtpEnv({ SMTP_USER: 'mailer', SMTP_PASSWORD: 'wrong' }),
      ).send(email),
    ).rejects.toThrow();
    expect(received).toEqual([]);
  });

  it('uses Brevo when both are configured', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));
    await createService(smtpEnv({ BREVO_API_KEY: 'key' })).send(email);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(received).toEqual([]);
  });
});
