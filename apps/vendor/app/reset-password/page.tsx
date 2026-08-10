'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ResetPasswordForm } from "@mymeddevices/shared-admin";
import { Store, Package, ClipboardList, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Brand Panel (Emerald themed for vendors) */}
      <div className="hidden lg:flex flex-col bg-emerald-600 text-white p-12 relative overflow-hidden">
        {/* Soft background light blooms */}
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[32rem] h-[32rem] bg-black/15 rounded-full -ml-48 -mb-48 blur-3xl" />
        
        {/* Concentric geometric circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52rem] h-[52rem] border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] border border-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] border border-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16rem] h-[16rem] border border-white/5 rounded-full pointer-events-none" />

        {/* Brand Logo */}
        <Link href="/" className="relative z-10 w-fit mb-16 block hover:opacity-90 transition-opacity">
          <Image
            src="/logos/logo-landscape.png"
            alt="MyMedDevices"
            width={180}
            height={48}
            className="brightness-0 invert h-auto w-auto"
            priority
          />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-sm text-emerald-50 mb-8 w-fit shadow-xs font-medium">
            <Store className="h-4 w-4 text-emerald-200" />
            Vendor Portal
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Grow your medical equipment business.
          </h1>
          <p className="text-xl text-emerald-50/85 mb-12 leading-relaxed">
            Manage inventory, fulfill hospital orders, track payments, and scale your healthcare distribution.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Inventory & Listings</h3>
              <p className="text-sm text-emerald-50/75 leading-relaxed">List your medical devices and manage stock in real time.</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-md">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Order Fulfillment</h3>
              <p className="text-sm text-emerald-50/75 leading-relaxed">Process bulk orders and track your vendor payouts.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8 border-t border-white/15">
          <p className="text-sm font-medium text-emerald-100/90 leading-relaxed">
            Kenya's leading platform connecting verified medical equipment suppliers with healthcare providers nationwide.
          </p>
        </div>
      </div>

      {/* Right: Reset Password Form Container */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="block hover:opacity-90 transition-opacity">
              <Image
                src="/logos/logo-landscape.png"
                alt="MyMedDevices"
                width={180}
                height={48}
                className="h-auto w-auto"
                priority
              />
            </Link>
          </div>

          <Suspense fallback={
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          }>
            <ResetPasswordForm theme="vendor" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

