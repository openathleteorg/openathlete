import { EventTemplate, EventTemplateFolder } from '@openathlete/shared';

/**
 * Types of draggable items in the DND system
 */
export enum DraggableType {
  TEMPLATE = 'template',
  FOLDER = 'folder',
}

/**
 * Types of droppable zones in the DND system
 */
export enum DroppableType {
  FOLDER = 'folder',
  ROOT_ZONE = 'root-zone',
  FOLDER_CONTENT = 'folder-content',
}

/**
 * Data attached to draggable templates
 */
export interface DraggableTemplateData {
  type: DraggableType.TEMPLATE;
  template: EventTemplate;
}

/**
 * Data attached to draggable folders
 */
export interface DraggableFolderData {
  type: DraggableType.FOLDER;
  folder: EventTemplateFolder;
}

/**
 * Data attached to folder drop zones
 */
export interface DroppableFolderData {
  type: DroppableType.FOLDER;
  folderId: number | null;
  folder?: EventTemplateFolder;
}

/**
 * Data attached to root drop zone (for items without folder)
 */
export interface DroppableRootData {
  type: DroppableType.ROOT_ZONE;
}

/**
 * Data attached to folder content drop zones
 */
export interface DroppableFolderContentData {
  type: DroppableType.FOLDER_CONTENT;
  folderId: number;
  folder: EventTemplateFolder;
}

/**
 * Union type for all draggable data
 */
export type DraggableData = DraggableTemplateData | DraggableFolderData;

/**
 * Union type for all droppable data
 */
export type DroppableData =
  | DroppableFolderData
  | DroppableRootData
  | DroppableFolderContentData;

/**
 * Generate a unique ID for a draggable template
 */
export function getTemplateId(template: EventTemplate): string {
  return `template-${template.eventTemplateId}`;
}

/**
 * Generate a unique ID for a draggable folder
 */
export function getFolderId(folder: EventTemplateFolder): string {
  return `folder-${folder.eventTemplateFolderId}`;
}

/**
 * Generate ID for folder drop zone
 */
export function getFolderDropZoneId(folder: EventTemplateFolder): string {
  return `folder-drop-${folder.eventTemplateFolderId}`;
}

/**
 * Generate ID for folder content drop zone
 */
export function getFolderContentDropZoneId(
  folder: EventTemplateFolder,
): string {
  return `folder-content-${folder.eventTemplateFolderId}`;
}

/**
 * ID for root drop zone (templates without folder)
 */
export const ROOT_DROP_ZONE_ID = 'root-drop-zone';

/**
 * Check if a folder is a descendant of another folder
 */
export function isFolderDescendant(
  folder: EventTemplateFolder,
  potentialAncestor: EventTemplateFolder,
  allFolders: EventTemplateFolder[],
): boolean {
  let current = folder;

  // Traverse up the parent chain
  while (current.parentFolderId) {
    if (current.parentFolderId === potentialAncestor.eventTemplateFolderId) {
      return true;
    }

    const parent = allFolders.find(
      (f) => f.eventTemplateFolderId === current.parentFolderId,
    );

    if (!parent) break;
    current = parent;
  }

  return false;
}

/**
 * Build a hierarchy tree from flat folder list
 */
export function buildFolderTree(
  folders: EventTemplateFolder[],
): EventTemplateFolder[] {
  return folders.filter((folder) => !folder.parentFolderId);
}

/**
 * Get all child folders of a folder
 */
export function getChildFolders(
  folder: EventTemplateFolder,
  allFolders: EventTemplateFolder[],
): EventTemplateFolder[] {
  return allFolders.filter(
    (f) => f.parentFolderId === folder.eventTemplateFolderId,
  );
}

/**
 * Get depth level of a folder in hierarchy (0 for root)
 */
export function getFolderDepth(
  folder: EventTemplateFolder,
  allFolders: EventTemplateFolder[],
): number {
  let depth = 0;
  let current = folder;

  while (current.parentFolderId) {
    depth++;
    const parent = allFolders.find(
      (f) => f.eventTemplateFolderId === current.parentFolderId,
    );
    if (!parent) break;
    current = parent;
  }

  return depth;
}
