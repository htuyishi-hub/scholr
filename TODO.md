# TODO - Railway deploy backend + frontend

- [x] Create Railway config(s) for two services: backend (artifacts/api-server) and frontend (artifacts/scholr)

- [x] Ensure backend exposes healthcheck endpoint: /api/healthz (or /api/healthz)

- [x] Configure frontend to build into static assets and start via a production static server

- [x] Configure frontend env var VITE_API_BASE_URL to point at backend Railway URL

- [ ] Add railway-specific ignore/watch paths (if using railway.toml)
- [ ] Deploy frontend (frontend needs its own Railway project/config; current Railway config at repo root is for backend)
- [x] Provide local verification commands (pnpm install/build/start) per service


