# Noetia — Project Stages, Sprints & Tasks

> **Current status (2026-05-06):** Stages 0–3 and Stage 4 offline/mobile shell are **complete**. Stage 5 E2E tests are done. Remaining: Stage 5 performance/monitoring, app store submissions, and a P3 backlog of UI improvements (see below).
>
> **Pending migrations to run:**
> ```bash
> docker compose exec api npm run migration:run
> ```
> This applies migration 023 (emailConfirmed) and 024 (bookCollection).
>
> **P3 UI backlog (not yet in sprints):**
> - ~~Fragment text editing before image creation (E1)~~ ✅ done
> - ~~Citation location in fragment image (E2)~~ ✅ done
> - Hex color picker for background in ShareModal (D3)
> - Gradient direction options (D4)
> - Integrate background preset images into ShareModal UI (D7)
> - Bible / volume collection grouping in Library UI (B2/B3 — migration done, UI pending)
> - **Profile page** — build `/profile` screen with customer-facing fields:
>   name, avatar, email (read-only), account type (personal/author/editorial),
>   country, preferred languages, reading interests, subscription status,
>   connected social accounts, and "Editar perfil" flow.
>   Currently the route exists but the page is empty.
> - **Bottom nav** — "Mi Biblioteca" and "Colección General" names + icons aligned ✅ done

**Estimation key:** Each task is estimated in days (1 dev). Sprints are 2 weeks (10 working days).
**Legend:** `[ ]` pending · `[x]` done · `[~]` in progress

> **Definition of Done — mandatory for all service tasks**
> A backend task is NOT complete until:
> - [x] A unit test file exists at the mirrored path under `tests/unit/`
> - [x] Tests cover happy path, edge cases, and error scenarios for every public method
> - [x] All tests pass (`npm run test` / `pytest`)
> - [x] Coverage for the modified service is ≥ 80% (`npm run test:cov` / `pytest --cov`)
> - [x] No test touches a real database or makes a real network call
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
- [x] Initialize monorepo structure and Git repository — 0.5d
- [x] Write `docker-compose.yml` with all services (api, web, db, cache, storage, proxy) — 1d
- [x] Write `docker-compose.prod.yml` with production overrides — 0.5d
- [x] Configure `.env.example` with all required variables — 0.5d
- [x] Set up Nginx reverse proxy with routing rules — 0.5d
- [x] Initialize MinIO and create buckets: `books/`, `audio/`, `images/` — 0.5d
- [x] Set up PostgreSQL with `init.sql` base schema — 1d
- [x] Set up Redis with `redis.conf` — 0.5d

**Testing Setup**
- [x] Configure Jest + coverage in `api` and `worker` (80% threshold, `tests/unit/` root) — 0.5d
- [x] Configure Jest + coverage in `web` and `mobile` (80% threshold, `tests/unit/` root) — 0.5d
- [x] Configure pytest + pytest-cov in `image-gen` (80% threshold, `tests/unit/` root) — 0.5d

**CI/CD**
- [x] Configure GitHub Actions: lint, test (with coverage gate ≥ 80%), build on PR — 1d
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
- [x] Set up NestJS project with TypeScript, ESLint, Prettier — 0.5d
- [x] Configure database connection with TypeORM and migrations — 0.5d
- [x] Create `users` table and entity — 0.5d
- [x] Implement email + password auth (register, login, JWT) — 1d
- [x] Email confirmation on registration (24h token via SMTP/nodemailer; OAuth users auto-confirmed) — 0.5d
- [x] Password recovery via email reset link (EmailService, SMTP env vars) — 0.5d
- [x] Integrate Google OAuth — 0.5d
- [x] Integrate Facebook OAuth — 0.5d
- [x] Integrate Apple Sign-In — 1d
- [x] Auth guards, refresh tokens, and logout — 1d
- [x] User profile endpoints (GET, PATCH, DELETE) — 0.5d
- [x] Unit tests: `auth.service`, `users.service` (mock DB, cover happy path + errors) — 1d

**Frontend (web)**
- [x] Set up Next.js project with TypeScript and Tailwind — 0.5d
- [x] Build login page (email/password + social buttons) — 1d
- [x] Build register page — 0.5d
- [x] Auth context and session persistence — 0.5d
- [x] Protected route wrapper — 0.5d

**Sprint 1.1 total: 10d** _(1d added for auth/user unit tests)_

---

### Sprint 1.2 — Content Library (Weeks 5–6)

