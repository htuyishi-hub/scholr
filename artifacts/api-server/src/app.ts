import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontendPublicDir = path.resolve(__dirname, "..", "..", "scholr", "dist", "public");


import { logger } from "./lib/logger.js";

const app: Express = express();

// Serve the built React frontend from the monorepo's Vite output.
// Vite outputs to: artifacts/scholr/dist/public
app.use(express.static(frontendPublicDir, { index: false }));

// For SPA routes (anything not starting with /api), fall back to index.html.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/api") {
    return next();
  }

  res.sendFile(path.join(frontendPublicDir, "index.html"), (err) => {
    if (err) next(err);
  });
});




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
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
