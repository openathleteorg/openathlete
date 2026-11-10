import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '@openathlete/database';
import type {
  CoachNote,
  CreateCoachNoteDto,
  UpdateCoachNoteDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const NOTE_SELECT = {
  coachNoteId: true,
  title: true,
  content: true,
  pinned: true,
  athleteId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CoachNoteSelect;

const NOTE_ORDER: Prisma.CoachNoteOrderByWithRelationInput[] = [
  { pinned: 'desc' },
  { updatedAt: 'desc' },
];

/**
 * A coach's private notes. Only their author reads them: the athlete a note
 * is about never does. A note about an athlete shows while the author can
 * reach that athlete (their own profile or one they coach), so it hides when
 * the coaching ends and comes back if it resumes.
 */
@Injectable()
export class CoachNoteService {
  constructor(private readonly prisma: PrismaService) {}

  /** Athletes the user may write about, fresh from the request's user */
  private reachableAthleteIds(user: AuthUser): number[] {
    return [
      ...(user.athlete ? [user.athlete.athleteId] : []),
      ...(user.coachAthletes ?? []).map((link) => link.athleteId),
    ];
  }

  private assertReachable(user: AuthUser, athleteId: number) {
    if (!this.reachableAthleteIds(user).includes(athleteId)) {
      throw new ForbiddenException('Not allowed to write about this athlete');
    }
  }

  /**
   * One athlete's notes, or with no athlete every note of the user (general
   * ones and those about athletes they still reach).
   */
  async list(user: AuthUser, athleteId?: number): Promise<CoachNote[]> {
    if (athleteId !== undefined) {
      this.assertReachable(user, athleteId);
      return this.prisma.coachNote.findMany({
        where: { coachUserId: user.userId, athleteId },
        select: NOTE_SELECT,
        orderBy: NOTE_ORDER,
      });
    }
    return this.prisma.coachNote.findMany({
      where: {
        coachUserId: user.userId,
        OR: [
          { athleteId: null },
          { athleteId: { in: this.reachableAthleteIds(user) } },
        ],
      },
      select: NOTE_SELECT,
      orderBy: NOTE_ORDER,
    });
  }

  async create(user: AuthUser, dto: CreateCoachNoteDto): Promise<CoachNote> {
    if (dto.athleteId) this.assertReachable(user, dto.athleteId);
    return this.prisma.coachNote.create({
      data: {
        coachUserId: user.userId,
        athleteId: dto.athleteId ?? null,
        title: dto.title,
        content: dto.content,
        pinned: dto.pinned,
      },
      select: NOTE_SELECT,
    });
  }

  async update(
    user: AuthUser,
    coachNoteId: number,
    dto: UpdateCoachNoteDto,
  ): Promise<CoachNote> {
    await this.findOwn(user, coachNoteId);
    if (dto.athleteId) this.assertReachable(user, dto.athleteId);
    return this.prisma.coachNote.update({
      where: { coachNoteId },
      data: {
        title: dto.title,
        content: dto.content,
        pinned: dto.pinned,
        athleteId: dto.athleteId,
      },
      select: NOTE_SELECT,
    });
  }

  async delete(user: AuthUser, coachNoteId: number): Promise<void> {
    await this.findOwn(user, coachNoteId);
    await this.prisma.coachNote.delete({ where: { coachNoteId } });
  }

  /** Someone else's note, or a hidden one, reads as missing */
  private async findOwn(user: AuthUser, coachNoteId: number) {
    const note = await this.prisma.coachNote.findFirst({
      where: { coachNoteId, coachUserId: user.userId },
      select: { athleteId: true },
    });
    if (
      !note ||
      (note.athleteId !== null &&
        !this.reachableAthleteIds(user).includes(note.athleteId))
    ) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }
}
