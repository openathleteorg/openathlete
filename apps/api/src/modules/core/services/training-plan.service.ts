import { Injectable } from '@nestjs/common';

import { PlanStatus } from '@openathlete/database';
import {
  EVENT_TYPE,
  SEOPlanData,
  WorkoutStepDto,
  createWorkoutSchema,
  mapWorkoutDtoToPrisma,
} from '@openathlete/shared';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService } from '../../prisma/services/prisma.service';
import { planSessionDayOffset } from '../helpers/plan-session-day';
import { remapZonesForAthlete } from '../helpers/workout-zones';

@Injectable()
export class TrainingPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async importSeoPlan(
    user: AuthUser,
    planData: SEOPlanData,
    startDate: Date | string,
  ) {
    const athleteId = user?.athlete?.athleteId;

    if (!athleteId) {
      throw new Error('Athlete ID is required');
    }

    // Convert startDate to Date if it's a string (from JSON)
    const startDateObj =
      startDate instanceof Date ? startDate : new Date(startDate);

    // Validate startDate
    if (!startDateObj || isNaN(startDateObj.getTime())) {
      throw new Error('Invalid start date provided');
    }

    // Calculate end date based on plan duration (in weeks)
    const endDate = new Date(startDateObj);
    endDate.setDate(endDate.getDate() + planData.plan.duration * 7);

    // Create TrainingPlan
    const trainingPlan = await this.prisma.trainingPlan.create({
      data: {
        athleteId,
        name: planData.plan.name,
        description: planData.plan.description,
        goal: planData.plan.goal,
        startDate: startDateObj,
        endDate,
        status: PlanStatus.DRAFT,
      },
    });

    // Calculate dates for each week
    let currentWeekStart = new Date(startDateObj);
    const weekDates: Array<{ start: Date; end: Date }> = [];

    for (let i = 0; i < planData.plan.duration; i++) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      weekDates.push({
        start: new Date(currentWeekStart),
        end: weekEnd,
      });

      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      currentWeekStart.setHours(0, 0, 0, 0);
    }

    // Create cycles and weeks
    let weekIndex = 0;
    for (const cycleData of planData.cycles) {
      // Calculate cycle dates based on its weeks
      const cycleStartWeek = weekIndex;
      const cycleEndWeek = weekIndex + cycleData.weeks.length - 1;

      if (cycleEndWeek >= weekDates.length) {
        throw new Error('Cycle weeks exceed plan duration');
      }

      const cycleStartDate = weekDates[cycleStartWeek].start;
      const cycleEndDate = weekDates[cycleEndWeek].end;

      // Create Cycle
      const cycle = await this.prisma.cycle.create({
        data: {
          athleteId,
          trainingPlanId: trainingPlan.trainingPlanId,
          name: cycleData.name,
          description: cycleData.description,
          phase: cycleData.phase,
          color: cycleData.color || null,
          startDate: cycleStartDate,
          endDate: cycleEndDate,
        },
      });

      // Create TrainingWeeks and Events
      for (const weekData of cycleData.weeks) {
        if (weekIndex >= weekDates.length) {
          break;
        }

        const weekDatesData = weekDates[weekIndex];

        // Create TrainingWeek
        const trainingWeek = await this.prisma.trainingWeek.create({
          data: {
            cycleId: cycle.cycleId,
            weekNumber: weekData.weekNumber,
            startDate: weekDatesData.start,
            endDate: weekDatesData.end,
            theme: weekData.theme || null,
          },
        });

        // Create Events for each session
        for (const session of weekData.sessions) {
          // Calculate session date based on dayOfWeek
          const sessionDate = new Date(weekDatesData.start);
          sessionDate.setDate(
            sessionDate.getDate() +
              planSessionDayOffset(session.dayOfWeek, sessionDate.getDay()),
          );
          sessionDate.setHours(9, 0, 0, 0); // Default to 9 AM

          // Calculate end date (default to 1 hour duration if not specified)
          const sessionEndDate = new Date(sessionDate);
          if (session.goalDuration) {
            sessionEndDate.setTime(
              sessionDate.getTime() + session.goalDuration * 1000,
            );
          } else {
            sessionEndDate.setHours(sessionDate.getHours() + 1);
          }

          // Create event directly with Prisma to link it to training week
          const createdEvent = await this.prisma.event.create({
            data: {
              athleteId,
              startDate: sessionDate,
              endDate: sessionEndDate,
              name: session.name,
              type: EVENT_TYPE.TRAINING,
              trainingWeekId: trainingWeek.trainingWeekId,
              training: {
                create: {
                  sport: session.sport,
                  description: session.description,
                  goalDistance: session.goalDistance || null,
                  goalDuration: session.goalDuration || null,
                  goalElevationGain: session.goalElevationGain || null,
                  goalRpe:
                    session.goalRpe !== null && session.goalRpe !== undefined
                      ? session.goalRpe / 10
                      : null,
                },
              },
            },
            include: {
              training: true,
            },
          });

          // Create workout if provided
          if (session.workout && createdEvent.training) {
            const parsed = createWorkoutSchema.safeParse({
              steps: session.workout.steps || [],
            });
            if (parsed.success) {
              // The AI may answer with zones that are not the athlete's
              const stepsForCreate = await remapZonesForAthlete(
                this.prisma,
                athleteId,
                createdEvent.training.sport,
                parsed.data.steps,
              );
              const workoutData = mapWorkoutDtoToPrisma({
                steps: stepsForCreate,
              });

              // Ensure all steps have orderIndex (safety check)
              if (workoutData.steps?.create) {
                workoutData.steps.create = workoutData.steps.create.map(
                  (step, idx) => {
                    const updatedStep = {
                      ...step,
                      orderIndex: step.orderIndex ?? idx,
                    };
                    // Also ensure childSteps in repeatBlock have orderIndex
                    if (updatedStep.repeatBlock?.create?.childSteps?.create) {
                      updatedStep.repeatBlock.create.childSteps.create =
                        updatedStep.repeatBlock.create.childSteps.create.map(
                          (child: WorkoutStepDto, childIdx: number) => ({
                            ...child,
                            orderIndex: child.orderIndex ?? childIdx,
                          }),
                        );
                    }
                    return updatedStep;
                  },
                );
              }

              await this.prisma.workout.create({
                data: {
                  eventTrainingId: createdEvent.training.eventTrainingId,
                  ...workoutData,
                },
              });
            }
          }
        }

        weekIndex++;
      }
    }

    // Return the created training plan with all relations
    return this.prisma.trainingPlan.findUnique({
      where: { trainingPlanId: trainingPlan.trainingPlanId },
      include: {
        cycles: {
          include: {
            weeks: {
              include: {
                sessions: true,
              },
            },
          },
        },
      },
    });
  }
}
