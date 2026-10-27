import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

/** Domain-separated authenticated encryption, additionally bound to the owning athlete. */
export class GarminPersonalCipher {
  private readonly key: Buffer;
  constructor(secret: string) {
    if (!secret) throw new Error('Missing credential encryption secret');
    this.key = Buffer.from(
      hkdfSync(
        'sha256',
        secret,
        Buffer.alloc(0),
        'openathlete/garmin-personal',
        32,
      ),
    );
  }
  encrypt(athleteId: number, value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(String(athleteId)));
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [
      'v1',
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      data.toString('base64'),
    ].join(':');
  }
  decrypt(athleteId: number, value: string): string {
    const [version, iv, tag, data] = value.split(':');
    if (version !== 'v1' || !iv || !tag || !data)
      throw new Error('Invalid encrypted credential');
    const cipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv, 'base64'),
    );
    cipher.setAAD(Buffer.from(String(athleteId)));
    cipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      cipher.update(Buffer.from(data, 'base64')),
      cipher.final(),
    ]).toString('utf8');
  }
}
