# Easereader backend

This directory is a backend-only copy of Easereader, prepared for a new user
interface. The legacy `public/index.html`, screenshots, and HTML examples are
intentionally not included.

See [NEW-UI-FEATURES.md](NEW-UI-FEATURES.md) for the functional specification
and the API contract the replacement frontend must implement.

## Run locally

### Backend

```bash
npm install
npm start
```

The API listens on `http://localhost:3000`. There is deliberately no page at
`/`; API routes live below `/api`, profile images below `/uploads`, and download
progress is published at `/ws/download-progress`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api`,
`/uploads`, and `/ws/download-progress` to the backend on `localhost:3000`.

Available scripts:

- `npm run dev` — start dev server
- `npm run build` — production build to `frontend/dist`
- `npm run typecheck` — TypeScript strict check
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests
- `npm run generate:api` — regenerate `src/api/types.ts` from `src/api/openapi.json`

Persisted configuration defaults to `data/`. Set `CONFIG_DIR` to use another
location. In Docker, mount a volume at `/config`:

```bash
docker build -t easereader-newui .
docker run --rm -p 3000:3000 -v easereader-config:/config easereader-newui
```

Selectable source domains are controlled by `BOOK_SOURCE_OPTIONS` near the top
of `server.js`. The backend rejects source URLs that are not in that allowlist.

