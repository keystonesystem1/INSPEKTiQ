import { redirect } from 'next/navigation';
import { requireAuthenticatedFirmUser } from '@/lib/supabase/user';

// Legacy route — carrier users are now served by /dashboard (role-specific rendering).
// This page is kept to avoid broken links but redirects all authenticated users to /dashboard.
// requireAuthenticatedFirmUser redirects unauthenticated visitors to /signin.
export default async function CarrierPortalPage() {
  await requireAuthenticatedFirmUser();
  redirect('/dashboard');
}
