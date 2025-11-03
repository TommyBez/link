import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "./db"
import { users, organizations } from "./db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  // Check if user exists in our database
  const [dbUser] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)

  return {
    clerkUser,
    dbUser: dbUser || null,
  }
}

export async function getCurrentOrganization() {
  const { orgId } = await auth()
  if (!orgId) return null

  // Check if organization exists in our database
  const [dbOrg] = await db.select().from(organizations).where(eq(organizations.clerkOrgId, orgId)).limit(1)

  return dbOrg || null
}

export async function ensureUserInDatabase() {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error("Not authenticated")

  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error("User not found")

  // Check if user exists
  const [existingUser] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)

  if (existingUser) return existingUser

  // Create organization if it doesn't exist
  if (orgId) {
    const [existingOrg] = await db.select().from(organizations).where(eq(organizations.clerkOrgId, orgId)).limit(1)

    if (!existingOrg) {
      await db.insert(organizations).values({
        clerkOrgId: orgId,
        name: clerkUser.organizationMemberships?.[0]?.organization?.name || "My Studio",
      })
    }

    // Get the organization
    const [org] = await db.select().from(organizations).where(eq(organizations.clerkOrgId, orgId)).limit(1)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId: userId,
        organizationId: org.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
        role: "staff",
      })
      .returning()

    return newUser
  }

  throw new Error("No organization found")
}
