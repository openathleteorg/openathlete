import { m } from '@/paraglide/messages';

import { Badge } from '../ui/badge';

export type QuickReadKind = 'observation' | 'limit';

export interface QuickReadLine {
  kind: QuickReadKind;
  text: string;
}

const LABELS: Record<QuickReadKind, () => string> = {
  observation: m.statistics_read_observation,
  limit: m.statistics_read_limit,
};

/**
 * What the figures say, in sentences built from them: no model writes these.
 * A limit says what the data does not allow to conclude.
 */
export function QuickRead({ lines }: { lines: QuickReadLine[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-1.5 text-sm" data-quick-read>
      {lines.map(({ kind, text }) => (
        <li key={text} className="flex items-start gap-2">
          <Badge
            variant={kind === 'limit' ? 'outline' : 'secondary'}
            className="mt-0.5 shrink-0 text-[10px]"
          >
            {LABELS[kind]()}
          </Badge>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
