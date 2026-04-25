## ADDED Requirements

### Requirement: Premium routes require active subscription
The system SHALL apply a `SubscriptionGuard` to all premium API routes (books content, reader endpoints). The guard SHALL allow access only when the authenticated user has a subscription with `status` in `['active', 'trialing', 'canceling']`.

#### Scenario: Active subscriber accesses premium content
- **WHEN** a user with `status = active` requests a guarded route
- **THEN** the request proceeds normally

#### Scenario: Trialing user accesses premium content
- **WHEN** a user with `status = trialing` and a future `trial_end` date requests a guarded route
- **THEN** the request proceeds normally

#### Scenario: Non-subscriber accesses premium content
- **WHEN** a user with `status = none` or `status = canceled` requests a guarded route
- **THEN** the API returns 403 `{ error: "subscription_required" }`

#### Scenario: Past-due subscriber accesses premium content
- **WHEN** a user with `status = past_due` requests a guarded route
- **THEN** the API returns 403 `{ error: "payment_required", billingPortalHint: true }`

### Requirement: Unauthenticated requests rejected before subscription check
The system SHALL apply `AuthGuard` before `SubscriptionGuard`. Unauthenticated requests SHALL be rejected with 401 before subscription status is checked.

#### Scenario: Unauthenticated request to premium route
- **WHEN** a request with no valid auth token hits a guarded route
- **THEN** the API returns 401 `{ error: "unauthorized" }` without checking subscription status
