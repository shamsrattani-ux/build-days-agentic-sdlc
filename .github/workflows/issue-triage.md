---
on:
  issues:
    types: [opened, reopened]
  workflow_dispatch:
    inputs:
      issue:
        description: Issue number to re-triage
        required: true
        type: number

permissions:
  contents: read
  issues: read

engine: copilot

concurrency:
  group: issue-triage-${{ github.event.issue.number || inputs.issue }}
  cancel-in-progress: false
  job-discriminator: ${{ github.run_id }}

tools:
  github:
    toolsets: [context, repos, issues]

network: defaults

safe-outputs:
  add-labels:
    # Type labels reuse the repo's existing vocabulary; priority labels are
    # created on first use. Extend this list if the repo's label taxonomy changes.
    allowed:
      - bug
      - enhancement
      - documentation
      - question
      - "priority: P0"
      - "priority: P1"
      - "priority: P2"
      - "priority: P3"
      - possible-duplicate
      - needs-more-info
    create-if-missing: true
    max: 4
  add-comment:
    max: 1
  assign-to-user:
    max: 1
    # SAFETY ALLOWLIST (placeholders): replace with real GitHub usernames that
    # have write access to this repo before relying on auto-assignment. Until
    # then, assignment attempts will simply fail harmlessly (unknown user).
    allowed:
      - REPLACE_WITH_FRONTEND_OWNER
      - REPLACE_WITH_BACKEND_OWNER
      - REPLACE_WITH_INFRA_OWNER

---

# Issue triage

Triage issue `${{ github.event.issue.number || inputs.issue }}` as a read-only workshop triage analyst. Use the GitHub tools to read the issue, search existing issues, and inspect repository structure (`AGENTS.md`, `DESIGN.md`, `docs/README.md`, `capstone/*/AGENTS.md`) as needed to understand ownership areas. Perform all of the following, then stop:

1. **Classify type.** Add exactly one type label: `bug`, `enhancement`, `documentation`, or `question`, based on the issue's content. If none clearly fits, skip the type label rather than guessing.
2. **Classify priority.** Add exactly one priority label:
   - `priority: P0` — broken build, security issue, data loss, or blocks the whole workshop.
   - `priority: P1` — a major feature or documented workflow is broken.
   - `priority: P2` — a minor bug or a reasonable enhancement request.
   - `priority: P3` — cosmetic, nice-to-have, or low-impact documentation issue.
3. **Detect duplicates.** Search open and recently closed issues for likely duplicates (similar title/body/symptoms). If you find a strong match, add the `possible-duplicate` label and note the matching issue number(s) in your comment. Do not close the issue yourself — a human must confirm and close it.
4. **Check clarity.** If the issue is missing enough detail to act on (no repro steps, no expected/actual behavior, ambiguous ask), add the `needs-more-info` label and ask 1-3 concise clarifying questions in your comment.
5. **Assign ownership.** If, and only if, the issue clearly maps to one of the areas below AND that area's placeholder has been replaced with a real allowed username, assign that user:
   - Frontend / UI / Next.js app code → frontend owner
   - Backend / API / data / storage adapters → backend owner
   - CI/CD, GitHub Actions, infrastructure, deployment → infra owner
   If the mapping is still a placeholder, or the issue doesn't clearly match an area, skip assignment and mention in your comment that it needs manual assignment instead.
6. **Summarize.** Post a single comment (this workflow allows only one) that states: the labels you applied and why, any duplicate match found, any clarifying questions, and who (if anyone) was assigned.

## Guardrails

- Do not close, edit, delete, or merge anything. Do not edit repository files. Do not approve or deploy.
- Only use labels and usernames from the allowlists declared in this workflow's frontmatter — do not invent new labels or assign users outside the allowlist.
- If nothing meaningful can be determined (e.g. spam, empty issue), it is fine to add no labels and post a brief comment saying so rather than guessing.
