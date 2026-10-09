import { createContext, useContext, useState } from 'react';

import { Event } from '@openathlete/shared';

import { WeekClipboard } from '../utils/week-actions';

interface EventClipboardContextType {
  clipboard: Event | null;
  copyEvent: (event: Event) => void;
  clearClipboard: () => void;
  hasClipboard: boolean;
  /** A whole week copied or cut, waiting to be pasted on another week */
  weekClipboard: WeekClipboard | null;
  setWeekClipboard: (clipboard: WeekClipboard | null) => void;
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
  const [weekClipboard, setWeekClipboard] = useState<WeekClipboard | null>(
    null,
  );

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
        weekClipboard,
        setWeekClipboard,
      }}
    >
      {children}
    </EventClipboardContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEventClipboard() {
  const context = useContext(EventClipboardContext);

  if (!context) {
    throw new Error(
      'useEventClipboard must be used within EventClipboardProvider',
    );
  }

  return context;
}
