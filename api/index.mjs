// Vercel Node Serverless Function that serves the whole Express API.
// `vercel.json` rewrites every /api/* request here, so the SPA can keep
// calling relative paths on its own origin (no CORS, cookies just work).
import app from "./_server.mjs";

export default app;
