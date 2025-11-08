import { useCoachDashboardQuery } from '@/api/coach';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMeters(meters: number): string {
  if (!meters) return '0 km';
  const km = meters / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
}

function HeaderText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`whitespace-nowrap text-sm font-medium ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

type PeriodType = 'week' | 'month' | 'year';

function getPeriodDates(period: PeriodType): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 6); // Last 7 days
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function CoachDashboardView() {
  const nav = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('week');
  const { start, end } = getPeriodDates(period);
  const { data, isLoading } = useCoachDashboardQuery(start, end);

  return (
    <div className="px-0 pt-6 h-full flex flex-col min-h-0">
      <div className="mb-6 px-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{m.coach_dashboard()}</h1>
          <p className="text-muted-foreground">{m.coach_dashboard_title()}</p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodType)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{m.week()}</SelectItem>
            <SelectItem value="month">{m.month()}</SelectItem>
            <SelectItem value="year">{m.year()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t rounded-none bg-background flex-1 min-h-0 flex flex-col relative">
        <div className="absolute left-[239px] top-0 bottom-0 w-4 pointer-events-none bg-gradient-to-r from-black/6 to-transparent dark:from-white/10 z-[45] border-l" />
        <div className="flex-1 min-h-0 overflow-x-auto relative">
          <div className="relative min-w-[1560px] flex flex-col h-full">
            <div className="sticky top-0 z-[25] bg-background grid grid-cols-[240px_200px_140px_140px_140px_140px_140px_140px_140px_140px] border-b shrink-0">
              <div className="sticky left-0 z-[35] bg-background border-r pl-4 pr-2 h-10 flex items-center font-medium">
                <HeaderText>{m.name()}</HeaderText>
              </div>
              <div className="pl-6 pr-2 h-10 flex items-center bg-background">
                <HeaderText>{m.email()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.planned_sessions()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.completed_sessions()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.planned_time()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.completed_time()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.completed_distance()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.compliance()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.last_activity()}</HeaderText>
              </div>
              <div className="px-2 h-10 flex items-center justify-center bg-background">
                <HeaderText>{m.actions()}</HeaderText>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <div className="grid grid-cols-[240px_200px_140px_140px_140px_140px_140px_140px_140px_140px]">
                {isLoading && (
                  <div className="col-span-10 py-10 flex items-center justify-center text-muted-foreground">
                    {m.agent_processing()}
                  </div>
                )}

                {!isLoading &&
                  data?.athletes?.map((row) => {
                    const compliance = row.compliancePercent;
                    const badgeClass =
                      compliance >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : compliance >= 50
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
                    return (
                      <div key={row.athleteId} className="contents group">
                        <div className="sticky left-0 z-[30] bg-background border-r border-b pl-4 pr-2 h-[57px] flex items-center font-medium group-hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {row.firstName} {row.lastName}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                nav(
                                  getPath(['dashboard', 'calendar']) +
                                    `/${row.athleteId}`,
                                )
                              }
                              title={m.view_calendar()}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="pl-6 pr-2 h-[57px] flex items-center text-muted-foreground border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">{row.email}</span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">{row.plannedSessions}</span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">
                            {row.completedSessions}
                          </span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">
                            {formatSeconds(row.plannedTime)}
                          </span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">
                            {formatSeconds(row.completedTime)}
                          </span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">
                            {formatMeters(row.completedDistance)}
                          </span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <Badge className={badgeClass}>
                            {row.compliancePercent}
                            {m.percent_symbol()}
                          </Badge>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center text-muted-foreground border-b group-hover:bg-muted/40 bg-background">
                          <span className="text-sm">
                            {row.lastActivityAt
                              ? new Date(
                                  row.lastActivityAt,
                                ).toLocaleDateString()
                              : '-'}
                          </span>
                        </div>
                        <div className="px-2 h-[57px] flex items-center justify-center border-b group-hover:bg-muted/40 bg-background">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              nav(
                                getPath(['dashboard', 'metrics']) +
                                  `/${row.athleteId}`,
                              )
                            }
                          >
                            {m.metrics()}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
