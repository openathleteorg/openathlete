import {
  type PageAction,
  PageActionsProvider,
  useSetPageActions,
} from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { MobileHeader } from './mobile-header';
import { MobileNavbar } from './mobile-navbar';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: PageAction[];
  showNavbar?: boolean;
  animate?: boolean;
}

/**
 * Get page title from current route
 */
function getPageTitle(pathname: string): string {
  // Map routes to titles
  const titleMap: Record<string, string> = {
    [getPath(['dashboard', 'calendar'])]: m.calendar(),
    [getPath(['dashboard', 'profile'])]: m.profile(),
    [getPath(['dashboard', 'messages'])]: m.messages(),
    [getPath(['dashboard', 'statistics'])]: m.statistics(),
    [getPath(['dashboard', 'records'])]: m.records(),
    [getPath(['dashboard', 'metrics'])]: m.metrics(),
    [getPath(['dashboard', 'settings'])]: m.settings(),
  };

  return titleMap[pathname] || 'OpenAthlete';
}

/**
 * Check if current route should show navbar
 */
function shouldShowNavbar(pathname: string): boolean {
  const navbarRoutes = [
    getPath(['dashboard', 'calendar']),
    getPath(['dashboard', 'profile']),
    getPath(['dashboard', 'messages']),
  ];

  return navbarRoutes.some((route) => pathname === route);
}

/**
 * Check if current route is a profile sub-page
 */
function isProfileSubPage(pathname: string): boolean {
  const profileSubPages = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'progression']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];
  return profileSubPages.some((route) => pathname === route);
}

/**
 * Check if route should animate transitions
 */
function shouldAnimate(pathname: string): boolean {
  const profilePath = getPath(['dashboard', 'profile']);
  const profileSubPages = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];

  if (
    pathname === profilePath ||
    profileSubPages.some((route) => pathname === route)
  ) {
    return false;
  }

  return false;
}

/**
 * Check if we're navigating back (from sub-page to profile)
 */
function isNavigatingBack(
  currentPath: string,
  previousPath: string | null,
): boolean {
  const profilePath = getPath(['dashboard', 'profile']);
  const subPages = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];

  // If we're going to profile from a sub-page, it's a back navigation
  if (currentPath === profilePath && previousPath) {
    return subPages.some((route) => previousPath === route);
  }

  // If we're going from profile to a sub-page, it's forward
  if (previousPath === profilePath) {
    return false;
  }

  // If we're going from a sub-page to another sub-page, it's forward
  if (subPages.includes(currentPath) && previousPath) {
    return false;
  }

  return false;
}

export function MobileLayout({
  children,
  title,
  actions = [],
  showNavbar: showNavbarProp,
  animate: animateProp,
}: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef<string | null>(null);
  const [isBack, setIsBack] = useState(false);

  // Track navigation direction
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      const profilePath = getPath(['dashboard', 'profile']);
      const isGoingToProfile = location.pathname === profilePath;
      const wasOnSubPage =
        previousPathRef.current && isProfileSubPage(previousPathRef.current);

      // Determine direction: back if going to profile from sub-page, forward otherwise
      const goingBack =
        isNavigatingBack(location.pathname, previousPathRef.current) ||
        (isGoingToProfile && wasOnSubPage);

      setIsBack(goingBack || false);
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const pageTitle = title || getPageTitle(location.pathname);
  const showNavbar =
    showNavbarProp !== undefined
      ? showNavbarProp
      : shouldShowNavbar(location.pathname);
  const shouldAnimateTransition =
    animateProp !== undefined ? animateProp : shouldAnimate(location.pathname);

  const handleBack = () => {
    navigate(getPath(['dashboard', 'profile']));
  };

  // Component to set actions from props
  // Note: Child components can override these actions by calling useSetPageActions themselves
  function ActionsSetter({ actions: actionsProp }: { actions: PageAction[] }) {
    useSetPageActions(actionsProp.length > 0 ? actionsProp : undefined);
    return null;
  }

  const content = (
    <PageActionsProvider>
      <ActionsSetter actions={actions} />
      <div className="flex min-h-screen flex-col w-full">
        <MobileHeader
          title={pageTitle}
          showBack={
            shouldShowNavbar(location.pathname)
              ? false
              : isProfileSubPage(location.pathname)
          }
          onBack={handleBack}
        />
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            showNavbar && 'pb-16', // Add padding for navbar
          )}
        >
          {shouldAnimateTransition ? (
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={location.pathname}
                initial={
                  isBack
                    ? { x: '100%', opacity: 0 } // Profile enters from right when going back
                    : { x: '-100%', opacity: 0 } // Sub-page enters from left when going forward
                }
                animate={{ x: 0, opacity: 1 }}
                exit={
                  isBack
                    ? { x: '-100%', opacity: 0 } // Sub-page exits to left when going back
                    : { x: '100%', opacity: 0 } // Profile exits to right when going forward
                }
                transition={{
                  type: 'tween',
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            children
          )}
        </main>
        {showNavbar && <MobileNavbar />}
      </div>
    </PageActionsProvider>
  );

  return content;
}
