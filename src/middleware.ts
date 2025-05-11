// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTHENTICATED_ROUTES_PREFIX = '/list'; // Covers /list, /list/create-first, etc.
const APP_AREA_ROUTES_PREFIXES = ['/list', '/stats', '/history', '/settings', '/themes', '/premium', '/premium-plans'];
const AUTH_ROUTE = '/auth';
const APP_ROOT_ROUTE = '/';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get('auth_token'); // Assuming your PHP session sets this or similar
  const isAuthenticatedByCookie = !!authTokenCookie;

  console.log(`Middleware: Path: ${pathname}, AuthTokenCookie Exists: ${isAuthenticatedByCookie}`);

  // 1. Handle root path: always redirect to auth page.
  // AppLayoutContent will then decide if user is already logged in and redirect further.
  if (pathname === APP_ROOT_ROUTE) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE;
    console.log(`Middleware: User on root. Redirecting to ${AUTH_ROUTE}.`);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Handle /auth route
  if (pathname === AUTH_ROUTE) {
    if (isAuthenticatedByCookie) {
      // If user has an auth cookie and tries to access /auth, redirect them to the app.
      // AuthContext/AppLayoutContent will verify the session with the backend and then decide the final destination.
      const redirectUrl = request.nextUrl.clone();
      // Redirect to create-first, AppLayoutContent will handle if lists exist
      redirectUrl.pathname = CREATE_FIRST_LIST_ROUTE; 
      console.log(`Middleware: User with session cookie on ${AUTH_ROUTE}. Redirecting to ${redirectUrl.pathname}.`);
      return NextResponse.redirect(redirectUrl);
    }
    // Allow access to /auth if no auth cookie (user needs to log in/sign up)
    return NextResponse.next();
  }

  // 3. Handle protected app area routes
  if (APP_AREA_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    if (!isAuthenticatedByCookie) {
      // User does not have an auth cookie and is trying to access a protected route.
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTE;
      redirectUrl.searchParams.set('redirectedFrom', pathname); // Pass original path for post-login redirect
      console.log(`Middleware: No session cookie for protected route ${pathname}. Redirecting to ${AUTH_ROUTE}.`);
      return NextResponse.redirect(redirectUrl);
    }
    // User has an auth cookie, allow access. Backend will validate session on API calls.
    // AppLayoutContent will further redirect if e.g. no lists and user lands on /list.
    return NextResponse.next();
  }

  // For any other routes not covered (e.g. public static assets, /about, /contact), allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
