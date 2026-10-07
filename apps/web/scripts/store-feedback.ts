/**
 * Files store feedback as GitHub issues: screenshots and crash reports sent
 * by TestFlight testers, and Google Play reviews. Runs on a schedule
 * (.github/workflows/store-feedback.yml) and files each item once, keyed by a
 * hidden marker in the issue body.
 *
 * Issues go to STORE_FEEDBACK_REPO, which should be private: screenshots can
 * show a tester's training data. Tester emails and names are never requested
 * or copied.
 *
 *   node scripts/store-feedback.ts [--dry-run]
 */
import { createPrivateKey, sign } from 'node:crypto';

const APP_ID = 'org.openathlete';
const ASC_API = 'https://api.appstoreconnect.apple.com';
const PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const GITHUB_API = 'https://api.github.com';
const LABEL = 'store-feedback';
// A first run would otherwise file the whole history at once
const MAX_NEW_ISSUES_PER_RUN = 20;
// GitHub rejects issue bodies above 65536 characters
const MAX_CRASH_LOG = 50_000;

type Fetch = typeof fetch;

export interface FeedbackIssue {
  key: string;
  createdAt: string;
  title: string;
  body: string;
  labels: string[];
}

// ---------------------------------------------------------------- tokens

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function signJwt(
  header: Record<string, string>,
  payload: Record<string, string | number>,
  privateKeyPem: string,
): string {
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const key = createPrivateKey(privateKeyPem);
  const signature =
    header.alg === 'ES256'
      ? sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' })
      : sign('sha256', Buffer.from(data), key);
  return `${data}.${base64url(signature)}`;
}

/** App Store Connect accepts tokens valid for at most 20 minutes */
export function appStoreConnectToken(
  keyId: string,
  issuerId: string,
  privateKeyPem: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  return signJwt(
    { alg: 'ES256', kid: keyId, typ: 'JWT' },
    {
      iss: issuerId,
      iat: nowSeconds,
      exp: nowSeconds + 15 * 60,
      aud: 'appstoreconnect-v1',
    },
    privateKeyPem,
  );
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export function googleServiceAccountAssertion(
  account: ServiceAccount,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  return signJwt(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: account.token_uri ?? 'https://oauth2.googleapis.com/token',
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    },
    account.private_key,
  );
}

// ---------------------------------------------------------------- formatting

const marker = (key: string) => `<!-- store-feedback:${key} -->`;
const MARKER = /<!-- store-feedback:([^ ]+) -->/g;

export function filedKeys(issueBodies: (string | null)[]): Set<string> {
  const keys = new Set<string>();
  for (const body of issueBodies) {
    for (const match of (body ?? '').matchAll(MARKER)) keys.add(match[1]);
  }
  return keys;
}

function titleFrom(prefix: string, text: string | undefined, empty: string) {
  const firstLine = (text ?? '').trim().split('\n')[0].trim();
  const summary = firstLine || empty;
  const title = `${prefix}: ${summary}`;
  return title.length > 90 ? `${title.slice(0, 89)}…` : title;
}

