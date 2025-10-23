import {
  useDeleteFolderMutation,
  useUpdateFolderMutation,
} from '@/api/event-template-folder';
import { m } from '@/paraglide/messages';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  FolderOpen,
  GripVertical,
  MoreVertical,
  Trash,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EventTemplate, EventTemplateFolder } from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  DraggableType,
  DroppableType,
  getFolderContentDropZoneId,
  getFolderId,
  getTemplateId,
} from './dnd-types';
import { DraggableTemplate } from './draggable-template';
import { FolderDialog } from './folder-dialog';

type Props = {
  folder: EventTemplateFolder;
  templates: EventTemplate[];
  childFolders: EventTemplateFolder[];
  onCreate: (template: EventTemplate) => void;
  onEdit: (template: EventTemplate) => void;
  refetchFolders: () => void;
  depth?: number;
  activeId?: string | null;
  allFolders: EventTemplateFolder[];
};

export function DroppableFolder({
  folder,
  templates,
  childFolders,
  onCreate,
  onEdit,
  refetchFolders,
  depth = 0,
  activeId,
  allFolders,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const deleteFolderMutation = useDeleteFolderMutation();
  const updateFolderMutation = useUpdateFolderMutation();

  // Auto-expand when dragging over
  const { setNodeRef: setContentDropRef, isOver: isOverContent } = useDroppable(
    {
      id: getFolderContentDropZoneId(folder),
      data: {
        type: DroppableType.FOLDER_CONTENT,
        folderId: folder.eventTemplateFolderId,
        folder,
      },
    },
  );

  // Separate droppable for empty folder zone
  const { setNodeRef: setEmptyDropRef, isOver: isOverEmpty } = useDroppable({
    id: `${getFolderContentDropZoneId(folder)}-empty`,
    data: {
      type: DroppableType.FOLDER_CONTENT,
      folderId: folder.eventTemplateFolderId,
      folder,
    },
  });

  const sortableFolder = useSortable({
    id: getFolderId(folder),
    data: {
      type: DraggableType.FOLDER,
      folder,
    },
  });

  // Auto-expand when dragging over folder content
  useEffect(() => {
    if ((isOverContent || isOverEmpty) && !isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOverContent, isOverEmpty, isExpanded]);

  const handleDeleteFolder = () => {
    deleteFolderMutation.mutate(folder.eventTemplateFolderId, {
      onSuccess: () => {
        toast.success(m.folder_deleted_successfully());
        setDeleteFolderDialogOpen(false);
        refetchFolders();
      },
    });
  };

  const handleRenameFolder = (name: string, color: string) => {
    updateFolderMutation.mutate(
      {
        folderId: folder.eventTemplateFolderId,
        body: { name, color },
      },
      {
        onSuccess: () => {
          toast.success(m.folder_renamed_successfully());
          setRenameFolderDialogOpen(false);
          refetchFolders();
        },
      },
    );
  };

  const folderStyle = {
    transform: CSS.Transform.toString(sortableFolder.transform),
    transition: sortableFolder.transition,
    opacity: sortableFolder.isDragging ? 0.4 : 1,
    marginLeft: `${depth * 24}px`,
  };

  // Filter templates that belong directly to this folder
  const directTemplates = templates.filter(
    (t) => t.folderId === folder.eventTemplateFolderId,
  );

  const totalItems = directTemplates.length + childFolders.length;

  // Combine templates and folders for sorting
  const sortableItems = [
    ...childFolders.map((f) => getFolderId(f)),
    ...directTemplates.map((t) => getTemplateId(t)),
  ];

  return (
    <div className="mb-2" ref={sortableFolder.setNodeRef} style={folderStyle}>
      {/* Folder Header */}
      <div
        ref={setContentDropRef}
        className={`
          group flex items-center gap-2 p-3 rounded-lg border
          transition-all duration-200
          ${
            sortableFolder.isDragging
              ? 'border-blue-400 shadow-lg scale-105 cursor-grabbing'
              : 'border-gray-200 hover:border-gray-300'
          }
          ${
            isOverContent || isOverEmpty
              ? 'bg-blue-50 border-blue-400 border-2 shadow-md'
              : 'bg-gray-50/50 hover:bg-gray-100/50'
          }
        `}
      >
        <button
          className="
            cursor-grab active:cursor-grabbing
            hover:bg-gray-200 p-1.5 rounded
            transition-colors opacity-0 group-hover:opacity-100
          "
          {...sortableFolder.attributes}
          {...sortableFolder.listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {isExpanded ? (
          <FolderOpen
            className="h-4 w-4 flex-shrink-0 transition-all"
            style={{ color: folder.color || '#6366f1' }}
          />
        ) : (
          <Folder
            className="h-4 w-4 flex-shrink-0 transition-all"
            style={{ color: folder.color || '#6366f1' }}
          />
        )}

        <span className="font-medium flex-1 truncate">{folder.name}</span>

        <span className="text-sm text-gray-500 flex-shrink-0">
          ({totalItems} {totalItems !== 1 ? m.items() : m.item()})
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-auto flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setRenameFolderDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {m.rename()}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteFolderDialogOpen(true)}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              {m.delete_()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Folder Content */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            {/* Child folders */}
            {childFolders.map((childFolder) => (
              <DroppableFolder
                key={childFolder.eventTemplateFolderId}
                folder={childFolder}
                templates={templates}
                childFolders={allFolders.filter(
                  (f) => f.parentFolderId === childFolder.eventTemplateFolderId,
                )}
                onCreate={onCreate}
                onEdit={onEdit}
                refetchFolders={refetchFolders}
                depth={depth + 1}
                activeId={activeId}
                allFolders={allFolders}
              />
            ))}

            {/* Templates */}
            {directTemplates.map((template) => (
              <DraggableTemplate
                key={template.eventTemplateId}
                template={template}
                onCreate={() => onCreate(template)}
                onEdit={() => onEdit(template)}
                depth={depth + 1}
              />
            ))}

            {/* Empty state */}
            {totalItems === 0 && (
              <div
                ref={setEmptyDropRef}
                className={`
                  text-sm text-gray-400 italic p-4 ml-6
                  border-2 border-dashed rounded-lg
                  transition-colors cursor-pointer
                  ${isOverEmpty || isOverContent ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                {isOverEmpty || isOverContent
                  ? m.drop_here_to_add_to_folder()
                  : m.empty_folder_drag_items()}
              </div>
            )}
          </SortableContext>
        </div>
      )}

      <FolderDialog
        open={renameFolderDialogOpen}
        onClose={() => setRenameFolderDialogOpen(false)}
        onConfirm={handleRenameFolder}
        initialName={folder.name}
        initialColor={folder.color || '#6366f1'}
        title={m.rename_folder()}
        confirmText={m.rename()}
        isLoading={updateFolderMutation.isPending}
      />

      <ConfirmAction
        open={deleteFolderDialogOpen}
        onClose={() => setDeleteFolderDialogOpen(false)}
        onConfirm={handleDeleteFolder}
        title={m.delete_folder()}
        message={m.confirm_delete_folder()}
        isLoading={deleteFolderMutation.isPending}
      />
    </div>
  );
}
