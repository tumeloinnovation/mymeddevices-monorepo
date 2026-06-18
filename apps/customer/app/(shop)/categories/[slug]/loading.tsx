'use client'
import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] py-6">
      <div className="container mx-auto px-4">
        {/* Category header skeleton */}
        <div className="mb-8 p-6 sm:p-8 rounded-lg bg-card border border-border">
          <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar skeleton */}
          <aside className="hidden md:block md:col-span-3">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-6" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main content skeleton */}
          <main className="col-span-12 lg:col-span-9">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Products grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}