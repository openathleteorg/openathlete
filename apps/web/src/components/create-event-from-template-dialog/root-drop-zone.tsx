import { m } from '@/paraglide/messages';
import { useDroppable } from '@dnd-kit/core';
import { FolderOpen } from 'lucide-react';

import { DroppableType } from './dnd-types';

type Props = {
  children: React.ReactNode;
  isEmpty?: boolean;
};

export function RootDropZone({ children, isEmpty = false }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-container',
    data: {
      type: DroppableType.ROOT_ZONE,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[400px] rounded-lg border-2 p-4 transition-all duration-200
        ${
          isOver
            ? 'border-blue-400 bg-blue-50/50 shadow-inner'
            : 'border-gray-200 bg-gray-50/30'
        }
      `}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
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
