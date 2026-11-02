import { useGetUserThreadsQuery } from '@/api/messages';
import { useGetMeQuery } from '@/api/user';
import { useSpaceContext } from '@/contexts/space';
import { hapticTap } from '@/utils/haptics';
import { calculateUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { UnreadBadge } from '../ui/unread-badge';
import { findTab, getAppTabs, isTabRoot } from './app-navigation';

/**
 * The app's bottom navigation. A tab remembers the screen it was left on;
 * tapping the current tab returns to its first screen, or to the top.
 */
export function AppTabBar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { space } = useSpaceContext();
  const tabs = getAppTabs(space);
  const active = findTab(tabs, pathname);
  const lastScreens = useRef<Record<string, string>>({});
  const { data: threads } = useGetUserThreadsQuery();
  const { data: me } = useGetMeQuery();
  const unread = me
    ? (threads ?? []).reduce(
        (sum, thread) => sum + calculateUnreadCount(thread, me.userId),
        0,
      )
    : 0;

  if (active) lastScreens.current[active.id] = pathname + search;

  return (
    <nav
      data-app-tab-bar
      className="app-tab-bar fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 pb-[var(--safe-bottom)] backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex h-[var(--tab-bar-height)] items-stretch">
        {tabs.map((tab) => {
          const isActive = tab.id === active?.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              data-app-tab={tab.id}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors active:scale-95',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => {
                hapticTap();
                if (!isActive) {
                  navigate(lastScreens.current[tab.id] ?? tab.path);
                } else if (isTabRoot(tabs, pathname)) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  navigate(tab.path);
                }
              }}
            >
              <span className="relative flex h-7 w-14 items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId="app-tab-indicator"
                    className="absolute inset-0 rounded-full bg-secondary"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon
                  className="relative size-[1.3125rem]"
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {tab.id === 'messages' && unread > 0 && (
                  <UnreadBadge
                    count={unread}
                    className="absolute -top-1 right-1.5"
                  />
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{tab.label()}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
