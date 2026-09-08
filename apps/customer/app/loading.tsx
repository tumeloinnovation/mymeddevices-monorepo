import Image from 'next/image'
import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="animate-pulse p-4">
            <Image
              src="/logos/logo-portrait.png"
              alt="MyMedDevices Logo"
              width={140}
              height={140}
              priority
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground tracking-wide">Loading MyMedDevices</p>
          <p className="text-xs text-muted-foreground">Please wait a moment...</p>
        </div>
      </div>
    </div>
  )
}