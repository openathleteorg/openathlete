export const coachNoteKeys = {
  root: 'CoachNoteAPI',
  notebook: ['CoachNoteAPI.notebook'] as const,
  list: (athleteId?: number) =>
    ['CoachNoteAPI', 'list', athleteId ?? 'all'] as const,
} as const;
