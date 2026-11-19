import { AnimatePresence } from 'framer-motion';
import { ReactNode, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { YearReviewAnnouncement } from './entry/year-review-announcement';
import { useYearReview } from './use-year-review';
import { YearReviewContext } from './year-review-context';
import { LaunchOrigin, YearReviewLaunch } from './year-review-launch';

/**
 * Holds the year review of the dashboard: whether it is out, the one-time
 * announcement, and the story itself once launched.
 */
export function YearReviewProvider({ children }: { children: ReactNode }) {
  const entry = useYearReview();
  const { markSeen, review } = entry;
  const [origin, setOrigin] = useState<LaunchOrigin | null>(null);

  const open = useCallback(
    (from?: Element | null) => {
      const box = from?.getBoundingClientRect();
      setOrigin(
        box
          ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
          : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      );
      markSeen();
    },
    [markSeen],
  );
  const close = useCallback(() => setOrigin(null), []);
  const value = { ...entry, open };

  return (
    <YearReviewContext.Provider value={value}>
      {children}
      {entry.available && !entry.seen && !origin && <YearReviewAnnouncement />}
      {createPortal(
        <AnimatePresence>
          {origin && review && (
            <YearReviewLaunch
              key="year-review"
              origin={origin}
              review={review}
              onClose={close}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </YearReviewContext.Provider>
  );
}
