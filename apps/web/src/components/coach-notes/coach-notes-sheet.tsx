import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { m } from '@/paraglide/messages';
import { NotebookPen } from 'lucide-react';

import { CoachNotebookPanel } from './coach-notebook-panel';
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
        <Tabs defaultValue="athlete" className="gap-4 px-4 pb-4">
          <TabsList>
            <TabsTrigger value="athlete">
              {m.coach_notes_athlete_tab()}
            </TabsTrigger>
            <TabsTrigger value="notebook">{m.coach_notebook()}</TabsTrigger>
          </TabsList>
          <TabsContent value="athlete">
            <CoachNotesPanel athleteId={athleteId} />
          </TabsContent>
          <TabsContent value="notebook">
            <CoachNotebookPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
