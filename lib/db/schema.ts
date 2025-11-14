import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const roles = pgEnum('roles', ['ADMIN', 'STAFF'] as const)

export const intakeSessionStatus = pgEnum('intake_session_status', [
  'pending',
  'completed',
  'expired',
] as const)

export const submissionStatus = pgEnum('submission_status', [
  'draft',
  'submitted',
  'processed',
] as const)

export const pdfArtifactStatus = pgEnum('pdf_artifact_status', [
  'queued',
  'generating',
  'ready',
  'failed',
] as const)

export type Role = (typeof roles.enumValues)[number]
export type IntakeSessionStatus =
  (typeof intakeSessionStatus.enumValues)[number]
export type SubmissionStatus = (typeof submissionStatus.enumValues)[number]
export type PdfArtifactStatus = (typeof pdfArtifactStatus.enumValues)[number]

// Organizations table
export const orgs = pgTable(
  'orgs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkOrgId: varchar('clerk_org_id', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('orgs_clerk_org_id_idx').on(table.clerkOrgId)],
)

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('users_clerk_user_id_idx').on(table.clerkUserId),
    index('users_email_idx').on(table.email),
  ],
)

// Memberships table (role-based access)
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roles('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('memberships_org_user_unique').on(table.orgId, table.userId),
    index('memberships_org_id_idx').on(table.orgId),
    index('memberships_user_id_idx').on(table.userId),
  ],
)

// Templates table
export const templates = pgTable(
  'templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'draft' | 'published' | 'archived'
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('templates_org_id_idx').on(table.orgId),
    index('templates_status_idx').on(table.status),
  ],
)

// Template versions table (immutable after publish)
export const templateVersions = pgTable(
  'template_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    schemaJson: jsonb('schema_json').notNull(),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('template_versions_template_version_unique').on(
      table.templateId,
      table.version,
    ),
    index('template_versions_template_id_idx').on(table.templateId),
  ],
)

// Intake sessions table (tokenized links with TTL)
export const intakeSessions = pgTable(
  'intake_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    templateVersionId: uuid('template_version_id')
      .notNull()
      .references(() => templateVersions.id, { onDelete: 'restrict' }),
    status: intakeSessionStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('intake_sessions_token_idx').on(table.token),
    index('intake_sessions_org_id_idx').on(table.orgId),
    index('intake_sessions_status_idx').on(table.status),
    index('intake_sessions_expires_at_idx').on(table.expiresAt),
  ],
)

// Submissions table
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    intakeSessionId: uuid('intake_session_id')
      .notNull()
      .references(() => intakeSessions.id, { onDelete: 'cascade' }),
    templateVersionId: uuid('template_version_id')
      .notNull()
      .references(() => templateVersions.id, { onDelete: 'restrict' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    respondentName: varchar('respondent_name', { length: 255 }),
    respondentEmail: varchar('respondent_email', { length: 255 }),
    respondentPhone: varchar('respondent_phone', { length: 50 }),
    responseData: jsonb('response_data').notNull(),
    status: submissionStatus('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('submissions_intake_session_id_unique').on(
      table.intakeSessionId,
    ),
    index('submissions_intake_session_id_idx').on(table.intakeSessionId),
    index('submissions_org_id_idx').on(table.orgId),
    index('submissions_status_idx').on(table.status),
    index('submissions_respondent_email_idx').on(table.respondentEmail),
  ],
)

// Signatures table
export const signatures = pgTable(
  'signatures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    signerName: varchar('signer_name', { length: 255 }).notNull(),
    signedAtUtc: timestamp('signed_at_utc', { withTimezone: true }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    blobUrl: text('blob_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('signatures_submission_id_idx').on(table.submissionId),
  ],
)

// PDF artifacts table
export const pdfArtifacts = pgTable(
  'pdf_artifacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url'),
    status: pdfArtifactStatus('status').notNull().default('queued'),
    sizeBytes: integer('size_bytes'),
    checksum: varchar('checksum', { length: 64 }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('pdf_artifacts_submission_id_idx').on(table.submissionId),
    index('pdf_artifacts_status_idx').on(table.status),
  ],
)

// Relations
export const orgsRelations = relations(orgs, ({ many }) => ({
  memberships: many(memberships),
  templates: many(templates),
  intakeSessions: many(intakeSessions),
  submissions: many(submissions),
}))

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  org: one(orgs, {
    fields: [memberships.orgId],
    references: [orgs.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}))

export const templatesRelations = relations(templates, ({ one, many }) => ({
  org: one(orgs, {
    fields: [templates.orgId],
    references: [orgs.id],
  }),
  versions: many(templateVersions),
}))

export const templateVersionsRelations = relations(
  templateVersions,
  ({ one, many }) => ({
    template: one(templates, {
      fields: [templateVersions.templateId],
      references: [templates.id],
    }),
    intakeSessions: many(intakeSessions),
    submissions: many(submissions),
  }),
)

export const intakeSessionsRelations = relations(
  intakeSessions,
  ({ one, many }) => ({
    org: one(orgs, {
      fields: [intakeSessions.orgId],
      references: [orgs.id],
    }),
    templateVersion: one(templateVersions, {
      fields: [intakeSessions.templateVersionId],
      references: [templateVersions.id],
    }),
    submissions: many(submissions),
  }),
)

export const submissionsRelations = relations(submissions, ({ one }) => ({
  intakeSession: one(intakeSessions, {
    fields: [submissions.intakeSessionId],
    references: [intakeSessions.id],
  }),
  templateVersion: one(templateVersions, {
    fields: [submissions.templateVersionId],
    references: [templateVersions.id],
  }),
  org: one(orgs, {
    fields: [submissions.orgId],
    references: [orgs.id],
  }),
  signature: one(signatures, {
    fields: [submissions.id],
    references: [signatures.submissionId],
  }),
  pdfArtifact: one(pdfArtifacts, {
    fields: [submissions.id],
    references: [pdfArtifacts.submissionId],
  }),
}))

export const signaturesRelations = relations(signatures, ({ one }) => ({
  submission: one(submissions, {
    fields: [signatures.submissionId],
    references: [submissions.id],
  }),
}))

export const pdfArtifactsRelations = relations(pdfArtifacts, ({ one }) => ({
  submission: one(submissions, {
    fields: [pdfArtifacts.submissionId],
    references: [submissions.id],
  }),
}))
