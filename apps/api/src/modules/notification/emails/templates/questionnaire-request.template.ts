import type { EmailLanguage } from '@openathlete/shared';

import { button, heading, note, paragraph } from '../core/blocks';
import { type EmailFooter, renderEmail } from '../core/layout';

type Texts = {
  subject: (coach: string, title: string) => string;
  heading: (title: string) => string;
  intro: (coach: string) => string;
  reminder: (coach: string) => string;
  questions: (count: number) => string;
  open: string;
  closes: (day: string) => string;
};

const translations: Record<EmailLanguage, Texts> = {
  FR: {
    subject: (coach, title) => `${coach} vous envoie « ${title} »`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} vous a envoyé un questionnaire. Vos réponses l'aident à adapter votre entraînement.`,
    reminder: (coach) =>
      `Le questionnaire que ${coach} vous a envoyé attend toujours votre réponse.`,
    questions: (count) =>
      count > 1 ? `${count} questions, une minute ou deux.` : 'Une question.',
    open: 'Répondre',
    closes: (day) => `Vous pouvez répondre jusqu'au ${day}.`,
  },
  EN: {
    subject: (coach, title) => `${coach} sent you "${title}"`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} sent you a questionnaire. Your answers help them adjust your training.`,
    reminder: (coach) =>
      `The questionnaire ${coach} sent you is still waiting for your answer.`,
    questions: (count) =>
      count > 1 ? `${count} questions, a minute or two.` : 'One question.',
    open: 'Answer',
    closes: (day) => `You can answer until ${day}.`,
  },
  IT: {
    subject: (coach, title) => `${coach} ti ha inviato «${title}»`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} ti ha inviato un questionario. Le tue risposte lo aiutano ad adattare il tuo allenamento.`,
    reminder: (coach) =>
      `Il questionario che ${coach} ti ha inviato aspetta ancora la tua risposta.`,
    questions: (count) =>
      count > 1 ? `${count} domande, un minuto o due.` : 'Una domanda.',
    open: 'Rispondi',
    closes: (day) => `Puoi rispondere fino al ${day}.`,
  },
  ES: {
    subject: (coach, title) => `${coach} te ha enviado «${title}»`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} te ha enviado un cuestionario. Tus respuestas le ayudan a adaptar tu entrenamiento.`,
    reminder: (coach) =>
      `El cuestionario que te envió ${coach} sigue esperando tu respuesta.`,
    questions: (count) =>
      count > 1 ? `${count} preguntas, uno o dos minutos.` : 'Una pregunta.',
    open: 'Responder',
    closes: (day) => `Puedes responder hasta el ${day}.`,
  },
  PT_BR: {
    subject: (coach, title) => `${coach} enviou “${title}” para você`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} enviou um questionário para você. Suas respostas ajudam a adaptar o seu treino.`,
    reminder: (coach) =>
      `O questionário que ${coach} enviou ainda espera a sua resposta.`,
    questions: (count) =>
      count > 1 ? `${count} perguntas, um ou dois minutos.` : 'Uma pergunta.',
    open: 'Responder',
    closes: (day) => `Você pode responder até ${day}.`,
  },
  DE: {
    subject: (coach, title) => `${coach} hat dir „${title}“ geschickt`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} hat dir einen Fragebogen geschickt. Deine Antworten helfen, dein Training anzupassen.`,
    reminder: (coach) =>
      `Der Fragebogen von ${coach} wartet noch auf deine Antwort.`,
    questions: (count) =>
      count > 1 ? `${count} Fragen, ein, zwei Minuten.` : 'Eine Frage.',
    open: 'Antworten',
    closes: (day) => `Du kannst bis ${day} antworten.`,
  },
  PL: {
    subject: (coach, title) => `Nowa ankieta – ${coach}: „${title}”`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} przesyła Ci ankietę. Twoje odpowiedzi pomogą dopasować Twój trening.`,
    reminder: (coach) =>
      `Ankieta, którą przesyła Ci ${coach}, wciąż czeka na Twoją odpowiedź.`,
    questions: (count) => {
      if (count <= 1) return 'Jedno pytanie.';
      const few =
        count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 12 || count % 100 > 14);
      return `${count} ${few ? 'pytania' : 'pytań'}, minuta lub dwie.`;
    },
    open: 'Odpowiedz',
    closes: (day) => `Możesz odpowiedzieć do ${day}.`,
  },
  NL: {
    subject: (coach, title) => `${coach} heeft je ‘${title}’ gestuurd`,
    heading: (title) => title,
    intro: (coach) =>
      `${coach} heeft je een vragenlijst gestuurd. Met je antwoorden kan je training worden bijgestuurd.`,
    reminder: (coach) =>
      `De vragenlijst van ${coach} wacht nog op je antwoord.`,
    questions: (count) =>
      count > 1 ? `${count} vragen, een minuutje of twee.` : 'Eén vraag.',
    open: 'Beantwoorden',
    closes: (day) => `Je kunt antwoorden tot ${day}.`,
  },
};

const locales: Record<EmailLanguage, string> = {
  FR: 'fr-FR',
  EN: 'en-GB',
  IT: 'it-IT',
  ES: 'es-ES',
  PT_BR: 'pt-BR',
  DE: 'de-DE',
  PL: 'pl-PL',
  NL: 'nl-NL',
};

/** Tells an athlete a questionnaire from their coach is open, or still is */
export function buildQuestionnaireRequestEmail({
  language,
  kind,
  coachName,
  title,
  questionCount,
  closesAt,
  timeZone,
  url,
  footer,
}: {
  language: EmailLanguage;
  kind: 'request' | 'reminder';
  coachName: string;
  title: string;
  questionCount: number;
  closesAt: Date;
  timeZone: string;
  url: string;
  footer: EmailFooter;
}) {
  const t = translations[language];
  const day = new Intl.DateTimeFormat(locales[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(closesAt);
  const subject = t.subject(coachName, title);
  const intro = kind === 'request' ? t.intro(coachName) : t.reminder(coachName);

  return {
    subject,
    ...renderEmail({
      language,
      title: subject,
      preview: intro,
      blocks: [
        heading(t.heading(title)),
        paragraph(intro),
        paragraph(t.questions(questionCount)),
        button({ href: url, label: t.open }),
        note(t.closes(day)),
      ],
      footer,
    }),
  };
}
