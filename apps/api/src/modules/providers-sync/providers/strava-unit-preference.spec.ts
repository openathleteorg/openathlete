import { StravaProviderService } from './strava.provider.service';

describe('Strava unit preference', () => {
  const user = { userId: 3 } as never;

  function setup(athlete?: object) {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      athlete: {
        findUnique: jest.fn().mockResolvedValue({ athleteId: 7 }),
      },
      user: { updateMany },
    };
    const config = { get: jest.fn(), getOrThrow: jest.fn() };
    const service = new StravaProviderService(
      prisma as never,
      config as never,
      {} as never,
    );
    jest
      .spyOn(service as never, 'exchangeCodeForTokens' as never)
      .mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        scope: 'read',
        athlete: { id: 1, ...athlete },
      } as never);
    jest
      .spyOn(service as never, 'saveProviderAccount' as never)
      .mockResolvedValue({ providerAccountId: 1 } as never);
    return { service, updateMany };
  }

  afterEach(() => jest.restoreAllMocks());

  it('starts on imperial when the athlete uses feet, unless they chose', async () => {
    const { service, updateMany } = setup({ measurement_preference: 'feet' });
    await service.connect(user, 'code');
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 3, unitSystemChosenAt: null },
      data: { unitSystem: 'IMPERIAL' },
    });
  });

  it('changes nothing for an athlete using meters', async () => {
    const { service, updateMany } = setup({ measurement_preference: 'meters' });
    await service.connect(user, 'code');
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('asks Strava when the token does not say', async () => {
    const { service, updateMany } = setup();
    const fetched = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ measurement_preference: 'feet' }),
    } as Response);
    await service.connect(user, 'code');
    expect(fetched).toHaveBeenCalledWith(
      'https://www.strava.com/api/v3/athlete',
      expect.anything(),
    );
    expect(updateMany).toHaveBeenCalled();
  });

  it('still connects when the preference cannot be read', async () => {
    const { service, updateMany } = setup();
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(service.connect(user, 'code')).resolves.toEqual({
      providerAccountId: 1,
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
