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
import { rm, mkdir, copyFile } from "node:fs/promises";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "..", "..");
// The active Vercel project uses artifacts/scholr as its Root Directory, so
// the function bundle must exist inside that directory. Keep a second copy at
// the repository root for deployments configured from the monorepo root.
const outFile = path.join(repoRoot, "artifacts", "scholr", "api", "_server.mjs");
const rootOutFile = path.join(repoRoot, "api", "_server.mjs");
const indexHtmlPath = path.join(repoRoot, "artifacts", "scholr", "dist", "public", "index.html");

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

  const { readFileSync } = await import("node:fs");
  let indexHtmlJson = "null";
  try {
    const html = readFileSync(indexHtmlPath, "utf8");
    indexHtmlJson = JSON.stringify(html);
    console.log(`[build-vercel] Embedded index.html (${html.length} bytes) for SEO injection`);
  } catch {
    console.warn(`[build-vercel] WARNING: index.html not found at ${indexHtmlPath} — SEO injection will fall back to next()`);
  }

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
      "process.env.SERVE_FRONTEND": '"false"',
    },
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
globalThis.__SCHOLR_INDEX_HTML__ = ${indexHtmlJson};
`,
    },
  });

  await mkdir(path.dirname(rootOutFile), { recursive: true });
  await copyFile(outFile, rootOutFile);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
