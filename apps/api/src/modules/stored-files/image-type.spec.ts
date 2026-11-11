import {
  imageIdsIn,
  imageRef,
  splitImages,
  withImagesAsLabel,
} from '@openathlete/shared';

import { detectImageType } from './image-type';

describe('detectImageType', () => {
  const bytes = (...values: number[]) => Buffer.from(values);

  test('recognizes the image types the app shows', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('image/png');
    expect(detectImageType(Buffer.from('GIF89a'))).toBe('image/gif');
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe(
      'image/webp',
    );
  });

  test('refuses anything else, whatever its name', () => {
    expect(detectImageType(Buffer.from('<svg onload="alert(1)">'))).toBeNull();
    expect(detectImageType(Buffer.from('<html>'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe('image references', () => {
  const id = '0b4f6c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e';

  test('finds the images of a text, once each', () => {
    const text = `Squat:\n${imageRef(id)}\nagain ${imageRef(id)}`;
    expect(imageIdsIn(text)).toEqual([id]);
    expect(splitImages(text)).toEqual([
      { type: 'text', value: 'Squat:\n' },
      { type: 'image', fileId: id },
      { type: 'text', value: '\nagain ' },
      { type: 'image', fileId: id },
    ]);
  });

  test('ignores links and other schemes', () => {
    expect(
      imageIdsIn(`![x](https://example.com/${id}) [y](file:${id})`),
    ).toEqual([]);
  });

  test('scans a text full of unclosed images in linear time', () => {
    const text = '!['.repeat(50_000);
    const start = Date.now();
    expect(imageIdsIn(text)).toEqual([]);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test('shows images as a label where only text fits', () => {
    expect(withImagesAsLabel(`Look ${imageRef(id)}`, '📷')).toBe('Look 📷');
  });
});
