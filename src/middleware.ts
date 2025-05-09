// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require the user to be authenticated
const AUTHENTICATED_ROUTES = [
  '/list',
  '/stats',
  '/history',
  '/settings',
  '/themes',
  '/premium',
  '/premium-plans',
  '/list/create-first', // create-first is now effectively a protected entry point to the app area
  // Add any Next.js API routes that need protection if they exist, e.g., '/api/userdata'
];

// The primary authentication page
const AUTH_ROUTE = '/auth';
// The root of the application, users will be redirected from here
const APP_ROOT_ROUTE = '/';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all OPTIONS requests (for CORS preflight checks)
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Check for a session cookie. The name 'auth_token' is used here as per previous context.
  // If your PHP backend uses a different session cookie name (e.g., PHPSESSID),
  // adjust this or ensure PHP sets 'auth_token' upon successful login.
  // Middleware can only check for presence, not validate HttpOnly cookies.
  const sessionCookie = request.cookies.get('auth_token'); // Or your PHP session cookie name if different & readable by JS
  const isAuthenticatedByCookiePresence = !!sessionCookie;

  console.log(`Middleware: Path: ${pathname}, SessionCookie ('auth_token') Exists: ${isAuthenticatedByCookiePresence}`);

  // 1. Handle root path: always redirect to auth page.
  // AuthContext/AppLayout will then decide if user is already logged in and redirect further.
  if (pathname === APP_ROOT_ROUTE) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_ROUTE;
    console.log(`Middleware: User on root. Redirecting to ${AUTH_ROUTE}.`);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Handle /auth route
  if (pathname === AUTH_ROUTE) {
    if (isAuthenticatedByCookiePresence) {
      // If user has an auth cookie and tries to access /auth, redirect them to the app.
      // AuthContext will verify the session with the backend.
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/list/create-first'; // Default authenticated entry point
      console.log(`Middleware: User with session cookie on ${AUTH_ROUTE}. Redirecting to ${redirectUrl.pathname}.`);
      return NextResponse.redirect(redirectUrl);
    }
    // Allow access to /auth if no auth cookie (user needs to log in/sign up)
    return NextResponse.next();
  }

  // 3. Handle protected routes
  if (AUTHENTICATED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticatedByCookiePresence) {
      // User does not have an auth cookie and is trying to access a protected route.
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTE;
      redirectUrl.searchParams.set('redirectedFrom', pathname); // Pass original path for post-login redirect
      console.log(`Middleware: No session cookie for protected route ${pathname}. Redirecting to ${AUTH_ROUTE}.`);
      return NextResponse.redirect(redirectUrl);
    }
    // User has an auth cookie, allow access. Backend will validate session on API calls.
    return NextResponse.next();
  }

  // For any other routes not covered, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for specific Next.js internals and static assets.
    // This ensures middleware runs for all page navigations and API routes (if any are part of Next.js).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Note: This matcher applies to requests handled by Next.js.
    // If your PHP API is under /neon/api/ and served by Hostinger's Apache/PHP,
    // this Next.js middleware will not run for those external PHP API calls.
  ],
};
