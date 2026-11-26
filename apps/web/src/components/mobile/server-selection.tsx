import whiteLogoSrc from '@/assets/logos/logo_white.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import {
  type AuthSessionSnapshot,
  captureAuthSession,
  isAuthSessionCurrent,
} from '@/utils/auth-attempt';
import { getDefaultApiBaseUrl } from '@/utils/capacitor';
import { signOutFirebase } from '@/utils/firebase-auth';
import {
  getSelectedServerUrl,
  isServerChange,
  resolveServerUrl,
  saveSelectedServerUrl,
  serverUrlCandidates,
} from '@/utils/mobile-server';
import {
  disconnectWatchScheduleOnExit,
  fenceWatchScheduleOnExit,
  latchWatchScheduleExit,
  recoverWatchScheduleCleanup,
  releaseWatchScheduleExit,
  watchScheduleActiveScope,
  watchScheduleExitBoundary,
} from '@/utils/watch-schedule';
import posthog from 'posthog-js';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type Props = { onCancel?: () => void };

type ServerSave = {
  session: AuthSessionSnapshot;
  boundary: number | null;
};

export function ServerSelection({ onCancel }: Props) {
  const defaultUrl = getDefaultApiBaseUrl();
  const current = getSelectedServerUrl() ?? defaultUrl;
  const [choice, setChoice] = useState<'default' | 'custom'>(
    current !== defaultUrl ? 'custom' : 'default',
  );
  const [serverInput, setServerInput] = useState(
    current !== defaultUrl ? current : '',
  );
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'resolving' | 'committing' | null>(null);
  const pendingSave = useRef<ServerSave | null>(null);

  const invalidateSave = useCallback(() => {
    const save = pendingSave.current;
    pendingSave.current = null;
    // A successor that started initializing during the fence needs its
    // observed boundary to stay in place until it establishes its session.
    if (save && save.boundary !== null && isAuthSessionCurrent(save.session)) {
      releaseWatchScheduleExit(save.boundary);
    }
  }, []);
  useLayoutEffect(() => invalidateSave, [invalidateSave]);

  const cancel = () => {
    const save = pendingSave.current;
    if (save && save.boundary !== null) return;
    invalidateSave();
    setPhase(null);
    onCancel?.();
  };

  const save = async () => {
    if (pendingSave.current) return;
    const session = captureAuthSession();
    const operation: ServerSave = { session, boundary: null };
    pendingSave.current = operation;
    const previousBoundary = watchScheduleExitBoundary();
    const activeScope = watchScheduleActiveScope();
    const scope =
      activeScope?.instanceURL === session.instanceURL ? activeScope : null;
    const isCurrent = () =>
      pendingSave.current === operation &&
      isAuthSessionCurrent(session) &&
      watchScheduleExitBoundary() === (operation.boundary ?? previousBoundary);
    setError('');
    setPhase('resolving');
    try {
      let url = defaultUrl;
      if (choice === 'custom') {
        try {
          serverUrlCandidates(serverInput);
        } catch {
          setError(m.mobile_server_invalid_url());
          return;
        }
        url = await resolveServerUrl(serverInput);
      }
      if (!isCurrent()) return;
      if (isServerChange(url, defaultUrl)) {
        // The old token remains installed until the native fence acknowledges.
        operation.boundary = latchWatchScheduleExit();
        setPhase('committing');
        await signOutFirebase().catch((reason: unknown) =>
          console.error('Failed to sign out Firebase:', reason),
        );
        if (!isCurrent()) return;
        const acknowledged = await fenceWatchScheduleOnExit();
        if (!isCurrent()) return;
        if (!acknowledged) {
          setError(m.apple_watch_server_switch_blocked());
          return;
        }
        if (scope) {
          void disconnectWatchScheduleOnExit(scope);
        } else {
          // The fence already recorded any authorized native teardown.
          void recoverWatchScheduleCleanup().catch(() => undefined);
        }
        posthog.reset();
      }
      if (saveSelectedServerUrl(url, defaultUrl)) {
        // Keep the old session latched until this document is replaced.
        pendingSave.current = null;
        window.location.reload();
      } else {
        onCancel?.();
      }
    } catch {
      if (isCurrent()) setError(m.mobile_server_unreachable());
    } finally {
      if (pendingSave.current === operation) {
        invalidateSave();
        setPhase(null);
      }
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
              value="default"
              checked={choice === 'default'}
              onChange={() => setChoice('default')}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">
                {defaultUrl === 'https://api.openathlete.org'
                  ? m.mobile_server_cloud()
                  : m.mobile_server_default()}
              </span>
              <span className="block text-sm text-muted-foreground">
                {defaultUrl}
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={cancel}
              disabled={phase === 'committing'}
            >
              {m.cancel()}
            </Button>
          )}
          <Button className="flex-1" onClick={save} isLoading={phase !== null}>
            {m.mobile_server_continue()}
          </Button>
        </div>
      </div>
    </main>
  );
}
