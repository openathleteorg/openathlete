import {
  useActivityUploadWebhookQuery,
  useGenerateActivityUploadWebhookMutation,
  useRevokeActivityUploadWebhookMutation,
} from '@/api/activity-import';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { ChevronDown, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ActivityUploadWebhookCredentialsDto } from '@openathlete/shared';

import { SettingsCopyField, SettingsRow } from './settings-section';

export function ActivityUploadWebhookRow() {
  return (
    <Collapsible data-connector-provider="WEBHOOK">
      <SettingsRow
        title={m.webhook_upload_title()}
        leading={<Link2 className="m-2 size-6" />}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.webhook_upload_title()}
            className="size-11 [&[data-state=open]>svg]:rotate-180"
          >
            <ChevronDown className="size-4 transition-transform" />
          </Button>
        </CollapsibleTrigger>
      </SettingsRow>
      <CollapsibleContent className="border-t bg-muted/30">
        <WebhookUploadOptions />
      </CollapsibleContent>
    </Collapsible>
  );
}

function WebhookUploadOptions() {
  const query = useActivityUploadWebhookQuery();
  const [credentials, setCredentials] =
    useState<ActivityUploadWebhookCredentialsDto | null>(null);
  const [signingChoice, setSigningChoice] = useState<boolean>();
  const generate = useGenerateActivityUploadWebhookMutation(setCredentials);
  const revoke = useRevokeActivityUploadWebhookMutation();
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

  const { enabled, runGapSignature } = query.data;
  const requireSignature = signingChoice ?? runGapSignature;
  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {m.webhook_upload_description()}
      </p>
      {enabled && <p className="text-sm">{m.webhook_upload_active()}</p>}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <Checkbox
          checked={requireSignature}
          disabled={pending}
          onCheckedChange={(checked) => setSigningChoice(checked === true)}
        />
        {m.webhook_upload_require_rungap()}
      </label>
      {credentials && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {m.webhook_upload_one_time()}
          </p>
          {credentials.passkey && (
            <p className="text-sm text-muted-foreground">
              {m.webhook_upload_rungap_setup()}
            </p>
          )}
          <CredentialField
            label={m.webhook_upload_url()}
            value={credentials.url}
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
            generate.mutate(requireSignature, {
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
