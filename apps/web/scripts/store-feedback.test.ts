import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  type FeedbackIssue,
  type TestFlightSubmission,
  appStoreConnectToken,
  fetchPlayReviewIssues,
  fetchTestFlightIssues,
  filedKeys,
  googleServiceAccountAssertion,
  issuesToFile,
  playReviewIssue,
  testFlightIssue,
} from './store-feedback';

function decode(token: string) {
  const [header, payload, signature] = token.split('.');
  return {
    header: JSON.parse(Buffer.from(header, 'base64url').toString()),
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
    data: Buffer.from(`${header}.${payload}`),
    signature: Buffer.from(signature, 'base64url'),
  };
}

const screenshot: TestFlightSubmission = {
  id: 'shot-1',
  attributes: {
    createdDate: '2026-10-01T08:00:00Z',
    comment: 'The calendar overflows on my phone\nSee the right edge',
    deviceModel: 'iPhone17,1',
    osVersion: '27.0',
    locale: 'fr-FR',
    screenshots: [
      {
        url: 'https://example.com/1.png',
        expirationDate: '2026-10-08T08:00:00Z',
      },
    ],
  },
  relationships: { build: { data: { id: 'build-1' } } },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe('tokens', () => {
  it('signs App Store Connect tokens with ES256', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const token = decode(appStoreConnectToken('KEY123', 'issuer-1', pem, 1000));

    expect(token.header).toEqual({ alg: 'ES256', kid: 'KEY123', typ: 'JWT' });
    expect(token.payload).toEqual({
      iss: 'issuer-1',
      iat: 1000,
      exp: 1900,
      aud: 'appstoreconnect-v1',
    });
    expect(
      verify(
        'sha256',
        token.data,
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        token.signature,
      ),
    ).toBe(true);
  });

  it('signs Google service account assertions with RS256', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const token = decode(
      googleServiceAccountAssertion(
        {
          client_email: 'ci@project.iam.gserviceaccount.com',
          private_key: pem,
        },
        1000,
      ),
    );

    expect(token.header.alg).toBe('RS256');
    expect(token.payload).toMatchObject({
      iss: 'ci@project.iam.gserviceaccount.com',
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: 4600,
    });
    expect(verify('sha256', token.data, publicKey, token.signature)).toBe(true);
  });
});

describe('testFlightIssue', () => {
  it('turns a screenshot into an issue titled after the comment', () => {
    const issue = testFlightIssue(screenshot, 'screenshot', '10400299');

    expect(issue.key).toBe('testflight-screenshot:shot-1');
    expect(issue.title).toBe('TestFlight: The calendar overflows on my phone');
    expect(issue.labels).toEqual(['store-feedback', 'ios']);
    expect(issue.body).toContain(
      '<!-- store-feedback:testflight-screenshot:shot-1 -->',
    );
    expect(issue.body).toContain('> See the right edge');
    expect(issue.body).toContain('| Build | 10400299 |');
    expect(issue.body).toContain('[Screenshot 1](https://example.com/1.png)');
    expect(issue.body).toContain('links expire 2026-10-08');
  });

  it('never copies tester identity, even when the API returns it', () => {
    const withIdentity = {
      ...screenshot,
      attributes: { ...screenshot.attributes, email: 'tester@example.com' },
    } as TestFlightSubmission;
    const issue = testFlightIssue(withIdentity, 'screenshot');
    expect(JSON.stringify(issue)).not.toContain('tester@example.com');
  });

  it('attaches crash logs, truncated to fit an issue', () => {
    const issue = testFlightIssue(
      { id: 'crash-1', attributes: { createdDate: '2026-10-01T08:00:00Z' } },
      'crash',
      undefined,
      'x'.repeat(60_000),
    );

    expect(issue.title).toBe('TestFlight crash: crash without comment');
    expect(issue.labels).toEqual(['store-feedback', 'ios', 'crash']);
    expect(issue.body).toContain('… (truncated)');
    expect(issue.body.length).toBeLessThan(65_536);
  });

  it('shortens long titles', () => {
    const issue = testFlightIssue(
      { id: 'a', attributes: { createdDate: '', comment: 'word '.repeat(50) } },
      'screenshot',
    );
    expect(issue.title.length).toBe(90);
    expect(issue.title.endsWith('…')).toBe(true);
  });
});

