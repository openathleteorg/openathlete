/**
 * Error thrown when a refresh token is invalid or expired
 * This indicates the provider account needs to be reconnected
 */
export class InvalidRefreshTokenError extends Error {
  constructor(
    public readonly provider: string,
    public readonly accountId: number,
    public readonly athleteId: number,
    message?: string,
  ) {
    super(
      message ||
        `Refresh token is invalid or expired for ${provider} account ${accountId}. Account needs to be reconnected.`,
    );
    this.name = 'InvalidRefreshTokenError';
  }
}
