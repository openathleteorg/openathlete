import { Injectable } from '@nestjs/common';

import { event_template_folder } from '@openathlete/database';
import { keysToCamel } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class EventTemplateFolderService {
  constructor(private prisma: PrismaService) {}

  async getMyFolders(user: AuthUser) {
    const folders = await this.prisma.event_template_folder.findMany({
      where: {
        user_id: user.user_id,
      },
      include: {
        _count: {
          select: {
            event_templates: true,
            child_folders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return folders.map((f) => keysToCamel(f));
  }

  async createFolder(
    user: AuthUser,
    data: {
      name: string;
      color?: string;
      description?: string;
      parentFolderId?: number | null;
    },
  ) {
    const folder = await this.prisma.event_template_folder.create({
      data: {
        user_id: user.user_id,
        name: data.name,
        color: data.color,
        description: data.description,
        parent_folder_id: data.parentFolderId,
      },
      include: {
        _count: {
          select: {
            event_templates: true,
            child_folders: true,
          },
        },
      },
    });
    return keysToCamel(folder);
  }

  async updateFolder(
    user: AuthUser,
    folderId: event_template_folder['event_template_folder_id'],
    data: {
      name?: string;
      color?: string;
      description?: string;
      parentFolderId?: number | null;
    },
  ) {
    const folder = await this.prisma.event_template_folder.findUnique({
      where: {
        event_template_folder_id: folderId,
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.user_id !== user.user_id) {
      throw new Error('Unauthorized');
    }

    const updated = await this.prisma.event_template_folder.update({
      where: {
        event_template_folder_id: folderId,
      },
      data: {
        name: data.name,
        color: data.color,
        description: data.description,
        parent_folder_id: data.parentFolderId,
      },
      include: {
        _count: {
          select: {
            event_templates: true,
            child_folders: true,
          },
        },
      },
    });
    return keysToCamel(updated);
  }

  async deleteFolder(
    user: AuthUser,
    folderId: event_template_folder['event_template_folder_id'],
  ) {
    const folder = await this.prisma.event_template_folder.findUnique({
      where: {
        event_template_folder_id: folderId,
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.user_id !== user.user_id) {
      throw new Error('Unauthorized');
    }

    await this.prisma.event_template_folder.delete({
      where: {
        event_template_folder_id: folderId,
      },
    });
  }
}
