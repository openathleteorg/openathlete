import { type AppBarConfig, AppBarContext } from '@/hooks/use-app-bar';
import { type ReactNode, useMemo, useState } from 'react';

export function AppBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppBarConfig>({});
  const value = useMemo(() => ({ config, setConfig }), [config]);
  return (
    <AppBarContext.Provider value={value}>{children}</AppBarContext.Provider>
  );
}
