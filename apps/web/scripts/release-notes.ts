/**
 * Store release notes ("What's new" on Google Play, "What to test" on
 * TestFlight), written from the conventional commits since the previous tag.
 * Only features and fixes reach testers; chores, docs and refactors don't.
 *
 *   node scripts/release-notes.ts v1.4.2 --max-length 500
 */
import { execFileSync } from 'node:child_process';

const COMMIT = /^(feat|fix)(?:\([^)]*\))?!?: (.+)$/;
const FALLBACK = 'Bug fixes and improvements.';

export function releaseNotes(subjects: string[], maxLength: number): string {
  const features: string[] = [];
  const fixes: string[] = [];
  for (const subject of subjects) {
    const match = COMMIT.exec(subject.trim());
    if (!match) continue;
    const [, type, summary] = match;
    const line = `• ${summary.charAt(0).toUpperCase()}${summary.slice(1)}`;
    (type === 'feat' ? features : fixes).push(line);
  }

  const lines = [...features, ...fixes];
  if (lines.length === 0) return FALLBACK.slice(0, maxLength);

  // Drop whole lines rather than cutting one in the middle
  const more = '• …';
  const kept: string[] = [];
  let length = 0;
  for (const [index, line] of lines.entries()) {
    const isLast = index === lines.length - 1;
    const reserve = isLast ? 0 : more.length + 1;
    const added = (kept.length > 0 ? 1 : 0) + line.length;
    if (length + added + reserve > maxLength) {
      kept.push(more);
      break;
    }
    kept.push(line);
    length += added;
  }
  return kept.join('\n').slice(0, maxLength);
}

function commitSubjectsSince(tag: string): string[] {
  const git = (...args: string[]) =>
    execFileSync('git', args, { encoding: 'utf8' }).trim();
  let previous = '';
  try {
    previous = git('describe', '--tags', '--abbrev=0', `${tag}^`);
  } catch {
    // First tag of the repository: every commit is new
  }
  const range = previous ? `${previous}..${tag}` : tag;
  const log = git('log', '--no-merges', '--format=%s', range);
  return log ? log.split('\n') : [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [tag, flag, value] = process.argv.slice(2);
  const maxLength = flag === '--max-length' ? Number(value) : 4000;
  if (!tag || !Number.isInteger(maxLength) || maxLength < 20) {
    console.error(
      'Usage: node scripts/release-notes.ts <tag> [--max-length <n>]',
    );
    process.exit(2);
  }
  console.log(releaseNotes(commitSubjectsSince(tag), maxLength));
}
