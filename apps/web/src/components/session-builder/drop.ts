/**
 * Where a dragged row lands, as tree editors do it: the vertical position
 * picks the place, the horizontal one the level. A step keeps its level
 * unless dragged right (into the repeat above) or left (out of it), so a
 * cool-down dragged below the last repeat stays after it.
 */

export interface DropRow {
  kind: 'step' | 'repeat' | 'end';
  id: string;
  /** The repeat holding the row; for an end row, the repeat it closes */
  parent: string | null;
}

export interface Drop {
  parent: string | null;
  index: number;
  depth: 0 | 1;
}

/** Pixels of horizontal drag for one level */
export const INDENT = 28;

type Item = { id: string; kind: 'step' | 'repeat'; parent: string | null };

const depthOf = (item: Item) => (item.parent ? 1 : 0);

export function projectDrop(
  rows: DropRow[],
  activeId: string,
  overId: string,
  deltaX: number,
): Drop | null {
  const items: Item[] = rows.flatMap((row) =>
    row.kind === 'end'
      ? []
      : [{ id: row.id, kind: row.kind, parent: row.parent }],
  );
  const active = items.find((item) => item.id === activeId);
  if (!active) return null;
  const activeIndex = items.indexOf(active);

  // An end row stands for the place after the repeat's last child
  const overRow = rows.find((row) => row.id === overId);
  if (!overRow) return null;
  let anchor: Item | undefined;
  if (overRow.kind === 'end') {
    const children = items.filter((item) => item.parent === overRow.parent);
    anchor =
      children[children.length - 1] ??
      items.find((item) => item.id === overRow.parent);
  } else {
    anchor = items.find((item) => item.id === overId);
  }
  if (!anchor) return null;
  const anchorIndex = items.indexOf(anchor);
  const down = overRow.kind === 'end' || activeIndex < anchorIndex;

  // The list without what moves: a repeat moves with its steps
  const rest = items.filter(
    (item) =>
      item.id !== active.id &&
      !(active.kind === 'repeat' && item.parent === active.id),
  );
  if (
    anchor.id === active.id ||
    (active.kind === 'repeat' && anchor.parent === active.id)
  ) {
    // Dropped where it was: only a step's level can change
    if (active.kind === 'repeat') return null;
    return place(rest, activeIndex, active, deltaX);
  }
  const anchorAt = rest.indexOf(anchor);
  let position = down ? anchorAt + 1 : anchorAt;

  if (active.kind === 'repeat') {
    // A repeat never lands among another repeat's steps: after them
    while (position < rest.length && rest[position].parent) position += 1;
    return {
      parent: null,
      index: rest.slice(0, position).filter((item) => !item.parent).length,
      depth: 0,
    };
  }
  return place(rest, position, active, deltaX);
}

function place(
  rest: Item[],
  position: number,
  active: Item,
  deltaX: number,
): Drop {
  const previous = rest[position - 1];
  const next = rest[position];
  const canNest =
    !!previous && (previous.kind === 'repeat' || !!previous.parent);
  // Between two steps of a repeat, a step can only be in it
  const mustNest = !!next?.parent && canNest;
  const wanted = depthOf(active) + Math.round(deltaX / INDENT);
  const depth: 0 | 1 = mustNest ? 1 : canNest && wanted >= 1 ? 1 : 0;

  if (depth === 1) {
    const parent =
      previous!.kind === 'repeat' ? previous!.id : previous!.parent!;
    return {
      parent,
      index: rest.slice(0, position).filter((item) => item.parent === parent)
        .length,
      depth,
    };
  }
  return {
    parent: null,
    index: rest.slice(0, position).filter((item) => !item.parent).length,
    depth,
  };
}
