// @vitest-environment jsdom
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatBubble } from './chat-bubble';

vi.mock('@/api/messages', () => ({
  useGetUserThreadsQuery: () => ({ data: [] }),
}));
vi.mock('@/api/user', () => ({ useGetMeQuery: () => ({ data: undefined }) }));
vi.mock('@/contexts/chatbot', () => ({
  useChatbot: () => ({
    bubblePosition: { edge: 'bottom-right', percentage: 100 },
    setBubblePosition: vi.fn(),
    openChat: vi.fn(),
    isOpen: false,
  }),
}));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ChatBubble', () => {
  let root: Root;
  let container: HTMLDivElement;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('stays below dialogs', async () => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={['/dashboard/calendar']}>
          <ChatBubble />
          <Dialog open>
            <DialogContent>
              <DialogTitle>Activity</DialogTitle>
              <DialogDescription>Details</DialogDescription>
            </DialogContent>
          </Dialog>
        </MemoryRouter>,
      ),
    );

    const bubble = document.querySelector<HTMLElement>('[data-chat-bubble]')!;
    // The bubble starts in the corner where dialogs keep their buttons on
    // phones: drawn above them, it would hide them.
    for (const slot of ['dialog-overlay', 'dialog-content']) {
      const layer = document.querySelector(`[data-slot="${slot}"]`)!;
      const zIndex = Number(
        /(?:^|\s)z-(\d+)(?:\s|$)/.exec(layer.className)![1],
      );
      expect(Number(bubble.style.zIndex)).toBeLessThan(zIndex);
    }
  });
});