**Backend (api)**
- [x] Create `books`, `authors`, `categories` tables and entities — 1d
- [x] Book CRUD endpoints (admin only) — 1d
- [x] Upload book text (EPUB/HTML) to MinIO — 1d
- [x] Upload audio file to MinIO — 0.5d
- [x] Streaming endpoint for audio (range requests, DRM headers) — 1d
- [x] Streaming endpoint for book text (encrypted, chunked) — 1d
- [x] Book search endpoint (Meilisearch integration) — 1d
- [x] Unit tests: `books.service`, `storage.service`, `search.service` (mock MinIO + Meilisearch) — 1d

**Frontend (web)**
- [x] Library page: book grid with cover, title, author — 1d
- [x] Book detail page: description, author, CTA — 0.5d
- [x] Category filter and search bar — 1d

**Sprint 1.2 total: 10d** _(1d added for books/storage/search unit tests)_

---

### Sprint 1.3 — Synchronized Reading Engine (Weeks 7–8)

**Backend (api)**
- [x] Design and store phrase-level sync map (JSON: phrase → timestamp) — 1d
- [x] Endpoint to fetch sync map for a given book — 0.5d
- [x] Reading progress endpoint (save/restore position by phrase index) — 0.5d
- [x] Unit tests: `sync-map.service`, `progress.service` (mock DB) — 0.5d

**Frontend (web)**
- [x] Reader layout: text column + audio controls — 1d
- [x] Render book text split into phrase spans — 1d
- [x] Audio player component (play/pause, scrub, speed 0.75×–2×) — 1d
- [x] Phrase highlight: sync audio time → active phrase highlight — 1.5d
- [x] Click phrase → seek audio to corresponding timestamp — 1d
- [x] Seamless switch: Reading → Listening (preserve position) — 0.5d
- [x] Seamless switch: Listening → Reading (scroll to active phrase) — 0.5d
- [x] Persist and restore reading progress — 0.5d
- [x] **Hybrid mode**: new reader mode — audio plays + full text visible + active phrase highlighted — 1d
  - Add `'hybrid'` to the mode state machine alongside `'reading'` and `'listening'`
  - Disable text selection (`user-select: none` + `onMouseDown` guard) while in hybrid mode
  - Display a "Hybrid" badge in the top bar with a one-tap exit button
  - Resume seamlessly: exiting hybrid mode pauses audio and enables selection at the current phrase
  - Unit tests: mode transition guards and selection-disabled behavior — 0.5d

**Sprint 1.3 total: 13d** _(hybrid mode adds 1.5d; 0.5d for sync/progress unit tests)_

---

## Stage 2 — Social Layer

> **Goal:** Fragment capture, quote card generation, and sharing — the core differentiator.
> **Estimate:** 6 weeks · 3 sprints

---

### Sprint 2.1 — Highlight & Fragment System (Weeks 9–10)

**Backend (api)**
- [x] Create `fragments` and `fragment_sheets` tables and entities — 1d
- [x] Fragment CRUD endpoints (create, read, update, delete) — 1d
- [x] Combine multiple fragments into a single selection — 1d
- [x] Fragment Sheet endpoint: list all fragments for a book/user — 0.5d
- [x] Unit tests: `fragments.service`, `fragment-sheets.service` (mock DB) — 0.5d

**Frontend (web)**
- [x] Text selection handler in reader (mouse + touch) — 1d
- [x] Highlight popover: "Save as Fragment" action — 0.5d
- [x] Fragment Sheet panel: list, edit, delete fragments — 1.5d
- [x] Combine fragments: multi-select + merge UI — 1d
- [x] Visual distinction between saved highlights in reader — 0.5d

**Sprint 2.1 total: 9.5d** _(0.5d added for fragments unit tests)_

---

### Sprint 2.2 — Image Generation Service (Weeks 11–12)

**image-gen service (Python)**
- [x] Set up Flask API with health check endpoint — 0.5d
- [x] Design LinkedIn quote card template (1200×627px) — 1d
- [x] Design Instagram quote card template (1080×1080px) — 1d
- [x] Design Facebook quote card template (1200×630px) — 0.5d
- [x] Design Pinterest quote card template (1000×1500 pin, 1000×1000 square) — replaces WhatsApp — 0.5d
- [x] Render endpoint: accept fragment + platform → return image — 1d
- [x] Upload generated image to MinIO `images/` bucket (MINIO_PUBLIC_URL rewrite for browser access) — 0.5d
- [x] Noetia watermark overlay — 0.5d
- [x] Font rendering for Spanish characters — 0.5d
- [x] Unit tests: `test_linkedin.py`, `test_instagram.py`, `test_facebook.py`, `test_pinterest.py` (mock MinIO, no network) — 1d

