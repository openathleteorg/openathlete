import { getPath } from './routes/paths';
import { getApiBaseUrl } from './utils/capacitor';

export const PATH_AFTER_LOGIN = getPath(['dashboard']);

/**
 * Socket.IO URL of a namespace. With a relative API URL (the Docker image's
 * /api proxy), sockets go through the page's own origin, whose /socket.io
 * path reaches the API.
 */
export function socketUrl(namespace: string): string {
  const apiBaseUrl = getApiBaseUrl();
  const base = apiBaseUrl.startsWith('/') ? window.location.origin : apiBaseUrl;
  return `${base}/${namespace}`;
}
