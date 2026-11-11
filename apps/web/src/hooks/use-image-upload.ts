import { useInstanceInfoQuery } from '@/api/instance/instance.hooks';
import { FilesAPI } from '@/api/stored-files';
import { m } from '@/paraglide/messages';
import { prepareImage } from '@/utils/image-resize';
import { isAxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { STORED_FILE_PURPOSE } from '@openathlete/shared';

/**
 * Uploads pictures for a note or a conversation, resized first. `enabled`
 * is false on an instance without storage, where the app offers no images.
 */
export function useImageUpload(
  purpose: STORED_FILE_PURPOSE,
  messageThreadId?: number,
) {
  const { data: instance } = useInstanceInfoQuery();
  const [pending, setPending] = useState(0);

  const upload = useCallback(
    async (files: Blob[]): Promise<string[]> => {
      if (files.length === 0) return [];
      setPending((count) => count + files.length);
      const ids: string[] = [];
      for (const file of files) {
        try {
          const image = await prepareImage(file);
          const { fileId } = await FilesAPI.uploadImage({
            image,
            purpose,
            messageThreadId,
          });
          ids.push(fileId);
        } catch (error) {
          toast.error(
            isAxiosError(error) && error.response?.status === 413
              ? m.image_too_large()
              : m.image_upload_failed(),
          );
        } finally {
          setPending((count) => count - 1);
        }
      }
      return ids;
    },
    [purpose, messageThreadId],
  );

  return {
    enabled: instance?.images === true,
    upload,
    isUploading: pending > 0,
  };
}
