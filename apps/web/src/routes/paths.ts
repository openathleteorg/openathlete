type Path =
  | {
      root: string;
      [key: string]: Path | string;
    }
  | string;

type Paths = Record<string, Path>;

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
} as const;

export const paths: Paths = {
  page403: '/403',
  page404: '/404',
  page500: '/500',

  // AUTH
  auth: {
    root: ROOTS.AUTH,
    login: `${ROOTS.AUTH}/login`,
    createAccount: `${ROOTS.AUTH}/create-account`,
    oauth: `${ROOTS.AUTH}/callback/:provider`,
    passwordReset: `${ROOTS.AUTH}/password-reset`,
    passwordResetRequest: `${ROOTS.AUTH}/password-reset-request`,
  },

  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    coach: `${ROOTS.DASHBOARD}/coach`,
    calendar: {
      root: `${ROOTS.DASHBOARD}/calendar`,
      athleteId: `${ROOTS.DASHBOARD}/calendar/:athleteId`,
    },
    summary: {
      root: `${ROOTS.DASHBOARD}/summary`,
      athleteId: `${ROOTS.DASHBOARD}/summary/:athleteId`,
    },
    statistics: {
      root: `${ROOTS.DASHBOARD}/statistics`,
      athleteId: `${ROOTS.DASHBOARD}/statistics/:athleteId`,
    },
    records: {
      root: `${ROOTS.DASHBOARD}/records`,
      athleteId: `${ROOTS.DASHBOARD}/records/:athleteId`,
    },
    metrics: {
      root: `${ROOTS.DASHBOARD}/metrics`,
      athleteId: `${ROOTS.DASHBOARD}/metrics/:athleteId`,
    },
    settings: {
      root: `${ROOTS.DASHBOARD}/settings`,
      athleteId: `${ROOTS.DASHBOARD}/settings/:athleteId`,
    },
    racePlan: {
      root: `${ROOTS.DASHBOARD}/race-plan`,
      viewer: `${ROOTS.DASHBOARD}/race-plan/viewer`,
    },
    messages: `${ROOTS.DASHBOARD}/messages`,
  },
} as const;

/**
 * Get the path from the paths object
 * @example getPath(['auth', 'login']) -> '/auth/login'
 * @example getPath(['dashboard']) -> '/dashboard'
 * @example getPath(['dashboard', 'root']) -> '/dashboard'
 */
export const getPath = (parts: string[]): string => {
  const path = parts.reduce(
    (acc: Path, part) => (acc as any)[part],
    paths as Path,
  );
  if (!path) {
    throw new Error(`Path not found: ${parts.join('/')}`);
  }
  return typeof path === 'string' ? path : path.root;
};

/**
 * Extracts the last segment from a URL path
 * Removes any trailing slash before extracting the final path segment
 *
 * @param path - The URL path to process
 * @returns The last segment of the path
 * @example getPathEnd('/auth/jwt') // Returns 'jwt'
 * @example getPathEnd('/auth/jwt/') // Also returns 'jwt'
 */
export const getPathEnd = (path: string) =>
  path.replace(/\/$/, '').split('/').pop();

/**
 * Extracts a specified number of segments from the end of a URL path
 *
 * @param path - The URL path to process
 * @param N - The number of path segments to extract from the end
 * @returns The concatenated last N segments of the path
 * @example getLastNPaths('/auth/jwt/login', 2) // Returns 'jwt/login'
 * @example getLastNPaths('/api/users/profile/settings', 3) // Returns 'users/profile/settings'
 */
export const getLastNPaths = (path: string, N: number) =>
  path.split('/').slice(-N).join('/');
