import { FinderDialog } from '@/components/finder/finder-dialog';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const FinderContext = createContext<{ openFinder: () => void } | null>(null);

/** One finder for the whole dashboard, also opened with Cmd+K */
export function FinderProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openFinder = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(() => ({ openFinder }), [openFinder]);

  return (
    <FinderContext.Provider value={value}>
      {children}
      <FinderDialog open={open} onOpenChange={setOpen} />
    </FinderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinder() {
  const context = useContext(FinderContext);
  if (!context) throw new Error('useFinder must be used within FinderProvider');
  return context;
}
