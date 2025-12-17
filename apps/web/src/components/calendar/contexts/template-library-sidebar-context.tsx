'use client';

import { useSidebar } from '@/components/ui/sidebar';
import * as React from 'react';

type TemplateLibrarySidebarContext = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
  mainSidebarWasOpen: boolean;
  setMainSidebarWasOpen: (wasOpen: boolean) => void;
};

const TemplateLibrarySidebarContext =
  React.createContext<TemplateLibrarySidebarContext | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useTemplateLibrarySidebar() {
  const context = React.useContext(TemplateLibrarySidebarContext);
  if (!context) {
    throw new Error(
      'useTemplateLibrarySidebar must be used within a TemplateLibrarySidebarProvider',
    );
  }
  return context;
}

export function TemplateLibrarySidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [mainSidebarWasOpen, setMainSidebarWasOpen] = React.useState(false);
  const { setOpen: setMainSidebarOpen } = useSidebar();

  const close = React.useCallback(() => {
    setOpen(false);
    // Wait for library to close before unfolding main sidebar
    setTimeout(() => {
      if (mainSidebarWasOpen) {
        setMainSidebarOpen(true);
      }
      setMainSidebarWasOpen(false);
    }, 200); // Match sidebar animation duration
  }, [mainSidebarWasOpen, setMainSidebarOpen]);

  const toggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const contextValue = React.useMemo<TemplateLibrarySidebarContext>(
    () => ({
      open,
      setOpen,
      toggle,
      close,
      mainSidebarWasOpen,
      setMainSidebarWasOpen,
    }),
    [open, toggle, close, mainSidebarWasOpen],
  );

  return (
    <TemplateLibrarySidebarContext.Provider value={contextValue}>
      {children}
    </TemplateLibrarySidebarContext.Provider>
  );
}
