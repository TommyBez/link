# PRD — Consent Platform MVP (Link)

## 1) Introduction / Overview
Link digitizes tattoo studio consent workflows. This PRD defines the MVP for an end‑to‑end, time‑to‑value focused release that spans: Consent Templates & Builder, E‑Signature, Distribution & Intake, PDF Generation & Storage, Search & Records, Roles & Permissions, Reporting (basic), and Onboarding & Organization setup.

v1 optimizes for delivering a usable “intake to signed PDF” flow in 1–2 weeks. Depth and configurability are intentionally constrained; advanced features are out of scope. Success is primarily measured by how quickly a client can complete the form while staff can reliably retrieve and share the resulting PDF.

## 2) Goals
- Ship an end‑to‑end consent flow usable by real studios within 1–2 weeks.
- Median client completion time from form open to submit ≤ 5 minutes (P0).
- Staff can prepare an intake in ≤ 60 seconds (select template, generate link/QR).
- ≥ 95% of completed submissions produce a PDF within 30 seconds.
- Enable basic access control (Admin vs Staff) scoped to the organization.
- Provide minimal reporting to confirm throughput and time performance.

## 3) User Stories
### Admin/Owner
- As an Admin, I can create a consent template with basic fields and publish it so staff can use it.
- As an Admin, I can invite staff so the team can work in the organization.
- As an Admin, I can view simple reports (daily completions, median completion time) to ensure operations are on track.

### Front Desk/Manager
- As Front Desk, I can pick a template and generate a unique intake link and QR code so a client can complete it quickly on a tablet or their phone.
- As Front Desk, I can see pending vs completed intakes so I know who to nudge before appointments.
- As Front Desk, I can find a client submission by name/phone/email and download the signed PDF for records.

### Artist/Staff
- As Staff, I can open a client’s completed form to review disclosures before proceeding.
- As Staff, I can access PDFs for past sessions for quick reference.

### Client
- As a Client, I can complete and sign the consent form on my own device or a kiosk in under 5 minutes.
- As a Client, I can clearly see required acknowledgments and sign with my finger.

## 4) Functional Requirements (MVP)
Numbering is global for traceability. Grouped by area for clarity.

### A. Consent Templates & Builder
1. The system must allow Admins to create, edit, and publish templates containing these field types: text (single‑line), textarea, email, phone, date, checkbox, radio, and signature.
2. The system must let Admins mark fields as required and provide label + helper text per field.
3. The system must support simple branding inputs on a template: logo upload (1 image) and primary brand color.
4. The system must implement versioning on publish: publishing creates an immutable template version; edits after publish create a new version (no in‑place modification).
5. The system must prevent staff from using a template draft (only published versions are selectable for intakes).
6. The system must store a machine‑readable schema for each published version to enable deterministic PDF rendering.

### B. E‑Signature
7. The system must provide a signature canvas for clients to draw a signature; it must capture image data and signer metadata (UTC timestamp, client IP, user agent).
8. The signature must be embedded in the generated PDF and linked to the submission audit trail.

### C. Distribution & Intake
9. The system must allow staff to start an intake by selecting a published template version.
10. The system must generate a unique, expiring link (tokenized) for each intake session that opens the client form directly.
11. The system must display a QR code for the intake link and provide a “copy link” action. (Email/SMS send is out of scope for MVP—see Non‑Goals.)
12. The system should support optional prefill via query params (e.g., name, DOB) that map to fields when present.
13. The system must show status of an intake: pending (not submitted) vs completed (submitted and signed).

### D. PDF Generation & Storage
14. The system must use React‑pdf to generate a flattened, non‑editable PDF on the server after submission using the stored template version and client responses.
15. The PDF must include an audit trail page (at minimum: template version, submission ID, signer name if provided, UTC timestamp, IP, and a hash/checksum of the JSON payload).
16. The system must store PDFs in secure blob storage and return a durable reference to the record.
17. The system should generate PDFs asynchronously and provide a status indicator on the submission detail (queued → generating → ready). If generation fails, it must be retriable.
18. The system must prevent direct public listing of PDFs; access must require an authenticated role or a time‑limited pre‑signed URL.

### E. Search & Records
19. The system must provide a search experience for staff/admins by name, email, phone, date range, status (pending/completed), and template.
20. The system must display a table of results with sortable columns and a details view that links to the PDF when ready.
21. The system must allow downloading the PDF from the record detail (permission‑gated).

### F. Roles & Permissions (RBAC)
22. The system must support at least two roles: Admin and Staff.
23. Admin can: manage templates and users; view all records in the org; download PDFs.
24. Staff can: start intakes, view and search records within their organization, and download PDFs.
25. The system must enforce organization scoping for Staff (a Staff user cannot access records outside their organization).

### G. Reporting & Analytics (Basic)
26. The system must display a simple dashboard with: total completions (last 7 and 30 days) and median completion time (last 7 days).
27. The system should expose a basic error rate for failed PDF generations over the last 7 days.