**worker service (BullMQ)**
- [x] Set up BullMQ worker connected to Redis — 0.5d
- [x] `image-render` job: call image-gen service + store result URL — 1d
- [x] Job status endpoint in api (pending / done / failed) — 0.5d
- [x] Unit tests: `image-render.job.spec.ts` (mock image-gen HTTP client + Redis) — 0.5d

**Frontend (web)**
- [x] Quote card preview modal: select platform format — 1d
- [x] Trigger image generation job, poll for result — 0.5d
- [x] Display rendered card preview — 0.5d

**Sprint 2.2 total: 11.5d** _(1.5d added for image-gen + worker unit tests)_

---

### Sprint 2.3 — Sharing Engine (Weeks 13–14)

**Backend (api)**
- [x] Share record endpoint: log share event (platform, fragment, user) — 0.5d
- [x] Signed URL generation for image download from MinIO — 0.5d
- [x] Unit tests: `sharing.service` (mock MinIO signed URL, mock DB) — 0.5d

**Frontend (web)**
- [x] "Share" button: native share sheet (Web Share API) — 0.5d
- [x] Platform-specific share links (LinkedIn, Instagram, Facebook, Pinterest) — 1.5d
- [x] Social OAuth account linking + direct publish (LinkedIn, Facebook, Instagram, Pinterest) — 1d
- [x] Fix download/copy link (MINIO_PUBLIC_URL presigned URL rewrite) — 0.5d
- [x] "Download image" fallback — 0.5d
- [x] Share confirmation feedback (toast notification) — 0.5d

**Sprint 2.3 total: 5.5d** _(0.5d added for sharing unit tests; light sprint — buffer for Stage 1–2 carry-over)_

---

## Stage 3 — Monetization & Publishers

> **Goal:** Paid subscriptions and author upload portal working end-to-end.
> **Estimate:** 4 weeks · 2 sprints

---

### Sprint 3.1 — Subscription & Payments (Weeks 15–16)

> Payment model: Audible-style hybrid. Users can buy titles individually (pay-per-title) or subscribe monthly to receive credits (1 credit = 1 book of any price). Individual plan = 1 credit/month; Reader plan = 2 credits/month. Credits expire at cycle end.

**Backend (api)**
- [x] Create `plans` table: Individual ($9.99/mo, 1 credit) and Reader ($14.99/mo, 2 credits) with annual variants — 0.5d
- [x] Create `subscriptions` table (userId, planId, status, creditBalance, currentPeriodEnd, trialEnd) — 0.5d
- [x] Create `book_purchases` table: record per-title purchases and credit redemptions — 0.5d
- [x] Stripe integration: create customer on sign-up — 0.5d
- [x] Stripe Checkout: redirect for subscription plans — 1d
- [x] Stripe Checkout: redirect for pay-per-title purchases — 0.5d
- [x] Stripe webhooks: activate/cancel subscription; issue credits on `invoice.paid` — 1d
- [x] Credit redemption endpoint `POST /api/library/redeem`: deduct 1 credit, record book_purchase — 0.5d
- [x] Free trial logic (14-day gate) — 0.5d
- [x] Content access guard: allow if book_purchase record exists OR active subscription with content access — 1d
- [x] Subscription status endpoint `GET /api/subscriptions/me` (status, creditBalance, plan) — 0.5d
- [x] Unit tests: `subscriptions.service`, `purchases.service`, `access-guard` (mock Stripe SDK, mock DB) — 1d

**Frontend (web)**
- [x] Pricing page: plan comparison table (pay-per-title + subscription plans side by side) — 1d
- [x] Book detail page: show list price + "Buy" button; "Use a Credit" button for subscribers — 0.5d
- [x] Credit balance indicator in user account page — 0.5d
- [x] Checkout flow for both subscription and per-title purchase — 0.5d
- [x] Paywall prompt: offer subscribe or buy-now for locked content — 0.5d
- [x] Post-payment success/cancel pages — 0.5d

**Sprint 3.1 total: 11.5d** _(1d added for unit tests; +2d for credit + per-title purchase mechanics)_

---

### Sprint 3.2 — Author / Publisher Module (Weeks 17–18)

