// app/add/page.js
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  useEffect(() => {
    if (url) {
      router.replace(`/dashboard?addUrl=${encodeURIComponent(url)}`);
    } else {
      router.replace('/dashboard');
    }
  }, [url, router]);

  return null; // nothing visible
}
