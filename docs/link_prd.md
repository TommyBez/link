# Link – PRD for Tattoo Studio PDF Consent Management

## tl;dr

Tattoo studios need a secure, compliant, and fast way to collect, store, and retrieve client consent forms as PDFs across multiple artists and locations. Link digitizes consent workflows with customizable templates, e-signature capture, ID verification, and secure storage—reducing paperwork, errors, and time while improving compliance and client experience. The product targets studio owners, admins, and staff (artists/front desk) who manage consent at scale.

## Goals

### Business Goals

* Increase paid studio subscriptions by 35% within 12 months through tiered plans (single-location, multi-location, enterprise).

* Reduce paper and processing costs for studios by 50% within 6 months of adoption (measured via user surveys and feature usage).

* Achieve 80% month-2 retention for studios onboarded in the last 90 days.

* Reach a median consent processing time under 5 minutes per client by the end of Q2.

* Secure SOC 2 readiness within 12 months to unlock enterprise accounts.

### User Goals

* Complete consent capture in under 5 minutes with minimal training.

* Configure branded, legally compliant templates once and reuse them across artists/locations.

* Retrieve any consent form in under 10 seconds via search/filter.

* Automatically generate time-stamped, legally binding PDFs with audit trails.

* Share forms securely via QR code, SMS, or email with minimal clicks.

### Non-Goals

* Building a full CRM or appointment scheduling system (only basic contact capture and linking to existing systems).

* Native mobile apps in v1 (responsive web + tablet-first experience only).

* Automated medical recommendations or diagnostic features (no clinical advice).

## User Stories

* Persona: Studio Admin/Owner

  * As an Admin, I want to create and manage consent templates, so that every artist has a consistent, compliant form.

  * As an Admin, I want to set roles and permissions, so that staff only access necessary client data.

  * As an Admin, I want to see compliance and completion reports, so that I can prove adherence during inspections.

  * As an Admin, I want to configure data retention and export policies, so that we meet local regulations.

* Persona: Front Desk/Manager

  * As Front Desk, I want to send clients a consent link via SMS/email, so that they can complete it before arrival.

  * As Front Desk, I want to scan a QR code on a tablet, so that walk-ins complete forms quickly.

  * As Front Desk, I want to see the status of pending forms, so that I can follow up before appointments.

* Persona: Artist/Staff

  * As an Artist, I want to review the client’s health disclosures and aftercare instructions, so that I can proceed safely.

  * As an Artist, I want to quickly find forms from past sessions, so that I can reference health info for follow-up work.

## Functional Requirements

* Consent Templates & Builder (Priority: P0)

  * Template Management: Create, edit, version, and archive templates with fields (text, checkbox, radio, dropdown, date, signature, initial).

  * Branding: Upload logo, set color/typography; per-location branding overrides.

* Consent Capture & Signatures (Priority: P0)

  * E-Signature: Capture client signatures compliant with ESIGN/UETA; store signature imagery and signer metadata (IP, timestamp, device).

* Distribution & Intake (Priority: P0)

  * Share Links: Unique, expiring URLs; QR code generation for walk-ins; SMS/email sending.

  * Pre-Fill: Deep link with pre-filled fields (name, DOB, appointment ID).

* PDF Generation & Storage (Priority: P0)

  * PDF Rendering: Server-side, flattened, non-editable PDFs with embedded audit trail page.

  * Storage & Retention: Encrypted at rest; configurable retention and purge; export to ZIP/CSV.

  * Version Binding: PDF contains template version, preventing tampering.

* Search & Records (Priority: P0)

  * Global Search: Name, phone, email, date, artist, location, tags.

  * Filters & Views: Status (pending/completed), date ranges, location, artist; saved views.

* Roles, Permissions & Compliance (Priority: P0)

  * RBAC: Admin, staff with granular permissions.

* Reporting & Analytics (Priority: P1)

  * Dashboard: Throughput, median completion time, completion rate, most-used templates.

  * Export: CSV of metadata and links; PDF bundles by date range or artist.

