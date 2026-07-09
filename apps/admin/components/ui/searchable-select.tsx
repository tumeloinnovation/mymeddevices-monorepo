"use client"

import * as React from "react"
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
  badge?: string
}

interface SearchableSelectProps {
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
  groupLabel,
  renderValue,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

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

  const handleSelect = (selectedValue: string) => {
    const option = options.find((opt) => opt.value === selectedValue)
    if (option && !option.disabled) {
      onChange?.(selectedValue)
      setOpen(false)
      setSearchValue("")
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
    setSearchValue("")
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between text-left font-normal h-11 px-3 py-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : renderValue ? (
              <>{renderValue(selectedOption)}</>
            ) : selectedOption ? (
              <>
                <span className="truncate">{selectedOption.label}</span>
                {selectedOption.badge && (
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {selectedOption.badge}
                  </Badge>
                )}
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && !loading && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command
          shouldFilter={false}
          className="max-h-[300px]"
        >
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
            />
            {searchValue && (
              <X
                className="h-4 w-4 text-muted-foreground cursor-pointer shrink-0"
                onClick={() => setSearchValue("")}
              />
            )}
          </div>
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groupLabel ? (
              <CommandGroup heading={groupLabel}>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {option.value === value && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate">{option.label}</span>
                      {option.badge && (
                        <Badge variant="secondary" className="ml-auto shrink-0">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {option.value === value && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate">{option.label}</span>
                      {option.badge && (
                        <Badge variant="secondary" className="ml-auto shrink-0">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
