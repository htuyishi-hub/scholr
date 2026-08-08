// Vercel Node Serverless Function for projects whose Root Directory is
// artifacts/scholr. The build step generates the bundled Express app beside
// this file before Vercel packages the function.
import app from "./_server.mjs";

export default app;