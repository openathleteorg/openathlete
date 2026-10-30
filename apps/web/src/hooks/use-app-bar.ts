import {
  type ReactNode,
  createContext,
  useContext,
  useLayoutEffect,
} from 'react';

export interface AppBarConfig {
  title?: string;
  subtitle?: string;
  /** Replaces the title, for a screen with its own header row */
  titleContent?: ReactNode;
  /** Buttons on the right of the bar */
  trailing?: ReactNode;
  /** Goes back from a pushed screen instead of showing a tab root */
  back?: boolean;
  /** Runs instead of the history back, for a screen with its own steps */
  onBack?: () => void;
  /** Hides the tab bar on a focused screen such as a conversation */
  hideTabBar?: boolean;
  /** The screen fills the viewport and scrolls inside itself */
  fullHeight?: boolean;
}

export const AppBarContext = createContext<{
  config: AppBarConfig;
  setConfig: (config: AppBarConfig) => void;
} | null>(null);

export function useAppBarConfig() {
  return useContext(AppBarContext)?.config ?? {};
}

/**
 * Sets the top bar of the app shell for the current screen. Outside the
 * shell, on larger screens, it does nothing. Pass a memoised config.
 */
export function useAppBar(config: AppBarConfig) {
  const setConfig = useContext(AppBarContext)?.setConfig;

  useLayoutEffect(() => {
    if (!setConfig) return;
    setConfig(config);
    return () => setConfig({});
  }, [config, setConfig]);
}
