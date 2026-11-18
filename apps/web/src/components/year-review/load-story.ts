/** The story's code and styles, fetched when first needed */
export const loadYearReviewStory = () => import('./story/year-review-story');

/** Starts loading the story before the click: hovering is enough */
export const preloadYearReviewStory = () => void loadYearReviewStory();
