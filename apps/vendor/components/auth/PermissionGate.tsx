'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { hasPermission, type VendorPermission } from '@/lib/auth/permissions';

interface PermissionGateProps {
  permission: VendorPermission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A component that only renders its children if the current vendor
 * has the required permission.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasAccess = hasPermission(user, permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
