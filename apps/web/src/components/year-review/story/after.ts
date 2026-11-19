import { CSSProperties } from 'react';

/** Comes in `ms` after the slide, with `yr-reveal` */
export const after = (ms: number) => ({ '--d': ms }) as CSSProperties;
