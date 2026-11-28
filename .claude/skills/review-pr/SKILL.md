---
name: review-pr
description: Review an external pull request on openathleteorg/openathlete, test it on top of current main, resolve trivial conflicts, and approve, request changes or merge with a clear, friendly review. Use when asked to look at, answer or land a contributor's PR.
---

# Review a contributor's PR

Reviews are posted under the maintainer's GitHub account, so be precise, kind and concrete. Contributors usually write in English: answer in English.

## 1. Understand it

```bash
gh pr view <n> -R openathleteorg/openathlete --json title,body,author,files,commits,mergeable,maintainerCanModify
gh pr diff <n> -R openathleteorg/openathlete
```

Read the whole diff, not only the description. Check:
- **Scope**: one topic per PR. Is it stacked on another PR?
- **Security**:
  - authorization through CASL;
  - no new unauthenticated endpoint without a rate limit;
  - no secrets, no new third-party calls unless env-gated.
- **Self-hosting**: works without optional env vars, nothing hosted-only enabled by default.
- **Data**: migrations are additive and safe (`prisma-migration` skill), and new foreign keys are covered by account deletion.
- **Repo conventions** (`CLAUDE.md`):
  - every string translated in all eight locales;
  - tests at the right level;
  - nginx `add_header` repeated in new locations.

## 2. Test it on current main

First-time contributors' CI runs wait for approval. Fork workflows get no secrets, so approving them is safe:

```bash
gh run list -R openathleteorg/openathlete --status action_required --json databaseId,headBranch
gh api -X POST repos/openathleteorg/openathlete/actions/runs/<id>/approve
```

Locally:
```bash
git fetch origin pull/<n>/head:pr-<n>
git checkout -B try-<n> main && git merge --no-edit pr-<n>
scripts/verify.sh                 # plus --integration / --e2e as the change requires
```

For UI changes, also run the E2E suite and look at the screens it touches, desktop and mobile (`e2e` skill). Paste concrete evidence in the review: what you ran and what you saw.

## 3. Conflicts

If they are trivial (translation keys added at the end of catalogs by two PRs, imports) and `maintainerCanModify` is true, resolve them yourself:
- merge `main` into the PR branch, without force-pushing;
- explain what you changed in the commit body;
- push to the contributor's fork: `git push git@github.com:<owner>/<repo>.git try-<n>:<branch>`.

Otherwise ask the contributor to rebase.

## 4. Decide

- **Approve and merge** when the checks pass and nothing blocks. Non-blocking remarks go in the review as numbered follow-ups.
  - `--squash` for a single logical change;
  - `--rebase` when the PR has several clean conventional commits.
- **Request changes** with a numbered list. For each item, give the file, the problem, why it matters, and the fix you suggest (with a snippet when useful).
- Larger features or product decisions (new providers, AI providers, unofficial integrations): don't decide alone. Summarize the trade-offs for the maintainer.

```bash
gh pr review <n> -R openathleteorg/openathlete --approve|--request-changes -b "..."
gh pr merge <n> -R openathleteorg/openathlete --squash|--rebase --delete-branch
```

After merging, wait for CI on `main`, then delete the local `pr-<n>` and `try-<n>` branches.
