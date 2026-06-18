import Image from 'next/image'
import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="animate-pulse">
        <Image
          src="/logos/logo-portrait.png"
          alt="MyMedDevices Logo"
          width={300}
          height={300}
          priority
        />
      </div>
    </div>
  )
}