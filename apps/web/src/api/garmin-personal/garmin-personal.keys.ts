export const garminPersonalKeys = {
  status: (userId: number) => ['garmin-personal', userId] as const,
};
