import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// Organizations table - represents tattoo studios
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Users table - studio staff members
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'), // admin, staff
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Forms table - form templates created by studio staff
export const forms = pgTable('forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Form fields table - individual fields and text blocks within forms
export const formFields = pgTable('form_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  fieldType: text('field_type').notNull(), // text, textarea, email, phone, date, checkbox, radio, select, signature, text_block, heading, divider
  label: text('label').notNull(), // For text_block, this stores the content
  placeholder: text('placeholder'),
  required: boolean('required').notNull().default(false),
  options: jsonb('options'), // For select/radio fields: ["Option 1", "Option 2"]
  order: integer('order').notNull(),
  validationRules: jsonb('validation_rules'), // { minLength: 5, pattern: "regex" }
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Form submissions table - completed forms from clients
export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  status: text('status').notNull().default('completed'), // pending, completed, archived
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  pdfUrl: text('pdf_url'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Submission answers table - individual answers to form fields
export const submissionAnswers = pgTable('submission_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => formSubmissions.id, { onDelete: 'cascade' }),
  formFieldId: uuid('form_field_id')
    .notNull()
    .references(() => formFields.id, { onDelete: 'cascade' }),
  answerValue: text('answer_value').notNull(), // Store as text, parse JSON for complex types
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Documents table - archive of generated PDFs
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => formSubmissions.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'), // Size in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  forms: many(forms),
  submissions: many(formSubmissions),
  documents: many(documents),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  forms: many(forms),
}))

export const formsRelations = relations(forms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [forms.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [forms.createdByUserId],
    references: [users.id],
  }),
  fields: many(formFields),
  submissions: many(formSubmissions),
}))

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  form: one(forms, {
    fields: [formFields.formId],
    references: [forms.id],
  }),
  answers: many(submissionAnswers),
}))

export const formSubmissionsRelations = relations(
  formSubmissions,
  ({ one, many }) => ({
    form: one(forms, {
      fields: [formSubmissions.formId],
      references: [forms.id],
    }),
    organization: one(organizations, {
      fields: [formSubmissions.organizationId],
      references: [organizations.id],
    }),
    answers: many(submissionAnswers),
    document: one(documents),
  }),
)

export const submissionAnswersRelations = relations(
  submissionAnswers,
  ({ one }) => ({
    submission: one(formSubmissions, {
      fields: [submissionAnswers.submissionId],
      references: [formSubmissions.id],
    }),
    formField: one(formFields, {
      fields: [submissionAnswers.formFieldId],
      references: [formFields.id],
    }),
  }),
)

export const documentsRelations = relations(documents, ({ one }) => ({
  submission: one(formSubmissions, {
    fields: [documents.submissionId],
    references: [formSubmissions.id],
  }),
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
}))
