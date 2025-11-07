import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { Role } from '../rbac'
import { isStaff } from '../rbac'

export type AuthContext = {
  userId: string
  clerkUserId: string
  orgId: string
  roles: Role[]
}

export async function requireAuth(): Promise<{
  clerkUserId: string
  clerkOrgId: string | null
}> {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: No user session')
  }

  return {
    clerkUserId: userId,
    clerkOrgId: orgId ?? null,
  }
}

export async function requireStaff(): Promise<AuthContext> {
  const { clerkUserId, clerkOrgId } = await requireAuth()

  if (!clerkOrgId) {
    throw new Error('Forbidden: No organization context')
  }

  // Look up user in our database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  })

  if (!user) {
    throw new Error('Forbidden: User not found in database')
  }

  // Look up membership and role
  const membership = await db.query.memberships.findFirst({
    where: (m, { and }) => and(eq(m.userId, user.id), eq(m.orgId, clerkOrgId)),
    with: {
      org: true,
    },
  })

  if (!membership) {
    throw new Error('Forbidden: No membership found for organization')
  }

  const roles: Role[] = [membership.role as Role]

  if (!isStaff(roles)) {
    throw new Error('Forbidden: STAFF or ADMIN role required')
  }

  return {
    userId: user.id,
    clerkUserId,
    orgId: membership.orgId,
    roles,
  }
}
