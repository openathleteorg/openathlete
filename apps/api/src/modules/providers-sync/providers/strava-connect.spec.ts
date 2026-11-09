import {
  StravaProviderService,
  hasStravaWriteScope,
} from './strava.provider.service';

describe('Strava connection and the activity description', () => {
  function setup(existing: object | null) {
    // The stored row, which create and update return whole, as Prisma does
    let row: object = { activityDescriptionEnabled: false, ...existing };
    const saved = (data: object) => {
      row = { ...row, providerAccountId: 9, ...data };
      return row;
    };
    const prisma = {
      athlete: {
        findUnique: jest.fn().mockResolvedValue({ athleteId: 7, user: {} }),
      },
      providerAccount: {
        findFirst: jest.fn().mockResolvedValue(existing),
        create: jest.fn(({ data }) => saved(data)),
        update: jest.fn(({ data }) => saved(data)),
      },
      lifecycleEmail: { deleteMany: jest.fn() },
    };
    const config = {
      get: jest.fn().mockReturnValue(''),
      getOrThrow: jest.fn(),
    };
    const service = new StravaProviderService(
      prisma as never,
      config as never,
      {} as never,
    );
    jest.spyOn(service, 'exchangeCodeForTokens').mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      athlete: { id: 123 },
    } as never);
    return { service, prisma };
  }

  const user = { userId: 1 } as never;

  it('asks Strava for write access', () => {
    const { service } = setup(null);
    expect(service.getAuthorizationUri()).toContain(
      encodeURIComponent('read,activity:read_all,activity:write'),
    );
  });

  it('turns the description on for a new connection that allows it', async () => {
    const { service, prisma } = setup(null);
    const account = await service.connect(
      user,
      'code',
      'read,activity:write,activity:read_all',
    );
    expect(account.scopes).toBe('read,activity:write,activity:read_all');
    expect(account.activityDescriptionEnabled).toBe(true);
    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      where: { providerAccountId: 9 },
      data: { activityDescriptionEnabled: true },
    });
  });

  it('leaves it off when the user unticked write access', async () => {
    const { service } = setup(null);
    const account = await service.connect(
      user,
      'code',
      'read,activity:read_all',
    );
    expect(account.activityDescriptionEnabled).toBe(false);
  });

  it('leaves it off for an athlete who connected before', async () => {
    const { service, prisma } = setup({
      providerAccountId: 9,
      scopes: 'read,activity:read_all',
      activityDescriptionEnabled: false,
    });
    const account = await service.connect(
      user,
      'code',
      'read,activity:read_all,activity:write',
    );
    // Write access is recorded, so turning it on in Settings works
    expect(account.scopes).toContain('activity:write');
    expect(account.activityDescriptionEnabled).toBe(false);
    expect(prisma.providerAccount.update).toHaveBeenCalledTimes(1);
  });

  it('reads scopes however Strava separates them', () => {
    expect(hasStravaWriteScope('read activity:write')).toBe(true);
    expect(hasStravaWriteScope('read,activity:read_all')).toBe(false);
    expect(hasStravaWriteScope(null)).toBe(false);
  });
});
