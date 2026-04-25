'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BillingSuccessPage() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    fetch('/api/subscriptions/sync', { method: 'POST' })
      .finally(() => setSynced(true));
  }, []);

  return (
    <main className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold mb-3">Subscription activated!</h1>
      <p className="text-gray-500 mb-8">
        Your account is now active. Start reading right away.
      </p>
      {synced && (
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          Start reading
        </Link>
      )}
    </main>
  );
}
