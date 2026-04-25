import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-6">👋</div>
      <h1 className="text-3xl font-bold mb-3">No charge was made</h1>
      <p className="text-gray-500 mb-8">
        You left before completing checkout. Your account has not been charged.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
      >
        View plans
      </Link>
    </main>
  );
}
