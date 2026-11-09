import axios from 'axios';
import { z } from 'zod';

import { Injectable } from '@nestjs/common';

const BASE = 'https://personal.connectapi.garmin.com';
const TOKEN_PATH =
  '/personalapitoken-service/personal-api/personal-api-key/token';
const MAX_BYTES = 25 * 1024 * 1024;
export class GarminPersonalError extends Error {
  constructor(
    readonly code:
      | 'key_required'
      | 'rate_limited'
      | 'unavailable'
      | 'invalid_response'
      | 'access_denied',
  ) {
    super(code);
  }
}
export interface PersonalCredentials {
  apiKey: string;
  token: string;
  expiresAt: number;
}
export const garminActivityId = z.union([
  z.string().regex(/^[1-9]\d{0,19}$/),
  z.number().int().positive().safe().transform(String),
]);
export const activityListSchema = z.array(
  z.object({
    activityId: garminActivityId,
    activityName: z.string().max(500).optional(),
  }),
);

@Injectable()
export class GarminPersonalClient {
  // Fixed origin, no redirects, bounded responses; no raw Axios error can escape with headers.
  private async request(
    method: 'GET' | 'POST',
    path: string,
    authorization: string,
    params?: Record<string, string | number>,
    binary = false,
  ): Promise<unknown> {
    try {
      const response = await axios.request({
        method,
        url: BASE + path,
        headers: {
          Authorization: authorization,
          // Garmin serves FIT archives as application/x-zip-compressed.
          // Requiring application/zip causes its content negotiation to return 406.
          Accept: '*/*',
        },
        params,
        timeout: 30000,
        maxRedirects: 0,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        responseType: binary ? 'arraybuffer' : 'text',
        transformResponse: [(data: unknown) => data],
      });
      return response.data;
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      throw new GarminPersonalError(
        status === 401 ||
          (status === 403 && method === 'POST' && path === TOKEN_PATH)
          ? 'key_required'
          : status === 403
            ? 'access_denied'
            : status === 429
              ? 'rate_limited'
              : 'unavailable',
      );
    }
  }
  async authorize(apiKey: string): Promise<PersonalCredentials> {
    const value = await this.request('POST', TOKEN_PATH, `ApiKey ${apiKey}`);
    try {
      const token = z.string().trim().max(32000).parse(value);
      const parts = token.split('.');
      if (
        parts.length !== 3 ||
        !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))
      )
        throw new Error();
      // Only cache expiry metadata from Garmin's HTTPS response, never use it as app authentication.
      const { exp } = z
        .object({ exp: z.number().int().positive() })
        .parse(JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')));
      if (exp * 1000 <= Date.now()) throw new Error();
      return {
        apiKey,
        token,
        expiresAt: Math.min(exp * 1000, Date.now() + 86400000),
      };
    } catch {
      throw new GarminPersonalError('invalid_response');
    }
  }
  async get(
    credentials: PersonalCredentials,
    path: string,
    params?: Record<string, string | number>,
    binary = false,
  ): Promise<unknown> {
    const value = await this.request(
      'GET',
      path,
      `Bearer ${credentials.token}`,
      params,
      binary,
    );
    if (binary) return Buffer.from(value as ArrayBuffer);
    if (value === '') return null;
    try {
      return JSON.parse(z.string().parse(value));
    } catch {
      throw new GarminPersonalError('invalid_response');
    }
  }
  activities(
    credentials: PersonalCredentials,
    startDate: string,
    endDate: string,
    start: number,
  ) {
    return this.get(
      credentials,
      '/activitylist-service/activities/search/activities',
      {
        start,
        limit: 100,
        startDate,
        endDate,
        sortOrder: 'asc',
        excludeChildren: 'true',
      },
    ).then((data) => {
      const parsed = activityListSchema.max(100).safeParse(data);
      if (!parsed.success) throw new GarminPersonalError('invalid_response');
      return parsed.data;
    });
  }
  async download(credentials: PersonalCredentials, id: string) {
    return this.get(
      credentials,
      `/download-service/files/activity/${garminActivityId.parse(id)}`,
      undefined,
      true,
    ) as Promise<Buffer>;
  }
}
