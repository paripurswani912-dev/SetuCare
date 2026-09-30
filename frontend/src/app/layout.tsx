import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/languageContext';
import { HeaderNav } from '@/components/HeaderNav';
import { SidebarNav } from '@/components/SidebarNav';
import { ToastContainer } from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'SetuCare - Interoperable Health Referral Platform',
  description:
    'Track healthcare referrals across fragmented government systems (ABDM, RCH, ANMOL, HFR, e-Aushadhi) for closed-loop patient care journeys.',
  keywords: [
    'SetuCare',
    'ABDM',
    'RCH',
    'ANMOL',
    'HFR',
    'e-Aushadhi',
    'Health Interoperability',
    'Referral Management',
    'ASHA worker platform',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <LanguageProvider>
          <HeaderNav />
          <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
            <SidebarNav />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              {children}
            </main>
          </div>
          <ToastContainer />
        </LanguageProvider>
      </body>
    </html>
  );
}
