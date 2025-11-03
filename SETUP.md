# Link - Setup Instructions

## Environment Variables

You need to add the following environment variables to your Vercel project:

### Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Enable **Organizations** in the Clerk dashboard:
   - Go to "Configure" → "Organizations"
   - Enable organizations
4. Copy the following keys from "API Keys":

\`\`\`env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
\`\`\`

### Clerk URLs (Optional - for custom domains)

\`\`\`env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
\`\`\`

### Database (Already configured)

Your Neon database is already connected with these variables:
- `NEON_NEON_DATABASE_URL`
- (and other NEON_* variables)

## Running the Database Migration

To create the database tables, run the SQL script:

1. Go to your Neon dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/001_create_tables.sql`
4. Execute the script

Or use the Neon CLI if you have it installed:

\`\`\`bash
psql $NEON_DATABASE_URL < scripts/001_create_tables.sql
\`\`\`

## Getting Started

1. Add the Clerk environment variables to your Vercel project
2. Run the database migration script
3. Start the development server: `npm run dev`
4. Sign up with an organization to get started

## Organization Setup

When you first sign up:
1. Create an organization in Clerk (you'll be prompted)
2. The system will automatically create the organization in the database
3. You'll be redirected to the dashboard

Invite team members:
1. Go to Clerk dashboard → Organizations
2. Invite members to your organization
3. They'll automatically get access to your studio's forms
