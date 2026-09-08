import React from 'react'
import { SafeHtml } from '@mymeddevices/shared-ui'

type Props = {
  description?: string
}

export default function DescriptionTab({ description }: Props) {
  return (
    <div className="py-2 text-foreground transition-colors duration-300">
      <h3 className="text-lg font-bold mb-4 text-foreground">
        Product Description
      </h3>
      <SafeHtml
        className="prose dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-muted-foreground"
        html={description}
        fallback={<p className="text-muted-foreground italic text-sm">No description available for this product.</p>}
      />
    </div>
  )
}

