import React from 'react'
import { SafeHtml } from '@mymeddevices/shared-ui'

type Props = {
  description?: string
}

export default function DescriptionTab({ description }: Props) {
  return (
    <div className="p-4 rounded-md bg-white dark:bg-card text-gray-800 dark:text-foreground transition-colors duration-300">
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-primary">
        Product Description
      </h3>
      <SafeHtml
        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-muted-foreground"
        html={description}
        fallback={<p className="text-muted-foreground">No description available.</p>}
      />
    </div>
  )
}

