## ADDED Requirements

### Requirement: Pricing page displays all plans
The system SHALL render a `/pricing` page on the web app showing all four subscription plans (Individual Monthly, Individual Annual, Dual Reader Monthly, Dual Reader Annual) with prices, billing interval, and a feature comparison list.

#### Scenario: Unauthenticated visitor views pricing
- **WHEN** an unauthenticated user navigates to `/pricing`
- **THEN** all four plan cards are displayed with prices and a CTA button ("Get started") that redirects to sign-in before checkout

#### Scenario: Authenticated user views pricing
- **WHEN** an authenticated user navigates to `/pricing`
- **THEN** plan cards are displayed and CTA buttons trigger checkout directly (no sign-in redirect)

#### Scenario: Annual plan shows savings badge
- **WHEN** the pricing page renders annual plans
- **THEN** each annual plan card displays a savings badge (e.g., "Save 26%") compared to the equivalent monthly plan

### Requirement: Checkout redirect flow
The system SHALL initiate Stripe Checkout by calling `POST /api/subscriptions/checkout` and redirecting the browser to the returned `url`.

#### Scenario: User clicks plan CTA
- **WHEN** an authenticated user clicks a plan's CTA button
- **THEN** the web app calls `POST /api/subscriptions/checkout` with the selected `planId`
- **AND** the browser is redirected to the Stripe Checkout URL

#### Scenario: Checkout API error
- **WHEN** the checkout API call fails
- **THEN** an inline error message is shown on the pricing page without navigating away

### Requirement: Post-checkout success page
The system SHALL render a `/billing/success` page shown after successful Stripe Checkout. It SHALL call `POST /api/subscriptions/sync` to refresh subscription state and display a confirmation message.

#### Scenario: User lands on success page
- **WHEN** a user is redirected to `/billing/success` after completing Stripe Checkout
- **THEN** the page calls `POST /api/subscriptions/sync`
- **AND** displays "Subscription activated" with a link to start reading

### Requirement: Post-checkout cancel page
The system SHALL render a `/billing/cancel` page shown when a user abandons Stripe Checkout. It SHALL display a message and link back to `/pricing`.

#### Scenario: User lands on cancel page
- **WHEN** a user is redirected to `/billing/cancel` after abandoning checkout
- **THEN** the page displays "No charge was made" and a "View plans" link to `/pricing`
