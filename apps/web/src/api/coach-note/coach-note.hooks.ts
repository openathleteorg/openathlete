import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CoachNoteAPI } from './coach-note.api';
import { coachNoteKeys } from './coach-note.keys';

export const useCoachNotesQuery = (athleteId?: number) =>
  useQuery({
    queryKey: coachNoteKeys.list(athleteId),
    queryFn: () => CoachNoteAPI.list(athleteId),
  });

/** A note shows in its athlete's list and in the full one: refresh both */
const useInvalidateNotes = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [coachNoteKeys.root] });
};

export const useCreateCoachNoteMutation = () => {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: CoachNoteAPI.create,
    onSuccess: invalidate,
  });
};

export const useUpdateCoachNoteMutation = () => {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: CoachNoteAPI.update,
    onSuccess: invalidate,
  });
};

export const useDeleteCoachNoteMutation = () => {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: CoachNoteAPI.delete,
    onSuccess: invalidate,
  });
};
