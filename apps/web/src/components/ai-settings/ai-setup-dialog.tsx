import { useAiAccessQuery } from '@/api/ai-settings';
import { PaywallDialog } from '@/components/paywall';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { purchaseChannel } from '@/utils/capacitor';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the dialog was opened from (PostHog, via the paywall). */
  analyticsSource?: string;
}

/**
 * Shown when an AI feature has no model to run on: points to the AI
 * settings, and to the plans when subscribing would include AI.
 */
export function AiSetupDialog({ open, onOpenChange, analyticsSource }: Props) {
  const navigate = useNavigate();
  const { data: access } = useAiAccessQuery();
  const [plansOpen, setPlansOpen] = useState(false);
  const canSubscribe =
    Boolean(access?.upgradeUnlocksHosted) && purchaseChannel() !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{m.ai_setup_title()}</DialogTitle>
            <DialogDescription>{m.ai_setup_description()}</DialogDescription>
          </DialogHeader>
          {canSubscribe && (
            <p className="text-sm text-muted-foreground">
              {m.ai_setup_or_subscribe()}
            </p>
          )}
          <DialogFooter className="gap-2">
            {canSubscribe && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setPlansOpen(true);
                }}
              >
                {m.ai_setup_view_plans()}
              </Button>
            )}
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate(`${getPath(['dashboard', 'settings'])}?tab=ai`);
              }}
            >
              {m.ai_setup_open_settings()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PaywallDialog
        open={plansOpen}
        onOpenChange={setPlansOpen}
        reason="ai-feature"
        analyticsSource={analyticsSource}
      />
    </>
  );
}
