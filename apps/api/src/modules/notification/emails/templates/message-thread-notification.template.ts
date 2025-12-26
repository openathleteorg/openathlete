import { EmailLanguage } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';

import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

const translations = {
  FR: {
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
} as const;

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

  const items = messages
    .map((message) => {
      const createdAt = new Date(message.createdAtIso);
      const timeLabel = createdAt.toLocaleString(
        language === Language.FR ? 'fr-FR' : 'en-US',
        {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        },
      );

      return `<li style="margin-bottom:8px;font-size:14px;line-height:20px;">
        <p style="margin:0 0 4px 0;">${message.contentSnippet}</p>
        <small style="display:block;margin:0;font-size:12px;color:#6b7280;">${t.from(
          message.senderName,
          timeLabel,
        )}</small>
      </li>`;
    })
    .join('');

  const content = [
    h1(title),
    p(t.intro(threadTitle)),
    messages.length > 0
      ? `<ul style="margin:0 0 16px 0;padding-left:20px;list-style-type:disc;">${items}</ul>`
      : '',
    inboxUrl ? button({ href: inboxUrl, label: t.openInbox }) : '',
    note(t.footerNote),
  ]
    .filter(Boolean)
    .join('');

  return layout({ title, preview, contentHtml: content });
}
