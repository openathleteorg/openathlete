import { Injectable, NotFoundException } from '@nestjs/common';

import { CustomExercise, WorkoutDurationType } from '@openathlete/database';
import type {
  CreateCustomExerciseDto,
  CustomExerciseDto,
  UpdateCustomExerciseDto,
  WORKOUT_DURATION_TYPE,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * Exercises coaches and athletes add beside the bundled catalog. Their
 * author edits them; the people they coach, or who coach them, read them,
 * as sessions planned between them use them.
 */
@Injectable()
export class CustomExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(exercise: CustomExercise, userId: number): CustomExerciseDto {
    return {
      customExerciseId: exercise.customExerciseId,
      ref: `u:${exercise.customExerciseId}`,
      name: exercise.name,
      instructions: exercise.instructions,
      mediaUrl: exercise.mediaUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      defaultDurationType:
        exercise.defaultDurationType as WORKOUT_DURATION_TYPE,
      defaultDurationValue: exercise.defaultDurationValue,
      mine: exercise.userId === userId,
    };
  }

  /** Users whose exercises `user` reads: themselves, their coaches, their athletes */
  private async readableAuthors(user: AuthUser): Promise<number[]> {
    const links = await this.prisma.coachAthlete.findMany({
      where: {
        OR: [
          { userId: user.userId },
          ...(user.athlete ? [{ athleteId: user.athlete.athleteId }] : []),
        ],
      },
      select: { userId: true, athlete: { select: { userId: true } } },
    });
    return [
      user.userId,
      ...links.flatMap((link) => [link.userId, link.athlete.userId]),
    ].filter((id, index, ids) => ids.indexOf(id) === index);
  }

  async list(user: AuthUser): Promise<CustomExerciseDto[]> {
    const authors = await this.readableAuthors(user);
    const exercises = await this.prisma.customExercise.findMany({
      where: { userId: { in: authors } },
      orderBy: { name: 'asc' },
    });
    return exercises.map((exercise) => this.toDto(exercise, user.userId));
  }

  async create(
    user: AuthUser,
    dto: CreateCustomExerciseDto,
  ): Promise<CustomExerciseDto> {
    const exercise = await this.prisma.customExercise.create({
      data: {
        name: dto.name,
        instructions: dto.instructions ?? '',
        mediaUrl: dto.mediaUrl ?? null,
        bodyPart: dto.bodyPart ?? null,
        equipment: dto.equipment ?? null,
        defaultDurationType: (dto.defaultDurationType ??
          'REPS') as WorkoutDurationType,
        defaultDurationValue: dto.defaultDurationValue ?? null,
        userId: user.userId,
      },
    });
    return this.toDto(exercise, user.userId);
  }

  private async own(user: AuthUser, id: number) {
    const exercise = await this.prisma.customExercise.findFirst({
      where: { customExerciseId: id, userId: user.userId },
    });
    if (!exercise) throw new NotFoundException();
    return exercise;
  }

  async update(
    user: AuthUser,
    id: number,
    dto: UpdateCustomExerciseDto,
  ): Promise<CustomExerciseDto> {
    await this.own(user, id);
    const exercise = await this.prisma.customExercise.update({
      where: { customExerciseId: id },
      data: {
        ...dto,
        defaultDurationType: dto.defaultDurationType as
          WorkoutDurationType | undefined,
      },
    });
    return this.toDto(exercise, user.userId);
  }

  /** Sessions keep the exercise's name: they read on without it */
  async remove(user: AuthUser, id: number): Promise<void> {
    await this.own(user, id);
    await this.prisma.customExercise.delete({
      where: { customExerciseId: id },
    });
  }
}
