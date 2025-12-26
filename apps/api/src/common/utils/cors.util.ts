/**
 * CORS utility functions for WebSocket gateways
 */

/**
 * Helper function to get allowed origins from environment variables
 * Reads from CORS_ORIGINS (comma-separated) or APP_URL, with fallback to localhost
 */
export const getAllowedOrigins = (): string[] => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  }
  return process.env.APP_URL
    ? [process.env.APP_URL]
    : ['http://localhost:5173'];
};

/**
 * CORS validation function for Socket.IO
 * Socket.IO accepts either a function with callback or a function returning boolean
 *
 * @param origin - The origin to validate
 * @param callback - Optional callback function for async validation
 * @returns boolean if no callback provided, void if callback is used
 */
export const corsOriginValidator = (
  origin: string | undefined,
  callback?: (err: Error | null, allow?: boolean) => void,
): boolean | void => {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

  // Also check if any allowed origin matches (for subdomain support)
  try {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      try {
        const allowedUrl = new URL(allowedOrigin);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return origin === allowedOrigin;
      }
    });

    if (callback) {
      return callback(null, isAllowed);
    }
    return isAllowed;
  } catch {
    // If URL parsing fails, do simple string comparison
    const isAllowed = allowedOrigins.includes(origin);
    if (callback) {
      return callback(null, isAllowed);
    }
    return isAllowed;
  }
};
