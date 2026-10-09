export const EVENT_INCLUDES = {
  training: {
    include: {
      // What the calendar needs to grade the session against the plan
      relatedActivity: {
        select: {
          eventId: true,
          movingTime: true,
          distance: true,
        },
      },
      workout: {
        include: {
          steps: {
            include: {
              targets: true,
              repeatBlock: {
                include: {
                  childSteps: {
                    include: {
                      targets: true,
                    },
                    orderBy: {
                      orderIndex: 'asc' as const,
                    },
                  },
                },
              },
            },
            orderBy: {
              orderIndex: 'asc' as const,
            },
          },
        },
      },
    },
  },
  competition: {
    include: {
      // What the calendar needs to grade the session against the plan
      relatedActivity: {
        select: {
          eventId: true,
          movingTime: true,
          distance: true,
        },
      },
    },
  },
  note: true,
  activity: {
    // select all fields except stream
    select: {
      eventActivityId: true,
      eventId: true,
      distance: true,
      elevationGain: true,
      movingTime: true,
      averageSpeed: true,
      maxSpeed: true,
      averageCadence: true,
      averageWatts: true,
      maxWatts: true,
      weightedAverageWatts: true,
      averageHeartrate: true,
      maxHeartrate: true,
      kilojoules: true,
      averageGapSpeed: true,
      averageNormalizedSpeed: true,
      rpe: true,
      externalId: true,
      sport: true,
      provider: true,
      description: true,
      records: true,
      equipmentId: true,
      isRace: true,
      feedbackSkipped: true,
      feedbackAnalyzedAt: true,
      equipment: {
        select: {
          equipmentId: true,
          name: true,
          type: true,
        },
      },
      segments: {
        orderBy: {
          orderIndex: 'asc' as const,
        },
        select: {
          activitySegmentId: true,
          segmentType: true,
          name: true,
          orderIndex: true,
          startTimeSeconds: true,
          endTimeSeconds: true,
          eventActivityId: true,
          distance: true,
          elevationGain: true,
          movingTime: true,
          averageSpeed: true,
          maxSpeed: true,
          averageCadence: true,
          averageWatts: true,
          maxWatts: true,
          weightedAverageWatts: true,
          averageHeartrate: true,
          maxHeartrate: true,
          kilojoules: true,
          averageGapSpeed: true,
          averageNormalizedSpeed: true,
          workoutStepId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      // The load cards show: the TRIMP the app charts
      trainingLoadEntries: {
        where: { calculation: { type: 'TRIMP' as const } },
        select: { value: true },
      },
      feedbackQuestions: {
        orderBy: {
          activityFeedbackQuestionId: 'asc' as const,
        },
        select: {
          activityFeedbackQuestionId: true,
          questionText: true,
          qcmOptions: true,
          answerText: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      extractedInjuries: {
        orderBy: { painScore: 'desc' as const },
        select: {
          athleteInjuryId: true,
          location: true,
          painScore: true,
          context: true,
          status: true,
        },
      },
    },
  },
};
