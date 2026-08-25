export type UserRole = "customer" | "provider" | "admin";

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  customer: "/customer/dashboard",
  provider: "/provider/dashboard",
  admin: "/admin/dashboard",
};

/** Auth pages an already authenticated user should be redirected away from. */
export const PUBLIC_AUTH_PATHS = [
  "/sign-in",
  "/sign-up/customer",
  "/sign-up/provider",
  "/admin/sign-in",
];

const ADMIN_SIGN_IN_PATH = "/admin/sign-in";

export function normalizeRole(role: string | undefined | null): UserRole | null {
  return role === "customer" || role === "provider" || role === "admin"
    ? role
    : null;
}

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role];
}

/**
 * The role a given protected route belongs to, or null for public routes.
 * Admin sign-in is public and therefore excluded.
 */
export function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/customer")) return "customer";
  if (pathname.startsWith("/provider")) return "provider";
  if (pathname.startsWith("/admin") && pathname !== ADMIN_SIGN_IN_PATH) {
    return "admin";
  }
  return null;
}

/** The sign-in page that guards the given route's role. */
export function getSignInPathFor(pathname: string): string {
  return getRequiredRole(pathname) === "admin"
    ? ADMIN_SIGN_IN_PATH
    : "/sign-in";
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.includes(pathname);
}
