declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: number;
    user_id?: number; // Alias for compatibility
    email: string;
    type: string;
    iat?: number;
    exp?: number;
  }

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string | Buffer,
    options?: {
      expiresIn?: string | number;
      algorithm?: string;
    },
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: {
      algorithms?: string[];
    },
  ): JwtPayload;
}

