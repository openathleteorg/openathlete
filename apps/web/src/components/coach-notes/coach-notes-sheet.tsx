import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { m } from '@/paraglide/messages';
import { NotebookPen } from 'lucide-react';

import { CoachNotesPanel } from './coach-notes-panel';

/** A coach's notes on an athlete, beside the calendar they plan in */
export function CoachNotesSheet({ athleteId }: { athleteId: number }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          aria-label={m.coach_notes()}
          title={m.coach_notes()}
          className="hidden md:inline-flex items-center gap-2"
        >
          <NotebookPen className="h-4 w-4" />
          <span className="hidden xl:inline">{m.coach_notes()}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{m.coach_notes()}</SheetTitle>
        </SheetHeader>
        <CoachNotesPanel athleteId={athleteId} className="px-4 pb-4" />
      </SheetContent>
    </Sheet>
  );
}
