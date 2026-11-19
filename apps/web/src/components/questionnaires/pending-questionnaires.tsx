import { usePendingQuestionnairesQuery } from '@/api/questionnaire';
import { SectionLabel } from '@/components/ui/section-label';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { PendingQuestionnaire } from '@openathlete/shared';

import { formatDateTime } from './answer-format';

function Row({ item }: { item: PendingQuestionnaire }) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-event-questionnaire">
        <ClipboardList className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[0.9375rem] font-medium">
          {item.title}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {m.questionnaire_open_until({ date: formatDateTime(item.closesAt) })}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
    </>
  );
}

const rowClass =
  'flex min-h-16 w-full items-center gap-3 px-4 py-3 active:bg-accent hover:bg-accent/50';

/**
 * The questionnaires from the athlete's coaches still waiting for an
 * answer. Links to the calendar, or opens them in place when it is there.
 */
export function PendingQuestionnaires({
  onOpen,
  className,
}: {
  /** In the calendar: opens the questionnaire without leaving it */
  onOpen?: (eventId: number) => void;
  className?: string;
}) {
  const { data: pending } = usePendingQuestionnairesQuery();
  if (!pending?.length) return null;

  return (
    <section
      className={cn('space-y-2', className)}
      aria-label={m.questionnaire_pending_title()}
      data-pending-questionnaires
    >
      <SectionLabel className="px-1">
        {m.questionnaire_pending_title()}
      </SectionLabel>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">
        {pending.map((item) =>
          onOpen ? (
            <button
              key={item.eventId}
              type="button"
              className={rowClass}
              data-pending-questionnaire={item.eventId}
              onClick={() => onOpen(item.eventId)}
            >
              <Row item={item} />
            </button>
          ) : (
            <Link
              key={item.eventId}
              to={`${getPath(['dashboard', 'calendar'])}?event=${item.eventId}`}
              className={rowClass}
              data-pending-questionnaire={item.eventId}
            >
              <Row item={item} />
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
