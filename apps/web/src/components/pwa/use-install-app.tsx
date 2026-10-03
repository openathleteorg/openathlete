import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { promptInstall, useInstallMethod } from '@/utils/pwa';
import { useState } from 'react';

/**
 * "Install app" action for the account menus: the browser's own dialog where
 * available, otherwise (iPhone/iPad) the Add to Home Screen steps. Render
 * `dialog` next to the trigger. Not available once installed.
 */
export function useInstallApp() {
  const method = useInstallMethod();
  const [stepsOpen, setStepsOpen] = useState(false);
  return {
    available: method !== null,
    install: () =>
      method === 'prompt' ? void promptInstall() : setStepsOpen(true),
    dialog: (
      <Dialog open={stepsOpen} onOpenChange={setStepsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.pwa_install_title()}</DialogTitle>
            <DialogDescription>{m.pwa_install_ios_steps()}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ),
  };
}
