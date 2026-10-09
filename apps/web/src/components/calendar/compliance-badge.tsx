import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import {
  Compliance,
  ShownComplianceStatus,
  complianceDotClass,
  isShownCompliance,
} from './utils/compliance';
import {
  complianceLabel,
  complianceRatioLabel,
} from './utils/compliance-labels';

/** Status dot, label and done/planned ratio, for tooltips and details */
export function ComplianceBadge({
  compliance,
  className,
}: {
  compliance: Compliance;
  className?: string;
}) {
  if (!isShownCompliance(compliance)) return null;
  const ratio = complianceRatioLabel(compliance);

  return (
    <div
      data-compliance={compliance.status}
      className={cn('flex items-center gap-2 text-xs', className)}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          complianceDotClass[compliance.status],
        )}
      />
      <span className="font-medium">
        {complianceLabel[compliance.status]()}
      </span>
      {ratio && <span className="text-muted-foreground">· {ratio}</span>}
    </div>
  );
}

const LEGEND: ShownComplianceStatus[] = [
  'complete',
  'partial',
  'off',
  'missed',
];

/** What the coloured strips of the cards mean */
export function ComplianceLegend({ className }: { className?: string }) {
  return (
    <ul
      aria-label={m.calendar_compliance_label()}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      {LEGEND.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('h-3 w-1 rounded-full', complianceDotClass[status])}
          />
          {complianceLabel[status]()}
        </li>
      ))}
    </ul>
  );
}
