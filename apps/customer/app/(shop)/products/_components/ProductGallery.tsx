import Image from 'next/image'
import React from 'react'

type Props = {
  images: string[]
  selected?: number
  onSelect?: (i: number) => void
}

export default function ProductGallery({ images, selected = 0, onSelect }: Props) {
  const clampedSelected = images.length > 0 ? Math.min(selected, images.length - 1) : 0
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnails - on small screens show horizontally above image */}
        <div className="flex sm:flex-col gap-3 overflow-auto sm:overflow-visible">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(i)}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border ${clampedSelected === i ? 'border-primary' : 'border-gray-200'} overflow-hidden`}
            >
              <Image src={src ?? '/logos/logo-portrait.png'} alt={`img-${i}`} width={80} height={80} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center">
          {/* responsive main image: smaller on mobile, larger on desktop */}
          <div className="w-full max-w-md sm:max-w-2xl">
            <Image src={images[clampedSelected] || '/logos/logo-portrait.png'} alt={`selected image`} width={800} height={800} className="rounded-md object-contain w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
