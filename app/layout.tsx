import type { Metadata } from 'next';
import './globals.css';
import DataProvider from '@/components/DataProvider';
import NextAuthProvider from '@/components/NextAuthProvider';

export const metadata: Metadata = {
  title: 'Avis Budget Group / Monstarlab Research Dashboard',
  description: 'ML research dashboard for Avis Budget Group stakeholders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F3F4F6]">
        <NextAuthProvider>
          <DataProvider>{children}</DataProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
