## ADDED Requirements

### Requirement: Billing section in account settings
The system SHALL render a billing section at `/account/billing` (web) showing the user's current plan name, status badge, next renewal date (or trial end date), and a "Manage billing" button.

#### Scenario: Active subscriber views billing settings
- **WHEN** an authenticated active subscriber navigates to `/account/billing`
- **THEN** the page displays plan name, `Active` status badge, and next renewal date
- **AND** a "Manage billing" button is visible

#### Scenario: Canceling subscriber views billing settings
- **WHEN** an authenticated user with `status = canceling` views billing settings
- **THEN** the page displays plan name, `Canceling` status badge, and the date access ends
- **AND** a "Resume subscription" button is visible alongside "Manage billing"

#### Scenario: Non-subscriber views billing settings
- **WHEN** an authenticated user with no subscription views `/account/billing`
- **THEN** the page displays "No active plan" and a "View plans" link to `/pricing`

### Requirement: Manage billing opens Stripe Billing Portal
The system SHALL redirect the user to the Stripe Billing Portal when they click "Manage billing" by calling `POST /api/subscriptions/portal` and navigating to the returned URL.

#### Scenario: User clicks "Manage billing"
- **WHEN** an authenticated subscriber clicks "Manage billing"
- **THEN** the web app calls `POST /api/subscriptions/portal`
- **AND** the browser is redirected to the Stripe Billing Portal

### Requirement: Refresh subscription status
The system SHALL provide a "Refresh status" action on the billing settings page that calls `POST /api/subscriptions/sync` and re-renders the page with the updated subscription data.

#### Scenario: User refreshes status after webhook delay
- **WHEN** a user clicks "Refresh status"
- **THEN** `POST /api/subscriptions/sync` is called and the page re-renders with up-to-date subscription data
