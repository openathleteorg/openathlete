import { motion } from 'framer-motion';
import { Suspense, lazy, useMemo } from 'react';

import { YearReviewDto } from '@openathlete/shared';

import { BrandLogoLayers } from './brand-logo-layers';
import { loadYearReviewStory } from './load-story';

const YearReviewStory = lazy(loadYearReviewStory);

export interface LaunchOrigin {
  x: number;
  y: number;
}

const circle = (radius: string, { x, y }: LaunchOrigin) =>
  `circle(${radius} at ${x}px ${y}px)`;

/**
 * The story opens as a navy circle growing from the button that launched
 * it, and closes back into it.
 */
export function YearReviewLaunch({
  origin,
  review,
  onClose,
}: {
  origin: LaunchOrigin;
  review: YearReviewDto;
  onClose: () => void;
}) {
  const reduced = useMemo(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const closed = circle('0px', origin);
  const open = circle('150vmax', origin);

  return (
    <motion.div
      className="bg-oa-bg fixed inset-0 z-[60]"
      initial={{ clipPath: reduced ? open : closed }}
      animate={{ clipPath: open }}
      exit={{ clipPath: reduced ? open : closed, opacity: reduced ? 0 : 1 }}
      transition={{ duration: reduced ? 0.15 : 0.7, ease: [0.65, 0, 0.35, 1] }}
    >
      <Suspense
        fallback={
          <div className="grid h-full place-items-center">
            <BrandLogoLayers className="w-24 animate-pulse" />
          </div>
        }
      >
        <YearReviewStory review={review} onClose={onClose} />
      </Suspense>
    </motion.div>
  );
}
