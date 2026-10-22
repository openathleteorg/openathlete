import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { localZwift } from '@/utils/zwift';
import { SettingsSection } from '@/views/dashboard/settings-view/settings-section';
import { useEffect, useRef, useState } from 'react';

import { useZwiftConnection } from './zwift-connection';
import { zwiftFailure } from './zwift-errors';

export function ZwiftSettings() {
  const { available, binding, scope, query } = useZwiftConnection();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(scope);
  const running = useRef(false);
  current.current = scope;
  useEffect(() => {
    current.current = scope;
    setBusy(false);
    setError('');
    return () => {
      current.current = '';
    };
  }, [scope]);
  if (!available) return null;
  const action = async (form?: HTMLFormElement) => {
    if (running.current) return;
    running.current = true;
    const started = scope;
    setBusy(true);
    setError('');
    try {
      if (form) {
        const fields = new FormData(form);
        const username = String(fields.get('username') ?? '').trim();
        const password = String(fields.get('password') ?? '');
        // Clear the password input immediately; tokens stay exclusively in native Keychain.
        form.reset();
        await localZwift.connect({ ...binding, username, password });
      } else await localZwift.disconnect(binding);
      if (current.current === started) await query.refetch();
    } catch (failure) {
      if (current.current === started) setError(zwiftFailure(failure));
    } finally {
      running.current = false;
      if (current.current === started) setBusy(false);
    }
  };
  return (
    <SettingsSection title="Zwift" description={m.zwift_connection_help()}>
      <div className="ph-no-capture ph-mask space-y-4 pt-4" data-cs-mask="true">
        <p className="text-sm text-muted-foreground">{m.zwift_private_api()}</p>
        {query.data?.connected ? (
          <div className="flex flex-wrap items-center gap-3">
            <p>{m.zwift_connected()}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void action()}
            >
              {m.zwift_disconnect()}
            </Button>
          </div>
        ) : (
          <form
            autoComplete="on"
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void action(event.currentTarget);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="zwift-username">{m.zwift_email()}</Label>
              <Input
                id="zwift-username"
                name="username"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zwift-password">{m.zwift_password()}</Label>
              <Input
                id="zwift-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </div>
            <Button type="submit" disabled={busy || query.isPending}>
              {busy ? m.zwift_busy() : m.zwift_connect()}
            </Button>
          </form>
        )}
        {(error || query.error) && (
          <p role="alert" className="text-sm text-destructive">
            {error || m.zwift_failed()}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
