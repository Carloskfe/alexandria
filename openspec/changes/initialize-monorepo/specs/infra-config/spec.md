## ADDED Requirements

### Requirement: PostgreSQL initializes with base schema
The `infra/postgres/init.sql` file SHALL create a `public` schema and an `extensions` block enabling `uuid-ossp` and `pgcrypto`, and SHALL NOT create any application tables (those are managed by TypeORM migrations).

#### Scenario: Database initializes on first start
- **WHEN** the PostgreSQL container starts for the first time with `init.sql` mounted
- **THEN** the extensions are enabled and the database accepts connections from the api service

### Requirement: Redis is configured for persistence and memory limits
The `infra/redis/redis.conf` file SHALL configure Redis with `appendonly yes` (AOF persistence), `maxmemory 256mb`, and `maxmemory-policy allkeys-lru`.

#### Scenario: Redis starts with custom config
- **WHEN** the Redis container starts with `redis.conf` mounted
- **THEN** Redis logs confirm AOF is enabled and the memory limit is applied

### Requirement: MinIO buckets are created on startup
The `infra/minio/buckets.sh` script SHALL use the MinIO client (`mc`) to create three buckets: `books`, `audio`, and `images` — with appropriate access policies (books and audio private, images public-read).

#### Scenario: Buckets are created
- **WHEN** `buckets.sh` is run after MinIO starts
- **THEN** all three buckets exist and the `images` bucket allows anonymous GET requests

#### Scenario: Script is idempotent
- **WHEN** `buckets.sh` is run a second time on an already-initialized MinIO instance
- **THEN** the script completes without error (no duplicate bucket error)
