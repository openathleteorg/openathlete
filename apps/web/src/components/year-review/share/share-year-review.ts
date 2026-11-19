import { downloadFile } from '@/utils/csv';

const fileName = (year: number) => `openathlete-${year}.png`;

/**
 * Hands the image to the system's share sheet with a line of text. Without
 * a sheet that takes files (most desktops), it is saved instead.
 * Resolves to what happened, so the story can say it.
 */
export async function shareYearReview(
  image: Blob,
  { year, title, text }: { year: number; title: string; text: string },
): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([image], fileName(year), { type: 'image/png' });
  const data = { files: [file], title, text };
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      // Closing the sheet is a choice, not a failure
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }
  downloadFile(fileName(year), image);
  return 'saved';
}

export function saveYearReviewImage(image: Blob, year: number) {
  downloadFile(fileName(year), image);
}
