import whiteLogoSrc from '@/assets/logos/logo_white.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { signOutFirebase } from '@/utils/firebase-auth';
import {
  CLOUD_API_URL,
  getSelectedServerUrl,
  resolveServerUrl,
  saveSelectedServerUrl,
  serverUrlCandidates,
} from '@/utils/mobile-server';
import posthog from 'posthog-js';
import { useState } from 'react';

type Props = { onCancel?: () => void };

export function ServerSelection({ onCancel }: Props) {
  const current = getSelectedServerUrl();
  const [choice, setChoice] = useState<'cloud' | 'custom'>(
    current && current !== CLOUD_API_URL ? 'custom' : 'cloud',
  );
  const [serverInput, setServerInput] = useState(
    current && current !== CLOUD_API_URL ? current : '',
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const save = async () => {
    setError('');
    setPending(true);
    try {
      let url = CLOUD_API_URL;
      if (choice === 'custom') {
        try {
          serverUrlCandidates(serverInput);
        } catch {
          setError(m.mobile_server_invalid_url());
          return;
        }
        url = await resolveServerUrl(serverInput);
      }
      if (url !== current) {
        await signOutFirebase().catch((reason: unknown) =>
          console.error('Failed to sign out Firebase:', reason),
        );
        posthog.reset();
      }
      if (saveSelectedServerUrl(url)) {
        window.location.reload();
      } else {
        onCancel?.();
      }
    } catch {
      setError(m.mobile_server_unreachable());
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--oa-bg)]">
            <img src={whiteLogoSrc} alt="" className="h-7 w-7" />
          </div>
          <span className="font-semibold">OpenAthlete</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{m.mobile_server_title()}</h1>
          <p className="text-sm text-muted-foreground">
            {m.mobile_server_description()}
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
            <input
              type="radio"
              name="server-choice"
              value="cloud"
              checked={choice === 'cloud'}
              onChange={() => setChoice('cloud')}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">
                {m.mobile_server_cloud()}
              </span>
              <span className="block text-sm text-muted-foreground">
                {CLOUD_API_URL}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
            <input
              type="radio"
              name="server-choice"
              value="custom"
              checked={choice === 'custom'}
              onChange={() => setChoice('custom')}
              className="mt-1"
            />
            <span className="font-medium">{m.mobile_server_custom()}</span>
          </label>
          {choice === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="server-url">{m.mobile_server_url_label()}</Label>
              <Input
                id="server-url"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="https://example.org"
                value={serverInput}
                onChange={(event) => setServerInput(event.target.value)}
                aria-invalid={Boolean(error)}
              />
              <p className="text-xs text-muted-foreground">
                {m.mobile_server_url_hint()}
              </p>
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {current && (
          <p className="text-sm text-muted-foreground">
            {m.mobile_server_switch_warning()}
          </p>
        )}
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              {m.cancel()}
            </Button>
          )}
          <Button className="flex-1" onClick={save} isLoading={pending}>
            {m.mobile_server_continue()}
          </Button>
        </div>
      </div>
    </main>
  );
}
