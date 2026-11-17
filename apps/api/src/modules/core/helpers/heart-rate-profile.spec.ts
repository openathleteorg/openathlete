import { savingCompletesHeartRateProfile } from './heart-rate-profile';

/** A metrics table holding these types, before and after the save */
function setup(before: string[], after: string[]) {
  let saved = false;
  const findMany = jest.fn(async () =>
    (saved ? after : before).map((type) => ({ type })),
  );
  const save = jest.fn(async () => {
    saved = true;
  });
  return { prisma: { athleteMetric: { findMany } } as never, save, findMany };
}

describe('savingCompletesHeartRateProfile', () => {
  it('says so when the save brings the second value', async () => {
    const { prisma, save } = setup(['HR_MAX'], ['HR_MAX', 'HR_REST']);
    expect(
      await savingCompletesHeartRateProfile(prisma, 9, ['HR_REST'], save),
    ).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('stays quiet on the nightly resting HR of a complete profile', async () => {
    const { prisma } = setup(['HR_MAX', 'HR_REST'], ['HR_MAX', 'HR_REST']);
    expect(
      await savingCompletesHeartRateProfile(prisma, 9, ['HR_REST'], jest.fn()),
    ).toBe(false);
  });

  it('stays quiet while a value is still missing', async () => {
    const { prisma } = setup([], ['HR_REST']);
    expect(
      await savingCompletesHeartRateProfile(prisma, 9, ['HR_REST'], jest.fn()),
    ).toBe(false);
  });

  it('reads nothing when the save holds no heart rate profile value', async () => {
    const { prisma, save, findMany } = setup([], []);
    expect(
      await savingCompletesHeartRateProfile(prisma, 9, ['DAILY_STEPS'], save),
    ).toBe(false);
    expect(save).toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });
});
