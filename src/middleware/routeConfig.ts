const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/api/webhooks/clerk'];
const PUBLIC_PREFIXES = ['/sign-in/', '/sign-up/'];
const PROTECTED_PREFIXES = ['/dashboard', '/resume', '/api'];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

export function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
