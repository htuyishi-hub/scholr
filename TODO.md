## TODO
- [x] Fix pnpm/lockfile mismatch between local pnpm and Railway pnpm by regenerating lockfile with pnpm 9.
- [x] Fix esbuild resolution issues for api-server build.
- [x] Fix esbuild resolution issues for scholr (Vite/esbuild index.js mismatch).
- [x] Remove temporary node_modules shim and make esbuild version compatible by pinning esbuild@0.25.8.
- [x] Confirm api-server build passes; confirm scholr build passes.
- [ ] Fix runtime crash on Railway due to missing DATABASE_URL by making db initialization not hard-fail on import.

