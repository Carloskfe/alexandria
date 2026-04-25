## MODIFIED Requirements

### Requirement: Authenticated user can save reading progress
The system SHALL allow an authenticated user with an active subscription (`status` in `['active', 'trialing', 'canceling']`) to record their last-read phrase index for a book via `POST /books/:id/progress` with body `{ phraseIndex: number }`. The endpoint SHALL upsert — one record per user+book pair. Users without an active subscription SHALL be rejected with 403.

#### Scenario: User saves progress for the first time
- **WHEN** an authenticated subscriber sends `POST /books/:id/progress` with `{ phraseIndex: 42 }` and no prior progress record exists
- **THEN** the system creates a new record and returns 201 with `{ userId, bookId, phraseIndex }`

#### Scenario: User updates existing progress
- **WHEN** an authenticated subscriber sends `POST /books/:id/progress` with a new `phraseIndex` and a prior record exists
- **THEN** the system updates the record and returns 200 with the updated `{ userId, bookId, phraseIndex }`

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated client sends `POST /books/:id/progress`
- **THEN** the system returns 401 Unauthorized

#### Scenario: Non-subscriber attempts to save progress
- **WHEN** an authenticated user with `status = none` or `status = canceled` sends `POST /books/:id/progress`
- **THEN** the system returns 403 `{ error: "subscription_required" }`

### Requirement: Authenticated user can retrieve their reading progress
The system SHALL allow an authenticated user to fetch their saved phrase index for a book via `GET /books/:id/progress`. If no progress record exists, the system SHALL return `{ phraseIndex: 0 }` (start of book).

#### Scenario: Progress record exists
- **WHEN** an authenticated user sends `GET /books/:id/progress` and a record exists
- **THEN** the system returns 200 with `{ userId, bookId, phraseIndex }`

#### Scenario: No progress record (first visit)
- **WHEN** an authenticated user sends `GET /books/:id/progress` and no record exists
- **THEN** the system returns 200 with `{ phraseIndex: 0 }`
