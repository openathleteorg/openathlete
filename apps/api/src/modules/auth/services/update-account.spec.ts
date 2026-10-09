import { updateAccountDtoSchema } from '@openathlete/shared';

// Against the shared build, which the API runs: the time zone check must
// survive bundling
describe('account update', () => {
  it('accepts a known time zone', () => {
    expect(
      updateAccountDtoSchema.safeParse({ timeZone: 'Europe/Paris' }).success,
    ).toBe(true);
  });

  it('refuses an unknown time zone', () => {
    expect(
      updateAccountDtoSchema.safeParse({ timeZone: 'Mars/Olympus_Mons' })
        .success,
    ).toBe(false);
    expect(updateAccountDtoSchema.safeParse({ timeZone: '' }).success).toBe(
      false,
    );
  });

  it('stores calendar display settings as a full, valid preference', () => {
    const parsed = updateAccountDtoSchema.parse({
      calendarDisplay: { density: 'compact', card: { distance: false } },
    });
    expect(parsed.calendarDisplay).toEqual({
      density: 'compact',
      card: {
        profile: true,
        duration: true,
        distance: false,
        elevation: false,
        load: false,
      },
      summary: {
        duration: true,
        distance: true,
        elevation: true,
        load: true,
        form: true,
      },
      wellness: true,
    });
  });
});
