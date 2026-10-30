import { useSpaceContext } from '@/contexts/space';
import { useAndroidBackButton } from '@/hooks/use-android-back-button';
import { useAppBarConfig } from '@/hooks/use-app-bar';
import { useEdgeSwipeBack } from '@/hooks/use-edge-swipe-back';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { cn } from '@/utils/shadcn';
import { MotionConfig, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

import { findTab, getAppTabs, isTabRoot } from './app-navigation';
import { AppTabBar } from './app-tab-bar';
import { AppTopBar } from './app-top-bar';

const SLIDE = {
  type: 'tween',
  duration: 0.26,
  ease: [0.32, 0.72, 0, 1],
} as const;

/**
 * The app on a phone, in a browser as in the iOS and Android apps: tabs at
 * the bottom, a stack of screens above them, and sheets instead of windows.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { pathname, search } = location;
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { space } = useSpaceContext();
  const config = useAppBarConfig();
  const tabs = getAppTabs(space);
  const root = isTabRoot(tabs, pathname);
  const pushed = !root;
  const canGoBack = pushed || config.back;
  const tabBarHidden = pushed || config.hideTabBar;

  const goBack = useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(findTab(tabs, pathname)?.path ?? tabs[0].path, {
        replace: true,
      });
    }
  }, [location.key, navigate, pathname, tabs]);

  useAndroidBackButton(root, goBack);
  const swipe = useEdgeSwipeBack(Boolean(canGoBack), config.onBack ?? goBack);
  const pull = usePullToRefresh(root && !config.fullHeight);

  // Each screen comes back where it was left
  const scrollPositions = useRef(new Map<string, number>());
  const screen = pathname + search;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
      scrollPositions.current.set(screen, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [screen]);
  useLayoutEffect(() => {
    const saved =
      navigationType === 'PUSH' && !root
        ? 0
        : (scrollPositions.current.get(screen) ?? 0);
    window.scrollTo(0, saved);
    // A lazy screen has no height yet: once more when it has rendered
    const frame = requestAnimationFrame(() => window.scrollTo(0, saved));
    return () => cancelAnimationFrame(frame);
  }, [screen, navigationType, root]);

  const previous = useRef(pathname);
  const sameTab =
    findTab(tabs, previous.current)?.id === findTab(tabs, pathname)?.id;
  useEffect(() => {
    previous.current = pathname;
  }, [pathname]);
  const offset =
    !sameTab || navigationType === 'REPLACE'
      ? 0
      : navigationType === 'POP'
        ? -24
        : 32;

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-app-shell
        data-tab-bar={tabBarHidden ? 'hidden' : 'visible'}
        className={cn(
          'flex min-h-dvh w-full min-w-0 flex-col bg-background',
          config.fullHeight && 'h-dvh overflow-hidden',
        )}
      >
        <AppTopBar
          onBack={canGoBack ? goBack : undefined}
          scrolled={scrolled}
        />
        {pull.distance > 0 && (
          <div
            aria-hidden
            className="flex items-end justify-center overflow-hidden text-muted-foreground"
            style={{ height: pull.distance }}
          >
            <Loader2
              className={cn('mb-2 size-5', pull.refreshing && 'animate-spin')}
              style={{ rotate: `${pull.distance * 4}deg` }}
            />
          </div>
        )}
        <motion.main
          key={pathname}
          ref={swipe.ref}
          initial={offset ? { x: offset, opacity: 0.4 } : { opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={offset ? SLIDE : { duration: 0.14 }}
          className={cn(
            'flex w-full min-w-0 flex-1 flex-col',
            config.fullHeight
              ? 'min-h-0'
              : !tabBarHidden && 'pb-[var(--tab-bar-space)]',
            config.fullHeight && !tabBarHidden && 'mb-[var(--tab-bar-space)]',
            tabBarHidden && !config.fullHeight && 'pb-[var(--safe-bottom)]',
          )}
        >
          {children}
        </motion.main>
        {!tabBarHidden && <AppTabBar />}
      </div>
    </MotionConfig>
  );
}
