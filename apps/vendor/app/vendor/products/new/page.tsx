'use client';

import React from 'react';
import { ProductWizard } from '@/components/vendor/products/ProductWizard';

export default function NewProductPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ProductWizard />
    </div>
  );
}
