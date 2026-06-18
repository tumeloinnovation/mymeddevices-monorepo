'use client'
import React from 'react'

export default function Loading() {
  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="w-full h-[420px] bg-gray-200 rounded-md animate-pulse" />

          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div>
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />

            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="mt-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-3 h-4 w-full max-w-md bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="mt-6">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="mt-2 h-40 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <section className="py-2 mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
