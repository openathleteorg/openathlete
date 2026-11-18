import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

/**
 * Encrypts users' AI provider keys at rest (AES-256-GCM).
 *
 * The key is derived from HASH_PEPPER, which never changes on an instance
 * (passwords depend on it too), so no extra secret has to be configured.
 * Values are versioned (`v1:iv:tag:ciphertext`) to allow a later rotation.
 */
export class AiCredentialCipher {
  private readonly key: Buffer;

  constructor(secret: string, context = 'openathlete/ai-credentials') {
    if (!secret) {
      throw new Error('AiCredentialCipher needs a secret');
    }
    this.key = Buffer.from(
      hkdfSync('sha256', secret, Buffer.alloc(0), context, 32),
    );
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return [
      VERSION,
      iv.toString('base64'),
      cipher.getAuthTag().toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  /** Throws when the value was tampered with or encrypted with another key. */
  decrypt(value: string): string {
    const [version, iv, tag, ciphertext] = value.split(':');
    if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
      throw new Error('Unsupported encrypted value');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}

/** The last characters of a key, enough to recognise it in the settings. */
export function apiKeyHint(apiKey: string): string {
  if (!apiKey) return '';
  return apiKey.length <= 8 ? '••••' : `••••${apiKey.slice(-4)}`;
}
