import React from 'react'
import { ShieldCheck, Award, Wrench, Cpu, Tag, Box } from 'lucide-react'

type Props = {
  sku: string | number
  brand?: string | null
  category?: string[] | null
  availability?: string
  modelNumber?: string
  weight?: string | number
  dimensions?: { length?: number; width?: number; height?: number; unit?: string } | null
  warrantyInfo?: string | null
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
  dimensions,
  warrantyInfo,
  specifications,
  tags,
}: Props) {
  const hasSpecs = specifications && Object.keys(specifications).length > 0

  const formattedDimensions = dimensions
    ? `${dimensions.length || '-'} × ${dimensions.width || '-'} × ${dimensions.height || '-'} ${dimensions.unit || 'cm'}`
    : null

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Core Technical & Device Specs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Core Specifications
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
            <div className="text-xs text-gray-500">Brand / Manufacturer</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{brand ?? 'Standard Medical'}</div>
          </div>
          <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
            <div className="text-xs text-gray-500">Category</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{category?.join(', ') ?? 'General Medical'}</div>
          </div>
          <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
            <div className="text-xs text-gray-500">SKU / Item Code</div>
            <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{sku}</div>
          </div>
          <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
            <div className="text-xs text-gray-500">Stock Availability</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize mt-0.5">{availability ?? 'In Stock'}</div>
          </div>
          {modelNumber && (
            <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
              <div className="text-xs text-gray-500">Model / Part Number</div>
              <div className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{modelNumber}</div>
            </div>
          )}
          {weight && String(weight) !== '0' && (
            <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
              <div className="text-xs text-gray-500">Weight</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{weight} kg</div>
            </div>
          )}
          {formattedDimensions && (
            <div className="p-3.5 rounded-lg border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/20">
              <div className="text-xs text-gray-500">Dimensions (L × W × H)</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{formattedDimensions}</div>
            </div>
          )}
          {warrantyInfo && (
            <div className="p-3.5 rounded-lg border border-blue-100 dark:border-blue-950/40 bg-blue-50/40 dark:bg-blue-950/10">
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Warranty & Support</div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mt-0.5">{warrantyInfo}</div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed Key-Value Parameters */}
      {hasSpecs && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Technical & Operational Parameters
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(specifications).map(([key, val]) => (
              <div key={key} className="flex justify-between items-baseline border-b dark:border-border/60 py-2">
                <span className="text-xs text-gray-500 font-medium">{key}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[60%]">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Product Taxonomy & Keywords */}
      {tags && tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Clinical Keywords & Taxonomy
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-muted/80 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

