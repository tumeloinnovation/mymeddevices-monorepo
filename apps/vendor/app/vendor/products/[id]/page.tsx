'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProductWizard } from '@/components/vendor/products/ProductWizard';

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ProductWizard productId={id} />
    </div>
  );
}
