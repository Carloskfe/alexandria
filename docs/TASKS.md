# Alexandria — Project Stages, Sprints & Tasks

**Estimation key:** Each task is estimated in days (1 dev). Sprints are 2 weeks (10 working days).
**Legend:** `[ ]` pending · `[x]` done · `[~]` in progress

> **Definition of Done — mandatory for all service tasks**
> A backend task is NOT complete until:
> - [ ] A unit test file exists at the mirrored path under `tests/unit/`
> - [ ] Tests cover happy path, edge cases, and error scenarios for every public method
> - [ ] All tests pass (`npm run test` / `pytest`)
> - [ ] Coverage for the modified service is ≥ 80% (`npm run test:cov` / `pytest --cov`)
> - [ ] No test touches a real database or makes a real network call
>
> See [CLAUDE.md — Testing](../CLAUDE.md#testing) for naming conventions and run commands per service.

---

## Table of Contents

1. [Stage 0 — Foundation](#stage-0--foundation)
2. [Stage 1 — Core Platform](#stage-1--core-platform)
3. [Stage 2 — Social Layer](#stage-2--social-layer)
4. [Stage 3 — Monetization & Publishers](#stage-3--monetization--publishers)
5. [Stage 4 — Mobile & Offline](#stage-4--mobile--offline)
6. [Stage 5 — Launch & QA](#stage-5--launch--qa)

---

## Stage 0 — Foundation

> **Goal:** Project infrastructure, tooling, and design system ready before feature development begins.
> **Estimate:** 2 weeks · 1 sprint

### Sprint 0.1 — Project Setup (Weeks 1–2)

**Infrastructure**
- [ ] Initialize monorepo structure and Git repository — 0.5d
- [ ] Write `docker-compose.yml` with all services (api, web, db, cache, storage, proxy) — 1d
- [ ] Write `docker-compose.prod.yml` with production overrides — 0.5d
- [ ] Configure `.env.example` with all required variables — 0.5d
- [ ] Set up Nginx reverse proxy with routing rules — 0.5d
- [ ] Initialize MinIO and create buckets: `books/`, `audio/`, `images/` — 0.5d
- [ ] Set up PostgreSQL with `init.sql` base schema — 1d
- [ ] Set up Redis with `redis.conf` — 0.5d

**Testing Setup**
- [ ] Configure Jest + coverage in `api` and `worker` (80% threshold, `tests/unit/` root) — 0.5d
- [ ] Configure Jest + coverage in `web` and `mobile` (80% threshold, `tests/unit/` root) — 0.5d
- [ ] Configure pytest + pytest-cov in `image-gen` (80% threshold, `tests/unit/` root) — 0.5d

**CI/CD**
- [ ] Configure GitHub Actions: lint, test (with coverage gate ≥ 80%), build on PR — 1d
- [ ] Configure GitHub Actions: deploy to staging on merge to main — 1d

**Design System**
- [ ] Define color palette, typography, and spacing tokens — 1d
- [ ] Create base component library (Button, Card, Typography, Input) — 1.5d

**Sprint 0.1 total: 11.5d** _(1.5d added for test framework setup across all services)_

---

## Stage 1 — Core Platform

> **Goal:** Working reading experience with auth and content library — the foundation users interact with.
> **Estimate:** 6 weeks · 3 sprints

---

### Sprint 1.1 — Authentication & User Management (Weeks 3–4)

**Backend (api)**
- [ ] Set up NestJS project with TypeScript, ESLint, Prettier — 0.5d
- [ ] Configure database connection with TypeORM and migrations — 0.5d
- [ ] Create `users` table and entity — 0.5d
- [ ] Implement email + password auth (register, login, JWT) — 1d
- [ ] Integrate Google OAuth — 0.5d
- [ ] Integrate Facebook OAuth — 0.5d
- [ ] Integrate Apple Sign-In — 1d
- [ ] Auth guards, refresh tokens, and logout — 1d
- [ ] User profile endpoints (GET, PATCH, DELETE) — 0.5d
- [ ] Unit tests: `auth.service`, `users.service` (mock DB, cover happy path + errors) — 1d

**Frontend (web)**
- [ ] Set up Next.js project with TypeScript and Tailwind — 0.5d
- [ ] Build login page (email/password + social buttons) — 1d
- [ ] Build register page — 0.5d
- [ ] Auth context and session persistence — 0.5d
- [ ] Protected route wrapper — 0.5d

**Sprint 1.1 total: 10d** _(1d added for auth/user unit tests)_

---

### Sprint 1.2 — Content Library (Weeks 5–6)

**Backend (api)**
- [ ] Create `books`, `authors`, `categories` tables and entities — 1d
- [ ] Book CRUD endpoints (admin only) — 1d
- [ ] Upload book text (EPUB/HTML) to MinIO — 1d
- [ ] Upload audio file to MinIO — 0.5d
- [ ] Streaming endpoint for audio (range requests, DRM headers) — 1d
- [ ] Streaming endpoint for book text (encrypted, chunked) — 1d
- [ ] Book search endpoint (Meilisearch integration) — 1d
- [ ] Unit tests: `books.service`, `storage.service`, `search.service` (mock MinIO + Meilisearch) — 1d

**Frontend (web)**
- [ ] Library page: book grid with cover, title, author — 1d
- [ ] Book detail page: description, author, CTA — 0.5d
- [ ] Category filter and search bar — 1d

**Sprint 1.2 total: 10d** _(1d added for books/storage/search unit tests)_

---

### Sprint 1.3 — Synchronized Reading Engine (Weeks 7–8)

**Backend (api)**
- [ ] Design and store phrase-level sync map (JSON: phrase → timestamp) — 1d
- [ ] Endpoint to fetch sync map for a given book — 0.5d
- [ ] Reading progress endpoint (save/restore position by phrase index) — 0.5d
- [ ] Unit tests: `sync-map.service`, `progress.service` (mock DB) — 0.5d

**Frontend (web)**
- [ ] Reader layout: text column + audio controls — 1d
- [ ] Render book text split into phrase spans — 1d
- [ ] Audio player component (play/pause, scrub, speed 0.75×–2×) — 1d
- [ ] Phrase highlight: sync audio time → active phrase highlight — 1.5d
- [ ] Click phrase → seek audio to corresponding timestamp — 1d
- [ ] Seamless switch: Reading → Listening (preserve position) — 0.5d
- [ ] Seamless switch: Listening → Reading (scroll to active phrase) — 0.5d
- [ ] Persist and restore reading progress — 0.5d

**Sprint 1.3 total: 10.5d** _(0.5d added for sync/progress unit tests)_

---

## Stage 2 — Social Layer

> **Goal:** Fragment capture, quote card generation, and sharing — the core differentiator.
> **Estimate:** 6 weeks · 3 sprints

---

### Sprint 2.1 — Highlight & Fragment System (Weeks 9–10)

**Backend (api)**
- [ ] Create `fragments` and `fragment_sheets` tables and entities — 1d
- [ ] Fragment CRUD endpoints (create, read, update, delete) — 1d
- [ ] Combine multiple fragments into a single selection — 1d
- [ ] Fragment Sheet endpoint: list all fragments for a book/user — 0.5d
- [ ] Unit tests: `fragments.service`, `fragment-sheets.service` (mock DB) — 0.5d

**Frontend (web)**
- [ ] Text selection handler in reader (mouse + touch) — 1d
- [ ] Highlight popover: "Save as Fragment" action — 0.5d
- [ ] Fragment Sheet panel: list, edit, delete fragments — 1.5d
- [ ] Combine fragments: multi-select + merge UI — 1d
- [ ] Visual distinction between saved highlights in reader — 0.5d

**Sprint 2.1 total: 9.5d** _(0.5d added for fragments unit tests)_

---

### Sprint 2.2 — Image Generation Service (Weeks 11–12)

**image-gen service (Python)**
- [ ] Set up Flask API with health check endpoint — 0.5d
- [ ] Design LinkedIn quote card template (1200×627px) — 1d
- [ ] Design Instagram quote card template (1080×1080px) — 1d
- [ ] Design Facebook quote card template (1200×630px) — 0.5d
- [ ] Design WhatsApp quote card template (800×800px) — 0.5d
- [ ] Render endpoint: accept fragment + platform → return image — 1d
- [ ] Upload generated image to MinIO `images/` bucket — 0.5d
- [ ] Alexandria watermark overlay — 0.5d
- [ ] Font rendering for Spanish characters — 0.5d
- [ ] Unit tests: `test_linkedin.py`, `test_instagram.py`, `test_facebook.py`, `test_whatsapp.py` (mock MinIO, no network) — 1d

**worker service (BullMQ)**
- [ ] Set up BullMQ worker connected to Redis — 0.5d
- [ ] `image-render` job: call image-gen service + store result URL — 1d
- [ ] Job status endpoint in api (pending / done / failed) — 0.5d
- [ ] Unit tests: `image-render.job.spec.ts` (mock image-gen HTTP client + Redis) — 0.5d

**Frontend (web)**
- [ ] Quote card preview modal: select platform format — 1d
- [ ] Trigger image generation job, poll for result — 0.5d
- [ ] Display rendered card preview — 0.5d

**Sprint 2.2 total: 11.5d** _(1.5d added for image-gen + worker unit tests)_

---

### Sprint 2.3 — Sharing Engine (Weeks 13–14)

**Backend (api)**
- [ ] Share record endpoint: log share event (platform, fragment, user) — 0.5d
- [ ] Signed URL generation for image download from MinIO — 0.5d
- [ ] Unit tests: `sharing.service` (mock MinIO signed URL, mock DB) — 0.5d

**Frontend (web)**
- [ ] "Share" button: native share sheet (Web Share API) — 0.5d
- [ ] Platform-specific share links (LinkedIn, Instagram, Facebook, WhatsApp) — 1.5d
- [ ] "Download image" fallback — 0.5d
- [ ] Share confirmation feedback (toast notification) — 0.5d

**Sprint 2.3 total: 5.5d** _(0.5d added for sharing unit tests; light sprint — buffer for Stage 1–2 carry-over)_

---

## Stage 3 — Monetization & Publishers

> **Goal:** Paid subscriptions and author upload portal working end-to-end.
> **Estimate:** 4 weeks · 2 sprints

---

### Sprint 3.1 — Subscription & Payments (Weeks 15–16)

**Backend (api)**
- [ ] Create `subscriptions` and `plans` tables — 0.5d
- [ ] Stripe integration: create customer on sign-up — 0.5d
- [ ] Stripe Checkout: Individual and Dual Reader plans — 1d
- [ ] Stripe webhooks: activate/cancel subscription on events — 1d
- [ ] Free trial logic (14-day gate) — 0.5d
- [ ] Feature gate middleware: block premium content for free users — 1d
- [ ] Subscription status endpoint — 0.5d
- [ ] Unit tests: `subscriptions.service`, `feature-gate.middleware` (mock Stripe SDK, mock DB) — 1d

**Frontend (web)**
- [ ] Pricing page: plan comparison table — 1d
- [ ] Checkout flow (redirect to Stripe Checkout) — 0.5d
- [ ] Subscription status in user account page — 0.5d
- [ ] Paywall prompt for locked content — 0.5d
- [ ] Post-payment success/cancel pages — 0.5d

**Sprint 3.1 total: 9.5d** _(1d added for subscription/gate unit tests)_

---

### Sprint 3.2 — Author / Publisher Module (Weeks 17–18)

**Backend (api)**
- [ ] Create `publishers` table and role — 0.5d
- [ ] Publisher registration and approval flow — 1d
- [ ] Book upload endpoint: text + audio + metadata + cover — 1d
- [ ] Hosting tier enforcement (1 / 3 / 12 books per tier) — 0.5d
- [ ] Analytics endpoints: downloads, reads, shares per book — 1d
- [ ] Revenue sharing record model — 0.5d
- [ ] Unit tests: `publishers.service`, `analytics.service` (mock DB, mock MinIO) — 0.5d

**Frontend (web)**
- [ ] Publisher registration page — 0.5d
- [ ] Publisher dashboard: book list, upload form — 1.5d
- [ ] Analytics charts per book (Recharts or Chart.js) — 1d
- [ ] Upload progress indicator (large audio files) — 0.5d

**Sprint 3.2 total: 8.5d** _(0.5d added for publishers/analytics unit tests)_

---

## Stage 4 — Mobile & Offline

> **Goal:** React Native app with full feature parity and offline support.
> **Estimate:** 6 weeks · 3 sprints

---

### Sprint 4.1 — React Native App Shell (Weeks 19–20)

- [ ] Initialize React Native project (Expo or bare workflow) — 0.5d
- [ ] Shared API client package between web and mobile — 1d
- [ ] Auth screens: login, register, social login — 1.5d
- [ ] Bottom tab navigation: Library, Reader, Fragments, Account — 0.5d
- [ ] Library screen: book grid — 1d
- [ ] Book detail screen — 0.5d
- [ ] Reader screen: text + audio player — 2d
- [ ] Phrase-level sync on mobile — 1.5d

**Sprint 4.1 total: 10d**

---

### Sprint 4.2 — Mobile Fragments & Sharing (Weeks 21–22)

- [ ] Text selection and fragment capture on mobile — 1.5d
- [ ] Fragment Sheet screen — 1d
- [ ] Quote card preview screen — 1d
- [ ] Native share sheet integration — 0.5d
- [ ] Subscription paywall on mobile — 1d
- [ ] Push notification setup (Expo Notifications) — 1d

**Sprint 4.2 total: 7d** _(buffer for mobile-specific fixes)_

---

### Sprint 4.3 — Offline Mode (Weeks 23–24)

- [ ] Download book text to device storage — 1d
- [ ] Download audio file to device storage — 1d
- [ ] Offline-capable reader (read from local files) — 1d
- [ ] Offline-capable audio player (local file) — 0.5d
- [ ] Store fragments offline (AsyncStorage / SQLite) — 1d
- [ ] Sync progress and fragments when back online — 1.5d
- [ ] Download manager UI: progress, cancel, delete — 1d

**Sprint 4.3 total: 8d**

---

## Stage 5 — Launch & QA

> **Goal:** Production-ready platform — performance tuned, bugs fixed, monitoring in place.
> **Estimate:** 4 weeks · 2 sprints

---

### Sprint 5.1 — Performance & Monitoring (Weeks 25–26)

**Backend**
- [ ] Add Prometheus metrics to api service — 0.5d
- [ ] Grafana dashboards: API latency, error rate, queue depth — 1d
- [ ] CDN setup for MinIO assets (CloudFront or Cloudflare) — 1d
- [ ] Database query optimization and indexing audit — 1d
- [ ] API rate limiting and abuse protection — 0.5d
- [ ] Content streaming caching strategy — 0.5d

**Frontend**
- [ ] Next.js performance audit (Lighthouse) — 0.5d
- [ ] Image optimization (lazy loading, WebP covers) — 0.5d
- [ ] Code splitting and bundle size audit — 0.5d
- [ ] Error boundary and global error tracking (Sentry) — 1d

**Sprint 5.1 total: 8d**

---

### Sprint 5.2 — Beta QA & Launch Prep (Weeks 27–28)

- [ ] End-to-end test suite (Playwright): auth, reader, sharing flow — 2d _(unit tests already written per sprint; this covers integration + UI flows only)_
- [ ] Load testing: simulate 500 concurrent readers — 1d
- [ ] DRM audit: verify no raw file access leaks — 1d
- [ ] Accessibility audit (WCAG 2.1 AA) — 1d
- [ ] App Store submission (iOS) — 1d
- [ ] Google Play submission (Android) — 0.5d
- [ ] Privacy policy and terms of service pages — 0.5d
- [ ] Onboarding flow for new users — 1d
- [ ] Beta invite system and waitlist page — 0.5d

**Sprint 5.2 total: 9.5d**

---

## Summary

| Stage | Name                        | Sprints | Estimated Weeks | Testing overhead |
|-------|-----------------------------|---------|-----------------|------------------|
| 0     | Foundation                  | 1       | 2               | +1.5d (setup)    |
| 1     | Core Platform               | 3       | 6               | +2.5d            |
| 2     | Social Layer                | 3       | 6               | +2.5d            |
| 3     | Monetization & Publishers   | 2       | 4               | +1.5d            |
| 4     | Mobile & Offline            | 3       | 6               | included inline  |
| 5     | Launch & QA                 | 2       | 4               | —                |
| **—** | **Total**                   | **14**  | **~30 weeks**   | **+8d total**    |

> Estimates assume 1 senior full-stack developer. Unit tests are baked into each backend service task (see Definition of Done above). With a team of 2–3, total calendar time reduces to ~13–17 weeks depending on parallel workstreams.
