"use client";

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { QueryClient, QueryClientProvider as QCProvider } from '@tanstack/react-query';
import { ThemeProvider } from "../components/theme-provider";
import { PropsWithChildren, useState } from "react";
import { ShopFiltersProvider } from "@mymeddevices/shared-core";

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

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QCProvider client={queryClient}>
      <NuqsAdapter>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ShopFiltersProvider>
            {children}
          </ShopFiltersProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QCProvider>
  );
}
