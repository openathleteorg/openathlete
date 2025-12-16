import { ReactNode, createContext, useContext, useState } from 'react';

interface EventContextMenuContextType {
  openContextMenuEventIds: Set<number>;
  setContextMenuOpen: (eventId: number, open: boolean) => void;
}

const EventContextMenuContext = createContext<
  EventContextMenuContextType | undefined
>(undefined);

export function EventContextMenuProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [openContextMenuEventIds, setOpenContextMenuEventIds] = useState<
    Set<number>
  >(new Set());

  const setContextMenuOpen = (eventId: number, open: boolean) => {
    setOpenContextMenuEventIds((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
  };

  return (
    <EventContextMenuContext.Provider
      value={{ openContextMenuEventIds, setContextMenuOpen }}
    >
      {children}
    </EventContextMenuContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEventContextMenu() {
  const context = useContext(EventContextMenuContext);
  if (!context) {
    // Return a default implementation if context is not available
    return {
      openContextMenuEventIds: new Set<number>(),
      setContextMenuOpen: () => {},
      isAnyContextMenuOpen: false,
    };
  }
  return {
    ...context,
    isAnyContextMenuOpen: context.openContextMenuEventIds.size > 0,
  };
}
