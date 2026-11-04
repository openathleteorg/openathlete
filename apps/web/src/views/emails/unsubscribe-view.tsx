import {
  EmailList,
  emailListOfToken,
  useResubscribeMutation,
  useUnsubscribeMutation,
} from '@/api/emails';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { isAxiosError } from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

const listLabels: Record<EmailList, () => string> = {
  tips: m.unsubscribe_list_tips,
  recap: m.unsubscribe_list_recap,
  news: m.unsubscribe_list_news,
};

/**
 * Where the unsubscribe link of an email leads, signed in or not. It asks
 * before unsubscribing: mail scanners open links, a click must decide.
 */
export function UnsubscribeView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const list = emailListOfToken(token);
  const unsubscribe = useUnsubscribeMutation();
  const resubscribe = useResubscribeMutation();

  const settingsLink = (
    <Button asChild variant="link">
      <Link to={`${getPath(['dashboard', 'settings'])}?tab=profile`}>
        {m.unsubscribe_manage()}
      </Link>
    </Button>
  );

  const invalid =
    !token ||
    !list ||
    (isAxiosError(unsubscribe.error) &&
      unsubscribe.error.response?.status === 400);

  let title = m.unsubscribe_title();
  let body: string;
  let actions: React.ReactNode;
  if (invalid) {
    body = m.unsubscribe_invalid();
    actions = settingsLink;
  } else if (resubscribe.isSuccess) {
    body = m.unsubscribe_resubscribed({ list: listLabels[list]() });
    actions = settingsLink;
  } else if (unsubscribe.isSuccess) {
    title = m.unsubscribe_done_title();
    body = m.unsubscribe_done_text({ list: listLabels[list]() });
    actions = (
      <>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => resubscribe.mutate(token)}
          isLoading={resubscribe.isPending}
        >
          {m.unsubscribe_undo()}
        </Button>
        {settingsLink}
      </>
    );
  } else {
    body = m.unsubscribe_confirm_text({ list: listLabels[list]() });
    actions = (
      <Button
        className="h-11"
        onClick={() => unsubscribe.mutate(token)}
        isLoading={unsubscribe.isPending}
      >
        {m.unsubscribe_confirm()}
      </Button>
    );
  }

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-base text-muted-foreground">{body}</p>
          {(unsubscribe.isError || resubscribe.isError) && !invalid && (
            <p role="alert" className="text-sm text-destructive">
              {m.unsubscribe_failed()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">{actions}</div>
      </div>
    </section>
  );
}
