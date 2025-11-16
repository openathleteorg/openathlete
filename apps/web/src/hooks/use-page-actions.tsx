import { type LucideIcon } from 'lucide-react';
import { type ReactNode, createContext, useContext } from 'react';

export interface PageAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

const PageActionsContext = createContext<PageAction[]>([]);

export const PageActionsProvider = ({
  actions,
  children,
}: {
  actions: PageAction[];
  children: ReactNode;
}) => {
  return (
    <PageActionsContext.Provider value={actions}>
      {children}
    </PageActionsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePageActions(): PageAction[] {
  return useContext(PageActionsContext);
}
