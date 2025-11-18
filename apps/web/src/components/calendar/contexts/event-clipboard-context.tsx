import { createContext, useContext, useState } from 'react';

import { Event } from '@openathlete/shared';

interface EventClipboardContextType {
  clipboard: Event | null;
  copyEvent: (event: Event) => void;
  clearClipboard: () => void;
  hasClipboard: boolean;
}

const EventClipboardContext = createContext<
  EventClipboardContextType | undefined
>(undefined);

export function EventClipboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clipboard, setClipboard] = useState<Event | null>(null);

  const copyEvent = (event: Event) => {
    setClipboard(event);
  };

  const clearClipboard = () => {
    setClipboard(null);
  };

  const hasClipboard = clipboard !== null;

  return (
    <EventClipboardContext.Provider
      value={{
        clipboard,
        copyEvent,
        clearClipboard,
        hasClipboard,
      }}
    >
      {children}
    </EventClipboardContext.Provider>
  );
}

export function useEventClipboard() {
  const context = useContext(EventClipboardContext);

  if (!context) {
    throw new Error(
      'useEventClipboard must be used within EventClipboardProvider',
    );
  }

  return context;
}

