# Alexandria — Developer Guide

Alexandria is a multimodal reading + social sharing platform. For full product context see [`docs/PRD.md`](docs/PRD.md).

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Testing](#testing)

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
alexandria/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── docs/
│   └── PRD.md
│
├── services/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/               # Google, Facebook, Apple, email auth
│   │   │   ├── books/              # Book catalog, streaming, DRM
│   │   │   ├── fragments/          # Highlights and fragment sheets
│   │   │   ├── subscriptions/      # Stripe plans and billing
│   │   │   ├── authors/            # Author/publisher module
│   │   │   ├── sharing/            # Share engine, deep links
│   │   │   └── users/              # User profiles and settings
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                        # Next.js web app
│   │   ├── app/
│   │   │   ├── (reader)/           # Synchronized reading UI
│   │   │   ├── (library)/          # Book catalog and discovery
│   │   │   ├── (fragments)/        # Fragment sheet and editor
│   │   │   ├── (social)/           # Quote card preview and sharing
│   │   │   └── (admin)/            # Author/publisher dashboard
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── mobile/                     # React Native app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   └── offline/            # Offline sync logic
│   │   └── package.json
│   │
│   ├── image-gen/                  # Python image generation service
│   │   ├── app.py                  # Flask API
│   │   ├── templates/              # Quote card design templates
│   │   │   ├── linkedin.py
│   │   │   ├── instagram.py
│   │   │   ├── facebook.py
│   │   │   └── whatsapp.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── worker/                     # BullMQ async job processor
│       ├── src/
│       │   ├── jobs/
│       │   │   ├── image-render.job.ts
│       │   │   └── share-export.job.ts
│       │   └── index.ts
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
        └── buckets.sh              # Creates books/, audio/, images/ buckets
```

Each service that contains a `src/` directory also has a sibling `tests/unit/` directory that mirrors it exactly (see [Testing](#testing)).

---

## Testing

### Rule: Every service MUST have unit tests

For every service file created or modified, a corresponding unit test file MUST be created or updated in the same task. No service is considered "done" without its tests passing.

### File structure — Mirrored `tests/unit/` directory

All unit tests live under `tests/unit/` inside each service and MUST mirror the structure of `src/` exactly.

```
services/api/
├── src/
│   ├── books/
│   │   └── books.service.ts
│   └── users/
│       └── users.service.ts
└── tests/
    └── unit/
        ├── books/
        │   └── books.service.spec.ts
        └── users/
            └── users.service.spec.ts

services/image-gen/
├── templates/
│   └── linkedin.py
└── tests/
    └── unit/
        └── templates/
            └── test_linkedin.py
```

### Naming convention — per language

**TypeScript (api, worker, web, mobile):**
- Source:  `src/books/books.service.ts`
- Test:    `tests/unit/books/books.service.spec.ts`

The rule: **take the source path, replace `src/` with `tests/unit/`, and suffix the filename with `.spec`.**

**Python (image-gen):**
- Source:  `templates/linkedin.py`
- Test:    `tests/unit/templates/test_linkedin.py`

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
