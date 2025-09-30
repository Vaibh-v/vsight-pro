export type Role = "owner" | "admin" | "editor" | "viewer";

export function canEdit(userRole: Role) {
  return userRole === "owner" || userRole === "admin" || userRole === "editor";
}
export function canAdmin(userRole: Role) {
  return userRole === "owner" || userRole === "admin";
}

/**
 * Placeholder resolver until you wire real auth/user store.
 * Return "owner" during dev to unlock all UI.
 */
export function resolveUserRole(): Role {
  return "owner";
}
