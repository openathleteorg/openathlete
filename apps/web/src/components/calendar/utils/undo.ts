import { m } from '@/paraglide/messages';
import { toast } from 'sonner';

type UndoEntry = { id: number; undo: () => Promise<unknown> | unknown };

/** Most recent changes Ctrl/Cmd+Z can undo, newest last */
const MAX_ENTRIES = 20;
const stack: UndoEntry[] = [];
let nextId = 1;

async function run(entry: UndoEntry) {
  const index = stack.indexOf(entry);
  if (index === -1) return; // Undone already, from the toast or the keyboard
  stack.splice(index, 1);
  try {
    await entry.undo();
    toast.success(m.undo_done());
  } catch {
    toast.error(m.undo_failed());
  }
}

/**
 * Reports a change that can be undone: a toast with Undo, and an entry for
 * Ctrl/Cmd+Z. Lives outside React so it survives the component (a dialog,
 * a menu) that made the change.
 */
export function undoable(
  message: string,
  undo: () => Promise<unknown> | unknown,
) {
  const entry = { id: nextId++, undo };
  stack.push(entry);
  if (stack.length > MAX_ENTRIES) stack.shift();
  toast.success(message, {
    action: { label: m.calendar_link_undo(), onClick: () => void run(entry) },
  });
}

/** Undoes the most recent change, if any; true when there was one */
export function undoLast(): boolean {
  const entry = stack.at(-1);
  if (!entry) return false;
  void run(entry);
  return true;
}

/** For tests */
export const clearUndoStack = () => stack.splice(0);
