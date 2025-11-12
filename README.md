# Link – Consent Platform

A secure, compliant consent management platform for tattoo studios. Link digitizes consent workflows with customizable templates, e-signature capture, and secure PDF storage—reducing paperwork while improving compliance and client experience.

## Overview

Link streamlines consent form management for tattoo studios by providing:

- **Template Builder**: Create and version customizable consent templates with drag-and-drop fields
- **Digital Signatures**: Capture legally binding e-signatures with audit trails (IP, timestamp, device)
- **Intake Distribution**: Share forms via QR codes, SMS, or email with tokenized, expiring links
- **PDF Generation**: Server-side rendering of immutable, audit-compliant PDFs
- **Records Management**: Search and retrieve consent forms with advanced filtering
- **RBAC & Multi-tenancy**: Role-based access control with organization-level isolation
- **Reporting**: Analytics on submission rates, completion times, and template usage

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI / ShadCN
- **Forms**: React Hook Form + Zod validation
- **State**: React Query for server state

### Backend
- **Runtime**: Next.js API Routes
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Storage**: Vercel Blob
- **Authentication**: Clerk (email magic links, organizations)
- **Authorization**: Middleware-based RBAC with RLS

### Infrastructure
- **Hosting**: Vercel
- **Database**: Neon (serverless Postgres)
- **Blob Storage**: Vercel Blob
- **Linting**: Ultracite (Biome-based)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Neon database account
- Clerk account
- Vercel account (for blob storage)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Generate database migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed sample template (optional)
pnpm seed:sample

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database (Neon)
DATABASE_URL=postgresql://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Webhooks
CLERK_WEBHOOK_SECRET=whsec_...
```

You can pull environment variables from Vercel using:

```bash
pnpm pull-env
```

## Project Structure

```
link/
├── app/                          # Next.js App Router
│   ├── (onboarding)/            # Onboarding flows
│   │   └── studio/new/          # Studio creation
│   ├── (staff)/                 # Authenticated staff routes
│   │   ├── settings/users/      # User management
│   │   └── templates/           # Template management
│   ├── api/                     # API routes
│   │   ├── templates/           # Template CRUD + publish
│   │   └── webhooks/            # Clerk webhooks
│   └── layout.tsx               # Root layout with ClerkProvider
├── components/                  # React components
│   ├── templates/builder/       # Template builder UI
│   └── ui/                      # ShadCN UI components
├── lib/                         # Core libraries
│   ├── db/                      # Database client & schema
│   ├── storage/                 # Blob storage helpers
│   ├── templates/               # Template JSON schemas
│   ├── server/                  # Server-side guards
│   ├── rbac.ts                  # Role-based access control
│   ├── crypto.ts                # Hashing utilities
│   ├── env.ts                   # Environment validation
│   └── utils.ts                 # Shared utilities
├── scripts/                     # Utility scripts
│   └── seed-sample-template.ts  # Sample data seeding
├── tasks/                       # Project planning docs
└── docs/                        # Documentation
```

## Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Linting
pnpm lint             # Check code with Ultracite
pnpm lint:fix         # Auto-fix linting issues

# Database
pnpm db:generate      # Generate migrations from schema
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio GUI

# Seeding
pnpm seed:sample      # Seed sample template data

# Environment
pnpm pull-env         # Pull env vars from Vercel
```

## Development Workflow

### Database Schema Changes

1. Update schema in `lib/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply to database: `pnpm db:push`
4. Review generated SQL in `drizzle/migrations/`

### Creating New Templates

Templates use a JSON schema defined in `lib/templates/schema.ts`. Each template has:

- **Draft Mode**: Editable, not used for intakes
- **Published Versions**: Immutable, tied to submissions
- **Fields**: Text, textarea, email, phone, date, checkbox, radio, signature

### Authentication Flow

1. Users sign in via Clerk at `/sign-in`
2. Clerk webhooks sync user/org data to local database
3. Middleware enforces authentication + RBAC
4. Guard utilities check permissions server-side

### RBAC Implementation

Roles are managed in Clerk and enforced via:

- `lib/rbac.ts`: Helper functions for role checks
- `lib/server/guard.ts`: Server-side authorization guards
- `middleware.ts`: Route-level protection

## Database Schema

Core entities (see `lib/db/schema.ts`):

- **Org**: Organization/studio entity (synced from Clerk)
- **User**: Staff members (synced from Clerk)
- **Membership**: User-org relationships with roles
- **Template**: Consent form templates (draft state)
- **TemplateVersion**: Published, immutable template versions
- **IntakeSession**: Tokenized form links with TTL
- **Submission**: Completed consent forms
- **Signature**: E-signature data with metadata
- **PdfArtifact**: Generated PDF files

## Key Features

### Template Builder

Located at `app/(staff)/templates/new/page.tsx`, the builder provides:

- Drag-and-drop field ordering
- Field type configuration (text, email, signature, etc.)
- Required field enforcement
- Custom helper text and validation rules
- Live preview
- Version publishing

### Intake Distribution

Create tokenized intake links with:

- Expiring URLs
- QR code generation
- Pre-filled field data
- Single-use tokens
- Status tracking

### Signature Capture

Compliance-focused signature capture:

- Canvas-based drawing
- Metadata: timestamp, IP, user agent
- Stored separately with hash integrity
- Embedded in final PDF with audit trail

### PDF Generation

Server-side PDF rendering with:

- React-pdf document generation
- Immutable versioning
- Embedded audit trail page
- Hash-based tampering detection
- Blob storage with pre-signed URLs

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Required Environment Variables

Ensure all environment variables are set in Vercel:

1. Database connection string
2. Clerk keys and webhook secret
3. Blob storage token

### Post-Deployment

1. Run database migrations on production
2. Configure Clerk webhook URLs
3. Test authentication flow
4. Verify blob storage permissions

## License

Private and proprietary.

## Support

For questions or issues, contact the development team.
