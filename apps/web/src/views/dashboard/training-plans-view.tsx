import {
  AppliedPlansPanel,
  PlanLibraryPanel,
} from '@/components/training-plans';
import { PageTitle } from '@/components/ui/page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { m } from '@/paraglide/messages';

/** The library of training plans, and the plans now on a calendar */
export function TrainingPlansView() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
      <PageTitle desktopOnly>{m.training_plans()}</PageTitle>
      <Tabs defaultValue="library" className="gap-4">
        <TabsList>
          <TabsTrigger value="library">
            {m.training_plans_library()}
          </TabsTrigger>
          <TabsTrigger value="applied">
            {m.training_plans_applied()}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="library">
          <PlanLibraryPanel />
        </TabsContent>
        <TabsContent value="applied">
          <AppliedPlansPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
