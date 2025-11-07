export type Role = 'ADMIN' | 'STAFF'

export type RequestContext = {
  userId: string
  orgId: string
  roles: Role[]
}

export function hasRole(userRoles: Role[], required: Role): boolean {
  return userRoles.includes(required)
}

export function isAdmin(roles: Role[]): boolean {
  return hasRole(roles, 'ADMIN')
}

export function isStaff(roles: Role[]): boolean {
  return hasRole(roles, 'STAFF') || hasRole(roles, 'ADMIN')
}

export function assertOrgScope(userOrgId: string, resourceOrgId: string): void {
  if (userOrgId !== resourceOrgId) {
    throw new Error('Access denied: Organization scope mismatch')
  }
}

export function enforceStaff(context: RequestContext): void {
  if (!isStaff(context.roles)) {
    throw new Error('Access denied: STAFF role required')
  }
}
