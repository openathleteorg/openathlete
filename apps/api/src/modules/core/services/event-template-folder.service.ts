import { BadRequestException, Injectable } from '@nestjs/common';

import { EventTemplateFolder } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  libraryWhere,
  requireLibrary,
  requireLibraryItem,
} from '../helpers/template-library';

@Injectable()
export class EventTemplateFolderService {
  constructor(private readonly prisma: PrismaService) {}

  /** A parent folder of the same library, or a 400 */
  private async assertParentIn(
    parentFolderId: number | null | undefined,
    userId: number,
    clubId: number | null,
  ) {
    if (parentFolderId === null || parentFolderId === undefined) return;
    const parent = await this.prisma.eventTemplateFolder.findFirst({
      where: {
        eventTemplateFolderId: parentFolderId,
        ...libraryWhere(userId, clubId),
      },
      select: { eventTemplateFolderId: true },
    });
    if (!parent) {
      throw new BadRequestException('The folder is not in this library');
    }
  }

  async getMyFolders(user: AuthUser, clubId: number | null = null) {
    await requireLibrary(this.prisma, user.userId, clubId, 'use');
    const folders = await this.prisma.eventTemplateFolder.findMany({
      where: libraryWhere(user.userId, clubId),
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
      clubId?: number | null;
    },
  ) {
    const clubId = data.clubId ?? null;
    await requireLibrary(this.prisma, user.userId, clubId, 'edit');
    await this.assertParentIn(data.parentFolderId, user.userId, clubId);
    const folder = await this.prisma.eventTemplateFolder.create({
      data: {
        userId: user.userId,
        clubId,
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

    await requireLibraryItem(
      this.prisma,
      user.userId,
      folder,
      'edit',
      'Folder',
    );
    await this.assertParentIn(
      data.parentFolderId,
      folder!.userId,
      folder!.clubId,
    );

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

    await requireLibraryItem(
      this.prisma,
      user.userId,
      folder,
      'edit',
      'Folder',
    );

    await this.prisma.eventTemplateFolder.delete({
      where: {
        eventTemplateFolderId: folderId,
      },
    });
  }
}
