"use client"

import * as React from "react"
import { Check, ChevronDown, Loader2, Search, X, Plus } from "lucide-react"
import { cn } from "../../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"

export interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
  badge?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[] | readonly SearchableSelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  groupLabel?: string
  renderValue?: (selectedOption: SearchableSelectOption | undefined) => React.ReactNode
  allowCreate?: boolean
  onCreateOption?: (name: string) => Promise<string>
  createLoading?: boolean
  createError?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  loading = false,
  renderValue,
  allowCreate = false,
  onCreateOption,
  createLoading = false,
  createError,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [internalCreateLoading, setInternalCreateLoading] = React.useState(false)
  const [internalCreateError, setInternalCreateError] = React.useState<string | null>(null)

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const showCreateOption = React.useMemo(() => {
    if (!allowCreate || !searchValue || !onCreateOption) return false
    const exactMatch = options.some(
      (option) => option.label.toLowerCase() === searchValue.toLowerCase()
    )
    return !exactMatch && searchValue.trim().length > 0
  }, [allowCreate, searchValue, options, onCreateOption])

  const effectiveCreateLoading = createLoading || internalCreateLoading
  const effectiveCreateError = createError || internalCreateError

  const handleSelect = (selectedValue: string) => {
    const option = options.find((opt) => opt.value === selectedValue)
    if (option && !option.disabled) {
      onChange?.(selectedValue)
      setOpen(false)
      setSearchValue("")
    }
  }

  const handleCreateOption = async () => {
    if (!onCreateOption || !searchValue) return

    setInternalCreateLoading(true)
    setInternalCreateError(null)

    try {
      const newId = await onCreateOption(searchValue)
      onChange?.(newId)
      setOpen(false)
      setSearchValue("")
    } catch (error) {
      setInternalCreateError(error instanceof Error ? error.message : "Failed to create option")
    } finally {
      setInternalCreateLoading(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
    setSearchValue("")
    setInternalCreateError(null)
  }

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || loading || effectiveCreateLoading}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full justify-between text-left font-normal h-9 px-3 py-2 text-xs",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {loading || effectiveCreateLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          ) : renderValue ? (
            <>{renderValue(selectedOption)}</>
          ) : selectedOption ? (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <Badge variant="secondary" className="ml-auto shrink-0 text-[9px]">
                  {selectedOption.badge}
                </Badge>
              )}
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && !loading && !effectiveCreateLoading && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-white dark:bg-zinc-950 p-1 shadow-md max-h-60 overflow-y-auto">
          <div className="flex items-center gap-2 border-b px-2 py-1 mb-1">
            <Search className="h-3.5 w-3.5 opacity-50 shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                setInternalCreateError(null)
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs outline-none py-1"
            />
          </div>

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateOption}
              disabled={effectiveCreateLoading}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded text-left font-medium"
            >
              {effectiveCreateLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>Create &quot;{searchValue}&quot;</span>
            </button>
          )}

          {effectiveCreateError && (
            <div className="px-2 py-1 text-[10px] text-rose-500">{effectiveCreateError}</div>
          )}

          {filteredOptions.length === 0 && !showCreateOption ? (
            <div className="px-2 py-2 text-xs text-zinc-400 text-center">{emptyMessage}</div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors",
                  opt.value === value && "bg-zinc-100 dark:bg-zinc-900 font-semibold text-emerald-600"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
