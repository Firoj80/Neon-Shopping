// src/app/page.tsx
"use client";

// This page now primarily serves as an entry point.
// AuthContext and AppLayout handle loading states and redirection.

export default function HomePage() {
  // Display a consistent loading screen.
  // Actual content or redirection to /auth or /list will be handled by AppLayout.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      <p className="text-xs text-muted-foreground mt-2">Initializing your cyberpunk experience.</p>
    </div>
  );
}
