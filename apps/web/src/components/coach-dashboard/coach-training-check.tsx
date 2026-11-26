import { useTrainingCheckAthletesQuery } from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { Link } from 'react-router-dom';

import { TrainingCheckAthletesDto } from '@openathlete/shared';

import { CHECK_STATUS, CheckLook } from '../statistics/training-check-look';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Answers = TrainingCheckAthletesDto['athletes'][number];

const COLUMNS: {
  key: Exclude<keyof Answers, 'athleteId'>;
  label: () => string;
}[] = [
  { key: 'fitness', label: m.check_col_fitness },
  { key: 'speed', label: m.check_col_speed },
  { key: 'durability', label: m.check_col_durability },
  { key: 'recovery', label: m.check_col_recovery },
  { key: 'design', label: m.check_col_design },
];

/** Answers that ask for a look come first */
const concern = (answers: Answers) =>
  COLUMNS.filter(
    ({ key }) => answers[key] === 'WORSE' || answers[key] === 'NOTE',
  ).length;

function Mark({ status, label }: { status: CheckLook; label: string }) {
  const { icon: Icon, label: word, tint, text } = CHECK_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full',
        tint,
      )}
      title={`${label}: ${word()}`}
      data-status={status}
    >
      <Icon className={cn('size-4', text)} aria-hidden="true" />
      <span className="sr-only">{`${label}: ${word()}`}</span>
    </span>
  );
}

/**
 * The training check of every athlete of a coach, answers only: who to look
 * at first. Each name opens the athlete's check with its figures.
 */
export function CoachTrainingCheck({
  athletes,
}: {
  /** The athletes shown on the dashboard, with the name to show for each */
  athletes: { athleteId: number; name: string }[];
}) {
  const { data } = useTrainingCheckAthletesQuery(athletes.length > 0);
  const names = new Map(athletes.map((row) => [row.athleteId, row.name]));
  const rows = (data?.athletes ?? [])
    .filter((row) => names.has(row.athleteId))
    .sort((a, b) => concern(b) - concern(a));
  if (rows.length === 0) return null;

  return (
    <Card data-coach-check>
      <CardHeader>
        <CardTitle className="text-base">{m.check_title()}</CardTitle>
        <p className="text-sm text-muted-foreground">{m.check_coach_text()}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">
                  {m.check_coach_athlete()}
                </th>
                {COLUMNS.map(({ key, label }) => (
                  <th key={key} className="px-1 py-2 text-center font-medium">
                    {label()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.athleteId} data-athlete={row.athleteId}>
                  <td className="py-2 pr-3">
                    <Link
                      to={`${getPath(['dashboard', 'statistics'])}/${row.athleteId}?view=check`}
                      className="inline-flex items-center font-medium hover:underline max-md:min-h-11"
                    >
                      {names.get(row.athleteId)}
                    </Link>
                  </td>
                  {COLUMNS.map(({ key, label }) => (
                    <td key={key} className="px-1 py-2 text-center">
                      <Mark status={row[key]} label={label()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
