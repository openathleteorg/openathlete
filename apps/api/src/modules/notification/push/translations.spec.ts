import { Language } from 'src/common/constants/languages.constant';

import { questionnaireNotification } from './questionnaire';
import { trainingReminderNotification } from './training-reminder';
import { getPushNotificationTranslation } from './translations';

describe('push notification translations', () => {
  it('writes activity feedback in Brazilian Portuguese', () => {
    expect(
      getPushNotificationTranslation('activity_processed', Language.PT_BR, {
        hasQuestions: true,
      }),
    ).toEqual({
      title: 'Atividade processada',
      body: 'Sua atividade foi analisada e as perguntas de feedback já estão disponíveis.',
    });
  });

  it('writes the next-day reminder in Brazilian Portuguese', () => {
    expect(trainingReminderNotification(Language.PT_BR, ['Corrida'])).toEqual({
      title: 'Amanhã',
      body: 'Corrida',
    });
    expect(
      trainingReminderNotification(Language.PT_BR, ['Corrida', 'Natação']),
    ).toEqual({
      title: 'Amanhã',
      body: '2 sessões: Corrida, Natação',
    });
  });

  it('writes activity feedback in German', () => {
    expect(
      getPushNotificationTranslation('activity_processed', Language.DE, {
        hasQuestions: true,
      }),
    ).toEqual({
      title: 'Aktivität verarbeitet',
      body: 'Deine Aktivität wurde analysiert und Feedback-Fragen sind verfügbar.',
    });
  });

  it('writes the next-day reminder in German', () => {
    expect(trainingReminderNotification(Language.DE, ['Laufen'])).toEqual({
      title: 'Morgen',
      body: 'Laufen',
    });
    expect(
      trainingReminderNotification(Language.DE, ['Laufen', 'Schwimmen']),
    ).toEqual({
      title: 'Morgen',
      body: '2 Einheiten: Laufen, Schwimmen',
    });
  });

  it('writes activity feedback in Polish and Dutch', () => {
    expect(
      getPushNotificationTranslation('activity_processed', Language.PL, {
        hasQuestions: false,
      }),
    ).toEqual({
      title: 'Aktywność przetworzona',
      body: 'Twoja aktywność została przeanalizowana.',
    });
    expect(
      getPushNotificationTranslation('activity_processed', Language.NL, {
        hasQuestions: true,
      }),
    ).toEqual({
      title: 'Activiteit verwerkt',
      body: 'Je activiteit is geanalyseerd en er staan feedbackvragen voor je klaar.',
    });
  });

  it('writes the next-day reminder in Polish, with its plural forms', () => {
    expect(trainingReminderNotification(Language.PL, ['Bieganie'])).toEqual({
      title: 'Jutro',
      body: 'Bieganie',
    });
    expect(
      trainingReminderNotification(Language.PL, ['Bieganie', 'Pływanie']).body,
    ).toBe('2 treningi: Bieganie, Pływanie');
    expect(
      trainingReminderNotification(Language.PL, ['A', 'B', 'C', 'D', 'E']).body,
    ).toBe('5 treningów: A, B, C, D, E');
  });

  it('writes the next-day reminder in Dutch', () => {
    expect(
      trainingReminderNotification(Language.NL, ['Hardlopen', 'Zwemmen']),
    ).toEqual({
      title: 'Morgen',
      body: '2 trainingen: Hardlopen, Zwemmen',
    });
  });

  it('tells an athlete, in every language, that a questionnaire waits', () => {
    for (const language of Object.values(Language)) {
      const { title, body } = questionnaireNotification(
        language,
        'request',
        'Paula',
        'Hooper',
      );
      expect(title).toContain('Paula');
      expect(body).toContain('Hooper');
    }
    expect(
      questionnaireNotification(Language.FR, 'reminder', 'Paula', 'Hooper'),
    ).toEqual({
      title: 'Questionnaire de Paula',
      body: '« Hooper » attend toujours votre réponse.',
    });
  });
});
