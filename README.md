# AI Website Optimizer

Full-stack app: paste a URL, get a real SEO / performance / accessibility / mobile / security /
broken-link audit with prioritized, actionable recommendations and an AI assistant to ask
follow-up questions about your scan.

**No stubs, no localStorage, no hardcoded scores.** Every check calls a real library against the
real target site; every score is derived from real findings; auth and persistence are backed by
a real MongoDB instance.

**Architecture: built to deploy entirely on Vercel — no separate worker host, no Docker required
in production.** See "Why no BullMQ worker" below for what changed and why.

## What's implemented

| Area | Real implementation |
|---|---|
| SEO | `cheerio` HTML parsing (title, meta description, headings, canonical, OG/Twitter tags, image alt coverage, JSON-LD) + real fetches of `/robots.txt` and `/sitemap.xml` |
| Performance | `lighthouse` (Node API) attached to a shared headless Chrome instance, real mobile Core Web Vitals (LCP, CLS, INP/TBT) |
| Accessibility | `@axe-core/puppeteer` — real WCAG violations by severity |
| Mobile | viewport meta check + real Puppeteer screenshots (mobile & desktop widths) + Lighthouse `tap-targets` audit |
| Security headers | real response header inspection (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) + HTTPS/mixed-content checks |
| Broken links | real crawler: extracts `<a href>`, resolves/dedupes, HEAD-with-GET-fallback, concurrency-limited, capped at 75 links |
| Recommendations | rule-based engine mapping only *actually detected* findings to `{issue, impact, effort, explanation, fixSteps}` |
| AI assistant | real server-side call to the Anthropic API (`@anthropic-ai/sdk`), passed the structured scan result |
| Auth | NextAuth Credentials provider, bcrypt (cost 12), JWT sessions, Mongo-backed users, route-protecting middleware |
| Background execution | `waitUntil()` from `@vercel/functions` — the scan pipeline runs inline in the API route's invocation, extended past the response (see below) |
| SSRF protection | DNS-resolves every target, blocks private/loopback/link-local ranges, re-validates on every redirect hop |
| Rate limiting | Redis fixed-window limiter, per-user and per-IP |

## Why no BullMQ worker

The original design used BullMQ + a standalone worker process, which needs a long-running host
(Railway/Render/Fly/a VM) — Vercel serverless functions don't keep a process alive between
invocations, so there's nowhere for a persistent job listener to run.

Instead:
- `POST /api/scan` creates the `Scan` document (`status: "queued"`), then calls
  **`waitUntil(runScanJob(...))`** (`src/lib/runScanJob.ts`) before returning the scan id.
  `waitUntil` (from `@vercel/functions`) extends the function invocation's lifetime past the
  response, so the scan actually finishes running instead of being killed the moment the response
  is sent.
