import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Alexandria',
  description: 'Read. Listen. Capture. Share.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
