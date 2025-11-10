import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { hashPayloadSHA256 } from '@/lib/crypto'
import { db } from '@/lib/db'
import { templates, templateVersions } from '@/lib/db/schema'
import { type TemplateDraftInput, templateDraft } from '@/lib/templates/schema'

dotenv.config({
  path: '.env.local',
})

type ParsedArgs = {
  org?: string
  help?: boolean
}

const SAMPLE_TEMPLATE_NAME = 'Sample Consent Template'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const parsed: ParsedArgs = {}

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      break
    }
    if (arg === '--org' || arg === '-o') {
      parsed.org = args[i + 1]
      i += 1
      continue
    }
    if (arg.startsWith('--org=')) {
      parsed.org = arg.split('=')[1]
    }
  }

  return parsed
}

function printHelp() {
  console.log(`Seed a sample consent template for a specific organization.

Usage:
  pnpm seed:sample -- --org <org-id-or-clerk-org-id>

Options:
  --org, -o    Required. The org UUID or Clerk org ID to seed.
  --help, -h   Show this message.`)
}

async function resolveOrg(orgIdentifier: string) {
  if (UUID_PATTERN.test(orgIdentifier)) {
    const byId = await db.query.orgs.findFirst({
      where: (table, { eq: eqWhere }) => eqWhere(table.id, orgIdentifier),
    })
    if (byId) {
      return byId
    }
  }

  const byClerkId = await db.query.orgs.findFirst({
    where: (table, { eq: eqWhere }) => eqWhere(table.clerkOrgId, orgIdentifier),
  })

  return byClerkId
}

function buildSampleTemplate(orgName: string): TemplateDraftInput {
  return templateDraft.parse({
    name: SAMPLE_TEMPLATE_NAME,
    description: `Starter template automatically generated for ${orgName}.`,
    locale: 'en-US',
    branding: {
      logoUrl:
        'https://dummyimage.com/240x80/2563eb/ffffff.png&text=Your+Studio+Logo',
      primaryColor: '#2563eb',
      accentColor: '#9333ea',
    },
    fields: [
      {
        id: 'welcome_copy',
        type: 'content',
        label: 'Welcome',
        helperText: '',
        content:
          'Thank you for trusting our studio. Please review the following information carefully before providing consent.',
        align: 'start',
      },
      {
        id: 'participant_name',
        type: 'text',
        label: 'Participant full name',
        helperText: 'Enter the full legal name of the participant.',
        required: true,
        placeholder: 'Jane Doe',
      },
      {
        id: 'participant_email',
        type: 'email',
        label: 'Contact email',
        helperText: 'We will send confirmation and updates to this address.',
        required: true,
        placeholder: 'jane.doe@example.com',
      },
      {
        id: 'visit_date',
        type: 'date',
        label: 'Visit date',
        helperText: 'Select the date the consent conversation occurred.',
        required: true,
      },
      {
        id: 'medical_history',
        type: 'textarea',
        label: 'Relevant medical history',
        helperText:
          'Include allergies, current medications, and recent conditions.',
        required: false,
        placeholder: 'List allergies, medications, and relevant history.',
      },
      {
        id: 'contact_method',
        type: 'radio',
        label: 'Preferred contact method',
        helperText: 'Choose the contact method the participant prefers.',
        required: true,
        options: [
          { id: 'contact_email', label: 'Email' },
          { id: 'contact_phone', label: 'Phone' },
        ],
      },
      {
        id: 'consent_ack',
        type: 'checkbox',
        label: 'Acknowledgement',
        helperText:
          'Confirm that the participant has reviewed the consent information thoroughly.',
        required: true,
        defaultValue: false,
      },
      {
        id: 'participant_signature',
        type: 'signature',
        label: 'Participant signature',
        helperText: 'Signature of participant or legal guardian.',
        required: true,
        acknowledgementText:
          'By signing, I acknowledge that I have read and understand the consent information provided.',
      },
    ],
  })
}

async function ensureTemplateVersions(
  templateId: string,
  payload: TemplateDraftInput,
) {
  const checksum = hashPayloadSHA256(payload)
  const now = new Date()

  await db
    .insert(templateVersions)
    .values({
      templateId,
      version: 0,
      schemaJson: payload,
      checksum,
      publishedAt: now,
    })
    .onConflictDoUpdate({
      target: [templateVersions.templateId, templateVersions.version],
      set: {
        schemaJson: payload,
        checksum,
        publishedAt: now,
      },
    })

  await db
    .insert(templateVersions)
    .values({
      templateId,
      version: 1,
      schemaJson: payload,
      checksum,
      publishedAt: now,
    })
    .onConflictDoUpdate({
      target: [templateVersions.templateId, templateVersions.version],
      set: {
        schemaJson: payload,
        checksum,
        publishedAt: now,
      },
    })

  return { checksum, publishedAt: now }
}

async function seedSampleTemplate(orgId: string) {
  const orgRecord = await resolveOrg(orgId)

  if (!orgRecord) {
    throw new Error(`Unable to find organization for identifier "${orgId}".`)
  }

  const payload = buildSampleTemplate(orgRecord.name)
  const now = new Date()

  const existingTemplate = await db.query.templates.findFirst({
    where: (table, { and, eq: eqWhere }) =>
      and(
        eqWhere(table.orgId, orgRecord.id),
        eqWhere(table.name, SAMPLE_TEMPLATE_NAME),
      ),
  })

  let templateId: string

  if (existingTemplate) {
    await db
      .update(templates)
      .set({
        status: 'published',
        name: SAMPLE_TEMPLATE_NAME,
        updatedAt: now,
      })
      .where(eq(templates.id, existingTemplate.id))
    templateId = existingTemplate.id
  } else {
    const [created] = await db
      .insert(templates)
      .values({
        orgId: orgRecord.id,
        name: SAMPLE_TEMPLATE_NAME,
        status: 'published',
        updatedAt: now,
      })
      .returning({ id: templates.id })
    templateId = created.id
  }

  const { checksum } = await ensureTemplateVersions(templateId, payload)

  console.log(
    `Seeded sample template "${SAMPLE_TEMPLATE_NAME}" for org ${orgRecord.name} (${orgRecord.id}). Template ID: ${templateId}. Checksum: ${checksum}.`,
  )
}

async function main() {
  const args = parseArgs()

  if (args.help || !args.org) {
    printHelp()
    if (!args.org) {
      process.exit(args.help ? 0 : 1)
    }
    process.exit(0)
  }

  try {
    await seedSampleTemplate(args.org)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main().catch(console.error)
