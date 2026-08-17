import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setRetryConfig, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { ensureFreshAdminToken, getAdminToken } from "./lib/admin-session";
import "./index.css";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

setBaseUrl(apiBaseUrl || window.location.origin);
setAuthTokenGetter(() => getAdminToken());
setRetryConfig({
  maxAttempts: Number(import.meta.env.VITE_API_MAX_RETRIES ?? 3),
  delayMs: Number(import.meta.env.VITE_API_RETRY_DELAY_MS ?? 5000),
});

// Renew a soon-to-expire admin session before the first API call goes out.
void ensureFreshAdminToken();

createRoot(document.getElementById("root")!).render(<App />);
