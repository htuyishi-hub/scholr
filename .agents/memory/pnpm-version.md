---
name: pnpm version mismatch fix
description: The Nix environment has pnpm@10.26.1; setting packageManager to pnpm@11 causes SIGABRT on Node 24.
---

## Rule
Always set `packageManager` in package.json to `pnpm@10.26.1` (the version installed in Nix), not pnpm@11.

**Why:** Replit's PNPM_WORKSPACE stack reads `packageManager` and tries to auto-install it via `pnpm add pnpm@<version>`. Node.js 24 crashes with an assertion error (`uv_thread_create`) when pnpm@11 tries to self-install. pnpm@10.26.1 is already present at `/nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin/pnpm`.

**How to apply:** If workflows fail with repeated `pnpm add pnpm@11.x.x` errors and SIGABRT, update `packageManager` in root `package.json` to `pnpm@10.26.1`. Then run `COREPACK_ENABLE_STRICT=0 pnpm install --no-frozen-lockfile` once.

Lock file format v9 is compatible with pnpm@10.
