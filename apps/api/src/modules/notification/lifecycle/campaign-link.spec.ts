import { campaignLink } from './campaign-link';

describe('campaignLink', () => {
  it('names the email, and keeps the parameters already there', () => {
    expect(
      campaignLink(
        'https://app.openathlete.org/dashboard/settings?tab=connectors',
        'CONNECT_REMINDER',
      ),
    ).toBe(
      'https://app.openathlete.org/dashboard/settings?tab=connectors&utm_source=openathlete&utm_medium=email&utm_campaign=connect_reminder',
    );
  });
});
