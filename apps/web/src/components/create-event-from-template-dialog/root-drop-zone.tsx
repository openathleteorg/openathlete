import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useDroppable } from '@dnd-kit/core';
import { FolderOpen } from 'lucide-react';

import { DroppableType } from './dnd-types';

type Props = {
  children: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
};

export function RootDropZone({ children, isEmpty = false, className }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-container',
    data: {
      type: DroppableType.ROOT_ZONE,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        `
        min-h-[400px] rounded-lg border-2 p-4 transition-all duration-200
        ${
          isOver
            ? 'border-primary bg-primary/5 shadow-inner'
            : 'border-border bg-muted/20'
        }
      `,
        className,
      )}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">{m.no_templates_yet()}</p>
          <p className="text-sm">
            {isOver
              ? m.drop_here_to_add_to_root()
              : m.create_folder_or_add_templates()}
          </p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
