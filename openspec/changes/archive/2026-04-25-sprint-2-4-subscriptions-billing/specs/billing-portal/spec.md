## ADDED Requirements

### Requirement: Billing portal session creation
The system SHALL expose `POST /api/subscriptions/portal` (authenticated) that creates a Stripe Billing Portal session and returns `{ url: string }` for client-side redirect.

#### Scenario: Active subscriber opens portal
- **WHEN** an authenticated user with a `stripe_customer_id` calls `POST /api/subscriptions/portal`
- **THEN** a Stripe Billing Portal session is created with `return_url` pointing to `/account/billing`
- **AND** the response contains `{ url }` pointing to the Stripe-hosted portal

#### Scenario: User without Stripe customer record
- **WHEN** an authenticated user with no `stripe_customer_id` calls `POST /api/subscriptions/portal`
- **THEN** the API returns 404 `{ error: "no_billing_account" }`
