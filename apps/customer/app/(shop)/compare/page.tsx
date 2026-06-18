import React from 'react'
import CompareProducts from '@/app/(shop)/compare/_components/CompareProducts'


export const metadata = {
  title: 'Compare Products',
}

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-120px)] py-8">
      <div className="container mx-auto px-4">
        <section className="px-2">
          <CompareProducts />
        </section>
      </div>
    </main>
  )
}
