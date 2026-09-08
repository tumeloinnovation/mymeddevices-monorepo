import React from 'react'
import CompareProducts from '@/app/(shop)/compare/_components/CompareProducts'

export const metadata = {
  title: 'Compare Products | MyMedDevices',
  description: 'Compare medical devices, specs, and pricing side-by-side.',
}

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-6">
      <CompareProducts />
    </div>
  )
}


