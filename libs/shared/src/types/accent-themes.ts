import { z } from 'zod';

/**
 * Accent colours of the app, a Supporter perk. Light and dark mode stay
 * free for everyone: they are accessibility, not decoration.
 */
export const ACCENT_THEMES = [
  'ocean',
  'forest',
  'sunset',
  'berry',
  'rose',
] as const;
export type AccentTheme = (typeof ACCENT_THEMES)[number];

/** null: the default navy of the brand */
export const accentThemeSchema = z.enum(ACCENT_THEMES).nullable();
