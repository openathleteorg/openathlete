import client, { routes } from '@/utils/axios';

import type {
  STORED_FILE_PURPOSE,
  UploadedImageDto,
} from '@openathlete/shared';

export class FilesAPI {
  static async uploadImage({
    image,
    purpose,
    messageThreadId,
  }: {
    image: Blob;
    purpose: STORED_FILE_PURPOSE;
    messageThreadId?: number;
  }): Promise<UploadedImageDto> {
    const form = new FormData();
    form.append('purpose', purpose);
    if (messageThreadId)
      form.append('messageThreadId', String(messageThreadId));
    form.append('file', image, 'image');
    const res = await client.post<UploadedImageDto>(
      routes.files.uploadImage,
      form,
    );
    return res.data;
  }

  /** The image itself: an <img> cannot send the session's token */
  static async getImage(fileId: string): Promise<Blob> {
    const res = await client.get<Blob>(routes.files.get(fileId), {
      responseType: 'blob',
    });
    return res.data;
  }
}
