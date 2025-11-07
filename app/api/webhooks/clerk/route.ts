import type {
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from '@clerk/nextjs/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, users } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  let event: WebhookEvent

  try {
    event = (await verifyWebhook(req)) as WebhookEvent
  } catch (_error) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      {
        status: 400,
      },
    )
  }

  try {
    await handleEvent(event)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error processing webhook' },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({ success: true })
}

async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'organization.created':
    case 'organization.updated': {
      await upsertOrganization(event.data)
      break
    }
    case 'organization.deleted': {
      const data = event.data
      if (data.id) {
        await db
          .delete(organizations)
          .where(eq(organizations.clerkOrgId, data.id))
      }
      break
    }
    case 'organizationMembership.created':
    case 'organizationMembership.updated': {
      await upsertMembership(event.data)
      break
    }
    case 'organizationMembership.deleted': {
      const data = event.data
      const userId = data.public_user_data?.user_id
      if (userId) {
        await db.delete(users).where(eq(users.clerkUserId, userId))
      }
      break
    }
    case 'user.created':
    case 'user.updated': {
      const data = event.data
      await updateUserProfile(data)
      break
    }
    case 'user.deleted': {
      const data = event.data
      if (data.id) {
        await db.delete(users).where(eq(users.clerkUserId, data.id))
      }
      break
    }
    default:
      break
  }
}

async function upsertOrganization(payload: OrganizationJSON) {
  if (!payload?.id) {
    return null
  }

  const name = getOrganizationName(payload)

  const [organizationRecord] = await db
    .insert(organizations)
    .values({
      clerkOrgId: payload.id,
      name,
    })
    .onConflictDoUpdate({
      target: organizations.clerkOrgId,
      set: {
        name,
        updatedAt: new Date(),
      },
    })
    .returning({ id: organizations.id })

  return organizationRecord?.id ?? null
}

async function upsertMembership(payload: OrganizationMembershipJSON) {
  if (!payload.organization?.id) {
    return
  }

  const organizationId = await upsertOrganization(payload.organization)
  const userId = payload.public_user_data?.user_id

  if (!(organizationId && userId)) {
    return
  }

  const name = getUserDisplayName(
    payload.public_user_data?.first_name,
    payload.public_user_data?.last_name,
  )
  const role = mapMembershipRole(payload.role)

  const [userRecord] = await db
    .update(users)
    .set({
      organizationId,
      name,
      role,
    })
    .where(eq(users.clerkUserId, userId))
    .returning({ id: users.id })

  return userRecord?.id ?? null
}

async function updateUserProfile(payload: UserJSON) {
  if (!payload.id) {
    return
  }

  const email = getPrimaryEmail(payload)
  const name = getUserDisplayName(payload.first_name, payload.last_name, email)

  await db
    .update(users)
    .set({
      email,
      name,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, payload.id))
}

function getPrimaryEmail(payload: UserJSON) {
  if (payload.primary_email_address_id && payload.email_addresses) {
    const primary = payload.email_addresses.find(
      (email) => email.id === payload.primary_email_address_id,
    )
    if (primary) {
      return primary.email_address
    }
  }

  if (payload.email_addresses && payload.email_addresses.length > 0) {
    return payload.email_addresses[0]?.email_address ?? ''
  }

  return ''
}

function getOrganizationName(payload: OrganizationJSON) {
  return payload.name?.trim() || payload.slug?.trim() || 'Untitled organization'
}

function getUserDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
) {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()

  if (fullName.length > 0) {
    return fullName
  }

  if (email && email.length > 0) {
    return email
  }

  return 'User'
}

function mapMembershipRole(role?: string | null) {
  if (!role) {
    return 'staff'
  }

  const normalized = role.toLowerCase()

  if (normalized === 'admin' || normalized === 'owner') {
    return 'admin'
  }

  return 'staff'
}
