import client, { routes } from '@/utils/axios';

import {
  CreateEventTemplateFolderDto,
  EventTemplateFolder,
  UpdateEventTemplateFolderDto,
} from '@openathlete/shared';

export class EventTemplateFolderAPI {
  /** The user's own folders, or a club's library with clubId */
  static async getMyFolders(
    clubId?: number | null,
  ): Promise<EventTemplateFolder[]> {
    const res = await client.get(routes.eventTemplateFolder.getMyFolders, {
      params: clubId ? { clubId } : undefined,
    });
    return res.data;
  }

  static async createFolder(
    body: CreateEventTemplateFolderDto,
  ): Promise<EventTemplateFolder> {
    const res = await client.post(routes.eventTemplateFolder.create, body);
    return res.data;
  }

  static async updateFolder({
    folderId,
    body,
  }: {
    folderId: EventTemplateFolder['eventTemplateFolderId'];
    body: UpdateEventTemplateFolderDto;
  }): Promise<EventTemplateFolder> {
    const res = await client.patch(
      routes.eventTemplateFolder.update(folderId),
      body,
    );
    return res.data;
  }

  static async deleteFolder(
    folderId: EventTemplateFolder['eventTemplateFolderId'],
  ): Promise<void> {
    await client.delete(routes.eventTemplateFolder.delete(folderId));
  }
}
