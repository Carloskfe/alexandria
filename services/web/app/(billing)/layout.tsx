import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmailVerificationBanner />
      {children}
    </>
  );
}
