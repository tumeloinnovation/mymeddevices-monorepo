import Loading from '@/app/loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

import FloatingWhatsAppButton from '@/components/common/FloatingWhatsAppButton';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import Providers from '@/providers';
import { ErrorBoundary } from '@mymeddevices/shared-core';

import { OrganizationJsonLd } from '@/components/seo';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mymeddevices.com'),
  title: {
    default: 'MyMedDevices - Medical Devices & Equipment in Kenya',
    template: '%s | MyMedDevices',
  },
  description:
    "Kenya's most trusted online provider of home-based medical devices and equipment. Shop blood pressure monitors, glucometers, mobility aids, and more.",
  keywords: [
    'medical devices',
    'medical equipment',
    'Kenya',
    'health',
    'blood pressure monitor',
    'glucometer',
    'mobility aids',
    'home healthcare',
    'wheelchair',
  ],
  authors: [{ name: 'MyMedDevices' }],
  creator: 'MyMedDevices',
  publisher: 'MyMedDevices',
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://mymeddevices.com',
    siteName: 'MyMedDevices',
    title: 'MyMedDevices - Medical Devices & Equipment in Kenya',
    description:
      "Kenya's most trusted online provider of home-based medical devices and equipment.",
    images: [
      {
        url: '/logos/logo.png',
        width: 1200,
        height: 630,
        alt: 'MyMedDevices Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyMedDevices - Medical Devices & Equipment in Kenya',
    description:
      "Kenya's most trusted online provider of home-based medical devices and equipment.",
    images: ['/logos/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
};

export const viewport = 'width=device-width, initial-scale=1';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={`antialiased flex flex-col min-h-screen font-sans`}>
        {/* Pre-hydration theme setter: apply saved theme or system preference to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var t=localStorage.getItem(k);var root=document.documentElement;if(t==='dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){} })();`,
          }}
        />
        <Providers>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <main className="grow">
                <LayoutWrapper>{children}</LayoutWrapper>
              </main>
            </Suspense>
          </ErrorBoundary>
          <Toaster />
          <FloatingWhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
