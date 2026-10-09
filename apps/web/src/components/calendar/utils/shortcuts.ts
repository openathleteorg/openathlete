/** Calendar keyboard shortcuts, by key */
export type CalendarShortcut =
  'today' | 'previous' | 'next' | 'monthView' | 'weekView' | 'help';

const SHORTCUTS: Record<string, CalendarShortcut> = {
  t: 'today',
  ArrowLeft: 'previous',
  ArrowRight: 'next',
  m: 'monthView',
  w: 'weekView',
  '?': 'help',
};

/** Keys held while dragging or clicking a card change what it does */
export const COPY_KEY = 'c';
export const EDIT_KEY = 'e';

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Widgets whose arrow keys already move inside them (tabs, lists, menus) */
const ARROW_WIDGETS =
  '[role="tablist"], [role="radiogroup"], [role="listbox"], [role="menu"], [role="slider"], [role="grid"]';

/**
 * The shortcut a key press triggers, or null: never while typing, with a
 * modifier (browser and system shortcuts keep working), or over a dialog or
 * menu (their own keys win).
 */
export function shortcutFor(
  event: Pick<
    KeyboardEvent,
    'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target' | 'repeat'
  >,
  overlayOpen: boolean,
): CalendarShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
    return null;
  }
  const target = event.target as HTMLElement | null;
  if (target && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)) {
    return null;
  }
  if (overlayOpen) return null;
  if (event.key.startsWith('Arrow') && target?.closest?.(ARROW_WIDGETS)) {
    return null;
  }
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return SHORTCUTS[key] ?? null;
}

/** A dialog, menu or popover is open: it owns the keyboard */
export function isOverlayOpen(root: ParentNode = document): boolean {
  return !!root.querySelector(
    '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
  );
}

const held = new Set<string>();

/** Tracks keys held down, for copy-on-drag and edit-on-click */
export function trackHeldKeys(win: Window = window): () => void {
  const down = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (TYPING_TAGS.has(target.tagName) || target.isContentEditable)
    ) {
      return;
    }
    held.add(event.key.toLowerCase());
  };
  const up = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
  // Switching window while holding a key never fires its keyup
  const clear = () => held.clear();
  win.addEventListener('keydown', down);
  win.addEventListener('keyup', up);
  win.addEventListener('blur', clear);
  return () => {
    win.removeEventListener('keydown', down);
    win.removeEventListener('keyup', up);
    win.removeEventListener('blur', clear);
    held.clear();
  };
}

export const isKeyHeld = (key: string) => held.has(key);
