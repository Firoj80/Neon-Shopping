import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the main list page logic area
  // AppLayout or ListPage itself will handle redirecting to /list/create-first if needed
  redirect('/list');
}
