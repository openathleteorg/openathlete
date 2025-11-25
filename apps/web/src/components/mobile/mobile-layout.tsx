import { type PageAction, PageActionsProvider } from '@/hooks/use-page-actions';
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
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];
  return profileSubPages.some((route) => pathname === route);
}

/**
 * Check if route should animate transitions
 */
function shouldAnimate(pathname: string): boolean {
  // Animate transitions from profile to sub-pages
  const animatedRoutes = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
    getPath(['dashboard', 'profile']),
  ];

  return animatedRoutes.some((route) => pathname === route);
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
      // Check if we're going back to profile from a sub-page
      const profilePath = getPath(['dashboard', 'profile']);
      const isGoingToProfile = location.pathname === profilePath;
      const wasOnSubPage =
        previousPathRef.current && isProfileSubPage(previousPathRef.current);

      // Also check if we're navigating back using the navigation function
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

  const content = (
    <div className="flex min-h-screen flex-col">
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={
                isBack
                  ? { x: -300, opacity: 0 } // Slide from left when going back
                  : { x: 300, opacity: 0 } // Slide from right when going forward
              }
              animate={{ x: 0, opacity: 1 }}
              exit={
                isBack
                  ? { x: 300, opacity: 0 } // Exit to right when going back
                  : { x: -300, opacity: 0 } // Exit to left when going forward
              }
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <PageActionsProvider actions={actions}>
                {children}
              </PageActionsProvider>
            </motion.div>
          </AnimatePresence>
        ) : (
          <PageActionsProvider actions={actions}>
            {children}
          </PageActionsProvider>
        )}
      </main>
      {showNavbar && <MobileNavbar />}
    </div>
  );

  return content;
}
