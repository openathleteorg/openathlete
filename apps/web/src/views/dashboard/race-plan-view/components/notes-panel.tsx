import { Card } from '@/components/ui/card';

import type { RacePlanVisualizationExport } from '@openathlete/shared';

export function NotesPanel({ plan }: { plan: RacePlanVisualizationExport }) {
  const snap = (plan.meta?.configSnapshot || {}) as any;
  const notes: unknown = snap?.notes ?? snap?.note;

  if (!notes) return null;

  const content = Array.isArray(notes)
    ? (notes as unknown[])
        .filter((n) => typeof n === 'string' && n.trim().length)
        .join('\n')
    : typeof notes === 'string'
      ? notes
      : String(notes);

  if (!content.trim()) return null;

  return (
    <Card className="p-4 space-y-2">
      <h3 className="font-medium">Notes</h3>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    </Card>
  );
}
