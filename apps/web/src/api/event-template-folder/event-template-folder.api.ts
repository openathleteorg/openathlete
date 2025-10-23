import client, { routes } from '@/utils/axios';

import {
  CreateEventTemplateFolderDto,
  EventTemplateFolder,
  UpdateEventTemplateFolderDto,
} from '@openathlete/shared';

export class EventTemplateFolderAPI {
  static async getMyFolders(): Promise<EventTemplateFolder[]> {
    const res = await client.get(routes.eventTemplateFolder.getMyFolders);
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
