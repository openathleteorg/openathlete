import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { BrandLogoLayers } from '../brand-logo-layers';
import { preloadYearReviewStory } from '../load-story';
import { useYearReviewContext } from '../year-review-context';
import './year-review-entry.css';

/** Lets the page settle before the announcement comes up */
const DELAY_MS = 1200;

/**
 * Announces the year review once: the first time the dashboard opens while
 * it is out. Opening it or putting it off both count as seen, on every
 * device.
 */
export function YearReviewAnnouncement() {
  const { year, open, markSeen } = useYearReviewContext();
  const { pathname } = useLocation();
  const [shown, setShown] = useState(false);
  const cta = useRef<HTMLButtonElement>(null);
  const onboarding = pathname.startsWith(getPath(['dashboard', 'onboarding']));

  useEffect(() => {
    if (onboarding) return;
    const timer = window.setTimeout(() => {
      setShown(true);
      preloadYearReviewStory();
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onboarding]);

  if (year === null) return null;

  return (
    <Dialog
      open={shown}
      onOpenChange={(next) => {
        if (!next) markSeen();
      }}
    >
      <DialogContent className="gap-0 overflow-hidden border-0 bg-oa-bg p-0 text-center sm:max-w-md">
        <div className="yr-entry flex flex-col items-center rounded-[inherit] px-6 pt-10 pb-6 *:relative *:z-[2]">
          <BrandLogoLayers className="yr-entry-logo w-24" />
          <p className="yr-entry-text mt-6 text-7xl leading-none font-extrabold tracking-tighter">
            {year}
          </p>
          <DialogTitle className="mt-4 text-2xl font-bold tracking-tight text-oa-fg">
            {m.year_review_announcement_title({ year })}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-xs text-sm text-oa-muted">
            {m.year_review_announcement_text({ year })}
          </DialogDescription>
          <button
            ref={cta}
            type="button"
            data-year-review-entry="announcement"
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-oa-fg font-semibold text-oa-bg outline-none transition-transform focus-visible:ring-2 focus-visible:ring-oa-brand-1 focus-visible:ring-offset-2 focus-visible:ring-offset-oa-bg active:scale-[0.98]"
            onClick={() => open(cta.current)}
          >
            <Sparkles className="size-4" />
            {m.year_review_announcement_cta()}
          </button>
          <button
            type="button"
            className="mt-2 h-11 w-full rounded-full text-sm text-oa-muted hover:text-oa-fg"
            onClick={markSeen}
          >
            {m.year_review_announcement_later()}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
