# Spec Delta

## Purpose

Lets people create an account, sign in with email or Google, and sign out, and guarantees every new account starts with a profile, an owner key and a free membership.

## ADDED Requirements

### Requirement: AUTH-1 Email and password sign-up

The system SHALL let a user sign up with email and password. The email SHALL be trimmed and lower-cased; the password SHALL be at least 8 characters and match its confirmation. On success the user SHALL be sent to `/account_confirmation`. (`src/app/actions/auth.ts:53-89`)

#### Scenario: Valid sign-up

- **WHEN** a user submits a valid email and a matching password of 8 or more characters
- **THEN** the account is created and the user is redirected to `/account_confirmation`

#### Scenario: Password mismatch or too short

- **WHEN** the password is under 8 characters or differs from its confirmation
- **THEN** sign-up is rejected and no account is created

### Requirement: AUTH-2 Email and password sign-in

The system SHALL let a user sign in with email and password and send them to `/main`. Every failure, including an invalid email, SHALL return the same message, "Correo o contraseña incorrectos.", so the response does not reveal whether an account exists. (`src/app/actions/auth.ts:9`, `:21-51`)

#### Scenario: Successful sign-in

- **WHEN** a user submits correct credentials
- **THEN** the user is redirected to `/main`

#### Scenario: Unknown account and wrong password look identical

- **WHEN** a sign-in fails because the account does not exist, or because the password is wrong
- **THEN** both return the identical message "Correo o contraseña incorrectos."

### Requirement: AUTH-3 Google sign-in

The system SHALL let a user sign in with Google OAuth. (`src/features/login/model/loginService.ts:20-22`)

#### Scenario: Google sign-in

- **WHEN** a user chooses Google sign-in and completes the provider flow
- **THEN** the flow returns to the auth callback

### Requirement: AUTH-4 Callback code exchange and safe redirect

OAuth and email links SHALL return to `/api/auth/callback`, which SHALL exchange `code` for a session and redirect to `next`. `next` SHALL be sanitised: only same-site relative paths are allowed, and anything else SHALL fall back to `/main`. (`src/app/api/auth/callback/route.ts:48-92`, `src/lib/auth/redirect.ts:12-44`)

#### Scenario: Relative next path

- **WHEN** the callback receives a valid code and `next=/main`
- **THEN** a session is set and the user is redirected to `/main`

#### Scenario: External next path

- **WHEN** the callback receives `next` pointing to another site
- **THEN** the user is redirected to `/main` instead

### Requirement: AUTH-5 Callback failure reasons

A failed callback SHALL redirect to `/auth/callback/error?reason=…` with `missing_code`, `oauth_callback` or `service_unavailable`. `service_unavailable` SHALL be chosen for 503 or 504 responses and for network, timeout or "paused" errors. (`src/app/api/auth/callback/route.ts:6-46`, `:83-89`)

#### Scenario: Missing code

- **WHEN** the callback is called without a `code`
- **THEN** the user is redirected to `/auth/callback/error?reason=missing_code`

#### Scenario: Auth service unreachable

- **WHEN** the code exchange fails with a 503, a timeout or a "paused" error
- **THEN** the reason is `service_unavailable`

### Requirement: AUTH-6 Sign-out

Signing out SHALL clear the session and redirect to `/login`. (`src/app/actions/auth.ts:91-96`)

#### Scenario: Sign-out

- **WHEN** a signed-in user signs out
- **THEN** the session is cleared and the user lands on `/login`

### Requirement: AUTH-7 Profile and membership on sign-up

On sign-up the database SHALL create a `user_profile` row, with a name taken from the provider metadata or the email local part and a fresh `book_id`, and SHALL create a `free`/`active` `user_memberships` row. (`migrations/20260617_assign_book_id_on_profile_creation.sql:2-23`, `migrations/20260601_user_memberships.sql:78-97`)

#### Scenario: New account

- **WHEN** a new auth user is created
- **THEN** a profile with a `book_id` and a free active membership exist for that user

### Requirement: AUTH-8 Missing book_id repair

If a profile lacks a `book_id`, `/api/dashboard/profile/current` and `/api/dashboard/profile/initialize` SHALL assign one. (`src/app/api/dashboard/profile/current/route.ts:27-54`, `src/app/api/dashboard/profile/initialize/route.ts:41-75`)

#### Scenario: Profile without book_id

- **WHEN** an authenticated user with a profile lacking `book_id` calls `/api/dashboard/profile/current`
- **THEN** a `book_id` is assigned and returned
