/**
 * Store versions of the iOS and Android apps, derived from the release tag so
 * that pushing vX.Y.Z is the only step that versions a mobile build.
 *
 * Both stores need a build number that only ever grows. It is computed from
 * the tag rather than counted, so re-running a release gives the same number
 * and a pre-release always sorts before its stable version:
 *
 *   v1.4.2-rc.3  ->  1·10⁷ + 4·10⁵ + 2·10² + 3   = 10400203
 *   v1.4.2       ->  1·10⁷ + 4·10⁵ + 2·10² + 99  = 10400299
 *
 *   node scripts/mobile-version.ts v1.4.2-rc.3
 */

export interface MobileVersion {
  /** Android versionName: the tag without its leading "v" */
  versionName: string;
  /** iOS CFBundleShortVersionString, which only accepts X.Y.Z */
  marketingVersion: string;
  /** Android versionCode and iOS CFBundleVersion */
  buildNumber: number;
  prerelease: boolean;
}

const TAG = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z]+)\.(\d+))?$/;

const STABLE_SLOT = 99;
// Google Play refuses version codes above 2100000000
const MAX_BUILD_NUMBER = 2_100_000_000;

export function mobileVersionFromTag(tag: string): MobileVersion {
  const match = TAG.exec(tag);
  if (!match) {
    throw new Error(
      `Cannot version the mobile apps from "${tag}": expected vX.Y.Z or vX.Y.Z-label.N (e.g. v1.4.2-rc.3)`,
    );
  }

  const [, majorText, minorText, patchText, label, numberText] = match;
  const major = Number(majorText);
  const minor = Number(minorText);
  const patch = Number(patchText);
  const prerelease = label !== undefined;
  const slot = prerelease ? Number(numberText) : STABLE_SLOT;

  if (minor > 99 || patch > 999) {
    throw new Error(
      `Cannot version the mobile apps from "${tag}": minor must be at most 99 and patch at most 999`,
    );
  }
  if (prerelease && (slot < 1 || slot >= STABLE_SLOT)) {
    throw new Error(
      `Cannot version the mobile apps from "${tag}": the pre-release number must be between 1 and ${STABLE_SLOT - 1}`,
    );
  }

  const buildNumber = major * 10_000_000 + minor * 100_000 + patch * 100 + slot;
  if (buildNumber > MAX_BUILD_NUMBER) {
    throw new Error(
      `Cannot version the mobile apps from "${tag}": the build number would exceed Google Play's limit`,
    );
  }

  return {
    versionName: tag.slice(1),
    marketingVersion: `${major}.${minor}.${patch}`,
    buildNumber,
    prerelease,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tag = process.argv[2];
  if (!tag) {
    console.error('Usage: node scripts/mobile-version.ts <tag>');
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(mobileVersionFromTag(tag)));
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
