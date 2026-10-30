import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { METRIC_REGISTRY } from '@openathlete/shared';

const docs = readFileSync(
  resolve(
    __dirname,
    '../../../../docs/content/docs/guides/statistics-science.mdx',
  ),
  'utf8',
);

describe('metric registry', () => {
  it('gives every figure a formula and a source', () => {
    for (const [key, metric] of Object.entries(METRIC_REGISTRY)) {
      expect(metric.formula, key).not.toBe('');
      expect(metric.sources.length, key).toBeGreaterThan(0);
    }
  });

  it('matches the public page: run scripts/generate-metric-docs.mjs', () => {
    for (const metric of Object.values(METRIC_REGISTRY)) {
      expect(docs).toContain(metric.formula);
    }
  });
});
