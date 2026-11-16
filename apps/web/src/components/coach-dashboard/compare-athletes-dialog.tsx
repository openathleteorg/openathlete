import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';

import {
  COACH_DASHBOARD_COLUMNS,
  CoachDashboardAthleteRowDto,
} from '@openathlete/shared';

import { ColumnCell } from './coach-dashboard-cells';
import { columnLabel } from './coach-dashboard-format';

const rowName = (row: CoachDashboardAthleteRowDto) =>
  `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email || '';

/**
 * Athletes side by side over the same period: every figure of the
 * dashboard, whichever columns the table shows.
 */
export function CompareAthletesDialog({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: CoachDashboardAthleteRowDto[];
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl" mobileFullscreen>
        <DialogHeader>
          <DialogTitle>{m.coach_compare_title()}</DialogTitle>
          <DialogDescription>{m.coach_compare_description()}</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto" data-compare-athletes>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium" />
                {rows.map((row) => (
                  <th key={row.athleteId} className="px-2 py-2 font-medium">
                    {rowName(row)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COACH_DASHBOARD_COLUMNS.map((column) => (
                <tr key={column} className="border-b last:border-0">
                  <th className="py-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                    {columnLabel(column)}
                  </th>
                  {rows.map((row) => (
                    <td key={row.athleteId} className="px-2 py-2 align-top">
                      <ColumnCell column={column} row={row} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
