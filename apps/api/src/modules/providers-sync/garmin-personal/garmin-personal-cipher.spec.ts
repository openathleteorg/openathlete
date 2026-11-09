import { GarminPersonalCipher } from './garmin-personal-cipher';

describe('Garmin Personal credentials', () => {
  const cipher = new GarminPersonalCipher('a-secret-used-only-in-tests');
  it('encrypts keys and tokens at rest with fresh nonces', () => {
    const value = JSON.stringify({
      apiKey: 'test-personal-key',
      token: 'test-token',
    });
    const encrypted = cipher.encrypt(1, value);
    expect(encrypted).not.toContain('test-personal-key');
    expect(cipher.decrypt(1, encrypted)).toBe(value);
    expect(cipher.encrypt(1, value)).not.toBe(encrypted);
  });
  it('rejects another owner, another instance secret and tampering', () => {
    const value = cipher.encrypt(1, 'test-private-key');
    expect(() => cipher.decrypt(2, value)).toThrow();
    expect(() =>
      new GarminPersonalCipher('another-secret').decrypt(1, value),
    ).toThrow();
    const parts = value.split(':');
    parts[2] = Buffer.alloc(16).toString('base64');
    expect(() => cipher.decrypt(1, parts.join(':'))).toThrow();
  });
});
