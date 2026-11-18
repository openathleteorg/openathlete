import { m } from '@/paraglide/messages';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { CSSProperties, PointerEvent, useEffect, useMemo, useRef } from 'react';

import { YearReviewDto } from '@openathlete/shared';

import { BrandLogoLayers } from '../brand-logo-layers';
import { storySlides } from '../slides';
import '../year-review.css';
import { useStoryPlayer } from './use-story-player';

/** Longer than a tap: the story holds still until the finger lifts */
const HOLD_MS = 220;
const SWIPE_PX = 50;
/** Taps on this share of the card, from the left, go back */
const BACK_ZONE = 0.3;

interface P {
  review: YearReviewDto;
  onClose: () => void;
}

/**
 * The year review, told as a story: full screen on a phone, a 9:16 card on
 * a wider screen, with the brand's navy whatever the theme.
 */
export default function YearReviewStory({ review, onClose }: P) {
  const slides = useMemo(() => storySlides(review), [review]);
  const player = useStoryPlayer(slides.length);
  const slide = slides[player.index];
  const root = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; at: number } | null>(null);
  const holdTimer = useRef<number>(undefined);

  // The dialog takes the focus, and gives it back when it closes
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Escape, and Android's back button, which sends one to open dialogs
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onControl = (event: PointerEvent) =>
    Boolean((event.target as HTMLElement).closest('button, a'));

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (onControl(event)) return;
    press.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    holdTimer.current = window.setTimeout(() => player.hold(true), HOLD_MS);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    window.clearTimeout(holdTimer.current);
    const start = press.current;
    press.current = null;
    if (player.held) player.hold(false);
    if (!start || onControl(event)) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) player.next();
      else player.previous();
      return;
    }
    if (Date.now() - start.at >= HOLD_MS) return;
    const card = event.currentTarget.getBoundingClientRect();
    if (event.clientX - card.left < card.width * BACK_ZONE) player.previous();
    else player.next();
  };

  const onPointerCancel = () => {
    window.clearTimeout(holdTimer.current);
    press.current = null;
    player.hold(false);
  };

  const [glowA, glowB, glowC] = slide.glow;

  return (
    <div
      ref={root}
      className="yr-root"
      role="dialog"
      aria-modal="true"
      aria-label={m.year_review_title({ year: review.year })}
      data-state="open"
      tabIndex={-1}
      style={
        {
          '--yr-blob-a': glowA,
          '--yr-blob-b': glowB,
          '--yr-blob-c': glowC,
        } as CSSProperties
      }
    >
      <div className="yr-stage-glow" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="yr-stage-brand" aria-hidden>
        <BrandLogoLayers />
        OpenAthlete
      </div>
      <button
        type="button"
        className="yr-nav yr-nav-previous"
        aria-label={m.year_review_previous()}
        disabled={player.index === 0}
        onClick={player.previous}
      >
        <ChevronLeft />
      </button>

      <section
        className="yr-story"
        data-paused={player.paused ? '' : undefined}
        aria-roledescription={m.year_review_story()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="yr-backdrop" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="yr-grain" aria-hidden />

        <header className="yr-chrome">
          <div className="yr-bars" aria-hidden>
            {slides.map((item, index) => (
              <span
                key={item.id}
                className="yr-bar"
                data-done={index < player.index ? '' : undefined}
              >
                <b
                  ref={index === player.index ? player.progressBar : undefined}
                />
              </span>
            ))}
          </div>
          <div className="yr-chrome-row">
            <p className="yr-who">
              <span className="yr-avatar" aria-hidden>
                {review.firstName?.charAt(0) ?? <BrandLogoLayers />}
              </span>
              <span>
                {review.firstName ?? 'OpenAthlete'}{' '}
                <small>· {m.year_review_title({ year: review.year })}</small>
              </span>
            </p>
            <div>
              <button
                type="button"
                className="yr-icon-button"
                aria-label={
                  player.paused ? m.year_review_play() : m.year_review_pause()
                }
                onClick={player.togglePause}
              >
                {player.paused ? (
                  <Play fill="currentColor" />
                ) : (
                  <Pause fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                className="yr-icon-button"
                aria-label={m.ui_close()}
                onClick={onClose}
              >
                <X />
              </button>
            </div>
          </div>
        </header>

        <div className="yr-paused" aria-hidden>
          <Pause fill="currentColor" />
        </div>

        <div aria-live="polite" className="contents">
          {/* Keyed: a slide comes back with its entrance played again */}
          <div key={`${slide.id}-${player.index}`} className="contents">
            {slide.render({ replay: () => player.goTo(0) })}
          </div>
        </div>
      </section>

      <button
        type="button"
        className="yr-nav yr-nav-next"
        aria-label={m.year_review_next()}
        disabled={player.isLast}
        onClick={player.next}
      >
        <ChevronRight />
      </button>
      <p className="yr-stage-hint" aria-hidden>
        <span>
          <kbd>←</kbd> <kbd>→</kbd> {m.year_review_hint_navigate()}
        </span>
        <span>
          <kbd>{m.year_review_hint_space()}</kbd> {m.year_review_pause()}
        </span>
        <span>{m.year_review_hint_hold()}</span>
      </p>
    </div>
  );
}
