import { aiCredentialHeadersSchema } from '@openathlete/shared';

import {
  mergeCredentialHeaders,
  normalizeCredentialHeaders,
  parseCredentialHeaders,
  providerHeaders,
} from './ai-credential-headers';

describe('AI credential headers', () => {
  it('normalizes header names and values', () => {
    expect(
      normalizeCredentialHeaders({ ' X-Custom-Header ': ' value ' }),
    ).toEqual({ 'x-custom-header': 'value' });
  });

  it('reads stored headers, and ignores malformed values', () => {
    expect(parseCredentialHeaders('{"X-Custom-Header":"value"}')).toEqual({
      'x-custom-header': 'value',
    });
    expect(parseCredentialHeaders('not json')).toEqual({});
    expect(parseCredentialHeaders('["value"]')).toEqual({});
  });

  it('adds a session id for OpenCode Go but lets custom headers win', () => {
    expect(providerHeaders('openai')).toEqual({});

    const generated = providerHeaders('opencode-go');
    expect(generated['x-opencode-session']).toEqual(expect.any(String));

    expect(
      mergeCredentialHeaders('opencode-go', {
        'x-opencode-session': 'my-session',
      }),
    ).toEqual({ 'x-opencode-session': 'my-session' });
  });

  it('refuses headers the API controls', () => {
    expect(
      aiCredentialHeadersSchema.safeParse({ authorization: 'Bearer x' })
        .success,
    ).toBe(false);
    expect(
      aiCredentialHeadersSchema.safeParse({ 'x-opencode-session': 'id' })
        .success,
    ).toBe(true);
    // Other providers' auth headers, in any case
    expect(
      aiCredentialHeadersSchema.safeParse({ 'X-Api-Key': 'key' }).success,
    ).toBe(false);
  });

  it('refuses values fetch cannot send', () => {
    // Above 0xFF, every call made with the key would throw
    expect(
      aiCredentialHeadersSchema.safeParse({ 'x-title': 'Coût 5 €' }).success,
    ).toBe(false);
    expect(
      aiCredentialHeadersSchema.safeParse({ 'x-title': 'a\r\nb: c' }).success,
    ).toBe(false);
    expect(
      aiCredentialHeadersSchema.safeParse({ 'x-title': 'OpenAthlete 1.0' })
        .success,
    ).toBe(true);
  });
});
