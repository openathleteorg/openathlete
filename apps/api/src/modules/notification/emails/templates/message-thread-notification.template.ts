import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, heading, note, paragraph, quotes } from '../core/blocks';
import { renderEmail } from '../core/layout';

const translations = {
  ES: {
    subject: 'Nuevos mensajes en tu bandeja de entrada de OpenAthlete',
    title: 'Nuevos mensajes en tu bandeja de entrada',
    preview: (count: number) =>
      count > 1
        ? `${count} mensajes nuevos en una conversación`
        : 'Nuevo mensaje en una conversación',
    intro: (threadTitle?: string | null) =>
      threadTitle
        ? `Has recibido nuevos mensajes en la conversación «${threadTitle}» de OpenAthlete.`
        : 'Has recibido nuevos mensajes en una de tus conversaciones de OpenAthlete.',
    openInbox: 'Abrir bandeja de entrada',
    footerNote:
      'Hemos agrupado estos mensajes para evitar enviarte un correo por cada uno.',
    from: (senderName: string, time: string) => `De ${senderName} — ${time}`,
  },
  FR: {
    subject: 'Nouveaux messages dans votre messagerie OpenAthlete',
    title: 'Nouveaux messages dans votre messagerie',
    preview: (count: number) =>
      count > 1
        ? `${count} nouveaux messages dans une conversation`
        : 'Nouveau message dans une conversation',
    intro: (threadTitle?: string | null) =>
      threadTitle
        ? `Vous avez reçu de nouveaux messages dans la conversation « ${threadTitle} » sur OpenAthlete.`
        : 'Vous avez reçu de nouveaux messages dans une de vos conversations sur OpenAthlete.',
    openInbox: 'Ouvrir la messagerie',
    footerNote:
      'Ces messages ont été regroupés pour éviter de vous envoyer un email à chaque nouveau message.',
    from: (senderName: string, time: string) => `De ${senderName} — ${time}`,
  },
  EN: {
    subject: 'New messages in your OpenAthlete inbox',
    title: 'New messages in your inbox',
    preview: (count: number) =>
      count > 1
        ? `${count} new messages in a conversation`
        : 'New message in a conversation',
    intro: (threadTitle?: string | null) =>
      threadTitle
        ? `You received new messages in the “${threadTitle}” conversation on OpenAthlete.`
        : 'You received new messages in one of your conversations on OpenAthlete.',
    openInbox: 'Open inbox',
    footerNote:
      'These messages were grouped so you do not receive an email for every single message.',
    from: (senderName: string, time: string) => `From ${senderName} — ${time}`,
  },
  IT: {
    subject: 'Nuovi messaggi nella tua casella OpenAthlete',
    title: 'Nuovi messaggi nella tua casella',
    preview: (count: number) =>
      count > 1
        ? `${count} nuovi messaggi in una conversazione`
        : 'Nuovo messaggio in una conversazione',
    intro: (threadTitle?: string | null) =>
      threadTitle
        ? `Hai ricevuto nuovi messaggi nella conversazione “${threadTitle}” su OpenAthlete.`
        : 'Hai ricevuto nuovi messaggi in una delle tue conversazioni su OpenAthlete.',
    openInbox: 'Apri la casella',
    footerNote:
      'Questi messaggi sono stati raggruppati per evitare di inviarti una email per ogni singolo messaggio.',
    from: (senderName: string, time: string) => `Da ${senderName} — ${time}`,
  },
  PT_BR: {
    subject: 'Novas mensagens na sua caixa de entrada do OpenAthlete',
    title: 'Novas mensagens na sua caixa de entrada',
    preview: (count: number) =>
      count > 1
        ? `${count} novas mensagens em uma conversa`
        : 'Nova mensagem em uma conversa',
    intro: (threadTitle?: string | null) =>
      threadTitle
        ? `Você recebeu novas mensagens na conversa “${threadTitle}” no OpenAthlete.`
        : 'Você recebeu novas mensagens em uma das suas conversas no OpenAthlete.',
    openInbox: 'Abrir caixa de entrada',
    footerNote:
      'Estas mensagens foram agrupadas para evitar o envio de um e-mail para cada mensagem.',
    from: (senderName: string, time: string) => `De ${senderName} — ${time}`,
  },
} as const;

const dateLocales: Record<EmailLanguage, string> = {
  ES: 'es-ES',
  FR: 'fr-FR',
  EN: 'en-US',
  IT: 'it-IT',
  PT_BR: 'pt-BR',
};

export function messageThreadNotificationSubject(
  language: EmailLanguage = Language.FR,
) {
  return translations[language].subject;
}

export function buildMessageThreadNotificationEmail({
  threadTitle,
  messages,
  inboxUrl,
  language = Language.FR,
}: {
  threadTitle?: string | null;
  messages: {
    senderName: string;
    contentSnippet: string;
    createdAtIso: string;
  }[];
  inboxUrl?: string;
  language?: EmailLanguage;
}) {
  const t = translations[language];
  const count = messages.length;

  const title = t.title;
  const preview = t.preview(count);

  // Message contents are typed by users: the blocks escape them
  const items = messages.map((message) => ({
    body: message.contentSnippet,
    caption: t.from(
      message.senderName,
      new Date(message.createdAtIso).toLocaleString(dateLocales[language], {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
    ),
  }));

  return renderEmail({
    language,
    title,
    preview,
    blocks: [
      heading(title),
      paragraph(t.intro(threadTitle)),
      ...(items.length > 0 ? [quotes(items)] : []),
      ...(inboxUrl ? [button({ href: inboxUrl, label: t.openInbox })] : []),
      note(t.footerNote),
    ],
  });
}
