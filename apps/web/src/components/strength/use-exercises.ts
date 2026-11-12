import {
  type CatalogExercise,
  useCustomExercisesQuery,
  useExerciseCatalogQuery,
} from '@/api/exercise';
import { useMemo } from 'react';

import type { CustomExerciseDto } from '@openathlete/shared';

/** What the builder and the player show of an exercise, whatever its source */
export interface ExerciseInfo {
  ref: string;
  name: string;
  bodyPart: string | null;
  equipment: string | null;
  target: string | null;
  secondary: string[];
  /** Start and end drawings of the bundled catalog */
  frames: [string, string] | null;
  /** A coach's video or image link */
  mediaUrl: string | null;
  steps: string[];
  custom: CustomExerciseDto | null;
  popular?: boolean;
}

export function mediaFrames(id: string): [string, string] {
  const base = `${import.meta.env.BASE_URL}exercises/media/${id}`;
  return [`${base}-0.svg`, `${base}-1.svg`];
}

export function catalogInfo(exercise: CatalogExercise): ExerciseInfo {
  return {
    ref: `c:${exercise.id}`,
    name: exercise.name,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: exercise.target,
    secondary: exercise.secondary,
    frames: exercise.media === 2 ? mediaFrames(exercise.id) : null,
    mediaUrl: null,
    steps: exercise.steps,
    custom: null,
    popular: exercise.popular,
  };
}

export function customInfo(exercise: CustomExerciseDto): ExerciseInfo {
  return {
    ref: exercise.ref,
    name: exercise.name,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: null,
    secondary: [],
    frames: null,
    mediaUrl: exercise.mediaUrl,
    steps: exercise.instructions
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
    custom: exercise,
  };
}

/** Every exercise the user can pick, the bundled ones and the custom ones */
export function useExercises() {
  const catalog = useExerciseCatalogQuery();
  const custom = useCustomExercisesQuery();
  return useMemo(() => {
    const all = [
      ...(custom.data ?? []).map(customInfo),
      ...(catalog.data?.exercises ?? []).map(catalogInfo),
    ];
    const byRef = new Map(all.map((info) => [info.ref, info]));
    return {
      all,
      byRef,
      attribution: catalog.data?.attribution ?? null,
      isLoading: catalog.isLoading,
      /** The exercise a step references; its stored name when it is gone */
      resolve: (ref: string | null | undefined, fallbackName?: string | null) =>
        (ref ? byRef.get(ref) : undefined) ??
        (fallbackName
          ? ({
              ref: ref ?? '',
              name: fallbackName,
              bodyPart: null,
              equipment: null,
              target: null,
              secondary: [],
              frames: null,
              mediaUrl: null,
              steps: [],
              custom: null,
            } satisfies ExerciseInfo)
          : null),
    };
  }, [catalog.data, catalog.isLoading, custom.data]);
}
