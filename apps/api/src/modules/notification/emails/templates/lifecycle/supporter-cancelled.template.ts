import type { EmailLanguage } from '@openathlete/shared';

import { paragraph, signature } from '../../core/blocks';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: 'merci, et une question',
    preview: 'Une ligne en réponse me suffit.',
    thanks:
      "Je vois que vous avez arrêté votre abonnement Supporter. Merci d'avoir soutenu OpenAthlete pendant ce temps, ça a compté.",
    ask: "Si vous avez deux minutes : qu'est-ce qui vous a fait arrêter ? Le prix, une fonction qui manque, autre chose ? Une ligne en réponse me suffit, je lis tout.",
    free: 'Votre compte et vos données restent là, et tout continue de marcher gratuitement.',
  },
  EN: {
    subject: 'thank you, and a question',
    preview: 'One line in reply is plenty.',
    thanks:
      'I see you ended your Supporter subscription. Thank you for backing OpenAthlete all this time, it mattered.',
    ask: 'If you have two minutes: what made you stop? The price, a missing feature, something else? One line in reply is plenty, I read every reply.',
    free: 'Your account and your data stay, and everything keeps working for free.',
  },
  IT: {
    subject: 'grazie, e una domanda',
    preview: 'Mi basta una riga di risposta.',
    thanks:
      'Vedo che hai interrotto l’abbonamento Supporter. Grazie per aver sostenuto OpenAthlete in questo periodo, è stato importante.',
    ask: 'Se hai due minuti: cosa ti ha fatto smettere? Il prezzo, una funzione che manca, altro? Mi basta una riga di risposta, leggo tutto.',
    free: 'Il tuo account e i tuoi dati restano, e tutto continua a funzionare gratis.',
  },
  ES: {
    subject: 'gracias, y una pregunta',
    preview: 'Me basta con una línea de respuesta.',
    thanks:
      'Veo que has cancelado tu suscripción Supporter. Gracias por apoyar OpenAthlete todo este tiempo, ha contado mucho.',
    ask: 'Si tienes dos minutos: ¿qué te hizo dejarlo? ¿El precio, una función que falta, otra cosa? Me basta con una línea de respuesta, las leo todas.',
    free: 'Tu cuenta y tus datos se quedan, y todo sigue funcionando gratis.',
  },
  PT_BR: {
    subject: 'obrigado, e uma pergunta',
    preview: 'Uma linha de resposta já basta.',
    thanks:
      'Vi que você encerrou sua assinatura Supporter. Obrigado por apoiar o OpenAthlete durante esse tempo, fez diferença.',
    ask: 'Se tiver dois minutos: o que fez você parar? O preço, uma função que falta, outra coisa? Uma linha de resposta já basta, eu leio todas.',
    free: 'Sua conta e seus dados continuam aqui, e tudo segue funcionando de graça.',
  },
  DE: {
    subject: 'danke, und eine Frage',
    preview: 'Eine Zeile als Antwort reicht völlig.',
    thanks:
      'Ich sehe, dass du dein Supporter-Abo beendet hast. Danke, dass du OpenAthlete die ganze Zeit unterstützt hast, das hat viel bedeutet.',
    ask: 'Wenn du zwei Minuten hast: Was hat dich zum Aufhören bewogen? Der Preis, eine fehlende Funktion, etwas anderes? Eine Zeile als Antwort reicht völlig, ich lese jede Antwort.',
    free: 'Dein Konto und deine Daten bleiben erhalten, und alles funktioniert weiterhin kostenlos.',
  },
} satisfies Record<EmailLanguage, unknown>;

export function buildSupporterCancelledEmail(
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
        paragraph(t.thanks),
        paragraph(t.ask),
        paragraph(t.free),
        signature(props.signature),
      ],
    }),
  };
}
