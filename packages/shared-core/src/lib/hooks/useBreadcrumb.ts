'use client'

import { usePathname } from 'next/navigation';

type BreadcrumbItem = {
  label: string;
  href: string;
};

export const useBreadcrumb = () => {
  const pathname = usePathname();
  const items: BreadcrumbItem[] = [];

  if (pathname) {
    const pathParts = pathname.split('/').filter(part => part);

    items.push({ label: 'Home', href: '/' });

    pathParts.forEach((part, index) => {
      const href = '/' + pathParts.slice(0, index + 1).join('/');
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      items.push({ label, href });
    });
  }

  return { items };
};