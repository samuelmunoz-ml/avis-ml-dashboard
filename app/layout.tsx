import type { Metadata } from 'next';
import './globals.css';
import DataProvider from '@/components/DataProvider';

export const metadata: Metadata = {
  title: 'Avis Budget Group / Monstarlab Research Dashboard',
  description: 'ML research dashboard for Avis Budget Group stakeholders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F7F7F6]">
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
