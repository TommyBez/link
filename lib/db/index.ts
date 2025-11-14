import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
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

const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle(pool, {
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