### H. Onboarding & Organization Setup
28. The system must allow sign‑up/sign‑in via one‑time passcode (OTP) sent by email and create an organization for the first user.
29. The system must allow Admins to invite users (email‑based invite flow acceptable for MVP).
30. The system must provide a sample template that can be published immediately for trial accounts.

### General UX/Quality
31. The client intake form must be mobile‑first, accessible (WCAG 2.1 AA targets), and performant on tablets.
32. The system must autosave client progress locally (e.g., on the device) at step boundaries to mitigate accidental navigations.
33. All timestamps stored and displayed for system events must be UTC internally; display in local time only in UI where appropriate.
34. The system must provide toasts for copy‑to‑clipboard, link/QR generation, and PDF readiness.
35. The system must render an in‑app PDF preview using React‑pdf components.

## 5) Non‑Goals (Out of Scope for MVP)
- Conditional logic, advanced field types (file uploads beyond logo, multi‑step branching, calculated fields), or form logic scripting.
- SMS/email sending within the product (copy link + QR only for distribution).
- Multi‑org cross‑linking, enterprise SSO, SCIM, or fine‑grained permission matrices.
- Full audit event viewer beyond the PDF’s audit page and minimal server logs.
- Bulk exports, ZIP bundles, or CSV exports (reporting is view‑only in MVP).
- Automated retention rules, legal holds, and purge policies (manual cleanup acceptable for MVP).
- ID verification, photo capture, or government ID scanning.
- Localization/internationalization and multi‑language templates.
- Offline kiosk mode with sync queues.

## 6) Design Considerations
- UI Frameworks: Next.js App Router, Tailwind CSS, ShadCN UI components already available in the codebase (forms, dialogs, toasts, table, accordion, progress, etc.).
- Components to leverage: `Form`, `Input`, `Select`, `Checkbox`, `Radio Group`, `Dialog/Sheet`, `Accordion`, `Table`, `Progress/Spinner`, `Toast`; React‑pdf components for preview such as `Document`, `Page`, `PDFViewer`, `PDFDownloadLink`, `BlobProvider`. A custom Signature Pad component is required.
- Navigation: Template Builder → Publish → Intake Prep (select template) → Client Form → Submission Detail → PDF Ready.
- Branding: Minimal (logo + primary color) applied to form header and PDF.
- Accessibility: Keyboard navigation, proper labels/aria on custom controls (signature canvas), sufficient contrast.

## 7) Technical Considerations
- Data Model (suggested MVP entities):
  - Organization, User, Membership (role)
  - Template, TemplateVersion (JSON schema + branding), FieldDefinition
  - IntakeSession (token, status, templateVersionId, prefill)
  - Submission (intakeSessionId, responses JSON, completedAt)
  - Signature (submissionId, image blob ref, ip, userAgent, signedAt)
  - PdfArtifact (submissionId, status, blob url/key, checksum, generatedAt)
- Storage:
  - Database: Postgres (e.g., Neon) via Drizzle ORM for schema and migrations.
  - Files: Vercel Blob for signature images and PDFs; access via pre‑signed URLs.
- AuthZ:
  - RBAC enforced in server routes and queries; Staff access is organization‑scoped.
  - PDF access requires Admin/Staff with scope or a short‑lived pre‑signed URL.
- API/Routes (illustrative):
  - Templates: POST /templates, POST /templates/:id/publish, GET /templates
  - Intake: POST /intakes, GET /intakes/:token, GET /intakes?status=
  - Submissions: POST /submissions (from client form), GET /submissions/:id
  - PDF: POST /pdf/:submissionId (enqueue), GET /pdf/:submissionId/status
- PDF Rendering:
  - Use React‑pdf for both client preview and server generation; on the server use the Node API (e.g., `renderToStream`/`renderToFile`), and on the client use `PDFViewer`/`BlobProvider` for preview. See [react‑pdf](https://react-pdf.org/). 
  - Flattened output; embed audit page.
  - On failure, log, surface in UI, and support retry.
- Observability:
  - Minimal request logging for audit fields; basic metrics for completions and PDF generation latency/error rates.

## 8) Success Metrics
- P0 (primary): Median client completion time ≤ 5 minutes from form open to submit.
- Guardrails:
  - ≥ 95% of submissions produce a PDF within 30 seconds of submission.
  - Search results return within ≤ 1 second for common queries on sample data.
  - PDF generation failure rate < 0.5% (7‑day window).

## 9) Open Questions
1. Distribution: Should MVP include email sending (transactional) via a provider, or keep link/QR only?
2. Token TTL: What default expiry should intake links have (e.g., 7 days)? Renew behavior?
3. PDF implementation: React‑pdf is selected; confirm font/emoji requirements and any brand typography to register.
4. Branding: Confirm org‑level (studio) overrides only; no location concept.
5. Audit details: Any additional fields required by studios (e.g., device model, geo IP)?
6. Reporting: Should we include a simple CSV export for submissions in a date range or defer to post‑MVP?
7. Data retention: What default retention and purge policy should be presented to Admins post‑MVP?


