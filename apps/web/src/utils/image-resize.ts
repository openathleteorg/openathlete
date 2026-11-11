import { IMAGE_MAX_BYTES } from '@openathlete/shared';

/** Long side of a stored image: sharp on a phone, light to send */
export const IMAGE_MAX_SIDE = 1600;

/** The size an image is drawn at, its long side at most `max` */
export function fitWithin(
  width: number,
  height: number,
  max = IMAGE_MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Makes a picture light enough to store: at most IMAGE_MAX_SIDE pixels on
 * its long side, as JPEG. A small GIF is kept as is, to keep its animation.
 */
export async function prepareImage(file: Blob): Promise<Blob> {
  if (file.type === 'image/gif' && file.size <= IMAGE_MAX_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas');
  // JPEG has no transparency: a white background instead of black
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      'image/jpeg',
      0.85,
    ),
  );
}

/** The image files among pasted or dropped data */
export function imageFiles(files: FileList | File[] | null | undefined) {
  return Array.from(files ?? []).filter((file) =>
    file.type.startsWith('image/'),
  );
}
