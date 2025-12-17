'use client';

import {
  useCreateEventTemplateMutation,
  useGetMyEventTemplatesQuery,
  useUpdateEventTemplateMutation,
} from '@/api/event-template';
import {
  useCreateFolderMutation,
  useGetMyFoldersQuery,
  useUpdateFolderMutation,
} from '@/api/event-template-folder';
import { useSidebar } from '@/components/ui/sidebar';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { DragEndEvent, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FileText, Folder, FolderPlus, Search, X } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EventTemplate, EventTemplateFolder } from '@openathlete/shared';

import { CreateEventDialog } from '../create-event-dialog';
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
} from '../create-event-from-template-dialog/dnd-types';
import { DraggableTemplate } from '../create-event-from-template-dialog/draggable-template';
import { DroppableFolder } from '../create-event-from-template-dialog/droppable-folder';
import { FolderDialog } from '../create-event-from-template-dialog/folder-dialog';
import { RootDropZone } from '../create-event-from-template-dialog/root-drop-zone';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useSharedDnd } from './contexts/shared-dnd-context';
import { useTemplateLibrarySidebar } from './contexts/template-library-sidebar-context';

const TEMPLATE_LIBRARY_SIDEBAR_WIDTH = '20rem';

export function TemplateLibrarySidebar() {
  const { open, close } = useTemplateLibrarySidebar();
  const { state: mainSidebarState } = useSidebar();
  const { registerSidebarHandler } = useSharedDnd() || {};
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
  const createTemplateMutation = useCreateEventTemplateMutation();
  const updateTemplateMutation = useUpdateEventTemplateMutation();
  const updateFolderMutation = useUpdateFolderMutation();

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
    // In the library sidebar, clicking "use" will open the template for editing
    // The user can then save it as an event with a date
    setEditingTemplate(template);
  };

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeData = active.data.current as DraggableData | undefined;
      const overData = over.data.current as DroppableData | undefined;

      // Check if drop is in sidebar (has DroppableData) - if not, let parent context handle it
      if (!overData) {
        // Drop is outside sidebar, let calendar handle it
        return;
      }

      // Handle calendar event being dropped to create a template
      const calendarEventData = active.data.current as
        | { type: 'event'; event: { eventId: number; name: string } }
        | undefined;
      if (calendarEventData?.type === 'event' && calendarEventData.event) {
        let targetFolderId: number | null = null;

        if (overData?.type === DroppableType.ROOT_ZONE) {
          targetFolderId = null;
        } else if (overData?.type === DroppableType.FOLDER_CONTENT) {
          targetFolderId = overData.folderId;
        } else if (overData?.type === DroppableType.FOLDER) {
          targetFolderId = overData.folderId;
        }

        createTemplateMutation.mutate(
          {
            eventId: calendarEventData.event.eventId,
            folderId: targetFolderId,
          },
          {
            onSuccess: () => {
              refetchTemplates();
              refetchFolders();
              toast.success(m.template_saved_successfully());
            },
            onError: () => {
              toast.error(m.failed_to_save_template());
            },
          },
        );
        return;
      }

      if (!activeData) return;

      // Handle template movements
      if (activeData.type === DraggableType.TEMPLATE) {
        const template = activeData.template;
        let targetFolderId: number | null = null;

        if (overData?.type === DroppableType.ROOT_ZONE) {
          targetFolderId = null;
        } else if (overData?.type === DroppableType.FOLDER_CONTENT) {
          targetFolderId = overData.folderId;
        } else if (overData?.type === DroppableType.FOLDER) {
          targetFolderId = overData.folderId;
        }

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
            onError: () => {
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
            onError: () => {
              toast.error(m.failed_to_move_folder());
            },
          },
        );
      }
    },
    [
      createTemplateMutation,
      updateTemplateMutation,
      updateFolderMutation,
      refetchTemplates,
      refetchFolders,
      folders,
    ],
  );

  // Register sidebar handler with shared DnD context
  React.useEffect(() => {
    if (!registerSidebarHandler) return;
    return registerSidebarHandler(handleDragEnd);
  }, [registerSidebarHandler, handleDragEnd]);

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

  const allSortableIds = [
    ...rootFolders.map((f) => getFolderId(f)),
    ...rootTemplates.map((t) => getTemplateId(t)),
  ];

  // Calculate left position based on main sidebar state
  const leftPosition = useMemo(() => {
    if (mainSidebarState === 'expanded') {
      return 'var(--sidebar-width)';
    }
    return 'var(--sidebar-width-icon)';
  }, [mainSidebarState]);

  return (
    <>
      {/* Spacer div to push content - similar to main sidebar */}
      <div
        className={cn(
          'hidden md:block relative bg-transparent transition-[width] duration-200 ease-linear flex-shrink-0',
        )}
        style={{
          width: open ? TEMPLATE_LIBRARY_SIDEBAR_WIDTH : '0',
        }}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 z-[9] hidden h-svh transition-[left,opacity] duration-200 ease-linear md:flex flex-col bg-sidebar border-r border-sidebar-border',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={{
          left: open
            ? leftPosition
            : `calc(${leftPosition} - ${TEMPLATE_LIBRARY_SIDEBAR_WIDTH})`,
          width: TEMPLATE_LIBRARY_SIDEBAR_WIDTH,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-sidebar-border">
            <h2 className="text-base font-semibold">{m.template_library()}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-2 space-y-2 flex flex-col h-full overflow-hidden">
              {/* Search and Create Folder Bar */}
              <div className="flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    size="icon"
                    onClick={() => setCreateFolderDialogOpen(true)}
                    className="flex-shrink-0"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {search ? (
                  // Search results - flat list
                  <div className="space-y-1">
                    {templates?.map((template) => (
                      <DraggableTemplate
                        key={template.eventTemplateId}
                        template={template}
                        onCreate={() => handleUseTemplate(template)}
                        onEdit={() => setEditingTemplate(template)}
                        showUseButton={false}
                      />
                    ))}
                    {templates?.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
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
                      className="h-full p-2"
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
                          showUseButton={false}
                        />
                      ))}

                      {/* Root templates (no folder) */}
                      {rootTemplates.map((template) => (
                        <DraggableTemplate
                          key={template.eventTemplateId}
                          template={template}
                          onCreate={() => handleUseTemplate(template)}
                          onEdit={() => setEditingTemplate(template)}
                          showUseButton={false}
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
                <div className="bg-card p-3 rounded-lg shadow-2xl border-2 border-primary opacity-95">
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
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(activeDragItem as EventTemplate).event?.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </DragOverlay>
          </div>
        </div>
      </div>

      {editingTemplate?.event && (
        <CreateEventDialog
          open={!!editingTemplate}
          onClose={() => {
            setEditingTemplate(null);
            refetchTemplates();
          }}
          event={editingTemplate.event}
          isTemplate={true}
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
