## ADDED Requirements

### Requirement: Users table stores account data
The system SHALL maintain a `users` table in PostgreSQL. TypeORM entity: `src/users/user.entity.ts`. A TypeORM migration SHALL create and evolve this table.

**Current columns:**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | gen_random_uuid() |
| `email` | varchar unique nullable | Nullable for Apple users without email |
| `passwordHash` | varchar nullable | Null for OAuth users |
| `provider` | enum | `local` \| `google` \| `facebook` \| `apple` |
| `providerId` | varchar nullable | OAuth provider user ID |
| `name` | varchar nullable | |
| `avatarUrl` | varchar nullable | |
| `userType` | enum nullable | `personal` \| `author` \| `editorial` |
| `country` | varchar nullable | |
| `languages` | simple-array nullable | |
| `interests` | simple-array nullable | |
| `stripeCustomerId` | varchar nullable | Set on first Stripe checkout |
| `hostingTier` | enum | `basic` \| `starter` \| `pro` (default: `basic`) |
| `emailConfirmed` | boolean | Default `true` for existing users; new local registrations start `false` |
| `isAdmin` | boolean | Default `false` |
| `createdAt` | timestamptz | Auto |
| `updatedAt` | timestamptz | Auto |
| `lastLoginAt` | timestamptz nullable | Updated on every login |

### Requirement: Email confirmation for local registrations
When a user registers with email + password (`provider = 'local'`), `emailConfirmed` is set to `false` and a confirmation email is sent via `EmailService.sendEmailConfirmation()`. The confirmation token is stored in Redis under `email_confirm:{token}` with a 24-hour TTL.

Endpoints:
- `GET /auth/confirm-email?token=<token>` — confirms the email, sets `emailConfirmed = true`, returns JWT
- `POST /auth/resend-confirmation` (JWT-protected) — resends confirmation email if still unconfirmed

OAuth registrations (Google, Facebook, Apple) are created with `emailConfirmed = true` — the email is verified by the provider.

#### Scenario: Migration creates users table
- **WHEN** TypeORM migrations are run against a fresh database
- **THEN** the `users` table exists with all required columns and constraints

#### Scenario: Email uniqueness is enforced
- **WHEN** two users with the same email are inserted
- **THEN** the database rejects the second insert with a unique constraint violation

#### Scenario: New local user has emailConfirmed = false
- **WHEN** a user registers with email + password
- **THEN** the created user record has `emailConfirmed = false`

#### Scenario: New OAuth user has emailConfirmed = true
- **WHEN** a user signs in via Google/Facebook/Apple
- **THEN** the created user record has `emailConfirmed = true`

#### Scenario: Confirmation email is sent on register
- **WHEN** a user registers with email + password
- **THEN** `EmailService.sendEmailConfirmation()` is called with the user's email and a generated token

#### Scenario: Valid confirmation token activates the account
- **WHEN** `GET /auth/confirm-email?token=<valid-token>` is called
- **THEN** `emailConfirmed` is set to `true` and a JWT is returned

### Requirement: User profile can be retrieved and updated
`GET /users/me` returns the authenticated user's profile. `PATCH /users/me` updates `name` and `avatarUrl`. Both require a valid JWT.

#### Scenario: Authenticated user retrieves profile
- **WHEN** `GET /users/me` is called with a valid JWT
- **THEN** HTTP 200 with id, email, name, avatarUrl, userType, emailConfirmed, createdAt

#### Scenario: Unauthenticated request is rejected
- **WHEN** `GET /users/me` is called without a JWT
- **THEN** HTTP 401
