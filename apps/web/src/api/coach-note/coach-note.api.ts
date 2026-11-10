import client, { routes } from '@/utils/axios';

import {
  CoachNote,
  CreateCoachNoteDto,
  UpdateCoachNoteDto,
  coachNoteSchema,
} from '@openathlete/shared';

const parseNotes = (data: unknown) => coachNoteSchema.array().parse(data);

export class CoachNoteAPI {
  /** One athlete's notes, or every note without an athlete */
  static async list(athleteId?: number): Promise<CoachNote[]> {
    const res = await client.get(routes.coachNote.list, {
      params: athleteId ? { athleteId } : undefined,
    });
    return parseNotes(res.data);
  }

  static async create(body: CreateCoachNoteDto): Promise<CoachNote> {
    const res = await client.post(routes.coachNote.create, body);
    return coachNoteSchema.parse(res.data);
  }

  static async update({
    id,
    body,
  }: {
    id: number;
    body: UpdateCoachNoteDto;
  }): Promise<CoachNote> {
    const res = await client.patch(routes.coachNote.update(id), body);
    return coachNoteSchema.parse(res.data);
  }

  static async delete(id: number): Promise<void> {
    await client.delete(routes.coachNote.delete(id));
  }
}
