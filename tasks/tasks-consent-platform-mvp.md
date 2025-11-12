## Relevant Files

- `lib/env.ts` - Runtime environment validation using Zod (DB, blob, email, secrets).
- `drizzle.config.ts` - Drizzle ORM configuration for migrations.
- `lib/db/index.ts` - Drizzle database client/connection.
- `lib/db/schema.ts` - Database schema for core entities (Org, User, Membership, Template, TemplateVersion, IntakeSession, Submission, Signature, PdfArtifact, Invite, OtpCode).
- `drizzle/migrations/*` - SQL migrations generated/applied by Drizzle.
- `lib/storage/blob.ts` - Vercel Blob client and helpers for uploads/downloads.
- `lib/rbac.ts` - RBAC helpers (role checks, org scoping).
- `lib/crypto.ts` - Utilities for checksums/hashes of JSON payloads.
- `lib/auth/session.ts` - Session utilities (encode/decode, cookie management).
- `middleware.ts` - Route protection and request context (session/role/org) injection.
- `lib/templates/schema.ts` - JSON schema/types for consent templates and versions.
- `app/(auth)/sign-in/page.tsx` - Email OTP sign-in UI.
- `app/api/auth/otp/request/route.ts` - Request OTP code endpoint.
- `app/api/auth/otp/verify/route.ts` - Verify OTP code, create user/org, start session.
- `app/api/invites/route.ts` - Create invites (Admin), list invites.
- `app/api/invites/accept/route.ts` - Accept invite and create membership.
- `app/(staff)/templates/page.tsx` - Templates list and management.
- `app/(staff)/templates/new/page.tsx` - Template builder for drafts.
- `app/api/templates/route.ts` - Create draft template (POST), list templates (GET).
- `app/api/templates/[id]/publish/route.ts` - Publish a template version (immutable).
- `app/(staff)/intakes/new/page.tsx` - Intake creation screen (select template, copy link, QR).
- `app/api/intakes/route.ts` - Create intake session (tokenized, TTL).
- `app/api/intakes/[token]/route.ts` - Resolve intake session by token (status + version).
- `components/qr-code.tsx` - QR code component for intake link.
- `app/(client)/intake/[token]/page.tsx` - Client form page rendered from schema.
- `components/forms/dynamic-form.tsx` - Renders fields (text, textarea, email, phone, date, checkbox, radio, signature) from schema.
- `components/signature-pad.tsx` - Signature canvas component with metadata capture.
- `hooks/use-local-progress.ts` - Autosave progress to localStorage.
- `app/api/submissions/route.ts` - Accept client submissions and signature payloads.
- `lib/pdf/document.tsx` - React-pdf document definition (pages, styles, audit page).
- `lib/pdf/fonts.ts` - React-pdf font registration (if custom fonts/emoji).
- `app/api/pdf/[submissionId]/generate/route.ts` - Trigger or enqueue PDF generation.
- `app/api/pdf/[submissionId]/status/route.ts` - Query PDF generation status.
- `app/api/pdf/[submissionId]/download/route.ts` - Serve pre-signed URL or stream.
- `app/(staff)/records/page.tsx` - Records search table and filters.
- `app/(staff)/submissions/[id]/page.tsx` - Submission detail view with PDF link/status.
- `app/api/records/route.ts` - Search submissions with filters and RBAC.
- `app/(staff)/reports/page.tsx` - Reporting dashboard UI.
- `app/api/reports/overview/route.ts` - Reporting/metrics API (totals, medians, error rates).
- `lib/rbac.test.ts` - Unit tests for RBAC helpers.
- `lib/crypto.test.ts` - Unit tests for checksum utilities.
- `lib/pdf/document.test.tsx` - Tests for React-pdf document generation (component-level).
- `components/signature-pad.test.tsx` - Tests for signature component behavior.
- `lib/db/schema.test.ts` - Tests for schema constraints and relations.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

IMPORTANT: As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 1.0 Platform foundations (DB schema, storage, env, RBAC scaffolding)
  - [x] 1.1 Configure Drizzle (`drizzle.config.ts`), install ORM/driver, and create `lib/db/index.ts`
  - [x] 1.2 Implement core entities in `lib/db/schema.ts` (Org, User, Membership, Template, TemplateVersion, IntakeSession, Submission, Signature, PdfArtifact) - Note: Invites/OTP removed (Clerk handles auth)
  - [x] 1.3 Generate initial migrations and apply to the database (scripts added: `pnpm db:generate`, `pnpm db:push`)
  - [x] 1.4 Implement Vercel Blob client in `lib/storage/blob.ts` for signatures and PDFs
  - [x] 1.5 Create `lib/rbac.ts` with helpers for Admin/Staff checks and org scoping
  - [x] 1.6 Create `lib/crypto.ts` with `hashPayloadSHA256(json: unknown): string`
  - [x] 1.7 Add `middleware.ts` with Clerk protection, update `app/layout.tsx` with ClerkProvider, create `lib/server/guard.ts` for RBAC
