import React from 'react'

type Props = {
  description?: string
}

export default function DescriptionTab({ description }: Props) {
  return (
    <div className="p-4 rounded-md bg-white dark:bg-card text-gray-800 dark:text-foreground transition-colors duration-300">
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-primary">
        Product Description
      </h3>
      <div
        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: description || '<p>No description available.</p>',
        }}
      />
    </div>
  )
}
