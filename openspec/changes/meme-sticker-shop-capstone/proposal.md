# Proposal

## Why

The repository's optional App-first capstone lets a team build a net-new
application under `capstone/<app-name>/` to practice the full OpenSpec →
implementation → evidence loop on a fresh stack. No team has yet proposed a
"meme sticker shop" capstone: a small storefront where a visitor browses a
seeded catalog of meme stickers and spends virtual credits to purchase one.
This is a comparable, timeboxed alternative to the existing capstone briefs,
built with Next.js and TypeScript instead of the main repo's React/Express
stack, to demonstrate the same spec-driven workflow on a different framework.

## What Changes

- Add a new net-new capstone application at `capstone/meme-sticker-shop/`:
  a Next.js (App Router) + TypeScript app with its own `package.json`,
  independent from the root workspace and the existing feedback app.
- Introduce a `Sticker` entity with a seeded catalog (id, name, price in
  credits, image reference).
- Introduce a single anonymous mock shopper with a starting virtual credit
  balance (no accounts, no login).
- Implement the primary workflow: browse the sticker grid, then purchase one
  sticker, which debits the shopper's balance and records a purchase.
- Implement the storage boundary as an explicit adapter interface with an
  in-memory/local implementation only; no external database or cloud service
  is introduced by this change.
- Add unit, API, and UI tests for the browse and purchase scenarios (loading,
  empty, success, and failure/validation states).
- Add a scoped `capstone/meme-sticker-shop/AGENTS.md` at implementation time
  per the capstone convention.

**Explicit non-goals** (deferred, not delivered by this change):
- No real payment processing — credits are virtual/mock only.
- No user accounts, sign-up, or authentication.
- No search, filtering, or sticker categories.
- No sticker upload/submission workflow.
- No Azure infrastructure, AVM modules, GitHub OIDC deployment, or capstone
  CI/CD workflow. Storage is local/in-memory only for this change. A
  deployed, durable-storage version is explicitly out of scope and would be
  a separate follow-on change if the team later wants to deploy this app.

## Capabilities

### New Capabilities

- `sticker-shop`: Browsing a seeded meme sticker catalog and purchasing a
  sticker with a virtual credit balance, including balance and purchase-
  history read behavior and the associated loading/empty/success/failure
  states.

### Modified Capabilities

None. This change does not alter `feedback-category-filter` or any other
existing capability.

## Impact

- **Application code**: Adds a new, independent subtree at
  `capstone/meme-sticker-shop/` (Next.js + TypeScript). Does not modify
  `src/`, the existing Express/React feedback app, or its tests.
- **Tests**: Adds unit, API (route handler), and UI tests scoped to the new
  subtree.
- **Infrastructure**: None added by this change (explicitly deferred).
- **Workflows**: None added by this change; capstone-scoped CI/CD is
  deferred to a follow-on change if/when deployment is pursued.
- **Security**: No new credentials, secrets, or external integrations; no
  real payment or authentication surface is introduced.
- **Documentation**: Adds `capstone/meme-sticker-shop/AGENTS.md` at
  implementation time; no root `DESIGN.md` change is required since this
  change introduces no durable, system-wide architectural decision.
