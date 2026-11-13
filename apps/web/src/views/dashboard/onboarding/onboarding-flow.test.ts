import { describe, expect, it } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import {
  EMPTY_ANSWERS,
  INITIAL_PROGRESS,
  nextStep,
  onboardingPath,
  parseProgress,
  toCompleteOnboardingDto,
} from './onboarding-flow';

const noCoach = { hasCoach: false };

describe('onboardingPath', () => {
  it('asks a new user their role first', () => {
    expect(onboardingPath(EMPTY_ANSWERS, noCoach)).toEqual([
      'role',
      'source',
      'done',
    ]);
  });

  it('takes an athlete through sports, goal, device and time', () => {
    expect(
      onboardingPath({ ...EMPTY_ANSWERS, role: 'ATHLETE' }, noCoach),
    ).toEqual(['role', 'sports', 'goal', 'connect', 'hours', 'source', 'done']);
  });

  it('asks for the coach only to those who follow one', () => {
    const answers = {
      ...EMPTY_ANSWERS,
      role: 'ATHLETE' as const,
      goal: 'FOLLOW_COACH' as const,
    };
    expect(onboardingPath(answers, noCoach)).toContain('invite-coach');
    expect(onboardingPath(answers, { hasCoach: true })).not.toContain(
      'invite-coach',
    );
  });

  it('takes a coach who also trains through both parts', () => {
    expect(onboardingPath({ ...EMPTY_ANSWERS, role: 'BOTH' }, noCoach)).toEqual(
      [
        'role',
        'team',
        'invite-athletes',
        'sports',
        'goal',
        'connect',
        'hours',
        'source',
        'done',
      ],
    );
  });
});

describe('nextStep', () => {
  it('goes to the first screen of the chosen role', () => {
    expect(nextStep('role', { ...EMPTY_ANSWERS, role: 'COACH' }, noCoach)).toBe(
      'team',
    );
  });

  it('stays on the last screen', () => {
    expect(nextStep('done', EMPTY_ANSWERS, noCoach)).toBe('done');
  });

  it('restarts from the role when the step no longer applies', () => {
    expect(
      nextStep('hours', { ...EMPTY_ANSWERS, role: 'COACH' }, noCoach),
    ).toBe('role');
  });
});

describe('toCompleteOnboardingDto', () => {
  it('sends the athlete profile and the target race', () => {
    expect(
      toCompleteOnboardingDto(
        {
          ...EMPTY_ANSWERS,
          role: 'ATHLETE',
          sports: [SPORT_TYPE.RUNNING],
          goal: 'RACE',
          raceDistance: 'MARATHON',
          raceDate: '2027-04-11',
          hours: 'FROM_3_TO_6',
          source: 'REDDIT',
        },
        { raceName: 'Marathon' },
      ),
    ).toEqual({
      roles: ['ATHLETE'],
      acquisitionSource: 'REDDIT',
      practicedSports: ['RUNNING'],
      trainingGoal: 'RACE',
      weeklyTrainingHours: 'FROM_3_TO_6',
      targetRace: {
        distance: 'MARATHON',
        date: '2027-04-11',
        name: 'Marathon',
      },
    });
  });

  it('leaves out a race without a date', () => {
    const dto = toCompleteOnboardingDto({
      ...EMPTY_ANSWERS,
      role: 'ATHLETE',
      goal: 'RACE',
      raceDistance: '10K',
    });
    expect(dto).not.toHaveProperty('targetRace');
  });

  it('leaves out athlete answers kept from a role the user changed', () => {
    expect(
      toCompleteOnboardingDto({
        ...EMPTY_ANSWERS,
        role: 'COACH',
        sports: [SPORT_TYPE.CYCLING],
        teamSize: 'FROM_6_TO_20',
        athleteEmails: ['ana@example.com', 'not an email', ''],
      }),
    ).toEqual({
      roles: ['COACH'],
      coachTeamSize: 'FROM_6_TO_20',
      athleteEmails: ['ana@example.com'],
    });
  });

  it('invites the coach of an athlete who follows one', () => {
    expect(
      toCompleteOnboardingDto({
        ...EMPTY_ANSWERS,
        role: 'ATHLETE',
        goal: 'FOLLOW_COACH',
        coachEmail: ' coach@example.com ',
      }),
    ).toMatchObject({ coachEmail: 'coach@example.com' });
  });
});

describe('parseProgress', () => {
  it('starts afresh without a save or with a broken one', () => {
    expect(parseProgress(null)).toBe(INITIAL_PROGRESS);
    expect(parseProgress('{not json')).toBe(INITIAL_PROGRESS);
    expect(parseProgress('"text"')).toBe(INITIAL_PROGRESS);
  });

  it('fills answers added since the save', () => {
    const progress = parseProgress(
      JSON.stringify({
        answers: { role: 'ATHLETE' },
        step: 'connect',
        history: ['role'],
      }),
    );
    expect(progress.step).toBe('connect');
    expect(progress.answers).toEqual({ ...EMPTY_ANSWERS, role: 'ATHLETE' });
  });
});
