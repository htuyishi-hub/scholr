/**
 * Bundles the Express app into a single ESM file that a Vercel Node
 * Serverless Function can import (`/api/_server.mjs` at the repo root).
 *
 * This is what makes `https://<domain>/api/*` work on the same origin as the
 * SPA: without it Vercel only serves static files and every `POST /api/...`
 * comes back as `405 Method Not Allowed`.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm, mkdir } from "node:fs/promises";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "..", "..");
const outFile = path.join(repoRoot, "api", "_server.mjs");

globalThis.require = createRequire(import.meta.url);

function loadEsbuild() {
  return globalThis.require(path.resolve(artifactDir, "node_modules/esbuild/lib/main.js"));
}

const external = [
  "*.node",
  "sharp",
  "better-sqlite3",
  "sqlite3",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
  "pg-native",
  "playwright",
  "puppeteer",
  "puppeteer-core",
];

async function build() {
  const esbuild = loadEsbuild();
  await rm(outFile, { force: true });
  await mkdir(path.dirname(outFile), { recursive: true });

  await esbuild.build({
    entryPoints: [path.resolve(artifactDir, "src/app.ts")],
    platform: "node",
    target: "node22",
    bundle: true,
    format: "esm",
    outfile: outFile,
    logLevel: "info",
    external,
    sourcemap: false,
    define: {
      // Serverless functions never bundle the SPA: keep the API in pure API mode.
      "process.env.SERVE_FRONTEND": '"false"',
    },
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
    },
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
