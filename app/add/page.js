// app/add/page.js
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const url = searchParams.get('url');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Redirect to login, preserving where the user wanted to go
      const target = url ? `/add?url=${encodeURIComponent(url)}` : '/dashboard';
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(target)}`);
      return;
    }

    if (status === 'authenticated') {
      if (url) {
        router.replace(`/dashboard?addUrl=${encodeURIComponent(url)}`);
      } else {
        router.replace('/dashboard');
      }
    }
  }, [status, url, router]);

  return null;
}
