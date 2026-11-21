# Afterlight

Afterlight is a movie discovery frontend for the Go API in this repository.

## Run locally

1. Start the Go API on port 8000 with PostgreSQL, the existing migrations, and the server's `DATABASE_URL`, `JWT_SECRET` (base64), and `API_READ_ACCESS_TOKEN` environment variables. The Go process reads these from its environment.
2. From the repository root, run:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

3. Open the Local URL printed by Vite. Vite proxies `/api` to `http://localhost:8000`.

Use Node 20.19+ on the Node 20 line, or 22.12+ on newer supported lines. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` to verify changes.

The build is written to `dist/`. For production, serve it behind a same-origin reverse proxy that sends `/api/*` to Go and sends frontend routes such as `/movies/123` to `index.html`.

## API coverage

- Home and Browse consume the four collections in `GET /api/home`.
- Details use `GET /api/movie/{id}`. The backend adds `backdrop_path` to the existing movie response. Genres and runtime are currently unavailable.
- Search uses `GET /api/search?q=…&page=…`. The grid filters the multi-search payload to movies. Pagination reflects the upstream mixed-media pages.
- Registration, login, profile, watchlist, and watched history use the existing Go handlers. Personal queries and mutations are keyed by the in-memory session ID.

## Future work

A personalized recommendation feed can add its own typed API module and TanStack Query options when the FastAPI contract is available, then reuse the home page's movie row.

The current JWT lives in memory. A full reload requires sign-in. For persistent sessions, extend the Go backend to issue and clear a short-lived session or refresh cookie with `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter in production. Validate origin and a CSRF token for state-changing cookie-authenticated requests. Rotate and revoke refresh sessions server-side if introduced.
