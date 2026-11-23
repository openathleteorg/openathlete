import { CoachAPI } from '@/api/coach';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Downloads the athlete's planned calendar, for a coach to keep a copy of
 * the programming they did.
 */
export function CalendarExportButton({ athleteId }: { athleteId: number }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const file = await CoachAPI.exportCalendar(athleteId);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `openathlete-calendar-${athleteId}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(m.data_export_failed());
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExport}
      disabled={isExporting}
      aria-label={m.coach_calendar_export()}
      title={m.coach_calendar_export_hint()}
      className="hidden md:inline-flex text-muted-foreground"
    >
      <Download className="size-4" />
    </Button>
  );
}
