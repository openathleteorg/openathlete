export const EVENT_INCLUDES = {
  training: {
    include: {
      relatedActivity: {
        select: {
          eventId: true,
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
      relatedActivity: {
        select: {
          eventId: true,
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
      feedbackSkipped: true,
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
    },
  },
};
