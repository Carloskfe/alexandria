import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alexandria',
  description: 'Read. Listen. Capture. Share.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
