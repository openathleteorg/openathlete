import { useDeleteEventTemplateMutation } from '@/api/event-template';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, FileText, GripVertical, Trash } from 'lucide-react';
import { useState } from 'react';

import { EventTemplate } from '@openathlete/shared';
import {
  EVENT_TYPE,
  formatDistance,
  formatDuration,
} from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { SportIcon } from '../sport-icon/sport-icon';
import { Button } from '../ui/button';
import { DraggableType, getTemplateId } from './dnd-types';

type Props = {
  template: EventTemplate;
  onCreate: () => void;
  onEdit: () => void;
  depth?: number;
};

export function DraggableTemplate({
  template,
  onCreate,
  onEdit,
  depth = 0,
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteTemplateMutation = useDeleteEventTemplateMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: getTemplateId(template),
    data: {
      type: DraggableType.TEMPLATE,
      template,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: `${depth * 24}px`,
  };

  if (!template.event) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 p-3 rounded-lg border bg-white
        transition-all duration-200
        ${
          isDragging
            ? 'border-blue-400 shadow-lg scale-105 cursor-grabbing'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${isOver ? 'border-blue-300 bg-blue-50' : ''}
      `}
    >
      <button
        className="
          cursor-grab active:cursor-grabbing
          hover:bg-gray-100 p-1.5 rounded
          transition-colors opacity-0 group-hover:opacity-100
        "
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />

      <div className="flex-1 flex items-center gap-4 min-w-0">
        <span className="font-medium min-w-[200px] truncate">
          {template.event?.name}
        </span>

        {template.event.type === EVENT_TYPE.TRAINING && (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
            <SportIcon sport={template.event.sport} />
            <span>{sportTypeLabelMap[template.event.sport]}</span>
          </div>
        )}

        {template.event.type === EVENT_TYPE.TRAINING &&
          template.event.goalDuration && (
            <span className="text-sm text-gray-600 min-w-[80px]">
              {formatDuration(template.event.goalDuration)}
            </span>
          )}

        {template.event.type === EVENT_TYPE.TRAINING &&
          template.event.goalDistance && (
            <span className="text-sm text-gray-600 min-w-[80px]">
              {formatDistance(template.event.goalDistance)} km
            </span>
          )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={onCreate}>
          {m.use()}
        </Button>
        <Button variant="outline" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteTemplateMutation.mutate(template.eventTemplateId);
          setDeleteDialogOpen(false);
        }}
        title={m.delete_template()}
        message={m.confirm_delete_template()}
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
}
