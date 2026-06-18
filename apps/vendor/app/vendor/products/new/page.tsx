'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductWizard } from '@/components/vendor/products/ProductWizard';

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">List New Equipment</h1>
          <p className="text-muted-foreground text-sm font-medium">Follow our clinical-grade listing process.</p>
        </div>
      </div>

      <ProductWizard />
    </div>
  );
}
