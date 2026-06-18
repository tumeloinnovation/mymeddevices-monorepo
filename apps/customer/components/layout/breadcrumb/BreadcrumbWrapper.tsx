'use client';

import { useBreadcrumb } from '@/lib/hooks/useBreadcrumb';
import { Breadcrumb } from '.';
import { usePathname } from 'next/navigation';

export const BreadcrumbWrapper = () => {
  const pathname = usePathname();
  const { items } = useBreadcrumb();

  // Don't render breadcrumb on the home page
  if (!pathname || pathname === '/') return null;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={items} />
    </div>
  );
};