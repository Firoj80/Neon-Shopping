// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that require authentication
const PROTECTED_ROUTES = ['/list', '/stats', '/history', '/settings', '/themes', '/premium', '/premium-plans'];
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const APP_ROOT_ROUTE = '/'; // Usually the entry point to the app after login

// This secret should match the one used in your PHP backend for signing JWTs
// It's crucial this is kept secret and is the same on both frontend (for verification) and backend (for signing/verification)
// For Edge runtime, it's better to have it as an environment variable.
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key-here-32-bytes';
// let jwtSecretKey: Uint8Array | null = null;
// try {
//   jwtSecretKey = new TextEncoder().encode(JWT_SECRET);
// } catch (e) {
//   console.error("Failed to encode JWT_SECRET:", e);
// }


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get('auth_token'); // Your JWT cookie name
  const isAuthenticatedByCookie = !!authTokenCookie; // Basic check for cookie existence

  console.log(`Middleware: Path: ${pathname}, AuthToken Exists: ${isAuthenticatedByCookie}`);

  // Determine if the current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || pathname === CREATE_FIRST_LIST_ROUTE;

  if (isProtectedRoute) {
    if (!isAuthenticatedByCookie) {
      // User is not authenticated and trying to access a protected route
      console.log(`Middleware: Unauthenticated access to protected route ${pathname}. Redirecting to ${AUTH_ROUTE}.`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTE;
      redirectUrl.searchParams.set('redirectedFrom', pathname); // Pass original path for redirection after login
      return NextResponse.redirect(redirectUrl);
    }
    // If authenticated by cookie, allow access. Client-side AuthContext will do further verification.
  } else if (pathname === AUTH_ROUTE) {
    if (isAuthenticatedByCookie) {
      // User is authenticated and trying to access the auth page
      // Redirect them to a default page within the app, e.g., /list/create-first or /list
      console.log(`Middleware: Authenticated user on ${AUTH_ROUTE}. Redirecting to ${CREATE_FIRST_LIST_ROUTE}.`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = CREATE_FIRST_LIST_ROUTE; // Or your main app page after login like '/list'
      return NextResponse.redirect(redirectUrl);
    }
  } else if (pathname === APP_ROOT_ROUTE) {
    // If user hits the root, decide where to send them
    if (isAuthenticatedByCookie) {
      console.log(`Middleware: Authenticated user on root. Redirecting to ${CREATE_FIRST_LIST_ROUTE}.`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = CREATE_FIRST_LIST_ROUTE; // Or '/list'
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log(`Middleware: Unauthenticated user on root. Redirecting to ${AUTH_ROUTE}.`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTE;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (PHP API routes - let them be handled by the PHP server)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any other static assets in /public like images, manifests, etc.
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
