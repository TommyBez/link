import type { WebhookEvent } from '@clerk/nextjs/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { and, eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { memberships, orgs, users } from '@/lib/db/schema'

export const runtime = 'nodejs'

function getPrimaryEmail(
  emailAddresses: Array<{ id: string; email_address: string }>,
) {
  return emailAddresses[0]?.email_address
}

function getUserName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  const hasName = firstName || lastName
  if (!hasName) {
    return null
  }
  return `${firstName || ''} ${lastName || ''}`.trim() || null
}

async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== 'user.created') {
    return
  }

  const { id, email_addresses, first_name, last_name } = evt.data
  const email = getPrimaryEmail(email_addresses)
  const name = getUserName(first_name, last_name)

  if (!email) {
    throw new Error(`User created without email: ${id}`)
  }

  await db.insert(users).values({
    clerkUserId: id,
    email,
    name,
  })

  console.log(`User created: ${id} (${email})`)
}

async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') {
    return
  }

  const { id, email_addresses, first_name, last_name } = evt.data
  const email = getPrimaryEmail(email_addresses)
  const name = getUserName(first_name, last_name)

  if (!email) {
    throw new Error(`User updated without email: ${id}`)
  }

  await db
    .update(users)
    .set({
      email,
      name,
    })
    .where(eq(users.clerkUserId, id))

  console.log(`User updated: ${id} (${email})`)
}

async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== 'user.deleted') {
    return
  }

  const { id } = evt.data
  if (!id) {
    throw new Error('User deleted event missing id')
  }

  await db.delete(users).where(eq(users.clerkUserId, id))

  console.log(`User deleted: ${id}`)
}

async function handleOrganizationCreated(evt: WebhookEvent) {
  if (evt.type !== 'organization.created') {
    return
  }

  const { id, name } = evt.data

  await db.insert(orgs).values({
    clerkOrgId: id,
    name: name || 'Unnamed Organization',
  })

  console.log(`Organization created: ${id} (${name})`)
}

async function handleOrganizationUpdated(evt: WebhookEvent) {
  if (evt.type !== 'organization.updated') {
    return
  }

  const { id, name } = evt.data

  await db
    .update(orgs)
    .set({
      name: name || 'Unnamed Organization',
    })
    .where(eq(orgs.clerkOrgId, id))

  console.log(`Organization updated: ${id} (${name})`)
}

async function handleOrganizationDeleted(evt: WebhookEvent) {
  if (evt.type !== 'organization.deleted') {
    return
  }

  const { id } = evt.data
  if (!id) {
    throw new Error('Organization deleted event missing id')
  }

  await db.delete(orgs).where(eq(orgs.clerkOrgId, id))

  console.log(`Organization deleted: ${id}`)
}

async function handleMembershipCreated(evt: WebhookEvent) {
  if (evt.type !== 'organizationMembership.created') {
    return
  }

  const { organization, public_user_data, role } = evt.data
  const orgId = organization.id
  const userId = public_user_data.user_id

  const [org] = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(eq(orgs.clerkOrgId, orgId))
    .limit(1)

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1)

  if (!org) {
    throw new Error(
      `Membership created but org not found: orgId=${orgId}, userId=${userId}`,
    )
  }
  if (!user) {
    throw new Error(
      `Membership created but user not found: orgId=${orgId}, userId=${userId}`,
    )
  }

  const mappedRole = role === 'org:admin' ? 'ADMIN' : 'STAFF'

  await db.insert(memberships).values({
    orgId: org.id,
    userId: user.id,
    role: mappedRole,
  })

  console.log(
    `Membership created: user ${userId} -> org ${orgId} (${mappedRole})`,
  )
}

async function handleMembershipUpdated(evt: WebhookEvent) {
  if (evt.type !== 'organizationMembership.updated') {
    return
  }

  const { organization, public_user_data, role } = evt.data
  const orgId = organization.id
  const userId = public_user_data.user_id

  const [org] = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(eq(orgs.clerkOrgId, orgId))
    .limit(1)

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1)

  if (!org) {
    throw new Error(
      `Membership updated but org not found: orgId=${orgId}, userId=${userId}`,
    )
  }
  if (!user) {
    throw new Error(
      `Membership updated but user not found: orgId=${orgId}, userId=${userId}`,
    )
  }

  const mappedRole = role === 'org:admin' ? 'ADMIN' : 'STAFF'

  await db
    .update(memberships)
    .set({
      role: mappedRole,
    })
    .where(and(eq(memberships.orgId, org.id), eq(memberships.userId, user.id)))

  console.log(
    `Membership updated: user ${userId} -> org ${orgId} (${mappedRole})`,
  )
}

async function handleMembershipDeleted(evt: WebhookEvent) {
  if (evt.type !== 'organizationMembership.deleted') {
    return
  }

  const { organization, public_user_data } = evt.data
  const orgId = organization.id
  const userId = public_user_data.user_id

  const [org] = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(eq(orgs.clerkOrgId, orgId))
    .limit(1)

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1)

  if (!org) {
    throw new Error(
      `Membership deleted but org not found: orgId=${orgId}, userId=${userId}`,
    )
  }
  if (!user) {
    throw new Error(
      `Membership deleted but user not found: orgId=${orgId}, userId=${userId}`,
    )
  }

  await db
    .delete(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.userId, user.id)))

  console.log(`Membership deleted: user ${userId} -> org ${orgId}`)
}

async function handleWebhookEvent(evt: WebhookEvent) {
  switch (evt.type) {
    case 'user.created':
      await handleUserCreated(evt)
      break
    case 'user.updated':
      await handleUserUpdated(evt)
      break
    case 'user.deleted':
      await handleUserDeleted(evt)
      break
    case 'organization.created':
      await handleOrganizationCreated(evt)
      break
    case 'organization.updated':
      await handleOrganizationUpdated(evt)
      break
    case 'organization.deleted':
      await handleOrganizationDeleted(evt)
      break
    case 'organizationMembership.created':
      await handleMembershipCreated(evt)
      break
    case 'organizationMembership.updated':
      await handleMembershipUpdated(evt)
      break
    case 'organizationMembership.deleted':
      await handleMembershipDeleted(evt)
      break
    default:
      console.log(`Unhandled webhook event type: ${evt.type}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    await handleWebhookEvent(evt)

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
