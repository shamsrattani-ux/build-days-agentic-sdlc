<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Meme sticker shop — capstone agent guide

This directory is an independently owned capstone subtree per
[`../AGENTS.md`](../AGENTS.md) and [`../../AGENTS.md`](../../AGENTS.md). It
implements the `meme-sticker-shop-capstone` OpenSpec change
(`../../openspec/changes/meme-sticker-shop-capstone/`).

## Boundary

- This app owns everything under `capstone/meme-sticker-shop/` and nothing
  else. Do not modify `src/`, the existing feedback app, or its tests from
  here, and do not modify other `capstone/<app-name>/` subtrees.
- This app has its own `package.json`/`node_modules`, independent of the
  repo root workspace.
- Storage is an explicit in-memory adapter behind a `StickerShopStore`
  interface (see `design.md` in the OpenSpec change). No external database
  or cloud service is used in this change.

## Validation commands (run from this directory)

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run build
# or run all of the above:
npm run check
```

Read the OpenSpec change's `proposal.md`, `specs/sticker-shop/spec.md`,
`design.md`, and `tasks.md` before making further changes.
