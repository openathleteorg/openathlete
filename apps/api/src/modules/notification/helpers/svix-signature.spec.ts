import { createHmac } from 'node:crypto';

import { verifySvixSignature } from './svix-signature';

// The example of the Svix documentation
const secret = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const headers = {
  id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
  timestamp: '1614265330',
  signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
};
const body = '{"test": 2432232314}';
const sentAt = new Date(1614265330 * 1000);

describe('verifySvixSignature', () => {
  it('accepts the signed example', () => {
    expect(verifySvixSignature(secret, body, headers, sentAt)).toBe(true);
    expect(
      verifySvixSignature(secret, Buffer.from(body), headers, sentAt),
    ).toBe(true);
  });

  it('accepts any of several signatures', () => {
    const rotated = { ...headers, signature: `v1,AAAA ${headers.signature}` };
    expect(verifySvixSignature(secret, body, rotated, sentAt)).toBe(true);
  });

  it('refuses a changed body, a wrong secret and missing headers', () => {
    expect(verifySvixSignature(secret, '{"test": 1}', headers, sentAt)).toBe(
      false,
    );
    expect(verifySvixSignature('whsec_b3RoZXI=', body, headers, sentAt)).toBe(
      false,
    );
    expect(
      verifySvixSignature(secret, body, { ...headers, signature: '' }, sentAt),
    ).toBe(false);
  });

  it('refuses a message that is too old', () => {
    const later = new Date(sentAt.getTime() + 6 * 60 * 1000);
    expect(verifySvixSignature(secret, body, headers, later)).toBe(false);
  });

  it('matches what it computes itself', () => {
    const key = Buffer.from('c2VjcmV0', 'base64');
    const signature = createHmac('sha256', key)
      .update(`id.1700000000.${body}`)
      .digest('base64');
    expect(
      verifySvixSignature(
        'whsec_c2VjcmV0',
        body,
        { id: 'id', timestamp: '1700000000', signature: `v1,${signature}` },
        new Date(1700000000 * 1000),
      ),
    ).toBe(true);
  });
});
