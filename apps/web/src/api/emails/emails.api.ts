import client, { routes } from '@/utils/axios';

const EMAIL_LISTS = ['tips', 'recap', 'news', 'questionnaires'] as const;
export type EmailList = (typeof EMAIL_LISTS)[number];

/** The links at the foot of the emails, which carry their own token */
export class EmailsAPI {
  static async unsubscribe(token: string): Promise<void> {
    await client.post(routes.emails.unsubscribe, null, { params: { token } });
  }

  static async resubscribe(token: string): Promise<void> {
    await client.post(routes.emails.resubscribe, null, { params: { token } });
  }
}

/** The list a token is for, read from it: `<user>.<list>.<signature>` */
export function emailListOfToken(token: string | null): EmailList | null {
  const list = token?.split('.')[1];
  return (EMAIL_LISTS as readonly string[]).includes(list ?? '')
    ? (list as EmailList)
    : null;
}