function quote(text: string | undefined, empty: string): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return `_${empty}_`;
  return trimmed
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function table(rows: [string, string | number | undefined][]): string {
  const filled = rows.filter(
    ([, value]) => value !== undefined && value !== '',
  );
  return [
    '| | |',
    '| --- | --- |',
    ...filled.map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');
}

export interface TestFlightSubmission {
  id: string;
  attributes: {
    createdDate: string;
    comment?: string;
    deviceModel?: string;
    osVersion?: string;
    locale?: string;
    appPlatform?: string;
    screenshots?: { url: string; expirationDate?: string }[];
  };
  relationships?: { build?: { data?: { id: string } | null } };
}

export function testFlightIssue(
  submission: TestFlightSubmission,
  kind: 'screenshot' | 'crash',
  buildVersion?: string,
  crashLog?: string,
): FeedbackIssue {
  const { attributes: a } = submission;
  const crash = kind === 'crash';
  const sections = [
    marker(`testflight-${kind}:${submission.id}`),
    quote(a.comment, 'No comment'),
    table([
      ['Build', buildVersion],
      ['Device', a.deviceModel],
      ['OS', a.osVersion],
      ['Locale', a.locale],
      ['Sent', a.createdDate],
    ]),
  ];
  const screenshots = a.screenshots ?? [];
  if (screenshots.length > 0) {
    const expiry = screenshots[0].expirationDate;
    sections.push(
      [
        `Screenshots${expiry ? ` (links expire ${expiry.slice(0, 10)})` : ''}:`,
        ...screenshots.map((s, i) => `- [Screenshot ${i + 1}](${s.url})`),
      ].join('\n'),
    );
  }
  if (crashLog) {
    const log =
      crashLog.length > MAX_CRASH_LOG
        ? `${crashLog.slice(0, MAX_CRASH_LOG)}\n… (truncated)`
        : crashLog;
    sections.push(
      `<details><summary>Crash log</summary>\n\n\`\`\`\n${log}\n\`\`\`\n\n</details>`,
    );
  }
  return {
    key: `testflight-${kind}:${submission.id}`,
    createdAt: a.createdDate,
    title: titleFrom(
      crash ? 'TestFlight crash' : 'TestFlight',
      a.comment,
      crash ? 'crash without comment' : 'screenshot without comment',
    ),
    body: sections.join('\n\n'),
    labels: crash ? [LABEL, 'ios', 'crash'] : [LABEL, 'ios'],
  };
}

export interface PlayReview {
  reviewId: string;
  comments?: {
    userComment?: {
      text?: string;
      lastModified?: { seconds: string };
      starRating?: number;
      reviewerLanguage?: string;
      device?: string;
      androidOsVersion?: number;
      appVersionName?: string;
    };
  }[];
}

export function playReviewIssue(review: PlayReview): FeedbackIssue | null {
  const comment = review.comments?.find((c) => c.userComment)?.userComment;
  if (!comment) return null;
  const sent = comment.lastModified
    ? new Date(Number(comment.lastModified.seconds) * 1000).toISOString()
    : new Date(0).toISOString();
  const stars = comment.starRating
    ? `${'★'.repeat(comment.starRating)}${'☆'.repeat(5 - comment.starRating)}`
    : undefined;
  return {
    key: `play-review:${review.reviewId}`,
    createdAt: sent,
    title: titleFrom(
      `Play review ${comment.starRating ?? '?'}★`,
      comment.text,
      'no text',
    ),
    body: [
      marker(`play-review:${review.reviewId}`),
      quote(comment.text, 'No text'),
      table([
        ['Rating', stars],
        ['Version', comment.appVersionName],
        ['Device', comment.device],
        ['Android API', comment.androidOsVersion],
        ['Language', comment.reviewerLanguage],
        ['Sent', sent],
      ]),
    ].join('\n\n'),
    labels: [LABEL, 'android'],
  };
}

/** Oldest first, so a capped run leaves the newest for the next one */
export function issuesToFile(
  issues: FeedbackIssue[],
  alreadyFiled: Set<string>,
  limit = MAX_NEW_ISSUES_PER_RUN,
): FeedbackIssue[] {
  return issues
    .filter((issue) => !alreadyFiled.has(issue.key))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

// ---------------------------------------------------------------- stores

async function getJson<T>(
  fetchFn: Fetch,
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetchFn(url, init);
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${url.split('?')[0]} failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

interface AscList<T> {
  data: T[];
  included?: { type: string; id: string; attributes: { version?: string } }[];
}

const SUBMISSION_FIELDS =
  'createdDate,comment,deviceModel,osVersion,locale,appPlatform,build';

export async function fetchTestFlightIssues(
  fetchFn: Fetch,
  token: string,
  alreadyFiled: Set<string>,
): Promise<FeedbackIssue[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const apps = await getJson<AscList<{ id: string }>>(
    fetchFn,
    `${ASC_API}/v1/apps?filter[bundleId]=${APP_ID}&fields[apps]=bundleId`,
    { headers },
  );
  const appId = apps.data[0]?.id;
  if (!appId) throw new Error(`No App Store Connect app for ${APP_ID}`);

  const issues: FeedbackIssue[] = [];
  for (const kind of ['screenshot', 'crash'] as const) {
    const type =
      kind === 'screenshot'
        ? 'betaFeedbackScreenshotSubmissions'
        : 'betaFeedbackCrashSubmissions';
    const fields =
      kind === 'screenshot'
        ? `${SUBMISSION_FIELDS},screenshots`
        : SUBMISSION_FIELDS;
    const list = await getJson<AscList<TestFlightSubmission>>(
      fetchFn,
      `${ASC_API}/v1/apps/${appId}/${type}?sort=-createdDate&limit=50&include=build&fields[${type}]=${fields}&fields[builds]=version`,
      { headers },
    );
    const builds = new Map(
      (list.included ?? [])
        .filter((item) => item.type === 'builds')
        .map((build) => [build.id, build.attributes.version]),
    );
    for (const submission of list.data) {
      if (alreadyFiled.has(`testflight-${kind}:${submission.id}`)) continue;
      const buildId = submission.relationships?.build?.data?.id;
      let crashLog: string | undefined;
      if (kind === 'crash') {
        const log = await getJson<{
          data?: { attributes?: { logText?: string } };
        }>(
          fetchFn,
          `${ASC_API}/v1/betaFeedbackCrashSubmissions/${submission.id}/crashLog`,
          { headers },
        ).catch(() => undefined);
        crashLog = log?.data?.attributes?.logText;
      }
      issues.push(
        testFlightIssue(
          submission,
          kind,
          buildId ? builds.get(buildId) : undefined,
          crashLog,
        ),
      );
    }
  }
  return issues;
}

export async function fetchPlayReviewIssues(
  fetchFn: Fetch,
  account: ServiceAccount,
): Promise<FeedbackIssue[]> {
  const { access_token } = await getJson<{ access_token: string }>(
    fetchFn,
    account.token_uri ?? 'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: googleServiceAccountAssertion(account),
      }),
    },
  );
  // The API only returns reviews of the last week, on the production track
  const { reviews = [] } = await getJson<{ reviews?: PlayReview[] }>(
    fetchFn,
    `${PLAY_API}/applications/${APP_ID}/reviews?maxResults=100`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
  return reviews
    .map(playReviewIssue)
    .filter((issue): issue is FeedbackIssue => issue !== null);
}

// ---------------------------------------------------------------- GitHub

async function fetchFiledKeys(
  fetchFn: Fetch,
  repo: string,
  token: string,
): Promise<Set<string>> {
  const bodies: (string | null)[] = [];
  for (let page = 1; ; page++) {
    const issues = await getJson<{ body: string | null }[]>(
      fetchFn,
      `${GITHUB_API}/repos/${repo}/issues?labels=${LABEL}&state=all&per_page=100&page=${page}`,
      { headers: githubHeaders(token) },
    );
    bodies.push(...issues.map((issue) => issue.body));
    if (issues.length < 100) return filedKeys(bodies);
  }
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = (name: string) => process.env[name]?.trim() || undefined;
  const repo = env('STORE_FEEDBACK_REPO');
  const githubToken = env('STORE_FEEDBACK_TOKEN');
  if (!repo || !githubToken) {
    throw new Error(
      'Set STORE_FEEDBACK_REPO (owner/name) and STORE_FEEDBACK_TOKEN',
    );
  }

  const filed = await fetchFiledKeys(fetch, repo, githubToken);
  const found: FeedbackIssue[] = [];

  const [keyId, issuerId, p8] = [
    env('ASC_KEY_ID'),
    env('ASC_ISSUER_ID'),
    env('ASC_KEY_P8'),
  ];
  if (keyId && issuerId && p8) {
    const token = appStoreConnectToken(keyId, issuerId, p8);
    found.push(...(await fetchTestFlightIssues(fetch, token, filed)));
  } else {
    console.log('App Store Connect key not set: skipping TestFlight');
  }

  const playJson = env('PLAY_SERVICE_ACCOUNT_JSON');
  if (playJson) {
    found.push(
      ...(await fetchPlayReviewIssues(
        fetch,
        JSON.parse(playJson) as ServiceAccount,
      )),
    );
  } else {
    console.log('Google Play service account not set: skipping reviews');
  }

  const toFile = issuesToFile(found, filed);
  console.log(`${found.length} new item(s), filing ${toFile.length}`);
  for (const issue of toFile) {
    if (dryRun) {
      console.log(
        `\n--- ${issue.title} [${issue.labels.join(', ')}]\n${issue.body}`,
      );
      continue;
    }
    const created = await getJson<{ html_url: string }>(
      fetch,
      `${GITHUB_API}/repos/${repo}/issues`,
      {
        method: 'POST',
        headers: githubHeaders(githubToken),
        body: JSON.stringify({
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
        }),
      },
    );
    console.log(`Filed ${created.html_url}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
