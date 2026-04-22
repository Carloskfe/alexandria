'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      saveToken(token);
      router.replace('/library');
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in…</p>
    </div>
  );
}
