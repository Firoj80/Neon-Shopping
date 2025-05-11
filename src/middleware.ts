// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes
const APP_ROOT_ROUTE = '/';
// No auth routes, all app routes are directly accessible after initial load.
// The AppLayout or specific page components will handle redirection
// to '/list/create-first' if no lists exist for the anonymous user.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If user hits the absolute root, and your app's primary content isn't there,
  // you might redirect them to a default starting page like '/list'.
  // However, if HomePage (`src/app/page.tsx`) handles this logic, middleware might not be needed.
  // For simplicity now, let HomePage handle redirection to /list or /list/create-first.
  if (pathname === APP_ROOT_ROUTE) {
    // console.log("Middleware: User on root. Letting HomePage handle redirection.");
    // Let the HomePage component decide where to redirect.
    return NextResponse.next();
  }

  // No other specific middleware logic needed for a purely local storage-based app without auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - any file with an extension (e.g., .png, .jpg)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
