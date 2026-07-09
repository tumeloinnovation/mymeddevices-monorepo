import React from 'react'

type Props = {
  sku: string | number
  brand?: string | null
  category?: string[] | null
  availability?: string
  modelNumber?: string
  weight?: string
  specifications?: Record<string, any>
  tags?: string[]
}

export default function SpecsTab({
  sku,
  brand,
  category,
  availability,
  modelNumber,
  weight,
  specifications,
  tags
}: Props) {
  const hasSpecs = specifications && Object.keys(specifications).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="border-b dark:border-border/60 pb-2">
            <div className="text-xs text-gray-500">Brand</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{brand ?? 'Unknown'}</div>
          </div>
          <div className="border-b dark:border-border/60 pb-2">
            <div className="text-xs text-gray-500">Category</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{category?.join(', ') ?? 'General'}</div>
          </div>
          <div className="border-b dark:border-border/60 pb-2">
            <div className="text-xs text-gray-500">SKU</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{sku}</div>
          </div>
          <div className="border-b dark:border-border/60 pb-2">
            <div className="text-xs text-gray-500">Availability</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{availability}</div>
          </div>
          {modelNumber && (
            <div className="border-b dark:border-border/60 pb-2">
              <div className="text-xs text-gray-500">Model Number</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{modelNumber}</div>
            </div>
          )}
          {weight && weight !== '0' && (
            <div className="border-b dark:border-border/60 pb-2">
              <div className="text-xs text-gray-500">Weight</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{weight} kg</div>
            </div>
          )}
        </div>
      </div>

      {hasSpecs && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(specifications).map(([key, val]) => (
              <div key={key} className="border-b dark:border-border/60 pb-2">
                <div className="text-xs text-gray-500">{key}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Product Labels</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-muted text-gray-800 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
