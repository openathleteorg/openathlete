import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { isStandalone, promptInstall, useInstallMethod } from '@/utils/pwa';
import { Globe, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { InstallChannel } from './install-channel';

/**
 * "Install app" action for the account menus: the store apps to come and the
 * web app, through the browser's own dialog where available, otherwise
 * (iPhone/iPad) the Add to Home Screen steps. Render `dialog` next to the
 * trigger. Not available once installed.
 */
export function useInstallApp() {
  const method = useInstallMethod();
  const [open, setOpen] = useState(false);
  return {
    available: !isCapacitor() && !isStandalone(),
    install: () => setOpen(true),
    dialog: (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.pwa_install_title()}</DialogTitle>
            <DialogDescription>{m.pwa_install_description()}</DialogDescription>
          </DialogHeader>
          <div className="divide-y">
            <InstallChannel
              icon={Smartphone}
              name={m.pwa_channel_ios()}
              description="App Store"
            >
              <Badge variant="secondary">{m.pwa_coming_soon()}</Badge>
            </InstallChannel>
            <InstallChannel
              icon={Smartphone}
              name={m.pwa_channel_android()}
              description="Google Play"
            >
              <Badge variant="secondary">{m.pwa_coming_soon()}</Badge>
            </InstallChannel>
            <InstallChannel
              icon={Globe}
              name={m.pwa_channel_web()}
              description={
                method === 'ios'
                  ? m.pwa_install_ios_steps()
                  : method === 'prompt'
                    ? m.pwa_channel_web_description()
                    : m.pwa_channel_web_unavailable()
              }
            >
              {method === 'prompt' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    void promptInstall();
                  }}
                >
                  {m.pwa_install_action()}
                </Button>
              )}
            </InstallChannel>
          </div>
        </DialogContent>
      </Dialog>
    ),
  };
}
