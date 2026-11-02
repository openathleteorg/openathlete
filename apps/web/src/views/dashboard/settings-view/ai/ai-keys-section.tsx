import {
  useAiCredentialsQuery,
  useAiModelPreferencesQuery,
  useAiProvidersQuery,
  useDeleteAiCredentialMutation,
  useTestAiCredentialMutation,
} from '@/api/ai-settings';
import { AddAiKeyDialog } from '@/components/ai-settings/add-ai-key-dialog';
import { aiProviderName } from '@/components/ai-settings/ai-labels';
import { ConfirmAction } from '@/components/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { aiErrorMessage } from '@/utils/ai-errors';
import { KeyRound, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AiCredentialDto, AiErrorCode } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from '../settings-section';

function statusBadge(credential: AiCredentialDto) {
  if (credential.lastError === AiErrorCode.CREDENTIAL_REJECTED) {
    return <Badge variant="destructive">{m.ai_key_status_rejected()}</Badge>;
  }
  if (credential.lastError === AiErrorCode.QUOTA_EXCEEDED) {
    return <Badge variant="destructive">{m.ai_key_status_quota()}</Badge>;
  }
  if (credential.lastUsedAt) {
    return (
      <Badge variant="secondary">
        {m.ai_key_last_used({
          date: new Date(credential.lastUsedAt).toLocaleDateString(getLocale()),
        })}
      </Badge>
    );
  }
  return null;
}

export function AiKeysSection() {
  const { data: providers = [] } = useAiProvidersQuery();
  const { data: credentials = [], isPending } = useAiCredentialsQuery();
  const { data: preferences = [] } = useAiModelPreferencesQuery();
  const deleteCredential = useDeleteAiCredentialMutation();
  const testCredential = useTestAiCredentialMutation();
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AiCredentialDto | null>(null);

  /** The model the key runs, or a known model of its provider. */
  const modelToTest = (credential: AiCredentialDto) =>
    preferences.find(
      (item) => item.aiCredentialId === credential.aiCredentialId,
    )?.modelId ??
    providers.find((item) => item.id === credential.provider)?.models[0]?.id;

  const handleTest = async (credential: AiCredentialDto) => {
    const modelId = modelToTest(credential);
    if (!modelId) return;
    try {
      const result = await testCredential.mutateAsync({
        aiCredentialId: credential.aiCredentialId,
        modelId,
      });
      if (result.ok) {
        toast.success(m.ai_key_test_ok({ model: modelId }));
      } else {
        toast.error(aiErrorMessage(result.code) ?? m.ai_error_provider());
      }
    } catch (error) {
      toast.error(aiErrorMessage(error) ?? m.ai_error_provider());
    }
  };

  return (
    <SettingsSection
      title={m.ai_keys_title()}
      description={m.ai_keys_description()}
      action={
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          disabled={!providers.length}
        >
          <Plus className="size-4" />
          {m.ai_key_add()}
        </Button>
      }
    >
      {isPending ? (
        <SettingsRowsSkeleton count={1} />
      ) : credentials.length === 0 ? (
        <SettingsEmpty>{m.ai_keys_empty()}</SettingsEmpty>
      ) : (
        <SettingsPanel role="list" aria-label={m.ai_keys_title()}>
          {credentials.map((credential) => (
            <SettingsRow
              key={credential.aiCredentialId}
              role="listitem"
              stacked
              leading={<KeyRound className="size-5" />}
              title={credential.label}
              description={
                <>
                  <span className="block truncate">
                    {aiProviderName(providers, credential.provider)}
                    {credential.apiKeyHint && ` · ${credential.apiKeyHint}`}
                    {credential.baseUrl && ` · ${credential.baseUrl}`}
                  </span>
                  {statusBadge(credential)}
                </>
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => handleTest(credential)}
                disabled={!modelToTest(credential) || testCredential.isPending}
              >
                {m.ai_key_test()}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="max-md:w-11"
                aria-label={`${m.ai_key_delete()} ${credential.label}`}
                onClick={() => setToDelete(credential)}
              >
                <Trash className="size-4" />
              </Button>
            </SettingsRow>
          ))}
        </SettingsPanel>
      )}

      <AddAiKeyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        providers={providers}
      />
      <ConfirmAction
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteCredential.mutateAsync(toDelete.aiCredentialId);
          toast.success(m.ai_key_deleted());
          setToDelete(null);
        }}
        title={m.ai_key_delete()}
        message={m.ai_key_delete_confirm()}
        isLoading={deleteCredential.isPending}
      />
    </SettingsSection>
  );
}
