'use client';

import { QueryClient, QueryClientProvider as QCProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ThemeProvider } from '@mymeddevices/ui/components/theme-provider';
import { SessionExpiredWatcher } from '@/components/auth/SessionExpiredWatcher';
import { ShopFiltersProvider } from '@/lib/context/ShopFiltersContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CartInitializer } from '@/components/cart/CartInitializer';
import { AuthCartSync } from '@/components/cart/AuthCartSync';

interface ProvidersProps {
  children: ReactNode;
}

// Create a singleton QueryClient instance for the app
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  } else {
    // Browser: create client once and reuse
    if (!browserQueryClient) {
      browserQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      });
    }
    return browserQueryClient;
  }
}

export default function Providers({ children }: ProvidersProps) {
  // Initialize QueryClient on first render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QCProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <ShopFiltersProvider>
          <TooltipProvider delayDuration={0}>
            {children}
            <SessionExpiredWatcher />
            <CartInitializer />
            <AuthCartSync />
          </TooltipProvider>
        </ShopFiltersProvider>
      </ThemeProvider>
    </QCProvider>
  );
}
