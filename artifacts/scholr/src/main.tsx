import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setRetryConfig, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

setBaseUrl(apiBaseUrl || window.location.origin);
setAuthTokenGetter(() => localStorage.getItem("scholr_token"));
setRetryConfig({
  maxAttempts: Number(import.meta.env.VITE_API_MAX_RETRIES ?? 3),
  delayMs: Number(import.meta.env.VITE_API_RETRY_DELAY_MS ?? 5000),
});

createRoot(document.getElementById("root")!).render(<App />);
