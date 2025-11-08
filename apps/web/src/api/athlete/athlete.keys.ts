export const athleteKeys = {
  root: 'AthleteAPI',
  getMyAthlete: 'AthleteAPI.getMyAthlete',
  getCoachedAthletes: 'AthleteAPI.getCoachedAthletes',
  getMyCoaches: 'AthleteAPI.getMyCoaches',
  inviteCoach: 'AthleteAPI.inviteCoach',
  inviteAthlete: 'AthleteAPI.inviteAthlete',
  removeAthlete: 'AthleteAPI.removeAthlete',
  removeCoach: 'AthleteAPI.removeCoach',
  getAthleteSettings: (athleteId: number) => [
    'AthleteAPI.getAthleteSettings',
    athleteId,
  ],
  getPendingInvitations: 'AthleteAPI.getPendingInvitations',
} as const;
