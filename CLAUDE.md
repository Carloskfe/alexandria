# Noetia — Developer Guide

Noetia is a multimodal reading + social sharing platform. For full product context see [`docs/PRD.md`](docs/PRD.md).

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Testing](#testing)

---

## Git Workflow

After completing any meaningful unit of work, commit and push to GitHub immediately so progress is never lost.

**Commit after every:**
- Completed task or group of tasks from a sprint
- Bug fix or hotfix
- Config or infrastructure change
- Documentation update

**Commit message format:**
```
<type>: <short description>

Types: feat | fix | chore | docs | ci | refactor
```

**Examples:**
```
feat: add JWT auth endpoints to api service
fix: add missing public/ dir for Next.js web service
chore: bump actions/checkout to v5
docs: update project structure in CLAUDE.md
```

**Push after every commit:**
```bash
git add <specific files>
git commit -m "<type>: <description>"
git push
```

Never batch multiple unrelated changes into a single commit. Small, focused commits make it easy to track progress and revert if needed.

---

## Tech Stack

| Service     | Technology            | Purpose                                    |
|-------------|-----------------------|--------------------------------------------|
| `api`       | NestJS (Node.js + TS) | REST/GraphQL API, business logic           |
| `web`       | Next.js (React)       | Web reader + admin dashboard               |
| `mobile`    | React Native          | iOS + Android app, offline sync            |
| `db`        | PostgreSQL 16         | Users, books, fragments, subscriptions     |
| `cache`     | Redis 7               | Sessions, phrase-sync state, job queues    |
| `storage`   | MinIO                 | Books, audio files, generated images (S3)  |
| `image-gen` | Python + Pillow/Cairo | Quote card image generation microservice   |
| `worker`    | BullMQ (Node.js)      | Async jobs: image rendering, share exports |
| `proxy`     | Nginx                 | Reverse proxy, SSL termination             |
| `search`    | Meilisearch           | Book and fragment full-text search         |
| `monitor`   | Grafana + Prometheus  | Metrics and alerting                       |

**Supporting services:** Supabase Auth or Auth.js (social login), Stripe (subscriptions)

---

## Project Structure

```
noetia/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── docs/
│   ├── PRD.md
│   ├── TASKS.md
│   └── stripe-setup.md
│
├── services/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/               # Google, Facebook, Apple, email auth
│   │   │   │   ├── auth.service.ts     # register, confirmEmail, resendConfirmation
│   │   │   │   ├── token.service.ts    # JWT, refresh, pwd-reset, email-confirm tokens
│   │   │   │   └── redis.provider.ts
│   │   │   ├── email/              # Email delivery (nodemailer, SMTP)
│   │   │   │   ├── email.service.ts    # sendEmailConfirmation, sendPasswordReset
│   │   │   │   └── email.module.ts
│   │   │   ├── books/              # Book catalog, streaming, DRM, sync maps
│   │   │   ├── fragments/          # Highlights and fragment sheets
│   │   │   ├── subscriptions/      # Stripe plans and billing
│   │   │   ├── authors/            # Author/publisher module
│   │   │   ├── sharing/            # Share engine, deep links
│   │   │   ├── social/             # OAuth account linking + publish per platform
│   │   │   │   ├── social.controller.ts
│   │   │   │   ├── social-token.service.ts   # AES-256-CBC encrypted tokens in Redis
│   │   │   │   ├── social-oauth.config.ts    # Shared platform OAuth config (LinkedIn, FB, IG, Pinterest)
│   │   │   │   └── publishers/
│   │   │   │       ├── linkedin.publisher.ts
│   │   │   │       ├── facebook.publisher.ts
│   │   │   │       ├── instagram.publisher.ts
│   │   │   │       └── pinterest.publisher.ts
│   │   │   ├── library/            # User library, access control
│   │   │   ├── ingestion/          # Book ingestion (Gutenberg, Librivox, Wikisource)
│   │   │   ├── search/             # Meilisearch integration
│   │   │   ├── storage/            # MinIO S3 client
│   │   │   ├── users/              # User profiles and settings
│   │   │   └── migrations/         # TypeORM migrations (see §Database Migrations)
│   │   ├── tests/unit/             # Mirrors src/ exactly
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                        # Next.js web app
│   │   ├── app/
│   │   │   ├── (reader)/           # Synchronized reading UI + Modo Escucha Activa
│   │   │   ├── (library)/          # Book catalog and discovery
│   │   │   ├── (fragments)/        # Fragment sheet and editor
│   │   │   ├── (social)/           # Quote card preview and sharing
│   │   │   └── (admin)/            # Author/publisher dashboard
│   │   ├── components/
│   │   │   ├── ReaderTopBar.tsx    # "Mi Biblioteca" + "Colección General" (books icon)
│   │   │   └── ShareModal.tsx      # Instagram, Facebook, LinkedIn, Pinterest formats
│   │   ├── lib/
│   │   │   └── share-utils.ts      # SharePlatform, ShareFormat, FORMAT_PLATFORM_MAP
│   │   ├── public/
│   │   │   ├── covers/             # Placeholder book cover PNGs (generated by image-gen scripts)
│   │   │   ├── backgrounds/        # imagen-1..5.png + upload-slot.png (preset backgrounds)
│   │   │   └── presets/            # Font preview thumbnails
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── mobile/                     # React Native app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   └── offline/            # Offline sync logic
│   │   └── package.json
│   │
│   ├── image-gen/                  # Python image generation service
│   │   ├── app.py                  # Flask API — POST /generate
│   │   ├── storage.py              # MinIO client (supports MINIO_PUBLIC_URL rewrite)
│   │   ├── templates/              # Quote card design templates
│   │   │   ├── base.py             # Core Pillow render_card, gradient, luminance utils
│   │   │   ├── linkedin.py         # 1200×627 (post), 1200×675 (twitter-card)
│   │   │   ├── instagram.py        # 1080×1080 (post), 1080×1920 (story/reel)
│   │   │   ├── facebook.py         # 1200×630 (post), 1080×1920 (story/reel)
│   │   │   ├── pinterest.py        # 1000×1500 (pin), 1000×1000 (pin-square)
│   │   │   └── whatsapp.py         # kept for backwards compatibility
│   │   ├── scripts/
│   │   │   ├── generate_book_covers.py   # Generates placeholder covers for 12 initial books
│   │   │   ├── generate_bg_presets.py    # Generates imagen-1..5 + upload-slot placeholders
│   │   │   └── generate_presets.py       # Font preview thumbnails for ShareModal
│   │   ├── tests/unit/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── worker/                     # BullMQ async job processor
│       ├── src/jobs/
│       │   ├── image-render.job.ts
│       │   └── share-export.job.ts
│       ├── Dockerfile
│       └── package.json
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
└── infra/
    ├── postgres/
    │   └── init.sql
    ├── redis/
    │   └── redis.conf
    └── minio/
        └── buckets.sh              # Creates buckets + folder structure:
                                    #   books/covers/
                                    #   images/share/
                                    #   images/backgrounds/presets/
                                    #   images/backgrounds/user/
```

Each service that contains a `src/` directory also has a sibling `tests/unit/` directory that mirrors it exactly (see [Testing](#testing)).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values. Key variables:

### API
| Variable | Default | Notes |
|----------|---------|-------|
| `JWT_SECRET` | `changeme` | **Change in production** |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `WEB_URL` | `http://localhost:3000` | Used in email confirmation + reset links |
| `API_URL` | `http://localhost:4000` | Used as OAuth callback base URL |

### Email (SMTP)
| Variable | Default | Notes |
|----------|---------|-------|
| `SMTP_HOST` | `mailhog` | Dev: Mailhog; Prod: SendGrid, SES, etc. |
| `SMTP_PORT` | `1025` | |
| `SMTP_SECURE` | `false` | Set `true` for port 465 |
| `SMTP_USER` | _(empty)_ | Leave empty for Mailhog |
| `SMTP_PASS` | _(empty)_ | |
| `SMTP_FROM` | `Noetia <noreply@noetia.app>` | Sender name + address |

### MinIO / Storage
| Variable | Default | Notes |
|----------|---------|-------|
| `MINIO_ENDPOINT` | `storage` | Docker service name |
| `MINIO_PORT` | `9000` | |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | **Required** — rewrites internal Docker hostname in presigned URLs so browsers can download images. Set to CDN/public URL in production. |
| `MINIO_ACCESS_KEY` | `minioadmin` | **Change in production** |
| `MINIO_SECRET_KEY` | `changeme` | **Change in production** |

### Social OAuth (account linking for sharing)
| Variable | Notes |
|----------|-------|
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn app credentials |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Meta app credentials |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | Instagram Basic Display API |
| `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET` | Pinterest developer app |
| `SOCIAL_TOKEN_SECRET` | AES-256 key for encrypting stored tokens — **change in production** |
| `INSTAGRAM_PUBLISH_ENABLED` | `false` — set `true` only after Meta App Review |

### Sentry (error tracking)
Leave all Sentry vars empty in development — the SDK skips initialization when DSN is absent.

| Variable | Notes |
|----------|-------|
| `SENTRY_DSN` | API (server-side) DSN from your Sentry project |
| `NEXT_PUBLIC_SENTRY_DSN` | Web (browser-side) DSN — same or separate project |
| `SENTRY_ORG` | Sentry org slug (for source-map uploads during CI build) |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Token for source-map uploads — set in CI secrets only |

### Stripe
See [`docs/stripe-setup.md`](docs/stripe-setup.md) for full setup instructions.

---

## Database Migrations

Migrations live in `services/api/src/migrations/` and are named `<timestamp>-<Description>.ts`.

**Run pending migrations inside the API container:**
```bash
docker compose exec api npm run migration:run
```

**Current migration history:**

| # | Migration | Description |
|---|-----------|-------------|
| 000 | `CreateUsersTable` | users table with auth fields |
| 001 | `AddUserType` | userType enum (personal, author, editorial) |
| 002 | `AddUserPreferences` | country, languages, interests |
| 003 | `AddUpdatedAt` | updatedAt timestamp |
| 004 | `CreateBooksTable` | books with category, audio/text keys |
| 005 | `CreateSyncMapsAndProgress` | phrase sync maps + reading progress |
| 006 | `CreateFragments` | user highlights |
| 007 | `CreatePlansTable` | subscription plans |
| 008 | `AddStripeCustomerId` | stripeCustomerId on users |
| 009 | `CreateSubscriptions` | subscriptions + book_purchases |
| 010 | `SeedPlans` | Individual + Reader plan seed data |
| 011 | `MakeFragmentPhraseIndicesNullable` | |
| 012 | `AddFreeLibrary` | isFree flag on books |
| 013 | `AddAudioStreamKey` | audioStreamKey on books |
| 014 | `AddUploadedBy` | uploadedById foreign key |
| 015 | `CreateUserBooksTable` | user library ownership |
| 016 | `CreateCollectionsTable` | book collections/series |
| 017 | `AddBookPriceCents` | per-title price in cents |
| 018 | `AddUserBookPurchaseType` | purchase vs credit redemption |
| 019 | `AddSubscriptionCredits` | creditBalance on subscriptions |
| 020 | `AddPlanCreditsPerCycle` | creditsPerCycle on plans |
| 021 | `AddHostingTier` | hostingTier enum on users |
| 022 | `AddBookAnalytics` | shareCount on books |
| 023 | `AddEmailConfirmed` | emailConfirmed boolean (default true for existing users; new local registrations start false) |
| 024 | `AddBookCollection` | collection varchar on books; auto-seeds Bible books with collection='Biblia' |
| 025 | `SeedCollectionsFromBookField` | Populates collections table from existing books.collection values |
| 026 | `FixCollectionsAndCovers` | Corrects collection slugs and adds themed cover URLs |
| 027 | `FixCollectionDataFinal` | Normalizes empty string → NULL, canonical Bible order, excludes Blasco Ibáñez |
| 028 | `UpdateThemedCoverUrls` | Sets /covers/*.png paths for 10 books + 2 collections |
| 029 | `LiteraturaInfantilCoverUrls` | Cover URLs for Literatura Infantil books (superseded by migration 030) |
| 030 | `CleanupLiteraturaInfantil` | Removes La Edad de Oro and Literatura Infantil collection; Pombo/Quiroga → standalone |
| 031 | `FixCuentosSelvaLanguage` | Deletes English Gutenberg text; re-ingested from Spanish Wikisource |

---

## Testing

### Rule: Every service MUST have unit tests

For every service file created or modified, a corresponding unit test file MUST be created or updated in the same task. No service is considered "done" without its tests passing.

### File structure — Mirrored `tests/unit/` directory

All unit tests live under `tests/unit/` inside each service and MUST mirror the structure of `src/` exactly.

```
services/api/
├── src/
│   ├── auth/
│   │   └── auth.service.ts
│   └── email/
│       └── email.service.ts
└── tests/
    └── unit/
        ├── auth/
        │   ├── auth.service.spec.ts
        │   ├── email.service.spec.ts   ← mirrors src/email/
        │   └── token.service.spec.ts
        └── social/
            ├── social.controller.spec.ts
            └── social-token.service.spec.ts

services/image-gen/
├── templates/
│   └── pinterest.py
└── tests/
    └── unit/
        └── templates/
            └── test_pinterest.py
```

### Naming convention — per language

**TypeScript (api, worker, web, mobile):**
- Source:  `src/books/books.service.ts`
- Test:    `tests/unit/books/books.service.spec.ts`

The rule: **take the source path, replace `src/` with `tests/unit/`, and suffix the filename with `.spec`.**

**Python (image-gen):**
- Source:  `templates/pinterest.py`
- Test:    `tests/unit/templates/test_pinterest.py`

The rule: **take the source path, prepend `tests/unit/` to the directory, and prefix the filename with `test_`.**

### Non-negotiable behaviors

- NEVER create a service file without also creating its corresponding test file under `tests/unit/` following the mirrored structure above.
- NEVER place test files inside `src/`, `/docs/`, or any other directory.
- Tests must cover: happy path, edge cases, and error/failure scenarios.
- Every public method in the service must have at least one test.
- Mock ALL external dependencies (databases, APIs, third-party clients). No test should touch a real database or make a real network call.
- Tests must be fully isolated — no shared state between test cases.

### Run commands per service

| Service     | Run tests                        | Run with coverage                          | Coverage threshold |
|-------------|----------------------------------|--------------------------------------------|--------------------|
| `api`       | `npm run test`                   | `npm run test:cov`                         | 80%                |
| `worker`    | `npm run test`                   | `npm run test:cov`                         | 80%                |
| `web`       | `npm run test`                   | `npm run test:cov`                         | 80%                |
| `mobile`    | `npm run test`                   | `npm run test -- --coverage`               | 80%                |
| `image-gen` | `pytest`                         | `pytest --cov=. --cov-report=term-missing` | 80%                |

### Before marking any task complete, verify

- [ ] A test file exists at the correct mirrored path under `tests/unit/`
- [ ] The test file name follows the naming convention for its language (`.spec.ts` / `test_*.py`)
- [ ] All tests pass with the run command above
- [ ] Coverage for the modified service is above 80%
- [ ] No test depends on a real database or external network call
