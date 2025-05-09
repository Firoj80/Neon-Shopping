import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users from the root path.
  // The AppLayout component will handle redirection logic based on auth status.
  // If logged in, it goes to /list or /list/create-first.
  // If not logged in, it goes to /auth.
  redirect('/list'); // Initial redirect, AppLayout takes over from here
}
