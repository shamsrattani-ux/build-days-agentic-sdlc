# Design

## Context

See `proposal.md` for motivation. This is a net-new capstone app under
`capstone/meme-sticker-shop/`, independent from the root `src/` workspace and
package manifests (per `capstone/AGENTS.md` and root `DESIGN.md`). The root
repo's main app is React/Express with a storage-interface pattern (in-memory
test adapter, Azure Table Storage for deployment); this capstone reuses the
same storage-interface *shape* but on Next.js, and stays local/in-memory only
for this change (no Azure deployment yet, per the confirmed non-goal).

## Goals / Non-Goals

**Goals:**
- Stand up a self-contained Next.js (App Router) + TypeScript app with its
  own `package.json`, lint, type-check, test, and build scripts, independent
  of the root workspace's tooling.
- Implement the `sticker-shop` capability behind an explicit storage
  interface so a future change can swap in a durable adapter without
  touching route or UI code.
- Keep the primary workflow (browse → purchase) fully covered by unit, API
  (route handler), and UI tests, including all states named in the spec.

**Non-Goals:**
- Real payments, authentication, search/filter, or sticker upload (see
  proposal's explicit non-goals).
- Azure infrastructure, AVM modules, GitHub OIDC deployment, or capstone
  CI/CD workflows. This change ships a runnable local app only; a follow-on
  change would add deployment.
- Multi-user concurrency at scale — "concurrent purchase safety" here means
  correct behavior for two overlapping requests against a single local
  process, not distributed-lock guarantees.

## Decisions

### 1. Framework and structure: Next.js App Router, self-contained package
`capstone/meme-sticker-shop/` gets its own `package.json`, `tsconfig.json`,
and test config, separate from the root `package.json`/`vite.config.ts`. This
matches the capstone boundary rule ("one application owns one
`capstone/<app-name>/` subtree") and lets the app use Next.js conventions
(file-based routing, Route Handlers) instead of forcing it into the root
Vite/Express setup.
- Alternative considered: reuse root Express API + add a Next.js frontend
  only. Rejected — mixes ownership across `src/` and `capstone/`, violating
  the "do not change `src/`" boundary, and adds coupling for a workshop
  exercise meant to be independently reviewable.

### 2. API surface: Next.js Route Handlers under `app/api/`
`GET /api/stickers` (catalog), `GET /api/balance` (shopper balance),
`POST /api/purchases` (purchase a sticker), `GET /api/purchases` (history).
This satisfies the capstone requirement to "expose an API" while staying
idiomatic to Next.js (colocated route handlers, no separate server process).

### 3. Storage boundary: `StickerShopStore` interface + in-memory adapter
Define a small interface (e.g. `listStickers`, `getBalance`,
`purchaseSticker`, `listPurchases`) implemented by a single in-process
in-memory adapter (module-scoped state, seeded on first load) for this
change. Route handlers depend only on the interface, mirroring the root
app's storage-port pattern.
- Alternative considered: a local file/SQLite-backed adapter for
  "durability" across restarts. Rejected for this change — adds complexity
  and a new dependency the user explicitly deferred ("mock it locally"); the
  in-memory adapter is simplest and the interface makes swapping in a real
  adapter later a contained change.

### 4. Purchase concurrency: single-process mutex around the store mutation
Because storage is in-memory and single-process, `purchaseSticker` performs
a read-check-write under a simple in-process lock (e.g. serialize via an
internal queue/mutex around the mutation) so two near-simultaneous requests
for the same limited-stock sticker cannot both succeed. This satisfies the
spec's "Concurrent purchase safety" scenario without needing a database
transaction, since there is no external database in this change.

### 5. Shopper identity: fixed mock shopper, no session/cookie logic
A single hardcoded shopper id with a starting balance (e.g. 100 credits) is
used for all requests in this change, per the confirmed scope (anonymous
mock user, no login). This keeps `Requirement: View current credit balance`
and `Requirement: View purchase history` simple: there is exactly one
balance and one purchase history to read.

### 6. Seed data: static catalog embedded in the adapter
Stickers are seeded as a small static list (5-8 entries) with placeholder
image paths under the app's `public/` directory, loaded once when the
in-memory store initializes. No admin/upload UI is introduced.

## Risks / Trade-offs

- **In-memory storage loses state on restart** → Acceptable for this change
  since it is explicitly local/mock; documented as a known limitation and
  the deferred non-goal for a durable adapter.
- **In-process mutex does not generalize to multiple server instances** →
  Acceptable because there is no deployment in this change; called out so a
  future deployment-focused change knows to replace it with a real
  transaction/optimistic-concurrency check against durable storage.
- **Single mock shopper means no per-user isolation is tested** → Acceptable
  for this change's confirmed scope; a future change adding real identity
  would need to revisit the storage interface's shopper-id parameter (kept
  as an explicit parameter now, even though only one id is ever used, to
  ease that later extension).

## Migration Plan

This is a net-new addition with no existing users or data — no migration or
rollback beyond deleting the `capstone/meme-sticker-shop/` directory and its
OpenSpec change if it needs to be reverted. No root `DESIGN.md` update is
required: this change introduces no durable, system-wide architectural
decision (the existing feedback app and root workspace are untouched).
