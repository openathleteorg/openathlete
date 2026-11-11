import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { FilesAPI } from './files.api';

/** A stored image as a URL for <img>, released when no longer shown */
export function useImageUrl(fileId: string) {
  const { data: blob, isError } = useQuery({
    queryKey: ['FilesAPI.getImage', fileId],
    queryFn: () => FilesAPI.getImage(fileId),
    // An id always names the same image
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return { url, isError };
}
