// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/list', '/stats', '/history', '/settings', '/themes', '/premium', '/premium-plans', '/list/create-first'];
const AUTH_ROUTE = '/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('PHPSESSID'); // Standard PHP session cookie name

  console.log(`Middleware: Pathname: ${pathname}, PHPSESSID exists: ${!!sessionCookie}`);

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!sessionCookie) {
      console.log('Middleware: No session cookie, redirecting to auth page.');
      const url = request.nextUrl.clone();
      url.pathname = AUTH_ROUTE;
      url.searchParams.set('redirectedFrom', pathname); // Optional: pass original path
      return NextResponse.redirect(url);
    }
    // If there's a session cookie, we assume the user might be authenticated.
    // The actual validation of the session happens on the API routes or client-side AuthContext.
    // For middleware, simply having the cookie is often enough to allow access,
    // and let client-side logic handle re-auth if session is invalid.
  } else if (pathname === AUTH_ROUTE) {
    if (sessionCookie) {
      // If user is on auth page but has a session cookie, redirect them to the app's main page.
      // This prevents logged-in users from seeing the login/signup page unnecessarily.
      // We can't know for sure if the session is valid here without an API call,
      // but it's a common UX pattern. AuthContext will verify.
      console.log('Middleware: Session cookie exists, user on auth page, redirecting to /list.');
      const url = request.nextUrl.clone();
      url.pathname = '/list'; // Or your main app page
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api routes (this is handled by PHP, not Next.js middleware for API calls)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
