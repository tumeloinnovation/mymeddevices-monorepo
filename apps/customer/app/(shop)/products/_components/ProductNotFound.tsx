import React from 'react'
import { FileMinus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProductNotFound() {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white border rounded-lg shadow-sm p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-full bg-gray-100 text-gray-600">
            <FileMinus className="h-6 w-6" />
          </div>
        </div>

        <h2 className="text-xl font-semibold">Product not found</h2>
        <p className="mt-2 text-sm text-gray-600">The product you're looking for doesn't exist or has been removed.</p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <Link href="/" className="inline-block">
            <Button>Browse products</Button>
          </Link>
          <Link href="/contact-us" className="inline-block">
            <Button variant="ghost">Contact us</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
