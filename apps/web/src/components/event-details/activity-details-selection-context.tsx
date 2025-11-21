import React, { createContext, useContext, useMemo, useState } from 'react';

type Domain = [number, number] | undefined;

type ActivityDetailsSelectionContextType = {
  domain: Domain;
  setDomain: (d: Domain) => void;
  reset: () => void;
  fullDomain: [number, number];
};

const ActivityDetailsSelectionContext =
  createContext<ActivityDetailsSelectionContextType | null>(null);

type P = {
  fullDomain: [number, number];
  children: React.ReactNode;
};

export function ActivityDetailsSelectionProvider({ fullDomain, children }: P) {
  const [domain, setDomain] = useState<Domain>(undefined);

  const value = useMemo<ActivityDetailsSelectionContextType>(
    () => ({
      domain,
      setDomain,
      reset: () => setDomain(undefined),
      fullDomain,
    }),
    [domain, fullDomain],
  );

  return (
    <ActivityDetailsSelectionContext.Provider value={value}>
      {children}
    </ActivityDetailsSelectionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActivityDetailsSelection() {
  const ctx = useContext(ActivityDetailsSelectionContext);
  if (!ctx) {
    return {
      domain: undefined,
      setDomain: () => {},
      reset: () => {},
      fullDomain: undefined,
    };
  }
  return ctx;
}
