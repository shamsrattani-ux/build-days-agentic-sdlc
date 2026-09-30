# Proposal

## Why

Workshop users currently see every feedback item at once with no way to focus
on a single category. As the board grows during a session, a participant or
facilitator cannot quickly review only `content`, `facilitation`, `tooling`,
or `idea` feedback, which makes triage slower. Issue #1 asks for an optional
category filter so users can narrow the board without losing the full data
set.

## What Changes

- Add an optional `category` query parameter to `GET /api/feedback` that
  restricts the returned items to the requested `FeedbackCategory`, validated
  against the existing `feedbackCategories` enum in
  `src/shared/contracts.ts`.
- Define and share the accepted filter contract (the four existing categories
  plus an `all` value) so client and server validate identically.
- Reject an unsupported category query value with a `400 VALIDATION_ERROR`
  response consistent with the existing `ApiError` shape; do not silently
  normalize it to `all`.
- Add a category filter control to the React board (`src/client/App.tsx`)
  that defaults to `all`, requests the matching subset, shows an accessible
  empty state when a category has no items, and can be cleared back to `all`.
- Filtering is read-only: it must not create, update, delete, or reorder
  stored feedback, and voting/creation behavior is unchanged.

## Capabilities

### New Capabilities

- `feedback-category-filter`: Optional, validated category-based filtering of
  the feedback board across the shared contract, the Express API, and the
  React client, without mutating stored feedback.

### Modified Capabilities

(none — feedback creation, voting, storage, health, and readiness capabilities
are unchanged)

## Impact

- **Shared contracts** (`src/shared/contracts.ts`): add a filter/query schema
  and exported type reusing `feedbackCategories`.
- **API** (`src/server/app.ts`, `src/server/storage.ts`): parse and validate
  the `category` query parameter on `GET /api/feedback`; extend
  `FeedbackStorage.list` (or add a filtered query) so both the in-memory and
  Azure Table adapters honor the filter.
- **Client** (`src/client/App.tsx`, `src/client/api.ts`): add a filter
  control, pass the selected category to the list request, and render the
  empty-category state.
- **Tests** (`tests/contracts.test.ts`, `tests/api.test.ts`,
  `tests/storage.test.ts`, `tests/App.test.tsx`): add coverage for valid
  filtering, the unsupported-category rejection, the empty state, and
  clearing the filter.
- **Docs**: update `docs/features/category-filtering.md` status and link the
  merged change once implemented (documentation only, no behavior change).
- No infrastructure, workflow, authentication, or deployment changes.
