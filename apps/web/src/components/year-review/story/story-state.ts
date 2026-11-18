/** Time each slide stays before the story moves on by itself */
export const SLIDE_DURATION_MS = 7000;

export interface StoryState {
  count: number;
  index: number;
  /** Milliseconds spent on the current slide */
  elapsed: number;
  /** Paused with the button or the space bar */
  paused: boolean;
  /** Held under a finger or the mouse: frozen until released */
  held: boolean;
}

export type StoryAction =
  | { type: 'tick'; ms: number }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'go'; index: number }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'hold'; held: boolean };

export const initialStoryState = (count: number): StoryState => ({
  count,
  index: 0,
  elapsed: 0,
  paused: false,
  held: false,
});

export const isLastSlide = (state: StoryState) =>
  state.index === state.count - 1;

/** Share of the current slide already shown, between 0 and 1 */
export const slideProgress = (state: StoryState) =>
  isLastSlide(state) ? 1 : Math.min(1, state.elapsed / SLIDE_DURATION_MS);

const go = (state: StoryState, index: number): StoryState => {
  const clamped = Math.max(0, Math.min(state.count - 1, index));
  return clamped === state.index
    ? state
    : { ...state, index: clamped, elapsed: 0 };
};

export function storyReducer(
  state: StoryState,
  action: StoryAction,
): StoryState {
  switch (action.type) {
    case 'tick': {
      // The last slide waits for the athlete: it holds the share buttons
      if (state.paused || state.held || isLastSlide(state)) return state;
      const elapsed = state.elapsed + action.ms;
      return elapsed >= SLIDE_DURATION_MS
        ? go(state, state.index + 1)
        : { ...state, elapsed };
    }
    case 'next':
      return go(state, state.index + 1);
    case 'previous':
      // Back on the first slide restarts it, as stories do
      return state.index === 0
        ? { ...state, elapsed: 0 }
        : go(state, state.index - 1);
    case 'go':
      return go(state, action.index);
    case 'togglePause':
      return { ...state, paused: !state.paused };
    case 'pause':
      return state.paused ? state : { ...state, paused: true };
    case 'hold':
      return { ...state, held: action.held };
  }
}
