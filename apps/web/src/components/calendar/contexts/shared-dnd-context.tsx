'use client';

import { Active, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import * as React from 'react';

import { DroppableData } from '../../create-event-from-template-dialog/dnd-types';

type SharedDndContextType = {
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  registerSidebarHandler: (
    handler: (event: DragEndEvent) => void,
  ) => () => void;
  registerCalendarHandler: (
    handler: (event: DragEndEvent) => void,
  ) => () => void;
  activeItem: Active | null;
};

const SharedDndContext = React.createContext<SharedDndContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSharedDnd() {
  const context = React.useContext(SharedDndContext);
  return context;
}

export function SharedDndProvider({ children }: { children: React.ReactNode }) {
  const sidebarHandlerRef = React.useRef<
    ((event: DragEndEvent) => void) | null
  >(null);
  const calendarHandlerRef = React.useRef<
    ((event: DragEndEvent) => void) | null
  >(null);
  const [activeItem, setActiveItem] = React.useState<Active | null>(null);

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveItem(event.active);
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    setActiveItem(null);
    const { over } = event;

    if (!over) return;

    const overId = String(over.id);
    const overData = over.data.current as DroppableData | undefined;

    // Check if drop is on a calendar day (ISO date string)
    const isCalendarDay = !isNaN(Date.parse(overId));

    // Check if drop is in sidebar (has DroppableData)
    const isSidebarDrop = !!overData;

    if (isCalendarDay && calendarHandlerRef.current) {
      // Drop on calendar - use calendar handler (handles templates and events)
      calendarHandlerRef.current(event);
    } else if (isSidebarDrop && sidebarHandlerRef.current) {
      // Drop in sidebar - use sidebar handler (handles template/folder reorganization)
      sidebarHandlerRef.current(event);
    }
  }, []);

  const registerSidebarHandler = React.useCallback(
    (handler: (event: DragEndEvent) => void) => {
      sidebarHandlerRef.current = handler;
      return () => {
        sidebarHandlerRef.current = null;
      };
    },
    [],
  );

  const registerCalendarHandler = React.useCallback(
    (handler: (event: DragEndEvent) => void) => {
      calendarHandlerRef.current = handler;
      return () => {
        calendarHandlerRef.current = null;
      };
    },
    [],
  );

  const contextValue = React.useMemo<SharedDndContextType>(
    () => ({
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      registerSidebarHandler,
      registerCalendarHandler,
      activeItem,
    }),
    [
      handleDragStart,
      handleDragEnd,
      registerSidebarHandler,
      registerCalendarHandler,
      activeItem,
    ],
  );

  return (
    <SharedDndContext.Provider value={contextValue}>
      {children}
    </SharedDndContext.Provider>
  );
}
