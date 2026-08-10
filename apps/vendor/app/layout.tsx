import Loading from '@/app/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Providers from '@/providers';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased flex flex-col min-h-screen font-sans`}>
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
        </Providers>
      </body>
    </html>
  );
}
