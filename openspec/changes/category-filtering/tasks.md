# Tasks

## 1. Shared category filter contract

_Primary paths: `src/shared/contracts.ts`, `tests/contracts.test.ts`. Must
land first — every other group imports this schema/type._

- [ ] 1.1 Add `feedbackListQuerySchema` (accepting the existing
      `feedbackCategories` values plus `"all"`, defaulting to `"all"`) and an
      exported `FeedbackListQuery` type to `src/shared/contracts.ts`, per
      `design.md` Decisions.
- [ ] 1.2 Add unit tests in `tests/contracts.test.ts` proving: a missing
      category parses to `all`; each existing category parses unchanged; an
      unsupported string fails validation. Verify with
      `npx vitest run tests/contracts.test.ts` (covers spec scenario
      "Unsupported category value rejected" at the contract layer).

## 2. Storage-layer category filtering

_Primary paths: `src/server/storage.ts`, `tests/storage.test.ts`. Depends on
Group 1's type only. Codes against the `FeedbackStorage.list` signature fixed
in `design.md` Decisions, so this can proceed independently of Group 3._

- [ ] 2.1 Extend the `FeedbackStorage` interface's `list` method to the
      `design.md`-fixed signature
      `list(options?: { category?: FeedbackCategory }): Promise<Feedback[]>`,
      and implement it in `InMemoryFeedbackStorage` (filter before the
      existing sort).
- [ ] 2.2 Implement the same filter in `AzureTableFeedbackStorage.list` using
      the existing `odata` tagged template (not string concatenation) to add
      an `and category eq ${value}` clause to the existing filter, per
      `design.md` Decisions.
- [ ] 2.3 Add/extend `tests/storage.test.ts` cases against
      `InMemoryFeedbackStorage` for: no filter/`all` returns every item; a
      valid category returns only matching items; a category with no
      matches returns an empty array; `create`/`vote` behavior and returned
      data are unchanged by the new parameter. Verify with
      `npx vitest run tests/storage.test.ts` (covers spec scenarios "All
      categories selected", "A single category selected", and the read-only
      guarantee).
- [ ] 2.4 Add a mocked-`TableClient` case in `tests/storage.test.ts`
      (matching the existing "Azure Table feedback storage" describe block
      pattern) asserting that `AzureTableFeedbackStorage.list` constructs an
      `odata` filter clause containing the requested category. Verify with
      `npx vitest run tests/storage.test.ts`.

## 3. Express API query handling

_Primary paths: `src/server/app.ts`, `tests/api.test.ts`. Depends on Group
1's schema and the `FeedbackStorage.list` signature fixed in `design.md`
Decisions; does not require Group 2's implementation to land first._

- [ ] 3.1 Parse and validate `GET /api/feedback`'s `category` query parameter
      with `feedbackListQuerySchema`, returning the existing
      `VALIDATION_ERROR` `ApiError` shape (matching the `validateBody`
      pattern) on failure, and pass the validated filter to `storage.list`.
      On a storage failure, return the same error response used for an
      unfiltered request under the same failure (no partial/filtered data).
- [ ] 3.2 Add/extend `tests/api.test.ts` cases for: `GET /api/feedback` with
      no query and with `?category=all` both return every seeded item;
      `?category=<valid>` returns only matching items; `?category=<invalid>`
      returns `400` with `VALIDATION_ERROR` and does not change the list
      returned by a subsequent unfiltered request; requesting with a filter
      then without one restores the full list (clearing); a storage failure
      with a valid category filter returns the same error response as an
      unfiltered request under the same failure. Verify with
      `npx vitest run tests/api.test.ts` (covers spec scenarios "All
      categories selected", "A single category selected", "Filter cleared
      after selection", "Unsupported category value rejected", and "A
      storage failure occurs while a category filter is applied").
- [ ] 3.3 Add a regression case in `tests/api.test.ts` confirming
      `POST /api/feedback` and `POST /api/feedback/:id/votes` are unaffected
      by the new query handling. Verify with the same
      `npx vitest run tests/api.test.ts` run.

## 4. React category filter control

_Primary paths: `src/client/App.tsx`, `src/client/api.ts`,
`tests/App.test.tsx`. Depends on Group 1's type only; can run in parallel
with Groups 2 and 3._

- [ ] 4.1 Update `listFeedback` in `src/client/api.ts` to accept an optional
      category and append it as a `category` query parameter.
- [ ] 4.2 Add a category filter control to `src/client/App.tsx` as a native
      `<select>` (matching the existing create-feedback category control's
      pattern per `design.md` Decisions), defaulting to "All categories",
      reading/writing the `category` URL search parameter, and re-requesting
      the list on change. If the URL's category value is not one of the
      existing categories or `all`, treat it as `all` locally (do not send it
      to the API or show a load-failure state) and correct the URL with
      `history.replaceState`.
- [ ] 4.3 Add two distinct accessible empty states in `App.tsx`: one for
      "selected category has no items" (names the category) and the existing
      "no feedback yet" state for zero feedback overall, each visibly
      distinct from the loading and load-failed states. Restore the full
      list when the filter is cleared back to "all".
- [ ] 4.4 Extend the existing item-count `<span className="count">` element
      to reflect the currently filtered count through its existing
      live-updating behavior, so a category change announces the new count
      to assistive technology without adding a second live region.
- [ ] 4.5 Add/extend `tests/App.test.tsx` cases for: default view shows all
      seeded items; selecting a category (via keyboard, using
      `@testing-library/user-event`) shows only matching items, updates the
      visible selection, and updates the announced count; selecting a
      category with no items shows the category-specific empty state
      (distinct from the "no feedback yet" state); clearing the filter
      restores the full list; loading with an unsupported category value in
      the URL falls back to the unfiltered view instead of a load failure.
      Verify with `npx vitest run tests/App.test.tsx` (covers spec scenarios
      "Selected category has no items", "No feedback exists in any
      category", "Selecting a category via keyboard", "Item count is
      announced after filtering", and "Page loads with an unsupported
      category in the URL").

## 5. Evidence and documentation

_Primary paths: `docs/features/category-filtering.md`, pull request body.
Depends on Groups 1-4 being complete._

- [ ] 5.1 Update `docs/features/category-filtering.md` to reference the
      completed OpenSpec change and merged pull request (status note only;
      no scope changes to the brief).
- [ ] 5.2 Run `npm run check` (lint, typecheck, full test suite, build) and
      `openspec validate category-filtering --strict`, and record each
      command's pass/fail/unrun result in the pull request description along
      with confirmation that feedback creation and voting still work.
- [ ] 5.3 Per `design.md` Migration Plan, capture a local demonstration of
      the filter (per `docs/features/category-filtering.md` Completion
      evidence) for the specification pull request. Add a deployed
      demonstration using persisted Azure data only once the team's deploy
      pipeline is confirmed active; otherwise record it as not yet available
      rather than reporting it as passed.