- [x] 2.0 Auth & Organization onboarding (Clerk: sign-in, invited vs self-serve studio setup)
  - [x] 2.1 Add Clerk sign-in page at `app/sign-in/[[...sign-in]]/page.tsx` using `<SignIn />` (email code/magic link)
  - [x] 2.2 Add Clerk sign-up page at `app/sign-up/[[...sign-up]]/page.tsx` using `<SignUp />`
  - [x] 2.3 Update `proxy.ts` to make `/sign-in` and `/sign-up` routes public
  - [x] 2.4 On session: If Clerk org/membership exists, proceed. If none, redirect to onboarding. Do not create local org/membership here (webhooks handle sync).
  - [x] 2.5 Build onboarding flow at `app/(onboarding)/studio/new/page.tsx` to create the studio via Clerk Organizations and set current user as admin; local `Org`/`Membership` are synced by webhooks (fields: studio name, locale/timezone; optional address/phone)
  - [x] 2.6 Add guard/redirect: authenticated users without a Clerk membership are forced to onboarding until the studio is created; invited members skip onboarding
  - [x] 2.7 Add users management UI at `app/(staff)/settings/users/page.tsx` using Clerk (list members, invite, roles)
  - [x] 2.8 Handle Clerk webhooks in `app/api/webhooks/route.ts` to sync user/org/membership changes (organization/membership created/updated/deleted, invitation accepted)
- [x] 3.0 Consent Templates & Builder with publish/versioning
  - [x] 3.1 Define template JSON schema/types in `lib/templates/schema.ts` (fields, required, helper text, branding)
  - [x] 3.2 Create builder UI at `app/(staff)/templates/new/page.tsx` supporting required MVP field types
  - [x] 3.3 Implement `POST /api/templates` (create draft) and `GET /api/templates` (list)
  - [x] 3.4 Implement `POST /api/templates/[id]/publish` to create immutable `TemplateVersion`
  - [x] 3.5 Enforce that only published versions are selectable for intakes
  - [x] 3.6 Seed a sample template for trial accounts (script or API)
- [ ] 4.0 Intake setup & distribution (tokenized links, QR, prefill, statuses)
  - [ ] 4.1 Build intake prep UI at `app/(staff)/intakes/new/page.tsx` (select version, copy link, QR)
  - [ ] 4.2 Implement `POST /api/intakes` to create tokenized `IntakeSession` with TTL
  - [ ] 4.3 Implement `GET /api/intakes/[token]` to load template version & intake status
  - [ ] 4.4 Support prefill mapping from query params to schema fields
  - [ ] 4.5 Show pending vs completed status for intakes in staff UI
- [ ] 5.0 Client intake form & signature capture (mobile-first, autosave, accessibility)
  - [ ] 5.1 Implement client form at `app/(client)/intake/[token]/page.tsx` rendering fields from schema
  - [ ] 5.2 Create `components/signature-pad.tsx` to capture signature image + metadata (UTC, IP, user agent)
  - [ ] 5.3 Add autosave at step boundaries using `hooks/use-local-progress.ts`
  - [ ] 5.4 Validate required fields and ensure accessibility (labels, aria, keyboard)
  - [ ] 5.5 Implement `POST /api/submissions` to persist responses and signature reference
- [ ] 6.0 PDF generation & storage pipeline (react-pdf, audit page, async status)
  - [ ] 6.1 Create `lib/pdf/document.tsx` using React-pdf, including audit trail page
  - [ ] 6.2 Implement `POST /api/pdf/[submissionId]/generate` to render and store PDF in blob
  - [ ] 6.3 Implement `GET /api/pdf/[submissionId]/status` with queued/generating/ready/failed
  - [ ] 6.4 Wire submission detail view to display status and trigger generation
  - [ ] 6.5 Implement retry endpoint/action for failed PDF generations
- [ ] 7.0 Records search & detail (filters, table) with RBAC download access
  - [ ] 7.1 Implement `GET /api/records` with filters (name, email, phone, date range, status, template)
  - [ ] 7.2 Build `app/(staff)/records/page.tsx` table with filters and sortable columns
  - [ ] 7.3 Build `app/(staff)/submissions/[id]/page.tsx` with details and PDF link
  - [ ] 7.4 Enforce RBAC and serve downloads via `GET /api/pdf/[submissionId]/download` (pre-signed URL)
- [ ] 8.0 Reporting & observability; UI polish & deployment readiness
  - [ ] 8.1 Implement `GET /api/reports/overview` (totals 7/30 days, median completion 7 days, error rate)
  - [ ] 8.2 Build `app/(staff)/reports/page.tsx` to display metrics
  - [ ] 8.3 Add toasts for copy link, QR generation, and PDF readiness
  - [ ] 8.4 Add minimal request logging and basic metrics (PDF latency/errors)
  - [ ] 8.5 QA pass (mobile performance, accessibility), finalize config, and prepare deployment


