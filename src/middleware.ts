// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Using jose for JWT verification in Edge runtime

// JWT_SECRET should be in an environment variable for security
const JWT_SECRET_BYTES = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-jwt-secret-for-neon-shopping-app-firoj');

// Define routes that require authentication
const AUTHENTICATED_ROUTES = ['/list', '/stats', '/history', '/settings', '/themes', '/premium', '/premium-plans'];
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const APP_ROOT_ROUTE = '/';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get('auth_token');
  let isAuthenticatedByCookie = false;

  if (authTokenCookie && authTokenCookie.value) {
    try {
      await jwtVerify(authTokenCookie.value, JWT_SECRET_BYTES);
      isAuthenticatedByCookie = true;
    } catch (err) {
      console.log("Middleware: Invalid token, treating as unauthenticated.");
      // Optionally, clear the invalid cookie
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      // return response; // If you want to clear cookie and then proceed with redirect logic
    }
  }

  console.log(`Middleware: Path: ${pathname}, AuthToken Exists: ${!!authTokenCookie}, IsAuthenticatedByCookie: ${isAuthenticatedByCookie}`);

  // If user is trying to access the root path
  if (pathname === APP_ROOT_ROUTE) {
    const redirectUrl = request.nextUrl.clone();
    // Always redirect to create-first list page initially
    redirectUrl.pathname = CREATE_FIRST_LIST_ROUTE;
    console.log(`Middleware: User on root. Redirecting to ${CREATE_FIRST_LIST_ROUTE}.`);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is on the authentication page
  if (pathname === AUTH_ROUTE) {
    if (isAuthenticatedByCookie) {
      // Authenticated user trying to access auth page, redirect them to create-first or list
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = CREATE_FIRST_LIST_ROUTE; // Or determine if they have lists and go to /list
      console.log(`Middleware: Authenticated user on ${AUTH_ROUTE}. Redirecting to ${redirectUrl.pathname}.`);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next(); // Allow unauthenticated users to access /auth
  }

  // For other authenticated routes (excluding create-first-list which is now public)
  if (AUTHENTICATED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticatedByCookie) {
      // User is not authenticated and trying to access a protected route
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = AUTH_ROUTE;
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      console.log(`Middleware: Unauthenticated access to protected route ${pathname}. Redirecting to ${AUTH_ROUTE}.`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Allow access to /list/create-first for everyone
  if (pathname === CREATE_FIRST_LIST_ROUTE) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