- The three checks needing headless Chrome (performance, accessibility, mobile) now **share one
  browser instance per scan** (`src/lib/browser.ts`), launched via `puppeteer-core` +
  `@sparticuz/chromium` — a slim, Lambda/Vercel-compatible Chromium build (full `puppeteer`'s
  bundled Chromium is hundreds of MB, well over Vercel's ~50MB compressed function bundle limit).
  Locally/in Docker it falls back to full `puppeteer` instead, for simplicity.
- Lighthouse attaches to that same shared browser over its remote-debugging port, rather than
  spawning its own Chrome the way `chrome-launcher` did (which assumed a locally managed binary
  that doesn't exist in a serverless function).
- `POST /api/scan`'s route sets `export const maxDuration = 300` — a full six-check scan
  typically takes 15-60s+, comfortably inside that budget. **This requires Vercel Pro or higher**
  (Hobby caps functions at 60s, which may not be enough for a slow target site).
- There's no BullMQ retry/backoff anymore. A failed scan is simply marked `"failed"` with the
  error message; the user re-runs it from the dashboard. The `jobs` collection is kept for
  status bookkeeping/audit history.

**Trade-off to know about:** `waitUntil` doesn't guarantee completion the way a real queue with
retries does — if the function is forcibly terminated mid-scan (rare, but possible under extreme
load or a Vercel platform issue), that scan is simply left `"running"` with no automatic retry.
For most usage this is fine; if you need guaranteed delivery at higher scale, reintroducing a real
queue (BullMQ on a small persistent worker, or a managed alternative like Inngest/QStash which are
built for exactly this on serverless) is the natural next step — the `Scan`/`Job` schema doesn't
need to change to add that later.

## Project structure

```
src/
  app/                    # Next.js App Router pages + API routes
    api/auth/             # NextAuth + signup
    api/scan/             # POST enqueue (runs scan via waitUntil), GET history,
                           # GET [id] status/result, POST [id]/assistant
    dashboard/             # scan form + history, and [scanId] detail/results page
    (auth)/signin, signup
  lib/
    mongodb.ts, redis.ts, auth.ts (NextAuth config), rateLimit.ts, ssrf.ts, url.ts, safeFetch.ts
    browser.ts             # shared headless Chrome launcher (puppeteer-core+sparticuz on
                           # Vercel, full puppeteer locally/Docker)
    runScanJob.ts          # runs one scan to completion + persists result; called via waitUntil
  models/                 # Mongoose: User, Scan, Job
  worker/                 # scan pipeline + checks (imported directly by the API route now,
                           # not a separate deployable process)
    checks/                 seo.ts, security.ts, links.ts, performance.ts, accessibility.ts, mobile.ts
    scoring.ts             # pure, unit-tested scoring
    recommendations.ts     # pure, unit-tested recommendation engine
    scanPipeline.ts        # orchestrates all checks -> scores -> recommendations
  components/             # ScanForm, ScanHistory, CategoryScoresChart (Recharts), RecommendationList, AssistantChat
  types/scan.ts            # shared TypeScript types for all check results
tests/                    # vitest: scoring, recommendations, SSRF
scripts/seedAdmin.ts      # one-time CLI to promote ADMIN_SEED_EMAIL to role "admin"
docker-compose.yml        # mongo, redis, web (local dev / self-hosting only)
Dockerfile.web
```

## MongoDB schema

- **users**: `email` (unique, indexed), `passwordHash`, `role` (`user`|`admin`), `emailVerified`, `createdAt`
- **scans**: `userId` (indexed), `url`, `status`, `overallScore`, `categoryScores` (embedded), `rawResults` (embedded, per-category findings), `recommendations` (embedded array), `createdAt`; compound index `{userId, createdAt}`
- **jobs**: `type`, `status`, `payload`, `scanId` (ref), `attempts`, `lastError`, timestamps — status/audit bookkeeping the frontend can query

## Verification performed in this build session

```
$ npx vitest run
 ✓ tests/scoring.test.ts  (8 tests)
 ✓ tests/ssrf.test.ts  (12 tests)
 ✓ tests/recommendations.test.ts  (5 tests)
 Test Files  3 passed (3)  |  Tests  25 passed (25)

$ npx tsc --noEmit -p tsconfig.json   # clean, no errors

$ npm run build
 ✓ Compiled successfully
 ✓ Generating static pages (9/9)
 (all routes built: /, /signin, /signup, /dashboard, /dashboard/[scanId],
  /api/auth/*, /api/scan, /api/scan/[id], /api/scan/[id]/assistant)
```

`next` was bumped 14.2.5 -> **14.2.35** and `mongoose` 8.5.1 -> **8.24.1** after `npm audit`
flagged a critical Mongoose NoSQL-injection advisory and a Next.js RCE advisory in the originally
pinned versions. `chrome-launcher`, full `puppeteer` (prod), and `bullmq`/its worker were removed
from the production dependency graph in the Vercel refactor (full `puppeteer` is now a
dev-only dependency for local/Docker runs).

**Known residual `npm audit` findings** (1 high, 3 moderate, 3 low) come from `next-auth@4.x`'s
own pinned dependencies and a handful of Next.js advisories only fully closed by upgrading to
Next 15/16 or Auth.js v5 — both breaking changes worth doing deliberately with their own test
pass. Run `npm audit` yourself before deploying to confirm current status.

**Not run in this sandbox** (no live MongoDB/Redis, no network access to download Chromium
binaries or reach arbitrary external sites): an actual live scan against a real URL end-to-end,
Docker Compose itself, and Playwright/e2e tests. Puppeteer's own bundled Chromium download was
skipped (`PUPPETEER_SKIP_DOWNLOAD=true`) during `npm install` here since the sandbox network only
allows package-registry domains.

## Setup

### 1. Environment

Copy `.env.example` to `.env` and fill in real values (`MONGODB_URI`, `REDIS_URL`,
`NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`, etc).

### 2. Deploy to Vercel (recommended path)

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. Set the environment variables from `.env.example` in the Vercel project settings — use a
   **MongoDB Atlas** connection string for `MONGODB_URI` and a managed Redis (e.g. **Upstash**)
   URL for `REDIS_URL`. Vercel doesn't provide either itself.
3. You need **Vercel Pro or higher** — `POST /api/scan` sets `maxDuration = 300`, above Hobby's
   60s cap.
4. Deploy. `puppeteer-core` + `@sparticuz/chromium` run headless Chrome inside the function
   automatically; no extra config needed for that part.
5. Seed an admin: run `npm run seed:admin` locally against your production `MONGODB_URI` (or via
   `vercel env pull` + the script), after signing up with the `ADMIN_SEED_EMAIL` address through
   the deployed app.

### 3. Local dev via Docker Compose

```
docker compose up --build
```

Starts `mongo`, `redis`, and `web` (Next.js on :3000, running the scan pipeline inline the same
way it does on Vercel). `Dockerfile.web` installs system Chromium so the local/Docker branch of
`src/lib/browser.ts` (full `puppeteer`, pointed at `PUPPETEER_EXECUTABLE_PATH`) has something to
launch.

### 4. Local dev without Docker

You'll need a local MongoDB and Redis, and either a local Chrome/Chromium install or to unset
`PUPPETEER_SKIP_DOWNLOAD` before `npm install` so Puppeteer downloads its own.

```
npm install
npm run dev   # Next.js app on :3000 — scans run inline in the API route, no separate worker command
```

### 5. Seed an admin user

Sign up normally through the app with the email you'll set as `ADMIN_SEED_EMAIL`, then:

```
npm run seed:admin
```

This promotes that one user's `role` to `admin` directly in MongoDB. There is no hardcoded admin
email anywhere in the codebase — `ADMIN_SEED_EMAIL` is read only by this script.

### 6. Tests

```
npm test          # vitest: scoring, recommendations, SSRF (pure logic, no live services needed)
npm run build     # next build (type-checks + compiles all routes)
```

## Where each piece runs in production

| Piece | Where |
|---|---|
| Everything (`web` + scan execution) | **Vercel**, Pro plan or higher (for the 300s function duration) |
| MongoDB | Managed Atlas, or self-hosted via `docker-compose.yml` for local dev |
| Redis | Managed (Upstash, etc.), or self-hosted via Compose for local dev |
| Local dev, everything | `docker compose up` |

If you'd rather go back to a persistent worker + queue (e.g. for guaranteed job delivery at
higher scale, or to avoid the Vercel Pro requirement), see the trade-off note under "Why no
BullMQ worker" above — the data model already supports adding that back.

## `.env.example`

```
# --- MongoDB ---
MONGODB_URI=mongodb://localhost:27017/ai-website-optimizer

# --- Redis (rate limiting) ---
REDIS_URL=redis://localhost:6379

# --- NextAuth ---
NEXTAUTH_SECRET=replace-with-a-long-random-string
NEXTAUTH_URL=http://localhost:3000

# --- Anthropic (server-side only) ---
ANTHROPIC_API_KEY=sk-ant-...

# --- Admin seeding ---
ADMIN_SEED_EMAIL=you@example.com
```

## Honest next steps before calling this "done"

- Run a real scan end-to-end (Vercel deploy or `docker compose up`) against a real URL — this
  hasn't been exercised live, only type-checked and unit-tested in this sandbox.
- Add integration tests for the scan pipeline against a couple of known test URLs, and basic e2e
  coverage of submit -> view dashboard (Playwright), as the original brief requested — not yet
  written.
- Decide on and execute the Next.js 15/16 or Auth.js v5 migration to close the remaining `npm
  audit` findings.
- If you outgrow `waitUntil`'s best-effort semantics (see trade-off note above), reintroduce a
  real queue with retries.
