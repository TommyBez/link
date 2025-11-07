# Setup Guide - Task 1 Platform Foundations

## Prerequisites

- Node.js 20+
- pnpm package manager
- Neon PostgreSQL database
- Vercel Blob Storage account
- Clerk account (optional, keys auto-generated on first run)

## Environment Variables

Create a `.env.local` file in the root with the following variables:

```bash
# Database (Neon PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secret-key-here-at-least-32-characters-long

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-rw-token

# App URL
APP_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Clerk (auto-generated on startup, or get from clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Generate and apply database migrations:

```bash
pnpm db:generate
pnpm db:push
```

3. Start the development server:

```bash
pnpm dev
```

## Database Commands

- `pnpm db:generate` - Generate SQL migrations from schema
- `pnpm db:push` - Push schema directly to database (dev only)
- `pnpm db:studio` - Open Drizzle Studio to browse database

## Architecture Overview

### Database Schema

- **orgs** - Organizations with Clerk org ID reference
- **users** - Users with Clerk user ID reference
- **memberships** - User-to-org relationships with roles (ADMIN, STAFF)
- **templates** - Consent form templates
- **templateVersions** - Immutable published versions
- **intakeSessions** - Tokenized intake links with TTL
- **submissions** - Form submissions with response data
- **signatures** - Digital signatures with metadata
- **pdfArtifacts** - Generated PDF records

### Key Files

- `lib/env.ts` - Environment validation with t3-env
- `lib/db/index.ts` - Drizzle database client
- `lib/db/schema.ts` - Complete database schema
- `lib/storage/blob.ts` - Vercel Blob helpers
- `lib/rbac.ts` - Role-based access control
- `lib/crypto.ts` - Cryptographic utilities
- `lib/server/guard.ts` - Server-side auth guards
- `middleware.ts` - Clerk authentication middleware
- `app/layout.tsx` - Root layout with ClerkProvider

## Next Steps

Task 1 is complete. Next tasks will implement:

- Task 2: Auth & Organization onboarding
- Task 3: Consent Templates & Builder
- Task 4: Intake setup & distribution
- Task 5: Client intake form & signature capture
- Task 6: PDF generation & storage
- Task 7: Records search & detail
- Task 8: Reporting & observability

