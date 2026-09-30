# Tasks

## 1. App scaffold

- [x] 1.1 Scaffold the Next.js (App Router) + TypeScript project at
      `capstone/meme-sticker-shop/` with its own `package.json`,
      `tsconfig.json`, and lint/test scripts (`dev`, `build`, `lint`,
      `typecheck`, `test`); verify `npm install` and `npm run build` succeed
      from inside that directory.
- [x] 1.2 Add `capstone/meme-sticker-shop/AGENTS.md` describing the local
      boundary (owns this subtree only, does not touch `src/`) and the
      validation commands from 1.1; verify the file exists and links back to
      `../AGENTS.md`.

## 2. Shared contracts and storage boundary

- [x] 2.1 Define `Sticker`, `Purchase`, and shopper-balance TypeScript types
      shared across route handlers and UI; verify `npm run typecheck`
      passes.
- [x] 2.2 Define the `StickerShopStore` interface (`listStickers`,
      `getBalance`, `purchaseSticker`, `listPurchases`) per design.md
      decision 3; verify it compiles and is imported only through this
      interface (no direct module-state access outside the adapter file).
- [x] 2.3 Implement the in-memory adapter: seeded catalog (5-8 stickers),
      single mock shopper with a starting balance, and an in-process mutex
      around `purchaseSticker` per design.md decision 4; verify unit tests
      cover: successful purchase debits balance and records a purchase,
      insufficient-credits purchase is rejected and balance unchanged,
      purchasing an unavailable sticker is rejected, and two concurrent
      purchase calls for the same sticker resolve to exactly one success.

## 3. API route handlers

- [x] 3.1 Implement `GET /api/stickers` returning the catalog; verify an API
      test covers success and an empty-catalog case.
- [x] 3.2 Implement `GET /api/balance` returning the shopper's balance;
      verify an API test covers the success case.
- [x] 3.3 Implement `POST /api/purchases` (purchase a sticker) returning the
      updated balance and the created purchase, with distinct error
      responses for insufficient credits, unavailable sticker, and
      unexpected storage failure; verify API tests cover all four outcomes
      (success, insufficient credits, unavailable, unexpected failure) per
      the `sticker-shop` spec.
- [x] 3.4 Implement `GET /api/purchases` returning purchase history; verify
      an API test covers both the populated and empty-history cases.

## 4. UI: browse and purchase

- [x] 4.1 Build the sticker grid page showing image, name, and price per
      sticker, with loading, empty, and failure states; verify a UI test
      exercises all three non-success states plus the populated grid, per
      the `Browse the sticker catalog` requirement.
- [x] 4.2 Build the balance display that updates after a purchase without a
      full page reload; verify a UI test confirms the displayed balance
      changes after a successful purchase.
- [x] 4.3 Build the purchase action (e.g. a button per sticker) with
      accessible confirmation and distinct error messaging for insufficient
      credits vs. unavailable vs. unexpected failure; verify UI tests cover
      each message path per the `Purchase a sticker with virtual credits`
      requirement.
- [x] 4.4 Build the purchase history view with populated and empty states;
      verify a UI test covers both per the `View purchase history`
      requirement.

## 5. End-to-end validation

- [ ] 5.1 Run the full local validation suite (lint, typecheck, unit, API,
      and UI tests) from `capstone/meme-sticker-shop/` and record the exact
      commands and pass/fail results.
- [ ] 5.2 Manually walk the browse → purchase → balance-update → purchase-
      history flow in the dev server and confirm it matches every scenario
      in `specs/sticker-shop/spec.md`.
- [ ] 5.3 Confirm no changes were made to `src/`, the existing feedback app,
      or its tests, and that the new subtree is independently reviewable
      (non-overlapping file ownership from tasks 1-4).
