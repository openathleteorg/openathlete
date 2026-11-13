import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph, signature } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  FR: {
    title: 'Votre compte est prêt',
    preview: 'Une étape avant de voir vos séances : relier votre montre.',
    greeting: (name?: string) => (name ? `Bonjour ${name},` : 'Bonjour,'),
    body: "Première chose à faire : relier votre montre ou Strava. OpenAthlete récupère alors votre historique et calcule votre charge d'entraînement, sans rien à saisir.",
    button: 'Relier ma montre',
    providers:
      "Garmin, Polar, Suunto, COROS et Strava sont pris en charge. L'import prend quelques minutes.",
    postscript:
      'P.S. Vous préparez une course en ce moment ? Répondez avec son nom, je lis tout.',
  },
  EN: {
    title: 'Your account is ready',
    preview: 'One step before your sessions show up: connect your watch.',
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    body: 'First thing to do: connect your watch or Strava. OpenAthlete then pulls in your history and works out your training load, with nothing to type in.',
    button: 'Connect my watch',
    providers:
      'Garmin, Polar, Suunto, COROS and Strava are supported. The import takes a few minutes.',
    postscript:
      'P.S. Training for a race right now? Reply with its name, I read every reply.',
  },
  IT: {
    title: 'Il tuo account è pronto',
    preview: 'Un passo prima di vedere le tue sessioni: collega l’orologio.',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    body: 'Prima cosa da fare: collega il tuo orologio o Strava. OpenAthlete recupera il tuo storico e calcola il carico di allenamento, senza nulla da inserire a mano.',
    button: 'Collega il mio orologio',
    providers:
      'Sono supportati Garmin, Polar, Suunto, COROS e Strava. L’importazione richiede qualche minuto.',
    postscript:
      'P.S. Stai preparando una gara? Rispondi con il suo nome, leggo tutte le risposte.',
  },
  ES: {
    title: 'Tu cuenta está lista',
    preview: 'Un paso antes de ver tus sesiones: conectar tu reloj.',
    greeting: (name?: string) => (name ? `Hola, ${name}:` : 'Hola:'),
    body: 'Lo primero: conecta tu reloj o Strava. OpenAthlete trae tu historial y calcula tu carga de entrenamiento, sin que tengas que escribir nada.',
    button: 'Conectar mi reloj',
    providers:
      'Funciona con Garmin, Polar, Suunto, COROS y Strava. La importación tarda unos minutos.',
    postscript:
      'P. D.: ¿Preparas alguna carrera? Responde con su nombre, leo todas las respuestas.',
  },
  PT_BR: {
    title: 'Sua conta está pronta',
    preview: 'Um passo antes de ver seus treinos: conectar seu relógio.',
    greeting: (name?: string) => (name ? `Olá, ${name},` : 'Olá,'),
    body: 'Primeiro passo: conecte seu relógio ou o Strava. O OpenAthlete traz seu histórico e calcula sua carga de treino, sem nada para digitar.',
    button: 'Conectar meu relógio',
    providers:
      'Garmin, Polar, Suunto, COROS e Strava são compatíveis. A importação leva alguns minutos.',
    postscript:
      'P.S.: Está se preparando para alguma prova? Responda com o nome dela, eu leio todas as respostas.',
  },
  DE: {
    title: 'Dein Konto ist bereit',
    preview:
      'Noch ein Schritt, bis deine Einheiten erscheinen: Verbinde deine Uhr.',
    greeting: (name?: string) => (name ? `Hallo ${name},` : 'Hallo,'),
    body: 'Als Erstes: Verbinde deine Uhr oder Strava. OpenAthlete importiert dann deinen Verlauf und berechnet deine Trainingsbelastung, ganz ohne Eintippen.',
    button: 'Uhr verbinden',
    providers:
      'Garmin, Polar, Suunto, COROS und Strava werden unterstützt. Der Import dauert ein paar Minuten.',
    postscript:
      'P.S. Bereitest du dich gerade auf einen Wettkampf vor? Antworte mit seinem Namen, ich lese jede Antwort.',
  },
} as const satisfies Record<EmailLanguage, unknown>;

export function buildWelcomeEmail({
  name,
  connections_url,
  signature: signedBy,
  language = Language.FR,
}: {
  name?: string;
  connections_url: string;
  /** Who signs, on instances that write to their users in person */
  signature?: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  return renderEmail({
    language,
    title: t.title,
    preview: t.preview,
    blocks: [
      heading(t.title),
      paragraph(t.greeting(name)),
      paragraph(t.body),
      button({ href: connections_url, label: t.button }),
      note(t.providers),
      ...(signedBy ? [signature(signedBy), paragraph(t.postscript)] : []),
    ],
  });
}
