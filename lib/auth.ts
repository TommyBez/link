import { auth, currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { organizations, users } from './db/schema'

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return null
  }

  const dbUser = await getDbUserByClerkId(userId)

  return {
    clerkUser,
    dbUser,
  }
}

export async function getCurrentOrganization() {
  const { orgId } = await auth()
  if (!orgId) {
    return null
  }

  // Check if organization exists in our database
  const [dbOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.clerkOrgId, orgId))
    .limit(1)

  return dbOrg || null
}

export async function getCurrentDbUser() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  return getDbUserByClerkId(userId)
}

export async function requireCurrentDbUser() {
  const user = await getCurrentDbUser()
  if (!user) {
    throw new Error('User not found in database')
  }

  return user
}

async function getDbUserByClerkId(clerkUserId: string) {
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  return dbUser || null
}
