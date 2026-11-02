import { EventService } from './event.service';

jest.mock('@garmin/fitsdk', () => ({}));
jest.mock('src/modules/auth/services/casl-prisma', () => ({
  accessibleBy: () => ({ Event: { athleteId: { in: [1, 2] } } }),
}));

describe('EventService.searchActivities', () => {
  const setup = (rows: unknown[]) => {
    const findMany = jest.fn().mockResolvedValue(rows);
    const service = Object.create(EventService.prototype) as EventService;
    Object.assign(service, {
      prisma: { event: { findMany } },
      abilities: { getFor: jest.fn().mockResolvedValue({}) },
    });
    return { service, findMany };
  };

  it('only searches the activities the user can read, newest first', async () => {
    const { service, findMany } = setup([]);

    await service.searchActivities({} as never, 'trail');

    const query = findMany.mock.calls[0][0];
    expect(query.where.AND).toEqual([
      { athleteId: { in: [1, 2] } },
      { type: 'ACTIVITY' },
      { name: { contains: 'trail', mode: 'insensitive' } },
    ]);
    expect(query.orderBy).toEqual({ startDate: 'desc' });
    expect(query.take).toBe(20);
  });

  it('returns what the finder shows', async () => {
    const startDate = new Date('2026-10-14T07:44:00Z');
    const { service } = setup([
      {
        eventId: 7,
        name: 'Morning Trail Run',
        startDate,
        athleteId: 2,
        activity: { sport: 'TRAIL_RUNNING' },
        athlete: { user: { firstName: 'Ada', lastName: 'Lovelace' } },
      },
    ]);

    await expect(
      service.searchActivities({} as never, 'trail'),
    ).resolves.toEqual([
      {
        eventId: 7,
        name: 'Morning Trail Run',
        startDate,
        sport: 'TRAIL_RUNNING',
        athleteId: 2,
        athleteName: 'Ada Lovelace',
      },
    ]);
  });
});
