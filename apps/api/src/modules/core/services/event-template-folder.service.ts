import { Injectable } from '@nestjs/common';

import { EventTemplateFolder } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class EventTemplateFolderService {
  constructor(private prisma: PrismaService) {}

  async getMyFolders(user: AuthUser) {
    const folders = await this.prisma.eventTemplateFolder.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        _count: {
          select: {
            eventTemplates: true,
            childFolders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return folders;
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
    const folder = await this.prisma.eventTemplateFolder.create({
      data: {
        userId: user.userId,
        name: data.name,
        color: data.color,
        description: data.description,
        parentFolderId: data.parentFolderId,
      },
      include: {
        _count: {
          select: {
            eventTemplates: true,
            childFolders: true,
          },
        },
      },
    });
    return folder;
  }

  async updateFolder(
    user: AuthUser,
    folderId: EventTemplateFolder['eventTemplateFolderId'],
    data: {
      name?: string;
      color?: string;
      description?: string;
      parentFolderId?: number | null;
    },
  ) {
    const folder = await this.prisma.eventTemplateFolder.findUnique({
      where: {
        eventTemplateFolderId: folderId,
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    const updated = await this.prisma.eventTemplateFolder.update({
      where: {
        eventTemplateFolderId: folderId,
      },
      data: {
        name: data.name,
        color: data.color,
        description: data.description,
        parentFolderId: data.parentFolderId,
      },
      include: {
        _count: {
          select: {
            eventTemplates: true,
            childFolders: true,
          },
        },
      },
    });
    return updated;
  }

  async deleteFolder(
    user: AuthUser,
    folderId: EventTemplateFolder['eventTemplateFolderId'],
  ) {
    const folder = await this.prisma.eventTemplateFolder.findUnique({
      where: {
        eventTemplateFolderId: folderId,
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.eventTemplateFolder.delete({
      where: {
        eventTemplateFolderId: folderId,
      },
    });
  }
}
