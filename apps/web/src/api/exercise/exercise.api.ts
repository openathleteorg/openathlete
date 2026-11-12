import client, { routes } from '@/utils/axios';

import type {
  CompleteStrengthSessionDto,
  CreateCustomExerciseDto,
  CustomExerciseDto,
  Event,
  UpdateCustomExerciseDto,
} from '@openathlete/shared';

/** One exercise of the bundled catalog, in the reader's language */
export interface CatalogExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondary: string[];
  /** Drawings: 2 (start and end position) or none */
  media: number;
  /** What coaches usually mean by the word: first in the search */
  popular?: boolean;
  steps: string[];
}

export interface ExerciseCatalog {
  version: 1;
  attribution: { data: string; media: string };
  exercises: CatalogExercise[];
}

export class ExerciseAPI {
  /** A static file of the app: it works offline and on every instance */
  static async getCatalog(locale: string): Promise<ExerciseCatalog> {
    const response = await fetch(
      `${import.meta.env.BASE_URL}exercises/catalog.${locale}.json`,
    );
    if (!response.ok) throw new Error(`catalog ${response.status}`);
    return response.json();
  }

  static async getCustom(): Promise<CustomExerciseDto[]> {
    const res = await client.get(routes.exercise.custom);
    return res.data;
  }

  static async createCustom(
    body: CreateCustomExerciseDto,
  ): Promise<CustomExerciseDto> {
    const res = await client.post(routes.exercise.custom, body);
    return res.data;
  }

  static async updateCustom({
    id,
    body,
  }: {
    id: number;
    body: UpdateCustomExerciseDto;
  }): Promise<CustomExerciseDto> {
    const res = await client.patch(routes.exercise.customOne(id), body);
    return res.data;
  }

  static async deleteCustom(id: number): Promise<void> {
    await client.delete(routes.exercise.customOne(id));
  }

  static async completeStrengthSession({
    eventId,
    body,
  }: {
    eventId: number;
    body: CompleteStrengthSessionDto;
  }): Promise<Event> {
    const res = await client.post(
      routes.exercise.completeStrengthSession(eventId),
      body,
    );
    return res.data;
  }
}
