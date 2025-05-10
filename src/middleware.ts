// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No longer need to check for auth tokens here.
// Redirection logic will be handled by AppLayout based on app state (e.g., existence of lists).

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // console.log(`Middleware: Path: ${pathname}`);

  // If user lands on root, let AppLayout decide where to redirect
  // For now, allow access to all paths. Client-side logic will handle redirection based on list existence.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for static assets and API routes (if any were client-side only)
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
