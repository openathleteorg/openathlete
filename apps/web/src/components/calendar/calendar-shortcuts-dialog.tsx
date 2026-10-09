import { m } from '@/paraglide/messages';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const SHORTCUTS = [
  { keys: ['T'], label: m.calendar_shortcut_today },
  // One or the other, not both together
  { keys: ['←', '→'], label: m.calendar_shortcut_previous_next, or: true },
  { keys: ['M'], label: m.calendar_shortcut_month },
  { keys: ['W'], label: m.calendar_shortcut_week },
  { keys: ['S'], label: m.calendar_shortcut_season },
  { keys: ['C', m.calendar_shortcut_drag()], label: m.calendar_shortcut_copy },
  {
    keys: ['Alt', m.calendar_shortcut_drag()],
    label: m.calendar_shortcut_copy,
  },
  { keys: ['E', m.calendar_shortcut_click()], label: m.calendar_shortcut_edit },
  { keys: ['Ctrl / ⌘', 'Z'], label: m.calendar_shortcut_undo },
  { keys: ['Esc'], label: m.calendar_shortcut_escape },
  { keys: ['?'], label: m.calendar_shortcut_help },
];

/** The calendar's keyboard shortcuts, opened with "?" */
export function CalendarShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{m.calendar_shortcuts_title()}</DialogTitle>
          <DialogDescription>
            {m.calendar_shortcuts_description()}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(({ keys, label, or }) => (
            <div key={keys.join('+')} className="contents">
              <dt className="flex items-center gap-1">
                {keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1">
                    {index > 0 && (
                      <span className="text-muted-foreground">
                        {or ? '/' : '+'}
                      </span>
                    )}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {key}
                    </kbd>
                  </span>
                ))}
              </dt>
              <dd className="text-muted-foreground">{label()}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
