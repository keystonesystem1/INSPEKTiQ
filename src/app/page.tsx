import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('inspektiq-role')?.value;

  redirect(role ? '/dashboard' : '/signin');
}
