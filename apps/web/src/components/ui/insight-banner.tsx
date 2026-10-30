import { cn } from '@/utils/shadcn';

import { Button } from './button';

export interface InsightAction {
  label: string;
  onClick: () => void;
}

interface P {
  text: string;
  /** What the sentence is based on, so it can be checked */
  source?: string;
  actions?: InsightAction[];
  className?: string;
}

const MARK = [
  'h-2 bg-oa-brand-1',
  'h-3.5 bg-oa-brand-2',
  'h-3 bg-oa-brand-3',
  'h-1.5 bg-oa-brand-4',
];

/** A sentence that summarises the page, above its figures */
export function InsightBanner({ text, source, actions, className }: P) {
  return (
    <section
      data-slot="insight-banner"
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-muted px-4 py-3',
        className,
      )}
    >
      <span aria-hidden className="flex h-4 shrink-0 items-end gap-0.5">
        {MARK.map((bar) => (
          <span key={bar} className={cn('w-1 rounded-full', bar)} />
        ))}
      </span>
      <div className="min-w-0 flex-[1_1_20rem]">
        <p className="text-sm text-pretty">{text}</p>
        {source && <p className="text-xs text-muted-foreground">{source}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              size="sm"
              variant={index === 0 ? 'default' : 'outline'}
              className="rounded-full"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
