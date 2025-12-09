import { type LucideIcon } from 'lucide-react';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface PageAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface PageActionsContextValue {
  actions: PageAction[];
  setActions: (actions: PageAction[]) => void;
}

const PageActionsContext = createContext<PageActionsContextValue>({
  actions: [],
  setActions: () => {},
});

export const PageActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActionsState] = useState<PageAction[]>([]);

  const setActions = useCallback((newActions: PageAction[]) => {
    setActionsState(newActions);
  }, []);

  return (
    <PageActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </PageActionsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePageActions(): PageAction[] {
  const { actions } = useContext(PageActionsContext);
  return actions;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSetPageActions(actions?: PageAction[]) {
  const { setActions } = useContext(PageActionsContext);

  useEffect(() => {
    if (actions) {
      setActions(actions);
    }
    return () => {
      setActions([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return setActions;
}
