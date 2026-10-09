import {
  Active,
  Collision,
  CollisionDetection,
  UniqueIdentifier,
  pointerWithin,
} from '@dnd-kit/core';

import { EVENT_TYPE, Event } from '@openathlete/shared';

/**
 * Planned sessions are drop targets for activities: dropping an activity on
 * one links them. Their droppable ids carry this prefix, so they never pass
 * for the ISO date of a calendar day.
 */
const LINK_DROP_PREFIX = 'link-session-';

export const linkDropId = (eventId: Event['eventId']) =>
  `${LINK_DROP_PREFIX}${eventId}`;

/** The session a droppable id stands for, null for anything else */
export function parseLinkDropId(id: UniqueIdentifier): Event['eventId'] | null {
  const value = String(id);
  if (!value.startsWith(LINK_DROP_PREFIX)) return null;
  const eventId = Number(value.slice(LINK_DROP_PREFIX.length));
  return Number.isInteger(eventId) ? eventId : null;
}

/** The calendar card being dragged is an activity */
export function isActivityDrag(active: Pick<Active, 'data'> | null): boolean {
  const data = active?.data.current as { event?: Event } | undefined;
  return data?.event?.type === EVENT_TYPE.ACTIVITY;
}

/**
 * Activities only land on sessions (they cannot move to another day); every
 * other card only lands on days and the template library.
 */
export function keepDropTargets(
  collisions: Collision[],
  activity: boolean,
): Collision[] {
  return collisions.filter(
    ({ id }) => (parseLinkDropId(id) !== null) === activity,
  );
}

/** Pointer collisions, narrowed to the targets the dragged item can use */
export const calendarCollisionDetection: CollisionDetection = (args) =>
  keepDropTargets(pointerWithin(args), isActivityDrag(args.active));
