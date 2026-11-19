import { buildQuestionnaireRequestEmail } from './questionnaire-request.template';

const base = {
  coachName: 'Paula Coach',
  title: 'Hooper <daily>',
  questionCount: 4,
  closesAt: new Date('2026-10-12T05:00:00Z'),
  timeZone: 'Europe/Paris',
  url: 'https://app.example/dashboard/calendar?event=7',
  footer: {
    kind: 'list' as const,
    reason: 'Because',
    unsubscribeUrl: 'https://app.example/emails/unsubscribe?token=t',
    preferencesUrl: 'https://app.example/dashboard/settings?tab=profile',
  },
};

describe('questionnaire request email', () => {
  it('names the coach and the questionnaire, escaping what they typed', () => {
    const email = buildQuestionnaireRequestEmail({
      ...base,
      language: 'FR',
      kind: 'request',
    });
    expect(email.subject).toBe('Paula Coach vous envoie « Hooper <daily> »');
    expect(email.html).toContain('Hooper &lt;daily&gt;');
    expect(email.html).not.toContain('<daily>');
    expect(email.html).toContain(base.url);
    expect(email.html).toContain(base.footer.unsubscribeUrl);
    // The closing day, in the athlete's time zone
    expect(email.text).toContain('lundi 12 octobre');
    expect(email.text).toContain('07:00');
  });

  it('says it again, differently, as a reminder', () => {
    const email = buildQuestionnaireRequestEmail({
      ...base,
      language: 'EN',
      kind: 'reminder',
      questionCount: 1,
    });
    expect(email.text).toContain('is still waiting for your answer');
    expect(email.text).toContain('One question.');
  });
});
