import {
  useAiAccessQuery,
  useAiCredentialsQuery,
  useAiModelPreferencesQuery,
  useAiProvidersQuery,
  useUpdateAiModelPreferencesMutation,
} from '@/api/ai-settings';
import {
  aiProviderName,
  aiTaskLabel,
} from '@/components/ai-settings/ai-labels';
import { ModelInput } from '@/components/ai-settings/model-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AI_FEATURE_TASKS,
  AiModelPreferenceDto,
  AiTask,
} from '@openathlete/shared';

import { SettingsPanel, SettingsSection } from '../settings-section';

/** Select value of "no key of mine" (default row) / "same as default". */
const NONE = 'none';

type Draft = Record<AiTask, { credential: string; modelId: string }>;

function toDraft(preferences: AiModelPreferenceDto[]): Draft {
  const draft = Object.fromEntries(
    Object.values(AiTask).map((task) => [
      task,
      { credential: NONE, modelId: '' },
    ]),
  ) as Draft;
  for (const preference of preferences) {
    draft[preference.task] = {
      credential: String(preference.aiCredentialId),
      modelId: preference.modelId,
    };
  }
  return draft;
}

export function AiModelsSection() {
  const { data: providers = [] } = useAiProvidersQuery();
  const { data: credentials = [] } = useAiCredentialsQuery();
  const { data: preferences } = useAiModelPreferencesQuery();
  const { data: access } = useAiAccessQuery();
  const updatePreferences = useUpdateAiModelPreferencesMutation();

  const initial = useMemo(() => toDraft(preferences ?? []), [preferences]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(initial), [initial]);

  const providerOf = (credential: string) => {
    const providerId = credentials.find(
      (item) => String(item.aiCredentialId) === credential,
    )?.provider;
    return providers.find((item) => item.id === providerId);
  };

  const update = (task: AiTask, change: Partial<Draft[AiTask]>) =>
    setDraft((current) => ({
      ...current,
      [task]: { ...current[task], ...change },
    }));

  const handleSave = async () => {
    setError(null);
    const chosen = Object.entries(draft).filter(
      ([, row]) => row.credential !== NONE,
    );
    if (chosen.some(([, row]) => !row.modelId.trim())) {
      setError(m.ai_models_model_required());
      return;
    }
    await updatePreferences.mutateAsync({
      preferences: chosen.map(([task, row]) => ({
        task: task as AiTask,
        aiCredentialId: Number(row.credential),
        modelId: row.modelId.trim(),
      })),
    });
    toast.success(m.ai_models_saved());
  };

  const row = (task: AiTask) => {
    const value = draft[task];
    const effective = task === AiTask.DEFAULT ? undefined : access?.tasks[task];
    return (
      <div
        key={task}
        className="grid min-h-14 gap-2 px-4 py-3 sm:grid-cols-3 sm:items-center"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">{aiTaskLabel(task)}</p>
          {effective && (
            <p className="truncate text-xs text-muted-foreground">
              {effective.available ? (
                <>
                  {aiProviderName(providers, effective.provider ?? '')}{' '}
                  {effective.modelId}{' '}
                  <Badge variant="secondary" className="ml-1">
                    {effective.source === 'hosted'
                      ? m.ai_source_hosted()
                      : m.ai_source_own_key()}
                  </Badge>
                </>
              ) : (
                m.ai_not_available()
              )}
            </p>
          )}
        </div>
        {credentials.length > 0 && (
          <Select
            value={value.credential}
            onValueChange={(credential) =>
              update(task, {
                credential,
                modelId:
                  credential === value.credential
                    ? value.modelId
                    : (providerOf(credential)?.models[0]?.id ?? ''),
              })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-label={`${aiTaskLabel(task)} ${m.ai_models_key()}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                {task === AiTask.DEFAULT
                  ? m.ai_models_none()
                  : m.ai_models_use_default()}
              </SelectItem>
              {credentials.map((credential) => (
                <SelectItem
                  key={credential.aiCredentialId}
                  value={String(credential.aiCredentialId)}
                >
                  {credential.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {credentials.length > 0 && value.credential !== NONE ? (
          <ModelInput
            provider={providerOf(value.credential)}
            value={value.modelId}
            onChange={(modelId) => update(task, { modelId })}
            aria-label={`${aiTaskLabel(task)} ${m.ai_models_model()}`}
          />
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>
    );
  };

  return (
    <SettingsSection
      title={m.ai_models_title()}
      description={m.ai_models_description()}
    >
      {credentials.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">
          {m.ai_models_no_keys()}
        </p>
      )}
      <SettingsPanel>
        {credentials.length > 0 && row(AiTask.DEFAULT)}
        {AI_FEATURE_TASKS.map(row)}
      </SettingsPanel>
      {error && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      )}
      {credentials.length > 0 && (
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-fit"
            onClick={handleSave}
            disabled={updatePreferences.isPending}
          >
            {m.ai_models_save()}
          </Button>
        </div>
      )}
    </SettingsSection>
  );
}
