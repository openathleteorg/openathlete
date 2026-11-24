// Sends the smoke suite's result to Constellation (POST /api/webhooks/deploy-check).
// Reads the Playwright JSON report; plain Node, so it runs without a build.
import { readFileSync } from 'node:fs';

const { CONSTELLATION_DEPLOY_CHECK_URL: url, DEPLOY_CHECK_TOKEN: token } =
  process.env;
const { TARGET: target, SHA: sha, OUTCOME: outcome, RUN_URL: runUrl } =
  process.env;

if (!url || !token) {
  console.log('No Constellation URL or token: nothing reported.');
  process.exit(0);
}

/** "file › test: first line of the error", for each test that failed for good. */
function failuresOf(report) {
  const failures = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status !== 'unexpected') continue;
        const last = test.results?.at(-1);
        const message = (last?.error?.message ?? last?.status ?? 'failed')
          // Playwright colours its messages for terminals
          .replace(/\u001b\[[0-9;]*m/g, '')
          .split('\n')
          .find((line) => line.trim())
          ?.trim();
        failures.push(`${[...path, spec.title].join(' › ')}: ${message}`);
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child, child.title ? [...path, child.title] : path);
    }
  };
  for (const suite of report.suites ?? []) walk(suite, [suite.title]);
  return failures;
}

let failures = [];
try {
  const report = JSON.parse(
    readFileSync('e2e/smoke/smoke-results/results.json', 'utf8'),
  );
  failures = failuresOf(report);
} catch {
  if (outcome !== 'success') failures = ['The smoke report could not be read'];
}

const status = outcome === 'success' ? 'passed' : 'failed';
const response = await fetch(url, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    scope: 'openathlete',
    target,
    sha,
    status,
    failures: failures.slice(0, 50),
    runUrl,
  }),
});
console.log(`Constellation: ${response.status} ${await response.text()}`);
if (!response.ok) process.exit(1);
