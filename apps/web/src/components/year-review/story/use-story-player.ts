import { useCallback, useEffect, useRef, useState } from 'react';

import {
  StoryAction,
  StoryState,
  initialStoryState,
  isLastSlide,
  slideProgress,
  storyReducer,
} from './story-state';

/**
 * Plays a story: one slide after the other on a timer that stops while the
 * tab is hidden, with the keyboard of a desktop (arrows, space).
 *
 * The timer runs every frame, so it lives in a ref and draws the progress
 * bar itself: React renders only when the slide or the pause changes.
 */
export function useStoryPlayer(count: number) {
  const state = useRef<StoryState>(initialStoryState(count));
  const progressBar = useRef<HTMLElement | null>(null);
  const [view, setView] = useState(state.current);

  const drawProgress = useCallback(() => {
    progressBar.current?.style.setProperty(
      'transform',
      `scaleX(${slideProgress(state.current)})`,
    );
  }, []);

  const dispatch = useCallback(
    (action: StoryAction) => {
      const previous = state.current;
      const next = storyReducer(previous, action);
      state.current = next;
      if (
        next.index !== previous.index ||
        next.paused !== previous.paused ||
        next.held !== previous.held
      ) {
        setView(next);
      }
      drawProgress();
    },
    [drawProgress],
  );

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // A hidden tab would otherwise skip slides when it comes back
      if (!document.hidden) dispatch({ type: 'tick', ms: now - last });
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [dispatch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') dispatch({ type: 'next' });
      else if (event.key === 'ArrowLeft') dispatch({ type: 'previous' });
      else if (event.key === ' ') {
        // Space would otherwise press the focused button
        event.preventDefault();
        dispatch({ type: 'togglePause' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return {
    index: view.index,
    paused: view.paused,
    held: view.held,
    isLast: isLastSlide(view),
    /** Attach to the bar of the current slide: the player scales it */
    progressBar: useCallback(
      (node: HTMLElement | null) => {
        // The bar left behind falls back to its CSS: full or empty
        if (progressBar.current !== node) {
          progressBar.current?.style.removeProperty('transform');
        }
        progressBar.current = node;
        drawProgress();
      },
      [drawProgress],
    ),
    next: useCallback(() => dispatch({ type: 'next' }), [dispatch]),
    previous: useCallback(() => dispatch({ type: 'previous' }), [dispatch]),
    goTo: useCallback(
      (index: number) => dispatch({ type: 'go', index }),
      [dispatch],
    ),
    togglePause: useCallback(
      () => dispatch({ type: 'togglePause' }),
      [dispatch],
    ),
    pause: useCallback(() => dispatch({ type: 'pause' }), [dispatch]),
    hold: useCallback(
      (held: boolean) => dispatch({ type: 'hold', held }),
      [dispatch],
    ),
  };
}

export type StoryPlayer = ReturnType<typeof useStoryPlayer>;
