import { paragraph, signature } from '../../core/blocks';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

// Written as a person writes, without layout: it asks for a reply
const translations = {
  FR: {
    subject: 'une question rapide',
    preview: 'Une ligne en réponse me suffit.',
    body: "Je vois que votre compte OpenAthlete est toujours vide, et je me demande ce qui a bloqué. Une montre qu'on ne gère pas, une connexion qui a échoué, ou simplement pas le temps ?",
    ask: "Une ligne en réponse me suffit. Je lis tout, et c'est ce qui décide de ce que je corrige en premier.",
  },
  EN: {
    subject: 'a quick question',
    preview: 'One line in reply is plenty.',
    body: "I see your OpenAthlete account is still empty, and I'm wondering what got in the way. A watch we don't support, a connection that failed, or just no time?",
    ask: 'One line in reply is plenty. I read every reply, and they decide what I fix first.',
  },
  IT: {
    subject: 'una domanda veloce',
    preview: 'Mi basta una riga di risposta.',
    body: 'Vedo che il tuo account OpenAthlete è ancora vuoto, e mi chiedo cosa ti abbia bloccato. Un orologio che non supportiamo, una connessione non riuscita, o semplicemente poco tempo?',
    ask: 'Mi basta una riga di risposta. Leggo tutto, ed è così che decido cosa sistemare per primo.',
  },
  ES: {
    subject: 'una pregunta rápida',
    preview: 'Me basta con una línea de respuesta.',
    body: 'Veo que tu cuenta de OpenAthlete sigue vacía y me pregunto qué te frenó. ¿Un reloj que no admitimos, una conexión que falló o simplemente falta de tiempo?',
    ask: 'Me basta con una línea de respuesta. Las leo todas, y deciden qué arreglo primero.',
  },
  PT_BR: {
    subject: 'uma pergunta rápida',
    preview: 'Uma linha de resposta já basta.',
    body: 'Vejo que sua conta no OpenAthlete continua vazia e fiquei pensando no que travou. Um relógio que não suportamos, uma conexão que falhou ou só falta de tempo?',
    ask: 'Uma linha de resposta já basta. Eu leio todas, e são elas que decidem o que eu corrijo primeiro.',
  },
  DE: {
    subject: 'eine kurze Frage',
    preview: 'Eine Zeile als Antwort reicht völlig.',
    body: 'Ich sehe, dass dein OpenAthlete-Konto noch leer ist, und frage mich, woran es gehakt hat. Eine Uhr, die wir nicht unterstützen, eine Verbindung, die fehlgeschlagen ist, oder einfach keine Zeit?',
    ask: 'Eine Zeile als Antwort reicht völlig. Ich lese jede Antwort, und sie entscheiden, was ich zuerst behebe.',
  },
};

export function buildConnectQuestionEmail(
  props: LifecycleEmailProps,
): LifecycleEmail {
  const t = translations[props.language];
  return {
    subject: t.subject,
    ...renderEmail({
      language: props.language,
      title: t.subject,
      preview: t.preview,
      footer: props.footer,
      variant: 'letter',
      blocks: [
        paragraph(greeting(props.language, props.name)),
        paragraph(t.body),
        paragraph(t.ask),
        signature(props.signature),
      ],
    }),
  };
}
