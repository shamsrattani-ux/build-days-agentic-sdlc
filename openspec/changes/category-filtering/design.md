# Design

## Context

See `proposal.md` - Why/What Changes for motivation and scope. Relevant
current state:

- `src/shared/contracts.ts` exports `feedbackCategories` and derives
  `FeedbackCategory`; both client and server already import from here.
- `GET /api/feedback` (`src/server/app.ts`) calls `storage.list()` with no
  arguments and returns every item; `FeedbackStorage` (`src/server/storage.ts`)
  has two implementations: `InMemoryFeedbackStorage` (tests, local dev) and
  `AzureTableFeedbackStorage` (deployed, partitioned by feedback id with
  `rowKey: "feedback"`).
- `src/client/App.tsx` already renders a `loading` / `loadFailed` / empty /
  populated state machine for the board and a category `<select>` in the
  create-feedback form, so a filter control and a new empty-state branch can
  follow established patterns instead of new ones.

## Goals / Non-Goals

**Goals:**
- Validate the category filter once, in the shared contract, so the API and
  client cannot disagree on accepted values.
- Keep filtering a pure read: never touch `create`/`vote` storage paths.
- Make both storage adapters honor the same filter contract so tests against
  `InMemoryFeedbackStorage` are representative of the deployed Azure adapter.

**Non-Goals:**
- Multiple simultaneous categories, saved/user preferences, or full-text
  search (excluded by the proposal).
- Any change to vote counting, creation, health, or readiness behavior.
- Any infrastructure or workflow change.

## Decisions

- **Filter contract lives in `src/shared/contracts.ts`.** Add a
  `feedbackListQuerySchema` (`z.object({ category: z.enum([...feedbackCategories, "all"]).default("all") })`)
  and export `FeedbackListQuery`. Alternative considered: validate only on the
  client. Rejected because the API must independently reject invalid values
  per the brief's required scenario, and duplicating the enum risks drift.
- **Validate the query on the server with a small query-schema parser**,
  mirrored after the existing `validateBody` helper in `src/server/app.ts`,
  returning the same `VALIDATION_ERROR` `ApiError` shape used by
  `POST /api/feedback`. Alternative considered: silently coerce an unknown
  category to `all`. Rejected because the brief requires rejection (or a
  documented normalization), and silent coercion hides client bugs.
- **Filtering happens in the storage layer, not only in the Express route.**
  Extend `FeedbackStorage.list` to accept an optional
  `{ category?: FeedbackCategory }` and have each adapter apply it:
  `InMemoryFeedbackStorage` filters the in-memory array before sorting;
  `AzureTableFeedbackStorage` adds an `and category eq '<value>'` clause to
  its existing `odata` filter. Alternative considered: fetch all items in the
  route handler and filter in memory. Rejected for the Azure adapter because
  it would transfer and discard rows unnecessarily and would let the two
  adapters diverge in behavior; pushing the filter into the interface keeps
  both adapters exercised by the same contract tests.
- **`category` is an optional query string; omitting it or passing `all`
  are equivalent and both return everything.** This keeps
  `GET /api/feedback` backward compatible for any existing caller.
- **The agreed `FeedbackStorage.list` signature is
  `list(options?: { category?: FeedbackCategory }): Promise<Feedback[]>`,
  fixed here rather than left to whichever task implements it first.**
  Because the signature is decided in this document, the storage-layer task
  (implementing the filter in both adapters) and the Express route task
  (calling `storage.list({ category })`) can be implemented independently
  against this agreed contract instead of one task depending on the other's
  code landing first.
- **Client keeps the selected category in a URL search param
  (`?category=<value>`)** read on mount and written on change, using the
  browser History API the same way `localStorage` is already used for the
  client id. Alternative considered: component-local state only. Rejected
  because a shareable/refreshable filter is a small, low-risk improvement
  consistent with "the board keeps the selected filter visible" in the brief,
  and avoids adding a new persistence mechanism.
- **The filter control is the same native `<select>` pattern already used
  for the create-feedback category field in `App.tsx`**, not a custom
  button/radio widget. Alternative considered: a segmented button group for
  a more prominent visual affordance. Rejected because a native `<select>`
  gets keyboard operability and assistive-technology name/value exposure for
  free from the browser, matching this repository's existing pattern instead
  of introducing custom ARIA widget behavior that would need its own
  accessibility testing.
- **Category matching is case-sensitive and exact, with no trimming or
  normalization**, consistent with how `createFeedbackSchema.category`
  already validates via `z.enum(feedbackCategories)` with no transform.
  Alternative considered: case-insensitive matching for a more forgiving API.
  Rejected to keep filter validation identical in strictness to existing
  category validation, and because the only caller is this repository's own
  client, which always sends an exact enum value.
- **An invalid `category` value found in the client's own URL is normalized
  to `all` locally, before any request is sent, and the URL is corrected
  with `history.replaceState`.** It is never forwarded to the API as-is.
  Alternative considered: treat it the same as a failed API load (show the
  existing `loadFailed` error state). Rejected because the user did not
  cause this condition (a stale/mistyped bookmark or shared link) and
  showing them an unrelated "feedback is unavailable" error would be
  misleading; recovering to the full board is safer and matches the
  proposal's goal of never losing the current data set.
- **Empty-category state reuses the existing `.state` block pattern** in
  `App.tsx` (the same element used for `loadFailed` and "no feedback yet"),
  with category-specific copy that is explicitly distinct from the
  no-feedback-at-all copy, rather than introducing a new state component.
- **The existing item-count `<span className="count">` becomes the
  live-updating region for the filtered count** (reusing/extending its
  existing `aria-live` behavior) instead of adding a second live region.
  Alternative considered: a brand-new `aria-live` announcement element.
  Rejected as duplicative when the board already renders a count element in
  the same location.
- **The Azure Table filter clause is built with the existing `odata` tagged
  template used elsewhere in `storage.ts` (e.g., for the `rowKey` filter),
  not string concatenation**, so the new clause gets the same escaping
  behavior as the rest of the file even though the value is enum-constrained.

No durable, system-wide architecture changes result from this design; root
`DESIGN.md` is unaffected because the storage interface change is an additive
method-signature extension consistent with its documented dependency
direction (UI/transport → shared contracts, API → storage interface).

## Risks / Trade-offs

- [Divergence between in-memory and Azure filter semantics] → Mitigation:
  both adapters are covered by the same `tests/storage.test.ts` contract
  suite, including a mocked-`TableClient` assertion that the Azure adapter's
  `odata` filter clause is actually constructed, and `tests/api.test.ts`
  exercises the route against the in-memory adapter for all required
  scenarios.
- [A shared-signature mismatch between the route and storage tasks] →
  Mitigation: the `FeedbackStorage.list` signature is fixed in this document
  (see Decisions) rather than decided ad hoc by either task.

## Migration Plan

Purely additive: no schema, data, or infrastructure migration. Deploying the
change is a normal application release; rollback is redeploying the prior
build since the `category` query parameter is optional and no stored data
shape changes. Deployed demonstration evidence is gated on the team's deploy
pipeline already being confirmed active (per root `DESIGN.md`, which treats
an unconfirmed workflow as not yet active); the specification pull request
relies on local test and build evidence, and a deployed demonstration is
added once that pipeline exists rather than reported prematurely.
