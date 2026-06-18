import Loading from '@/app/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vendor Portal | MyMedDevices',
  description: 'Manage your vendor account and products.',
};

export const viewport = 'width=device-width, initial-scale=1';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className={`antialiased flex flex-col min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var t=localStorage.getItem(k);var root=document.documentElement;if(t==='dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){} })();`,
          }}
        />
        <Providers>
          <Suspense fallback={<Loading />}>
            <main className="grow">
              {children}
            </main>
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
