export const coachNoteKeys = {
  root: 'CoachNoteAPI',
  list: (athleteId?: number) =>
    ['CoachNoteAPI', 'list', athleteId ?? 'all'] as const,
} as const;
