import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'DBU Connect — Debre Berhan University Social & Campus Platform',
  description:
    'A centralized digital platform where eligible Debre Berhan University students communicate, connect, buy and sell, and access reliable university information.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