**Backend (api)**
- [x] Create `publishers` table and role — 0.5d
- [x] Publisher registration and approval flow — 1d
- [x] Book upload endpoint: text + audio + metadata + cover — 1d
- [x] Hosting tier enforcement (1 / 3 / 12 books per tier) — 0.5d
- [x] Analytics endpoints: downloads, reads, shares per book — 1d
- [x] Revenue sharing record model — 0.5d
- [x] Unit tests: `publishers.service`, `analytics.service` (mock DB, mock MinIO) — 0.5d

**Frontend (web)**
- [x] Publisher registration page — 0.5d
- [x] Publisher dashboard: book list, upload form — 1.5d
- [x] Analytics charts per book (Recharts or Chart.js) — 1d
- [x] Upload progress indicator (large audio files) — 0.5d

**Sprint 3.2 total: 8.5d** _(0.5d added for publishers/analytics unit tests)_

---

## Stage 4 — Mobile & Offline

> **Goal:** React Native app with full feature parity and offline support.
> **Estimate:** 6 weeks · 3 sprints

---

### Sprint 4.1 — React Native App Shell (Weeks 19–20)

- [x] Initialize React Native project (Expo or bare workflow) — 0.5d
- [x] Shared API client package between web and mobile — 1d
- [x] Auth screens: login, register, social login — 1.5d
- [x] Bottom tab navigation: Library, Reader, Fragments, Account — 0.5d
- [x] Library screen: book grid — 1d
- [x] Book detail screen — 0.5d
- [x] Reader screen: text + audio player — 2d
- [x] Phrase-level sync on mobile — 1.5d

**Sprint 4.1 total: 10d**

---

### Sprint 4.2 — Mobile Fragments & Sharing (Weeks 21–22)

- [x] Text selection and fragment capture on mobile — 1.5d
- [x] Fragment Sheet screen — 1d
- [x] Quote card preview screen — 1d
- [x] Native share sheet integration — 0.5d
- [x] Subscription paywall on mobile — 1d
- [x] Push notification setup (Expo Notifications) — 1d

**Sprint 4.2 total: 7d** _(buffer for mobile-specific fixes)_

---

### Sprint 4.3 — Offline Mode (Weeks 23–24)

- [x] Download book text to device storage — 1d
- [x] Download audio file to device storage — 1d
- [x] Offline-capable reader (read from local files) — 1d
- [x] Offline-capable audio player (local file) — 0.5d
- [x] Store fragments offline (AsyncStorage / SQLite) — 1d
- [x] Sync progress and fragments when back online — 1.5d
- [x] Download manager UI: progress, cancel, delete — 1d

**Sprint 4.3 total: 8d**

---

## Stage 5 — Launch & QA

> **Goal:** Production-ready platform — performance tuned, bugs fixed, monitoring in place.
> **Estimate:** 4 weeks · 2 sprints

---

### Sprint 5.1 — Performance & Monitoring (Weeks 25–26)

**Backend**
- [x] Add Prometheus metrics to api service — 0.5d
- [x] Grafana dashboards: API latency, error rate, queue depth — 1d
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

- [x] End-to-end test suite (Playwright): auth, reader, sharing flow — 2d _(unit tests already written per sprint; this covers integration + UI flows only)_
- [ ] Load testing: simulate 500 concurrent readers — 1d
- [ ] DRM audit: verify no raw file access leaks — 1d
- [ ] Accessibility audit (WCAG 2.1 AA) — 1d
- [ ] App Store submission (iOS) — 1d
- [ ] Google Play submission (Android) — 0.5d
- [x] Privacy policy and terms of service pages — 0.5d
- [x] Onboarding flow for new users — 1d
- [ ] Beta invite system and waitlist page — 0.5d

**Sprint 5.2 total: 9.5d**

---

## Summary

| Stage | Name                        | Sprints | Estimated Weeks | Testing overhead |
|-------|-----------------------------|---------|-----------------|------------------|
| 0     | Foundation                  | 1       | 2               | +1.5d (setup)    |
| 1     | Core Platform               | 3       | 6               | +4d (incl. hybrid mode) |
| 2     | Social Layer                | 3       | 6               | +2.5d            |
| 3     | Monetization & Publishers   | 2       | 4               | +1.5d            |
| 4     | Mobile & Offline            | 3       | 6               | included inline  |
| 5     | Launch & QA                 | 2       | 4               | —                |
| **—** | **Total**                   | **14**  | **~30 weeks**   | **+9.5d total**  |

> Estimates assume 1 senior full-stack developer. Unit tests are baked into each backend service task (see Definition of Done above). With a team of 2–3, total calendar time reduces to ~13–17 weeks depending on parallel workstreams.
