import Image from 'next/image'
import React from 'react'

type Props = {
  images: string[]
  selected?: number
  onSelect?: (i: number) => void
}

export default function ProductGallery({ images, selected = 0, onSelect }: Props) {
  const clampedSelected = images.length > 0 ? Math.min(selected, images.length - 1) : 0

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm border border-gray-200 dark:border-border h-auto lg:h-[calc(100vh-120px)] min-h-[400px]">
        <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          <Image src="/logos/logo-portrait.png" alt="No image" width={200} height={200} className="opacity-50" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-auto">
      {/* Main Image */}
      <div className="bg-white dark:bg-card rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-border">
        <div className="aspect-square w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 p-6">
          <Image
            src={images[clampedSelected] || '/logos/logo-portrait.png'}
            alt={`Product image ${clampedSelected + 1}`}
            width={800}
            height={800}
            className="max-h-full max-w-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Thumbnails - Below Main Image (horizontal scroll) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                clampedSelected === i
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Image
                src={src ?? '/logos/logo-portrait.png'}
                alt={`Thumbnail ${i + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
