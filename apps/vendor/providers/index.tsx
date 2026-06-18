'use client';

import React, { ReactNode } from 'react';
import SharedProviders from '../../../packages/shared-ui/src/providers/index';
import { AuthProvider } from './AuthProvider';
import { SessionExpiredWatcher } from '@/components/auth/SessionExpiredWatcher';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SharedProviders>
      <AuthProvider>
        {children}
        <SessionExpiredWatcher />
      </AuthProvider>
    </SharedProviders>
  );
}
