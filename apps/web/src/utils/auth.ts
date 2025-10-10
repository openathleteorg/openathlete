import { API_BASE_URL } from '@/config';
import axios from 'axios';

import { routes } from './axios';
import { ACCESS_TOKEN, REFRESH_TOKEN, getItem } from './local-storage';

function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );
    return decoded;
  } catch {
    return null;
  }
}

type TokenInfo = {
  accessToken: string;
  refreshed: boolean;
} & (
  | {
      refreshed: true;
      refreshToken: string;
    }
  | {
      refreshed: false;
      refreshToken?: never;
    }
);

export async function refreshToken(): Promise<TokenInfo | null> {
  const token = getItem(REFRESH_TOKEN);
  if (!token) return null;

  try {
    const tokenData = await axios.post(
      `${API_BASE_URL}${routes.auth.refreshToken}`,
      {
        refreshToken: token,
      },
    );

    if (!tokenData.data) return null;
    const { accessToken, refreshToken } = tokenData.data;

    return {
      accessToken,
      refreshToken,
      refreshed: true,
    };
  } catch {
    return null;
  }
}

export function isValidToken(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return false;
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function getAccessToken(): Promise<TokenInfo | null> {
  const token = getItem(ACCESS_TOKEN);
  if (!token) return refreshToken();
  if (!isValidToken(token)) return refreshToken();
  return { accessToken: token, refreshed: false };
}
