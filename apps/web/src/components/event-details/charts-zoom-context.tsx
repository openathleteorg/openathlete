import React, { createContext, useContext, useMemo, useState } from 'react';

type Domain = [number, number] | undefined;

type ChartsZoomContextType = {
  domain: Domain;
  setDomain: (d: Domain) => void;
  reset: () => void;
  fullDomain: [number, number];
};

const ChartsZoomContext = createContext<ChartsZoomContextType | null>(null);

type P = {
  fullDomain: [number, number];
  children: React.ReactNode;
};

export function ChartsZoomProvider({ fullDomain, children }: P) {
  const [domain, setDomain] = useState<Domain>(undefined);

  const value = useMemo<ChartsZoomContextType>(
    () => ({
      domain,
      setDomain,
      reset: () => setDomain(undefined),
      fullDomain,
    }),
    [domain, fullDomain],
  );

  return (
    <ChartsZoomContext.Provider value={value}>
      {children}
    </ChartsZoomContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChartsZoom() {
  const ctx = useContext(ChartsZoomContext);
  if (!ctx) {
    throw new Error('useChartsZoom must be used within ChartsZoomProvider');
  }
  return ctx;
}
