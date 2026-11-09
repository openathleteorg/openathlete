import {
  useAiModelPreferencesQuery,
  useCreateAiCredentialMutation,
  useTestAiCredentialMutation,
  useUpdateAiModelPreferencesMutation,
} from '@/api/ai-settings';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { aiErrorMessage } from '@/utils/ai-errors';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

import {
  AiProvider,
  AiTask,
  createAiCredentialDtoSchema,
} from '@openathlete/shared';

import { ModelInput } from './model-input';
import { ProviderPicker } from './provider-picker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: AiProvider[];
}

export function AddAiKeyDialog({ open, onOpenChange, providers }: Props) {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [label, setLabel] = useState('');
  const [modelId, setModelId] = useState('');
  const [headersText, setHeadersText] = useState('');
  const [headersOpen, setHeadersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: preferences = [] } = useAiModelPreferencesQuery();
  const createCredential = useCreateAiCredentialMutation();
  const testCredential = useTestAiCredentialMutation();
  const updatePreferences = useUpdateAiModelPreferencesMutation();

  const provider = providers.find((item) => item.id === providerId);
  const isSaving =
    createCredential.isPending ||
    testCredential.isPending ||
    updatePreferences.isPending;

  const reset = () => {
    setProviderId(null);
    setApiKey('');
    setBaseUrl('');
    setLabel('');
    setModelId('');
    setHeadersText('');
    setHeadersOpen(false);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const headers = parseHeaderLines(headersText);
    if (!headers) {
      setError(m.ai_key_headers_invalid());
      return;
    }
    const parsed = createAiCredentialDtoSchema.safeParse({
      provider: providerId ?? '',
      apiKey,
      label: label || undefined,
      baseUrl: provider?.requiresBaseUrl ? baseUrl : undefined,
      headers: Object.keys(headers).length ? headers : undefined,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues.some((issue) => issue.path[0] === 'headers')
          ? m.ai_key_headers_invalid()
          : m.ai_key_form_invalid(),
      );
      return;
    }
    if (!provider) {
      setError(m.ai_key_form_invalid());
      return;
    }
    if (!apiKey.trim() && !provider.apiKeyOptional) {
      setError(m.ai_key_form_invalid());
      return;
    }

    try {
      const credential = await createCredential.mutateAsync(parsed.data);
      const model = modelId.trim();
      if (model) {
        const result = await testCredential.mutateAsync({
          aiCredentialId: credential.aiCredentialId,
          modelId: model,
        });
        if (!result.ok) {
          toast.error(aiErrorMessage(result.code) ?? m.ai_error_provider());
        } else {
          toast.success(m.ai_key_test_ok({ model }));
          // A first key becomes the default model, so AI works right away
          if (!preferences.some((item) => item.task === AiTask.DEFAULT)) {
            await updatePreferences.mutateAsync({
              preferences: [
                ...preferences,
                {
                  task: AiTask.DEFAULT,
                  aiCredentialId: credential.aiCredentialId,
                  modelId: model,
                },
              ],
            });
          }
        }
      } else {
        toast.success(m.ai_key_saved());
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(aiErrorMessage(err) ?? m.ai_key_save_failed());
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.ai_key_add_title()}</DialogTitle>
          <DialogDescription>{m.ai_key_add_description()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-key-provider">{m.ai_key_provider()}</Label>
            <ProviderPicker
              id="ai-key-provider"
              providers={providers}
              value={providerId}
              onChange={(id) => {
                setProviderId(id);
                setModelId('');
              }}
            />
          </div>

          {provider?.requiresBaseUrl && (
            <div className="space-y-2">
              <Label htmlFor="ai-key-base-url">{m.ai_key_base_url()}</Label>
              <Input
                id="ai-key-base-url"
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="http://localhost:11434/v1"
                required
              />
              <p className="text-xs text-muted-foreground">
                {m.ai_key_base_url_hint()}
              </p>
            </div>
          )}

          {providerId === 'opencode-go' && (
            <p className="text-xs text-muted-foreground">
              {m.ai_key_opencode_session_hint()}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ai-key-api-key">
                {provider?.apiKeyOptional
                  ? m.ai_key_api_key_optional()
                  : m.ai_key_api_key()}
              </Label>
              {provider?.docUrl && (
                <a
                  href={provider.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {m.ai_key_get_key()}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <Input
              id="ai-key-api-key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-key-model">{m.ai_key_model()}</Label>
            <ModelInput
              id="ai-key-model"
              provider={provider}
              value={modelId}
              onChange={setModelId}
            />
            <p className="text-xs text-muted-foreground">
              {m.ai_key_model_hint()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-key-label">{m.ai_key_label()}</Label>
            <Input
              id="ai-key-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={100}
            />
          </div>

          <Collapsible
            open={headersOpen}
            onOpenChange={setHeadersOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground"
              >
                <ChevronDown
                  className={
                    headersOpen
                      ? 'size-4 rotate-180 transition-transform'
                      : 'size-4 transition-transform'
                  }
                />
                {m.ai_key_headers()}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Textarea
                id="ai-key-headers"
                value={headersText}
                onChange={(event) => setHeadersText(event.target.value)}
                placeholder="X-Title: OpenAthlete"
                aria-label={m.ai_key_headers()}
                rows={3}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                {m.ai_key_headers_hint()}
              </p>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!providerId || isSaving}>
              {m.ai_key_save()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Parses "Name: value" lines; null when a line is not a header. */
function parseHeaderLines(text: string): Record<string, string> | null {
  const headers: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) return null;
    const name = trimmed.slice(0, separator).trim();
    if (!name) return null;
    headers[name] = trimmed.slice(separator + 1).trim();
  }
  return headers;
}
