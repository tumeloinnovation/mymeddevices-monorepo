import React from 'react'

type Props = {
  sku: string | number
  brand?: string | null
  category?: string[] | null
  availability?: string
}

export default function SpecsTab({ sku, brand, category, availability }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Brand</div>
          <div className="font-medium">{brand ?? 'Unknown'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Category</div>
          <div className="font-medium">{category?.join(', ') ?? 'General'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">SKU</div>
          <div className="font-medium">{sku}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Availability</div>
          <div className="font-medium">{availability}</div>
        </div>
      </div>
    </>

  )
}
