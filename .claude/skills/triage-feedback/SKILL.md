---
name: triage-feedback
description: Gather OpenAthlete user feedback from GitHub (issues, PRs, discussions) and the local Discord export, deduplicate it, prioritize it, and draft replies. Use when asked what users want, what to work on next, or to answer the community.
---

# Triage community feedback

## Sources

- **GitHub**:
  ```bash
  R=openathleteorg/openathlete
  gh issue list -R $R --state open --json number,title,author,createdAt,comments,labels
  gh pr list -R $R --json number,title,author,createdAt
  gh api graphql -f query='{repository(owner:"openathleteorg",name:"openathlete"){discussions(first:20,orderBy:{field:UPDATED_AT,direction:DESC}){nodes{number title author{login} updatedAt comments{totalCount}}}}}'
  ```
  For each item with activity, read the body and the last comments.
- **Discord**: `DISCORD_FEEDBACK.md` at the repository root. It is a local export, kept out of git through `.git/info/exclude`, and must never be committed or quoted publicly. Check its "Extrait le" date; if it is old, ask the maintainer for a fresh export.
- **Production errors**: when the PostHog MCP is connected to the OpenAthlete project, look in Error Tracking for errors matching the reports.

## Triage

1. Group duplicates across sources, for example a Garmin sync question asked on Discord and in an issue.
2. Check each item against the code and `git log`. It may already be fixed: then the right action is a reply, not work.
3. Classify each item:
   - type: bug, docs, feature, question;
   - severity: data loss, security or legal first, then broken core flows (login, sync, calendar), then the rest;
   - reach: how many people asked.
4. Note who is waiting for an answer and since when. Unanswered people come first, whatever the topic.

## Output

- A prioritized table: item, type, severity, sources with dates, status (fixed in `<sha>` / to do / needs a decision).
- Draft replies, ready to paste. Use the user's language on Discord and English on GitHub. Be short and specific: what was done, what to do now, or a question.
- Proposed GitHub issues for confirmed bugs and accepted features, with reproduction steps and acceptance criteria. Show them to the maintainer before creating them.
