import { describe, expect, it } from 'vitest';

import { EVENT_TYPE } from '@openathlete/shared';

import {
  isActivityDrag,
  keepDropTargets,
  linkDropId,
  parseLinkDropId,
} from './link-drop';

describe('session drop targets', () => {
  it('round-trips the session id', () => {
    expect(parseLinkDropId(linkDropId(42))).toBe(42);
  });

  it('tells sessions from days and the template library', () => {
    expect(parseLinkDropId('2026-10-05T22:00:00.000Z')).toBeNull();
    expect(parseLinkDropId('folder-drop-3')).toBeNull();
    expect(parseLinkDropId('link-session-abc')).toBeNull();
  });

  it('lands activities on sessions only, and the rest elsewhere', () => {
    const collisions = [
      { id: linkDropId(1) },
      { id: '2026-10-05T22:00:00.000Z' },
      { id: 'root-drop-zone' },
    ];
    expect(keepDropTargets(collisions, true)).toEqual([{ id: linkDropId(1) }]);
    expect(keepDropTargets(collisions, false)).toEqual(collisions.slice(1));
  });

  it('recognises a dragged activity', () => {
    const drag = (type: EVENT_TYPE) => ({
      data: { current: { type: 'event', event: { type } } },
    });
    expect(isActivityDrag(drag(EVENT_TYPE.ACTIVITY))).toBe(true);
    expect(isActivityDrag(drag(EVENT_TYPE.TRAINING))).toBe(false);
    expect(isActivityDrag(null)).toBe(false);
  });
});
