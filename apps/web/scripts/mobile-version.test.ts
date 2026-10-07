import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { mobileVersionFromTag } from './mobile-version';

describe('mobileVersionFromTag', () => {
  it('versions a stable release', () => {
    expect(mobileVersionFromTag('v1.4.2')).toEqual({
      versionName: '1.4.2',
      marketingVersion: '1.4.2',
      buildNumber: 10_400_299,
      prerelease: false,
    });
  });

  it('keeps the pre-release label for Android only', () => {
    expect(mobileVersionFromTag('v1.4.2-rc.3')).toEqual({
      versionName: '1.4.2-rc.3',
      marketingVersion: '1.4.2',
      buildNumber: 10_400_203,
      prerelease: true,
    });
  });

  it('orders build numbers like the releases they come from', () => {
    const tags = [
      'v1.1.0',
      'v1.1.1-beta.1',
      'v1.1.1-rc.2',
      'v1.1.1',
      'v1.2.0-rc.1',
      'v1.2.0',
      'v1.10.0',
      'v2.0.0',
    ];
    const numbers = tags.map((tag) => mobileVersionFromTag(tag).buildNumber);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(tags.length);
  });

  it('stays above the version codes uploaded by hand before the pipeline', () => {
    expect(mobileVersionFromTag('v0.0.0-rc.1').buildNumber).toBeLessThan(4);
    expect(mobileVersionFromTag('v1.0.0').buildNumber).toBeGreaterThan(3);
  });

  it.each([
    ['1.2.3', 'expected vX.Y.Z'],
    ['v1.2', 'expected vX.Y.Z'],
    ['v1.2.3-rc', 'expected vX.Y.Z'],
    ['v1.2.3-rc.1.2', 'expected vX.Y.Z'],
    ['v1.2.3-rc.0', 'between 1 and 98'],
    ['v1.2.3-rc.99', 'between 1 and 98'],
    ['v1.100.0', 'minor must be at most 99'],
    ['v1.0.1000', 'patch at most 999'],
    ['v211.0.0', "Google Play's limit"],
  ])('rejects %s', (tag, message) => {
    expect(() => mobileVersionFromTag(tag)).toThrow(message);
  });

  it('prints the version as JSON from the command line', () => {
    const script = fileURLToPath(
      new URL('./mobile-version.ts', import.meta.url),
    );
    const output = execFileSync(process.execPath, [script, 'v1.4.2-rc.3'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    expect(JSON.parse(output)).toMatchObject({ buildNumber: 10_400_203 });
  });
});
