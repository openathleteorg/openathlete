import {
  useGetMyEventTemplatesQuery,
  useUpdateEventTemplateMutation,
  useUseEventTemplateMutation,
} from '@/api/event-template';
import {
  useCreateFolderMutation,
  useGetMyFoldersQuery,
  useUpdateFolderMutation,
} from '@/api/event-template-folder';
import { m } from '@/paraglide/messages';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FileText, Folder, FolderPlus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EventTemplate, EventTemplateFolder } from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import { CreateEventDialog } from '../create-event-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CustomModal } from './custom-modal';
import {
  DraggableData,
  DraggableType,
  DroppableData,
  DroppableType,
  buildFolderTree,
  getChildFolders,
  getFolderId,
  getTemplateId,
  isFolderDescendant,
} from './dnd-types';
import { DraggableTemplate } from './draggable-template';
import { DroppableFolder } from './droppable-folder';
import { FolderDialog } from './folder-dialog';
import { RootDropZone } from './root-drop-zone';

type P = {
  open: boolean;
  onClose: () => void;
  date?: Date;
};

export function CreateEventFromTemplateDialog({ open, onClose, ...rest }: P) {
  const { athleteId } = useCalendarContext();
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(
    null,
  );
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: templates, refetch: refetchTemplates } =
    useGetMyEventTemplatesQuery(search);
  const { data: folders, refetch: refetchFolders } = useGetMyFoldersQuery();
  const createFolderMutation = useCreateFolderMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const updateFolderMutation = useUpdateFolderMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Custom collision detection strategy
  const collisionDetectionStrategy = (args: any) => {
    // First, check pointer intersections (most precise)
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Then check rect intersections
    const rectCollisions = rectIntersection(args);

    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // Fallback to closest center
    return closestCenter(args);
  };

  const startDate = useMemo(() => {
    if (!rest.date) return undefined;
    const d = new Date(rest.date);
    d.setHours(8);
    d.setMinutes(0);
    d.setSeconds(0);
    return d;
  }, [rest]);

  const endDate = useMemo(() => {
    if (!rest.date) return undefined;
    const d = new Date(rest.date);
    d.setHours(9);
    d.setMinutes(0);
    d.setSeconds(0);
    return d;
  }, [rest]);

  const useTemplateMutation = useUseEventTemplateMutation({
    onSuccess: () => {
      onClose();
      toast.success(m.event_created_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });

  const handleCreateFolder = (name: string, color: string) => {
    createFolderMutation.mutate(
      { name, color },
      {
        onSuccess: () => {
          setCreateFolderDialogOpen(false);
          refetchFolders();
          toast.success(m.folder_created_successfully());
        },
      },
    );
  };

  const rootFolders = useMemo(() => {
    return buildFolderTree(folders || []);
  }, [folders]);

  const rootTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((t) => !t.folderId);
  }, [templates]);

  const handleUseTemplate = (template: EventTemplate) => {
    if (!startDate || !endDate) return;
    useTemplateMutation.mutate({
      eventTemplateId: template.eventTemplateId,
      body: {
        startDate,
        endDate,
        athleteId,
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current as DraggableData | undefined;
    const overData = over.data.current as DroppableData | undefined;

    if (!activeData) return;

    // Handle template movements
    if (activeData.type === DraggableType.TEMPLATE) {
      const template = activeData.template;
      let targetFolderId: number | null = null;

      // Determine target folder based on drop zone type
      if (overData?.type === DroppableType.ROOT_ZONE) {
        targetFolderId = null;
      } else if (overData?.type === DroppableType.FOLDER_CONTENT) {
        targetFolderId = overData.folderId;
      } else if (overData?.type === DroppableType.FOLDER) {
        targetFolderId = overData.folderId;
      }

      // Skip if no change
      if (template.folderId === targetFolderId) {
        return;
      }

      updateTemplateMutation.mutate(
        {
          eventTemplateId: template.eventTemplateId,
          body: {
            folderId: targetFolderId,
          },
        },
        {
          onSuccess: () => {
            refetchTemplates();
            refetchFolders();
            toast.success(m.template_moved_successfully());
          },
          onError: (error) => {
            console.error('Failed to move template:', error);
            toast.error(m.failed_to_move_template());
          },
        },
      );
    }

    // Handle folder movements
    else if (activeData.type === DraggableType.FOLDER) {
      const draggedFolder = activeData.folder;
      let targetParentId: number | null = null;

      if (overData?.type === DroppableType.ROOT_ZONE) {
        targetParentId = null;
      } else if (overData?.type === DroppableType.FOLDER_CONTENT) {
        const targetFolder = overData.folder;

        // Prevent dropping folder into itself or its descendants
        if (
          targetFolder.eventTemplateFolderId ===
            draggedFolder.eventTemplateFolderId ||
          isFolderDescendant(targetFolder, draggedFolder, folders || [])
        ) {
          toast.error(m.cannot_move_folder_circular());
          return;
        }

        targetParentId = targetFolder.eventTemplateFolderId;
      } else if (overData?.type === DroppableType.FOLDER) {
        const targetFolder = overData.folder;

        if (
          !targetFolder ||
          targetFolder.eventTemplateFolderId ===
            draggedFolder.eventTemplateFolderId ||
          (targetFolder &&
            isFolderDescendant(targetFolder, draggedFolder, folders || []))
        ) {
          toast.error(m.cannot_move_folder_circular());
          return;
        }

        targetParentId = targetFolder.eventTemplateFolderId;
      }

      // Skip if no change
      if (draggedFolder.parentFolderId === targetParentId) {
        return;
      }

      updateFolderMutation.mutate(
        {
          folderId: draggedFolder.eventTemplateFolderId,
          body: {
            parentFolderId: targetParentId,
          },
        },
        {
          onSuccess: () => {
            refetchFolders();
            toast.success(m.folder_moved_successfully());
          },
          onError: (error) => {
            console.error('Failed to move folder:', error);
            toast.error(m.failed_to_move_folder());
          },
        },
      );
    }
  };

  const activeDragItem = useMemo(() => {
    if (!activeId) return null;

    if (activeId.startsWith('template-')) {
      const templateId = parseInt(activeId.replace('template-', ''));
      return templates?.find((t) => t.eventTemplateId === templateId);
    } else if (activeId.startsWith('folder-')) {
      const folderId = parseInt(activeId.replace('folder-', ''));
      return folders?.find((f) => f.eventTemplateFolderId === folderId);
    }

    return null;
  }, [activeId, templates, folders]);

  if (!rest.date) {
    return null;
  }

  const allSortableIds = [
    ...rootFolders.map((f) => getFolderId(f)),
    ...rootTemplates.map((t) => getTemplateId(t)),
  ];

  return (
    <>
      <CustomModal
        open={open && !editingTemplate}
        onClose={onClose}
        title={m.select_a_template()}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <div className="space-y-4">
            {/* Search and Create Folder Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={m.search_templates()}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!search && (
                <Button
                  variant="outline"
                  onClick={() => setCreateFolderDialogOpen(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {m.create_folder()}
                </Button>
              )}
            </div>

            {/* Main Content Area */}
            <div className="space-y-3 pb-4 min-h-[400px]">
              {search ? (
                // Search results - flat list
                <div className="space-y-2">
                  {templates?.map((template) => (
                    <DraggableTemplate
                      key={template.eventTemplateId}
                      template={template}
                      onCreate={() => handleUseTemplate(template)}
                      onEdit={() => setEditingTemplate(template)}
                    />
                  ))}
                  {templates?.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      {m.no_templates_found()}
                    </div>
                  )}
                </div>
              ) : (
                // Hierarchical view with folders
                <SortableContext
                  items={allSortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <RootDropZone
                    isEmpty={
                      rootFolders.length === 0 && rootTemplates.length === 0
                    }
                  >
                    {/* Root folders */}
                    {rootFolders.map((folder) => (
                      <DroppableFolder
                        key={folder.eventTemplateFolderId}
                        folder={folder}
                        templates={templates || []}
                        childFolders={getChildFolders(folder, folders || [])}
                        onCreate={handleUseTemplate}
                        onEdit={setEditingTemplate}
                        refetchFolders={refetchFolders}
                        activeId={activeId}
                        allFolders={folders || []}
                      />
                    ))}

                    {/* Root templates (no folder) */}
                    {rootTemplates.map((template) => (
                      <DraggableTemplate
                        key={template.eventTemplateId}
                        template={template}
                        onCreate={() => handleUseTemplate(template)}
                        onEdit={() => setEditingTemplate(template)}
                      />
                    ))}
                  </RootDropZone>
                </SortableContext>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null} style={{ cursor: 'grabbing' }}>
            {activeDragItem && (
              <div className="bg-white p-3 rounded-lg shadow-2xl border-2 border-blue-400 opacity-90">
                {activeId?.startsWith('folder-') ? (
                  <div className="flex items-center gap-2">
                    <Folder
                      className="h-4 w-4"
                      style={{
                        color:
                          (activeDragItem as EventTemplateFolder).color ||
                          '#6366f1',
                      }}
                    />
                    <span className="font-medium">
                      {(activeDragItem as EventTemplateFolder).name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {(activeDragItem as EventTemplate).event?.name}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </CustomModal>

      {editingTemplate?.event && (
        <CreateEventDialog
          open={!!editingTemplate}
          onClose={() => {
            setEditingTemplate(null);
            refetchTemplates();
          }}
          event={editingTemplate.event}
        />
      )}

      <FolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        onConfirm={handleCreateFolder}
        title={m.create_folder()}
        confirmText={m.create()}
        isLoading={createFolderMutation.isPending}
      />
    </>
  );
}
