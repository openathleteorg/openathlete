import { describe, expect, it } from 'vitest';

import { fitWithin, imageFiles } from './image-resize';

describe('fitWithin', () => {
  it('shrinks the long side to the limit, keeping the proportions', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 4000)).toEqual({ width: 400, height: 1600 });
  });

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('imageFiles', () => {
  it('keeps only images', () => {
    const png = new File(['x'], 'a.png', { type: 'image/png' });
    const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(imageFiles([png, pdf])).toEqual([png]);
    expect(imageFiles(null)).toEqual([]);
  });
});
