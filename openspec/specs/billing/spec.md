# billing Specification

## Purpose

Defines the plans sold in Colombian pesos through Wompi, how a checkout is created, and how verified payment events extend a membership.

## Requirements

### Requirement: BILL-1 Plans and prices

The plans SHALL be Free ($0), Pro monthly (3.000 COP) and Pro annual (199.000 COP), with amounts held in cents. (`src/lib/pricing.ts:32-104`)

#### Scenario: Annual price

- **WHEN** the annual plan is read
- **THEN** its amount is 199.000 COP expressed in cents

### Requirement: BILL-2 Checkout config

Choosing a paid plan SHALL call `POST /api/billing/wompi/checkout-config`, which SHALL require a signed-in user, insert a `pending` row in `billing_payments` with a unique reference, and return the Wompi public key, amount, reference, a SHA-256 integrity signature and a return URL of `/main?billing=processing&reference=…`. (`src/app/api/billing/wompi/checkout-config/route.ts:57-130`)

#### Scenario: Signed-in purchase

- **WHEN** a signed-in user requests `pro_monthly`
- **THEN** a pending payment row is created and a signed checkout config is returned

#### Scenario: Anonymous request

- **WHEN** an unauthenticated caller requests a checkout config
- **THEN** the request is rejected with 401

### Requirement: BILL-3 Widget checkout

The client SHALL open the Wompi Widget Checkout from `checkout.wompi.co/widget.js`. (`src/features/dashboard/view/DashboardPricingView.tsx:53`, `:153-187`)

#### Scenario: Open checkout

- **WHEN** a user confirms a paid plan
- **THEN** the Wompi widget opens with the returned config

### Requirement: BILL-4 Webhook authenticity

The webhook SHALL reject a request with no configured event secret (500), invalid JSON (400) or a bad checksum (401). The checksum SHALL be compared in constant time. (`src/app/api/billing/wompi/webhook/route.ts:121-130`, `:225-234`, `:357-384`)

#### Scenario: Bad checksum

- **WHEN** an event arrives with a checksum that does not match
- **THEN** the response is 401 and nothing is applied

### Requirement: BILL-5 Idempotent event storage

Each event SHALL be stored in `billing_webhook_events`, keyed by the SHA-256 of the raw body. A redelivered event that was already processed SHALL be acknowledged without being applied again. (`src/app/api/billing/wompi/webhook/route.ts:236-277`, `:386-408`)

#### Scenario: Redelivery

- **WHEN** an already processed event is delivered again
- **THEN** it is acknowledged as a duplicate and the membership is not changed

### Requirement: BILL-6 Status mapping

Wompi statuses SHALL map `APPROVED → approved`, `DECLINED → declined`, `VOIDED → voided`, and anything else `→ error`. (`src/app/api/billing/wompi/webhook/route.ts:132-148`)

#### Scenario: Declined

- **WHEN** an event has status `DECLINED`
- **THEN** the payment is marked `declined`

### Requirement: BILL-7 Membership extension

An approved payment SHALL set the membership to `tier: member`, `status: active`, with `ends_at` extended by one month or one year, counted from the later of now and the current `ends_at`, so buying early stacks the periods. Purchases SHALL NOT auto-renew. (`src/app/api/billing/wompi/webhook/route.ts:170-223`)

#### Scenario: Early renewal

- **WHEN** a member with 10 days left has a monthly payment approved
- **THEN** `ends_at` moves to the old `ends_at` plus one month

### Requirement: BILL-8 Membership expiry

A `member` membership whose status is `active` or `trialing` and whose `ends_at` is set and not after the current time SHALL be treated as expired: its status SHALL be `expired` and its tier `free`, with `ends_at` kept. The profile endpoints SHALL report a membership that way even when the stored row has not been updated yet, and the database SHALL store it that way within one hour of `ends_at` passing. A membership with no `ends_at`, the `admin` tier and every other status SHALL NOT be changed by expiry. A payment approved after expiry SHALL give a new `member`/`active` membership counted from the time of payment, as in `BILL-7`. (`src/lib/membership.ts:20-32`, `src/app/api/dashboard/profile/route.ts:61`, `src/app/api/dashboard/profile/current/route.ts:102`, `migrations/20261006_expire_user_memberships.sql:7-30` and `:39-43`; the renewal is `src/app/api/billing/wompi/webhook/route.ts:170-223`)

#### Scenario: Lapsed membership read through the API

- **WHEN** a `member`/`active` membership with `ends_at` in the past is read through a profile endpoint before the stored row is updated
- **THEN** the response shows `tier: free` and `status: expired`, with the same `ends_at`

#### Scenario: Membership still running

- **WHEN** a `member`/`active` membership has `ends_at` in the future
- **THEN** it is reported and stored unchanged

#### Scenario: Exactly at the end

- **WHEN** the current time equals `ends_at`
- **THEN** the membership is treated as expired

#### Scenario: Stored expiry

- **WHEN** the scheduled expiry runs and finds a `member`/`active` row with `ends_at` in the past
- **THEN** the row becomes `expired` with tier `free`, and rows that do not match are not touched

#### Scenario: Renewal beats the job

- **WHEN** a payment approved before the scheduled expiry runs moves `ends_at` into the future
- **THEN** the expiry does not change that row

#### Scenario: Never-ending memberships

- **WHEN** a membership has no `ends_at`, or its tier is `admin`
- **THEN** it is never expired

#### Scenario: Buying again after expiry

- **WHEN** an expired member has a monthly payment approved
- **THEN** the membership is `member`/`active` and `ends_at` is one month after the time of payment
