import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SpaceConsumer, SpaceProvider } from '@/contexts/space';
import { isCapacitor } from '@/utils/capacitor';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Calendar, FileText, Folder, StickyNote } from 'lucide-react';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import {
  SharedDndProvider,
  useSharedDnd,
} from '../calendar/contexts/shared-dnd-context';
import { TemplateLibrarySidebarProvider } from '../calendar/contexts/template-library-sidebar-context';
import { TemplateLibrarySidebar } from '../calendar/template-library-sidebar';
import { ChatBubble, ChatWindow } from '../chatbot';
import {
  DraggableData,
  DraggableType,
} from '../create-event-from-template-dialog/dnd-types';
import { MobileLayout } from '../mobile/mobile-layout';
import { AppSidebar } from '../sidebar/app-sidebar';
import { SportIcon } from '../sport-icon/sport-icon';

interface P {
  children: React.ReactNode;
}

function LayoutContent({ children }: P) {
  const { onDragStart, onDragEnd, activeItem } = useSharedDnd() || {};
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Get the drag overlay content based on the active item
  const getDragOverlayContent = () => {
    if (!activeItem) return null;

    const activeData = activeItem.data.current as DraggableData | undefined;

    // Template being dragged
    if (activeData?.type === DraggableType.TEMPLATE && activeData.template) {
      const event = activeData.template.event;
      const isTrainingOrCompetition =
        event?.type === EVENT_TYPE.TRAINING ||
        event?.type === EVENT_TYPE.COMPETITION;

      return (
        <div className="bg-card px-3 py-2.5 rounded-xl shadow-2xl border border-border/50 cursor-grabbing animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              {isTrainingOrCompetition && event && 'sport' in event ? (
                <SportIcon sport={event.sport} className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate max-w-[180px]">
                {event?.name}
              </span>
              <span className="text-xs text-muted-foreground">Template</span>
            </div>
          </div>
        </div>
      );
    }

    // Folder being dragged
    if (activeData?.type === DraggableType.FOLDER && activeData.folder) {
      return (
        <div className="bg-card px-3 py-2.5 rounded-xl shadow-2xl border border-border/50 cursor-grabbing animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                backgroundColor: `${activeData.folder.color || '#6366f1'}20`,
              }}
            >
              <Folder
                className="h-4 w-4"
                style={{ color: activeData.folder.color || '#6366f1' }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate max-w-[180px]">
                {activeData.folder.name}
              </span>
              <span className="text-xs text-muted-foreground">Dossier</span>
            </div>
          </div>
        </div>
      );
    }

    // Calendar event being dragged
    const eventData = activeItem.data.current as
      | { type: 'event'; event: Event }
      | undefined;
    if (eventData?.type === 'event' && eventData.event) {
      const event = eventData.event;
      const isTrainingOrCompetition =
        event.type === EVENT_TYPE.TRAINING ||
        event.type === EVENT_TYPE.COMPETITION;
      const isNote = event.type === EVENT_TYPE.NOTE;

      return (
        <div className="bg-card px-3 py-2.5 rounded-xl shadow-2xl border border-border/50 cursor-grabbing animate-in zoom-in-95 duration-150 max-w-[240px]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              {isTrainingOrCompetition && 'sport' in event ? (
                <SportIcon sport={event.sport} className="h-4 w-4" />
              ) : isNote ? (
                <StickyNote className="h-4 w-4 text-amber-500" />
              ) : (
                <Calendar className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate">{event.name}</span>
              <span className="text-xs text-muted-foreground">
                {isTrainingOrCompetition
                  ? 'Séance'
                  : isNote
                    ? 'Note'
                    : 'Événement'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <AppSidebar />
      <SpaceConsumer>
        {isCapacitor() ? (
          <MobileLayout>{children}</MobileLayout>
        ) : (
          <>
            <div className="flex w-full">
              <TemplateLibrarySidebar />
              <SidebarInset className="flex-1">{children}</SidebarInset>
            </div>
            <ChatBubble />
            <ChatWindow />
          </>
        )}
      </SpaceConsumer>
      <DragOverlay dropAnimation={null} style={{ cursor: 'grabbing' }}>
        {getDragOverlayContent()}
      </DragOverlay>
    </DndContext>
  );
}

export function DashboardLayout({ children }: P) {
  return (
    <SpaceProvider>
      <SidebarProvider>
        <TemplateLibrarySidebarProvider>
          <SharedDndProvider>
            <LayoutContent>{children}</LayoutContent>
          </SharedDndProvider>
        </TemplateLibrarySidebarProvider>
      </SidebarProvider>
    </SpaceProvider>
  );
}
