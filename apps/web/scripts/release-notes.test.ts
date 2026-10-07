import { describe, expect, it } from 'vitest';

import { releaseNotes } from './release-notes';

describe('releaseNotes', () => {
  it('lists features, then fixes, without their conventional prefix', () => {
    expect(
      releaseNotes(
        [
          'fix(web): keep the messages bubble out of the onboarding',
          'chore(deps): bump vite',
          'feat: control who can sign up with SIGNUP_MODE',
          'docs: close the upgrade callout',
          'feat(api)!: reset passwords without email',
          'refactor(web): split the calendar',
        ],
        500,
      ),
    ).toBe(
      [
        '• Control who can sign up with SIGNUP_MODE',
        '• Reset passwords without email',
        '• Keep the messages bubble out of the onboarding',
      ].join('\n'),
    );
  });

  it('falls back to a generic note when nothing user-facing changed', () => {
    expect(releaseNotes(['chore: release', 'ci: cache pnpm'], 500)).toBe(
      'Bug fixes and improvements.',
    );
  });

  it('drops whole lines to fit the store limit', () => {
    const subjects = Array.from(
      { length: 40 },
      (_, i) => `feat: feature number ${i}`,
    );
    const notes = releaseNotes(subjects, 120);
    expect(notes.length).toBeLessThanOrEqual(120);
    expect(notes.endsWith('\n• …')).toBe(true);
    for (const line of notes.split('\n').slice(0, -1)) {
      expect(line).toMatch(/^• Feature number \d+$/);
    }
  });

  it('keeps every line when they fit exactly', () => {
    const notes = releaseNotes(['feat: a', 'fix: b'], 7);
    expect(notes).toBe('• A\n• B');
  });
});
