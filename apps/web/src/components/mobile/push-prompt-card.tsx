import { Button } from '@/components/ui/button';
import { usePushPermission } from '@/hooks/use-push-permission';
import { m } from '@/paraglide/messages';
import { PUSH_PROMPT_DISMISSED, getItem, setItem } from '@/utils/local-storage';
import { Bell } from 'lucide-react';
import { useState } from 'react';

/**
 * Offers the session reminders once there is a session to be reminded of.
 * The system prompt only comes after this card's yes: asked once, refused
 * for good, it should not be spent at launch.
 */
export function PushPromptCard() {
  const { permission, enable } = usePushPermission();
  const [dismissed, setDismissed] = useState(
    () => getItem(PUSH_PROMPT_DISMISSED) === 'true',
  );
  if (permission !== 'prompt' || dismissed) return null;

  return (
    <div data-push-prompt className="rounded-2xl border bg-card p-4">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Bell className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{m.push_prompt_title()}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {m.push_prompt_description()}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="h-11"
          onClick={() => {
            setItem(PUSH_PROMPT_DISMISSED, 'true');
            setDismissed(true);
          }}
        >
          {m.push_prompt_later()}
        </Button>
        <Button className="h-11" onClick={() => void enable()}>
          {m.push_enable()}
        </Button>
      </div>
    </div>
  );
}