describe('playReviewIssue', () => {
  it('turns a review into an issue without the author name', () => {
    const issue = playReviewIssue({
      reviewId: 'r1',
      authorName: 'Jane Runner',
      comments: [
        {
          userComment: {
            text: 'Sync with Garmin is slow',
            lastModified: { seconds: '1790000000' },
            starRating: 3,
            appVersionName: '1.4.2',
            device: 'panther',
            androidOsVersion: 36,
          },
        },
      ],
    } as Parameters<typeof playReviewIssue>[0]);

    expect(issue).toMatchObject({
      key: 'play-review:r1',
      title: 'Play review 3★: Sync with Garmin is slow',
      labels: ['store-feedback', 'android'],
    });
    expect(issue?.body).toContain('| Rating | ★★★☆☆ |');
    expect(issue?.body).toContain('| Version | 1.4.2 |');
    expect(JSON.stringify(issue)).not.toContain('Jane');
  });

  it('skips reviews without a user comment', () => {
    expect(playReviewIssue({ reviewId: 'r2', comments: [] })).toBeNull();
  });
});

describe('deduplication', () => {
  const issue = (key: string, createdAt: string): FeedbackIssue => ({
    key,
    createdAt,
    title: key,
    body: '',
    labels: [],
  });

  it('reads the keys of issues already filed', () => {
    expect(
      filedKeys([
        '<!-- store-feedback:testflight-screenshot:a -->\n\nText',
        null,
        'No marker',
        '<!-- store-feedback:play-review:b -->',
      ]),
    ).toEqual(new Set(['testflight-screenshot:a', 'play-review:b']));
  });

  it('files new items oldest first, up to the limit', () => {
    const toFile = issuesToFile(
      [
        issue('c', '2026-10-03'),
        issue('a', '2026-10-01'),
        issue('b', '2026-10-02'),
        issue('d', '2026-10-04'),
      ],
      new Set(['a']),
      2,
    );
    expect(toFile.map((i) => i.key)).toEqual(['b', 'c']);
  });
});

describe('fetchTestFlightIssues', () => {
  it('reads both feedback kinds without requesting tester emails', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) => {
      const path = String(url);
      if (path.includes('/v1/apps?'))
        return jsonResponse({ data: [{ id: 'app-1' }] });
      if (path.includes('betaFeedbackScreenshotSubmissions?')) {
        return jsonResponse({
          data: [screenshot, { ...screenshot, id: 'shot-old' }],
          included: [
            {
              type: 'builds',
              id: 'build-1',
              attributes: { version: '10400299' },
            },
          ],
        });
      }
      if (path.includes('betaFeedbackCrashSubmissions?')) {
        return jsonResponse({
          data: [
            {
              id: 'crash-1',
              attributes: { createdDate: '2026-10-02T00:00:00Z' },
            },
          ],
        });
      }
      if (path.endsWith('/crashLog')) {
        return jsonResponse({
          data: { attributes: { logText: 'Thread 0 crashed' } },
        });
      }
      return jsonResponse({}, 404);
    });

    const issues = await fetchTestFlightIssues(
      fetchFn as unknown as typeof fetch,
      'token',
      new Set(['testflight-screenshot:shot-old']),
    );

    expect(issues.map((i) => i.key)).toEqual([
      'testflight-screenshot:shot-1',
      'testflight-crash:crash-1',
    ]);
    expect(issues[0].body).toContain('| Build | 10400299 |');
    expect(issues[1].body).toContain('Thread 0 crashed');
    for (const [url, init] of fetchFn.mock.calls as unknown as [
      string,
      RequestInit,
    ][]) {
      expect(url).not.toContain('email');
      expect(init.headers).toEqual({ Authorization: 'Bearer token' });
    }
  });

  it('reports API errors with their status', async () => {
    const fetchFn = async () => new Response('Unauthorized', { status: 401 });
    await expect(
      fetchTestFlightIssues(
        fetchFn as unknown as typeof fetch,
        'bad',
        new Set(),
      ),
    ).rejects.toThrow('failed: 401 Unauthorized');
  });
});

describe('fetchPlayReviewIssues', () => {
  it('exchanges the service account for a token, then reads reviews', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const fetchFn = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        if (String(url) === 'https://oauth2.googleapis.com/token') {
          expect(String(init?.body)).toContain('grant_type=urn');
          return jsonResponse({ access_token: 'play-token' });
        }
        expect(init?.headers).toEqual({ Authorization: 'Bearer play-token' });
        return jsonResponse({
          reviews: [
            {
              reviewId: 'r1',
              comments: [{ userComment: { text: 'Great', starRating: 5 } }],
            },
          ],
        });
      },
    );

    const issues = await fetchPlayReviewIssues(
      fetchFn as unknown as typeof fetch,
      {
        client_email: 'ci@project.iam.gserviceaccount.com',
        private_key: pem,
      },
    );

    expect(issues.map((i) => i.title)).toEqual(['Play review 5★: Great']);
    expect(String(fetchFn.mock.calls[1][0])).toContain(
      '/applications/org.openathlete/reviews',
    );
  });
});
