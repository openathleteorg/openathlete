import { describe, expect, it } from 'vitest';

import config from '../capacitor.config';
import packageJson from '../package.json';

// Capacitor's runtime and tooling, not plugins
const NOT_PLUGINS = new Set([
  '@capacitor/android',
  '@capacitor/cli',
  '@capacitor/core',
  '@capacitor/ios',
]);
const IOS_ONLY = new Set(['@capgo/native-purchases']);

describe('capacitor.config', () => {
  it('builds every plugin into the Android app but the App Store one', () => {
    const plugins = Object.keys(packageJson.dependencies).filter(
      (name) =>
        !NOT_PLUGINS.has(name) &&
        (/^@capacitor(-[a-z]+)?\//.test(name) ||
          name.startsWith('@capgo/') ||
          name.startsWith('capacitor-')),
    );

    expect([...(config.android?.includePlugins ?? [])].sort()).toEqual(
      plugins.filter((name) => !IOS_ONLY.has(name)).sort(),
    );
  });
});
