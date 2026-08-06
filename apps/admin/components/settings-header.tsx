"use client"

export function SettingsHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-6 pb-3 border-b-2 border-zinc-200 dark:border-zinc-800">
      <h1 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
        {title}
      </h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
        {description}
      </p>
    </div>
  )
}
