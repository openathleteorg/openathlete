import {
  useActivityUploadWebhookQuery,
  useGenerateActivityUploadWebhookMutation,
  useRevokeActivityUploadWebhookMutation,
} from '@/api/activity-import';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { CheckCircle2, ChevronDown, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ActivityUploadWebhookCredentialsDto,
  WebhookConnector,
} from '@openathlete/shared';

import { SettingsCopyField, SettingsRow } from './settings-section';

export function ActivityUploadWebhookRow({
  connector,
}: {
  connector: WebhookConnector;
}) {
  const query = useActivityUploadWebhookQuery(connector);
  const lastUploadAt = query.data?.lastUploadAt;
  const title =
    connector === 'rungap'
      ? m.webhook_upload_rungap_title()
      : m.webhook_upload_generic_title();
  return (
    <Collapsible data-connector-provider={connector}>
      <SettingsRow
        title={title}
        leading={<Link2 className="m-2 size-6" />}
        description={
          query.data &&
          (query.data.enabled ? (
            <>
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0" />
                {m.webhook_upload_active()}
              </span>
              {lastUploadAt && (
                <time dateTime={lastUploadAt}>
                  {m.webhook_upload_last_received({
                    date: new Date(lastUploadAt).toLocaleDateString(
                      getLocale(),
                      {
                        dateStyle: 'medium',
                      },
                    ),
                  })}
                </time>
              )}
            </>
          ) : (
            m.webhook_upload_inactive()
          ))
        }
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={title}
            className="size-11 [&[data-state=open]>svg]:rotate-180"
          >
            <ChevronDown className="size-4 transition-transform" />
          </Button>
        </CollapsibleTrigger>
      </SettingsRow>
      <CollapsibleContent className="border-t bg-muted/30">
        <WebhookUploadOptions connector={connector} query={query} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function WebhookUploadOptions({
  connector,
  query,
}: {
  connector: WebhookConnector;
  query: ReturnType<typeof useActivityUploadWebhookQuery>;
}) {
  const [credentials, setCredentials] =
    useState<ActivityUploadWebhookCredentialsDto | null>(null);
  const generate = useGenerateActivityUploadWebhookMutation(
    connector,
    setCredentials,
  );
  const revoke = useRevokeActivityUploadWebhookMutation(connector);
  const pending = generate.isPending || revoke.isPending;

  if (query.isPending) return <Skeleton className="m-4 h-9 w-40" />;
  if (!query.data) {
    return (
      <Button
        className="m-4"
        variant="outline"
        onClick={() => void query.refetch()}
      >
        {m.webhook_upload_retry()}
      </Button>
    );
  }

  const { enabled } = query.data;
  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {connector === 'rungap'
          ? m.webhook_upload_rungap_setup()
          : m.webhook_upload_description()}
      </p>
      {credentials && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {m.webhook_upload_one_time()}
          </p>
          <CredentialField
            label={m.webhook_upload_url()}
            value={
              connector === 'generic'
                ? credentials.url.replace(`/${credentials.token}`, '')
                : credentials.url
            }
          />
          {credentials.passkey ? (
            <CredentialField
              label={m.webhook_upload_passkey()}
              value={credentials.passkey}
            />
          ) : (
            <CredentialField
              label={m.webhook_upload_token()}
              value={credentials.token}
            />
          )}
          <Button variant="ghost" onClick={() => setCredentials(null)}>
            {m.done()}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            generate.mutate(undefined, {
              onError: () => toast.error(m.failed_to_initiate_connection()),
            })
          }
        >
          {enabled ? m.webhook_upload_replace() : m.webhook_upload_generate()}
        </Button>
        {enabled && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              revoke.mutate(undefined, {
                onSuccess: () => setCredentials(null),
                onError: () => toast.error(m.failed_to_disconnect()),
              })
            }
          >
            {m.webhook_upload_revoke()}
          </Button>
        )}
      </div>
    </div>
  );
}

function CredentialField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(m.webhook_upload_copied());
    } catch {
      toast.error(m.webhook_upload_copy_failed());
    }
  };
  return (
    <>
      <p className="text-sm font-medium">{label}</p>
      <SettingsCopyField
        value={value}
        onCopy={() => void copy()}
        className="ph-no-capture"
      />
    </>
  );
}
