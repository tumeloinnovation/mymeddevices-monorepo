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
      <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm border border-gray-200 dark:border-border">
        <div className="aspect-[4/3] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          <Image src="/logos/logo-portrait.png" alt="No image" width={200} height={200} className="opacity-50" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnails - Left Side */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 flex-shrink-0">
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

      {/* Main Image */}
      <div className="flex-1 bg-white dark:bg-card rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-border">
        <div className="aspect-[4/3] flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 p-6">
          <Image
            src={images[clampedSelected] || '/logos/logo-portrait.png'}
            alt={`Product image ${clampedSelected + 1}`}
            width={800}
            height={600}
            className="max-h-full max-w-full object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}
