# Spec Delta

## ADDED Requirements

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
