import { fetchPublicJson, isPublicAddress } from './public-fetch';

describe('public fetch', () => {
  it('tells public addresses from the server network', () => {
    expect(isPublicAddress('93.184.215.14')).toBe(true);
    expect(isPublicAddress('2606:4700::6810:84e5')).toBe(true);
    for (const address of [
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.5',
      '192.168.1.10',
      '169.254.169.254',
      '100.100.0.1',
      '0.0.0.0',
      '::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      '::ffff:a9fe:a9fe',
      'fd12::1',
      'fe80::1',
      'not-an-address',
    ]) {
      expect(isPublicAddress(address)).toBe(false);
    }
  });

  it('refuses plain http and hosts resolving to the server network', async () => {
    await expect(
      fetchPublicJson(new URL('http://example.com/client.json')),
    ).rejects.toThrow('Only https');
    await expect(
      fetchPublicJson(new URL('https://localhost/client.json')),
    ).rejects.toThrow('not a public address');
    await expect(
      fetchPublicJson(new URL('https://127.0.0.1/client.json')),
    ).rejects.toThrow();
  });
});
