'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearRoleSession } from '@/hooks/useUser';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    clearRoleSession();
    router.replace('/signin');
    router.refresh();
  }, [router]);

  return null;
}
