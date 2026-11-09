import { CliDeps, USAGE, runCommand } from './commands';

function setup(users = [{ userId: 7, email: 'ana@example.com' }]) {
  const deps = {
    prisma: {
      providerAccount: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { providerAccountId: 3 },
            { providerAccountId: 5 },
          ]),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(users[0] ?? null),
        findMany: jest.fn().mockResolvedValue(
          users.map((user) => ({
            ...user,
            firstName: 'Ana',
            lastName: 'Lopez',
            roles: ['ATHLETE'],
            createdAt: new Date('2026-10-01T10:00:00Z'),
          })),
        ),
      },
    },
    tokens: {
      createToken: jest.fn().mockResolvedValue({ token: 'tok-123' }),
    },
    accountDeletion: { deleteAccount: jest.fn() },
    appUrl: 'https://train.example.org/',
    queueFullImports: jest.fn(),
    readInput: jest.fn().mockResolvedValue(''),
  } as unknown as CliDeps;
  const lines: string[] = [];
  const run = (...args: string[]) =>
    runCommand(args, deps, (line) => lines.push(line));
  return { deps, lines, run };
}

describe('admin commands', () => {
  it('lists the accounts', async () => {
    const { lines, run } = setup();
    expect(await run('list-users')).toBe(0);
    expect(lines).toEqual([
      '7\tana@example.com\tAna Lopez\tATHLETE\t2026-10-01',
      '1 account',
    ]);
  });

  it('prints a password reset link for the account', async () => {
    const { deps, lines, run } = setup();
    expect(await run('reset-password', 'Ana@Example.com')).toBe(0);
    expect(deps.prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: 'ana@example.com', mode: 'insensitive' } },
      }),
    );
    expect(lines[1]).toBe(
      'https://train.example.org/auth/password-reset?token=tok-123',
    );
  });

  it('deletes an account only once confirmed', async () => {
    const { deps, lines, run } = setup();
    expect(await run('delete-user', 'ana@example.com')).toBe(1);
    expect(deps.accountDeletion.deleteAccount).not.toHaveBeenCalled();
    expect(lines[0]).toContain('--yes');

    expect(await run('delete-user', 'ana@example.com', '--yes')).toBe(0);
    expect(deps.accountDeletion.deleteAccount).toHaveBeenCalledWith(7);
  });

  it('deletes the accounts of the emails read from the input', async () => {
    const { deps, lines, run } = setup([
      { userId: 7, email: 'ana@example.com' },
      { userId: 9, email: 'bob@example.com' },
    ]);
    jest
      .mocked(deps.readInput)
      .mockResolvedValue(
        'Ana@Example.com\nbob@example.com\n\nghost@example.com\n',
      );
    jest.mocked(deps.prisma.user.findMany).mockResolvedValue([
      { userId: 7, email: 'ana@example.com' },
      { userId: 9, email: 'bob@example.com' },
    ] as never);

    expect(await run('delete-users')).toBe(1);
    expect(deps.accountDeletion.deleteAccount).not.toHaveBeenCalled();
    expect(lines[0]).toBe(
      'This deletes 2 accounts and all their data for good (1 email matches no account). Add --yes to confirm.',
    );
    expect(deps.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: {
            in: ['ana@example.com', 'bob@example.com', 'ghost@example.com'],
          },
        },
      }),
    );

    expect(await run('delete-users', '--yes')).toBe(0);
    expect(deps.accountDeletion.deleteAccount).toHaveBeenCalledWith(7);
    expect(deps.accountDeletion.deleteAccount).toHaveBeenCalledWith(9);
    expect(lines.at(-1)).toBe('Deleted 2 accounts, 1 email matched no account');
  });

  it('keeps deleting when one account fails, and says so', async () => {
    const { deps, lines, run } = setup();
    jest
      .mocked(deps.readInput)
      .mockResolvedValue('ana@example.com\nbob@example.com');
    jest.mocked(deps.prisma.user.findMany).mockResolvedValue([
      { userId: 7, email: 'ana@example.com' },
      { userId: 9, email: 'bob@example.com' },
    ] as never);
    jest
      .mocked(deps.accountDeletion.deleteAccount)
      .mockRejectedValueOnce(new Error('locked'));

    expect(await run('delete-users', '--yes')).toBe(1);
    expect(deps.accountDeletion.deleteAccount).toHaveBeenCalledTimes(2);
    expect(lines).toContain('Could not delete user 7: locked');
    expect(lines.at(-1)).toBe('Deleted 1 account, 1 failed');
  });

  it('refuses an empty input', async () => {
    const { lines, run } = setup();
    expect(await run('delete-users', '--yes')).toBe(1);
    expect(lines).toEqual(['No email on the standard input']);
  });

  it('says when no account has the email', async () => {
    const { lines, run } = setup([]);
    expect(await run('reset-password', 'nobody@example.com')).toBe(1);
    expect(lines).toEqual(['No account with the email nobody@example.com']);
  });

  it('explains its usage', async () => {
    const { lines, run } = setup();
    expect(await run('help')).toBe(0);
    expect(await run('unknown')).toBe(1);
    expect(lines).toEqual([USAGE, USAGE]);
  });

  it('queues a Garmin backfill for every connected account', async () => {
    const { deps, lines, run } = setup();
    expect(await run('garmin-backfill')).toBe(0);
    expect(deps.prisma.providerAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider: 'GARMIN',
          status: 'active',
          importActivitiesEnabled: true,
        },
      }),
    );
    expect(deps.queueFullImports).toHaveBeenCalledWith([3, 5]);
    expect(lines).toEqual(['Backfill queued for 2 Garmin accounts']);
  });
});
