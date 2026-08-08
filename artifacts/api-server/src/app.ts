import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontendPublicDir = path.resolve(__dirname, "..", "..", "scholr", "dist", "public");

// The frontend is deployed separately (Vercel). When this build does not ship
// a bundled SPA, the API runs in pure API mode and never tries to serve HTML.
const serveFrontend =
  process.env.SERVE_FRONTEND !== "false" &&
  fs.existsSync(path.join(frontendPublicDir, "index.html"));

// Cross-origin browsers (Vercel frontend -> Render API) must be allow-listed.
// Set CORS_ORIGINS to a comma-separated list of exact origins, e.g.
// "https://scholr.vercel.app,https://www.scholr.com". "*" allows everything.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes("*");

const corsOptions: Parameters<typeof cors>[0] = {
  origin(origin, callback) {
    // Same-origin / server-to-server requests have no Origin header.
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};


import { logger } from "./lib/logger.js";

const app: Express = express();

// Baseline security headers for every response (Lighthouse "Best Practices").
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Serve the built React frontend from the monorepo's Vite output when it is
// bundled alongside the API (single-service Render deploy).
if (serveFrontend) {
  app.use(
    express.static(frontendPublicDir, {
      index: false,
      etag: true,
      setHeaders(res, filePath) {
        // Vite emits content-hashed filenames under /assets, so they can be
        // cached immutably. Everything else revalidates.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    }),
  );

  // For SPA routes (anything not starting with /api), fall back to index.html.
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/api") {
      return next();
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(frontendPublicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;