import type { Metadata } from 'next';
import BottomNav from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false }, // Library pages require login — don't index
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