## User Experience

End-to-end flow built with Next.js, Tailwind CSS, and ShadCN UI components;

**Entry Point & First-Time User Experience**

* Discovery: Studios find Link via referral, marketplace listing, or sales outreach; click “Start Free Trial”.

* Onboarding: Clerk-hosted auth for email/password or Google; organization and location setup wizard; guided template import from common consent PDFs; sample template provided; role invitations for staff.

**Core Experience**

* Step 1: Admin creates a template

  * UI Elements: ShadCN Form, Input, Select, Checkbox, Radio Group, Signature Pad, Accordion for sections, Code/JSON editor drawer for conditional logic; Color Picker; File Upload.

  * Data Validation: Required fields; live preview; versioning guardrails.

  * Navigation: Motion slide-in panels; breadcrumb for Templates > New > Preview.

* Step 2: Front Desk prepares intake

  * UI Elements: Location selector, Template card grid, “Generate QR” modal, “Send Link” dialog (SMS/email).

  * Data Validation: Phone/email format; link expiry duration; single-use token creation.

  * Navigation: Modal confirmations; copy-to-clipboard toast.

* Step 3: Client completes form (kiosk or personal device)

  * UI Elements: Mobile-first form, progress bar, field-level help,  signature canvas, consent checkboxes.

  * Data Validation:  required legal acknowledgments; file type/size limits; accessibility hints.

  * Navigation: Stepper transitions; autosave; “Resume later” via magic link.

* Step 4: PDF generation and storage

  * UI Elements: “View PDF” button, download/share menu, audit trail page.

  * Data Validation: Template-version lock; hash verification before storage.

  * Navigation: Background PDF generation with status indicator; toast on completion.

* Step 6: Search and reporting

  * UI Elements: Global search bar, filter facets, data table (Material UI/AG Grid), saved views, export panel, charts (Recharts).

  * Data Validation: Export scope confirmation; permission checks on bulk actions.

  * Navigation: Split-pane results/details; URL query params for shareable views.

**UI/UX Highlights**

* Component Strategy: Reusable ShadCN components for forms, dialogs, and tables; ; consistent accessibility patterns.

* Styling: Tailwind CSS for utility-first styling; custom theme tokens for brand consistency; minimal overrides to speed iteration.

* Interactions: Motion transitions

## Technical Considerations

* Template Versioning: Immutable versions tied to each submission; migrations produce new versions, not edits in place.

* PDF Generation: Server-side headless rendering; flatten layers; embed audit trail; checksum to detect tampering; regenerate on demand using stored structured data.

## UI Architecture

* Supported Frameworks:  Next.js app router as the default; 

* Component Libraries: ShadCN UI for forms, dialogs, toasts;  custom Signature Pad component.

* Styling Frameworks: Tailwind CSS as default; CSS variables for theming; minimal custom CSS for brand overrides.

* State Management: React Query for data fetching cache; Context for auth/org; lightweight Zustand for local state.

* Routing: App router with nested layouts (org, location, templates, forms, reports); guarded routes by role.

* Accessibility: WCAG 2.1 AA; keyboard navigation; ARIA on custom controls (signature canvas); high-contrast theme toggle.

* Animation: Motion for transitions and stepper flows; progressive disclosure for advanced settings.

* Print/PDF Views: Server-rendered PDF templates using a consistent typography and layout system to match brand styling.

## API & Backend

* Data Fetching: Next.js server actions and RESTful endpoints; React Query on client; 

* Authentication: Clerk for email code login, and organization management.

* Authorization: Middleware enforcing RBAC + RLS at DB level; policy checks per route.

* Hosting & Deployment: Vercel for frontend and serverless functions; background jobs via Vercel workflows for PDF generation and exports.

* Database: Postgres (Neon) with Drizzle ORM for typed schema and migrations;

* Storage: Vercel Blob; server-only access with pre-signed URLs.

* API Strategy:

  * Internal REST Endpoints: /templates, /forms, /sign, /pdf, /exports, /webhooks.