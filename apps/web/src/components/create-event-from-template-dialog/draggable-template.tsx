import { useDeleteEventTemplateMutation } from '@/api/event-template';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Edit,
  FileText,
  GripVertical,
  Share2,
  StickyNote,
  Trash,
  Users,
} from 'lucide-react';
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
  /** Plans the template for several athletes; absent without athletes */
  onPlanForAthletes?: () => void;
  /** Copies the template into a club's library; absent without one */
  onShareToClub?: () => void;
  /** A club library its assistant uses but does not change */
  readOnly?: boolean;
  depth?: number;
  showUseButton?: boolean;
};

export function DraggableTemplate({
  template,
  onCreate,
  onEdit,
  onPlanForAthletes,
  onShareToClub,
  readOnly = false,
  depth = 0,
  showUseButton = true,
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
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    marginLeft: `${depth * 24}px`,
  };

  if (!template.event) return null;

  const isCompact = !showUseButton;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-template={template.event?.name}
      className={`
        group relative flex items-center gap-2 p-2 rounded-lg border bg-card overflow-hidden
        transition-all duration-200
        ${
          isDragging
            ? 'border-dashed border-muted-foreground/30 bg-muted/50'
            : 'border-border hover:border-border/80 hover:shadow-sm'
        }
        ${isOver ? 'border-primary/50 bg-primary/10' : ''}
      `}
    >
      <button
        className="
          cursor-grab active:cursor-grabbing
          hover:bg-muted p-1.5 rounded
          transition-colors opacity-0 group-hover:opacity-100
        "
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {isCompact ? (
        template.event.type === EVENT_TYPE.TRAINING ||
        template.event.type === EVENT_TYPE.COMPETITION ? (
          <SportIcon
            sport={template.event.sport}
            className="h-4 w-4 flex-shrink-0"
          />
        ) : (
          <StickyNote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )
      ) : (
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
        <span className="font-medium truncate min-w-0">
          {template.event?.name}
        </span>

        {!isCompact && (
          <>
            {template.event.type === EVENT_TYPE.TRAINING && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 truncate">
                <SportIcon
                  sport={template.event.sport}
                  className="flex-shrink-0"
                />
                <span className="truncate">
                  {sportTypeLabelMap[template.event.sport]}
                </span>
              </div>
            )}

            {template.event.type === EVENT_TYPE.TRAINING &&
              template.event.goalDuration && (
                <span className="text-sm text-muted-foreground truncate min-w-0">
                  {formatDuration(template.event.goalDuration)}
                </span>
              )}

            {template.event.type === EVENT_TYPE.TRAINING &&
              template.event.goalDistance && (
                <span className="text-sm text-muted-foreground truncate min-w-0">
                  {formatDistance(template.event.goalDistance)} km
                </span>
              )}
          </>
        )}
      </div>

      {isCompact ? (
        <div className="absolute inset-0 flex items-center justify-end gap-1 ml-10 pr-2 bg-gradient-to-l from-card via-card/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {onPlanForAthletes && (
            <Button
              variant="outline"
              size="icon"
              onClick={onPlanForAthletes}
              aria-label={m.plan_for_athletes_template_action()}
              title={m.plan_for_athletes_template_action()}
              data-template-plan-for-athletes
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          {onShareToClub && (
            <Button
              variant="outline"
              size="icon"
              onClick={onShareToClub}
              aria-label={m.club_library_share()}
              title={m.club_library_share()}
              data-template-share-to-club
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onEdit}
                data-template-edit
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                data-template-delete
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="outline" onClick={onCreate}>
            {m.use()}
          </Button>
          {onPlanForAthletes && (
            <Button
              variant="outline"
              size="icon"
              onClick={onPlanForAthletes}
              aria-label={m.plan_for_athletes_template_action()}
              title={m.plan_for_athletes_template_action()}
              data-template-plan-for-athletes
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          {onShareToClub && (
            <Button
              variant="outline"
              size="icon"
              onClick={onShareToClub}
              aria-label={m.club_library_share()}
              title={m.club_library_share()}
              data-template-share-to-club
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onEdit}
                data-template-edit
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                data-template-delete
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

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
