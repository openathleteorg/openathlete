import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { Download, RotateCcw, Share } from 'lucide-react';
import { CSSProperties, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { BrandLogoLayers } from '../brand-logo-layers';
import { formatNumber, hours } from '../format';
import { mixLabel, recap } from '../share/recap';
import { renderShareImage } from '../share/share-image';
import {
  saveYearReviewImage,
  shareYearReview,
} from '../share/share-year-review';
import { Slide } from '../story/slide';
import { SERIES_COLORS, SlideProps } from './types';

/** The sports by name, then the others together */
const MIX_COLORS = [...SERIES_COLORS, 'var(--yr-muted)'];

export function RecapSlide({
  review,
  onReplay,
}: SlideProps & { onReplay: () => void }) {
  const units = useUnits();
  const card = useMemo(() => recap(review, units), [review, units]);
  const [busy, setBusy] = useState(false);

  const withImage = async (handle: (image: Blob) => Promise<void>) => {
    setBusy(true);
    try {
      await handle(await renderShareImage(card, review.year));
    } catch {
      toast.error(m.year_review_share_failed());
    } finally {
      setBusy(false);
    }
  };

  const share = () =>
    withImage(async (image) => {
      const outcome = await shareYearReview(image, {
        year: review.year,
        title: m.year_review_share_title({ year: review.year }),
        text: m.year_review_share_text({
          year: review.year,
          distance: `${formatNumber(Math.round(units.distanceValue(review.totals.distance)))} ${units.distanceLabel}`,
          hours: formatNumber(hours(review.totals.movingTime)),
        }),
      });
      if (outcome === 'saved') toast.success(m.year_review_image_saved());
    });

  const save = () =>
    withImage(async (image) => {
      saveYearReviewImage(image, review.year);
      toast.success(m.year_review_image_saved());
    });

  return (
    <Slide className="yr-recap">
      <section
        className="yr-share-card"
        aria-label={m.year_review_recap_label()}
      >
        <header className="yr-share-head">
          <span className="yr-share-brand">
            <BrandLogoLayers />
            OpenAthlete
          </span>
          <span className="yr-share-year">{review.year}</span>
        </header>
        <p className="yr-share-title">
          {card.title}
          <br />
          <span className="yr-gradient">{card.accent}</span>
        </p>
        <dl className="yr-share-figures">
          {card.figures.map(({ value, label }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="yr-share-months" aria-hidden>
          {card.months.map((share, index) => (
            <i
              key={index}
              data-best={index === card.bestMonth ? '' : undefined}
              style={
                { '--h': `${Math.max(share, 0.04) * 100}%` } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="yr-share-mix" aria-hidden>
          {card.mix.map((part, index) => (
            <i
              key={part.label}
              style={
                {
                  flexGrow: part.share,
                  background: MIX_COLORS[index],
                } as CSSProperties
              }
            />
          ))}
        </div>
        <ul className="yr-share-legend">
          {card.mix.map((part, index) => (
            <li
              key={part.label}
              style={{ '--c': MIX_COLORS[index] } as CSSProperties}
            >
              {mixLabel(part)}
            </li>
          ))}
        </ul>
      </section>

      <div className="yr-actions">
        <button
          type="button"
          className="yr-button"
          data-variant="primary"
          disabled={busy}
          onClick={share}
        >
          <Share />
          {m.year_review_share()}
        </button>
        <div className="yr-actions-row">
          <button
            type="button"
            className="yr-button"
            data-variant="ghost"
            disabled={busy}
            onClick={save}
          >
            <Download />
            {m.year_review_save_image()}
          </button>
          <button
            type="button"
            className="yr-button"
            data-variant="ghost"
            onClick={onReplay}
          >
            <RotateCcw />
            {m.year_review_replay()}
          </button>
        </div>
        {card.attribution && (
          <p className="yr-attribution">{card.attribution}</p>
        )}
      </div>
    </Slide>
  );
}
