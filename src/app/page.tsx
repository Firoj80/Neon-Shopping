import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the main shopping list page
  redirect('/list');
}
