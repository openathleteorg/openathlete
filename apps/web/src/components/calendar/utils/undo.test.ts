import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_t, key) => () => String(key) }),
}));

const { clearUndoStack, undoLast, undoable } = await import('./undo');

/** The Undo action of the n-th success toast */
const toastUndo = (n: number) =>
  (toast.success.mock.calls[n][1] as { action: { onClick: () => void } }).action
    .onClick;

describe('undo', () => {
  beforeEach(() => {
    clearUndoStack();
    toast.success.mockClear();
  });

  it('undoes the most recent change first, once', async () => {
    const first = vi.fn();
    const second = vi.fn();
    undoable('moved', first);
    undoable('copied', second);

    expect(undoLast()).toBe(true);
    await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    // The toast of the change just undone does nothing more
    toastUndo(1)();
    expect(undoLast()).toBe(true);
    await vi.waitFor(() => expect(first).toHaveBeenCalledTimes(1));
    expect(second).toHaveBeenCalledTimes(1);
    expect(undoLast()).toBe(false);
  });

  it('undoes from the toast, and leaves the others for the keyboard', async () => {
    const first = vi.fn();
    const second = vi.fn();
    undoable('moved', first);
    undoable('copied', second);

    toastUndo(0)();
    await vi.waitFor(() => expect(first).toHaveBeenCalled());
    undoLast();
    await vi.waitFor(() => expect(second).toHaveBeenCalled());
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('says when an undo fails', async () => {
    undoable('moved', () => Promise.reject(new Error('offline')));
    undoLast();
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('undo_failed'),
    );
  });
});
