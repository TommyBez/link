import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../env'
import {
  intakeSessions,
  intakeSessionsRelations,
  memberships,
  membershipsRelations,
  orgs,
  orgsRelations,
  pdfArtifacts,
  pdfArtifactsRelations,
  signatures,
  signaturesRelations,
  submissions,
  submissionsRelations,
  templates,
  templatesRelations,
  templateVersions,
  templateVersionsRelations,
  users,
  usersRelations,
} from './schema'

const sql = neon(env.DATABASE_URL)

export const db = drizzle(sql, {
  schema: {
    orgs,
    orgsRelations,
    users,
    usersRelations,
    memberships,
    membershipsRelations,
    templates,
    templatesRelations,
    templateVersions,
    templateVersionsRelations,
    intakeSessions,
    intakeSessionsRelations,
    submissions,
    submissionsRelations,
    signatures,
    signaturesRelations,
    pdfArtifacts,
    pdfArtifactsRelations,
  },
})
