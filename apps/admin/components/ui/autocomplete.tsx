"use client";

import * as React from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteContextType<T = any> {
  value: string;
  onValueChange: (value: string) => void;
  items: T[];
  itemToStringValue: (item: T) => string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  selectItem: (item: T) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const AutocompleteContext = React.createContext<AutocompleteContextType | null>(null);

function useAutocompleteContext<T = any>() {
  const context = React.useContext(AutocompleteContext);
  if (!context) {
    throw new Error("Autocomplete subcomponents must be used within <Autocomplete />");
  }
  return context as AutocompleteContextType<T>;
}

export interface AutocompleteProps<T = any> {
  value: string;
  onValueChange: (value: string) => void;
  items?: T[];
  itemToStringValue?: (item: T) => string;
  children: React.ReactNode;
  className?: string;
  onSelectItem?: (item: T) => void;
}

export function Autocomplete<T = any>({
  value,
  onValueChange,
  items = [],
  itemToStringValue = (item: any) => (typeof item === "string" ? item : item?.value || item?.label || String(item)),
  children,
  className,
  onSelectItem,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const selectItem = React.useCallback(
    (item: T) => {
      const strVal = itemToStringValue(item);
      onValueChange(strVal);
      if (onSelectItem) {
        onSelectItem(item);
      }
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [itemToStringValue, onValueChange, onSelectItem]
  );

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <AutocompleteContext.Provider
      value={{
        value,
        onValueChange,
        items,
        itemToStringValue,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
        selectItem,
        inputRef,
        containerRef,
      }}
    >
      <div ref={containerRef} className={cn("relative w-full", className)}>
        {children}
      </div>
    </AutocompleteContext.Provider>
  );
}

export interface AutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  showClear?: boolean;
  onClear?: () => void;
  icon?: React.ReactNode;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ className, placeholder = "Search...", showClear = true, onClear, icon, onFocus, onKeyDown, ...props }, ref) => {
    const { value, onValueChange, isOpen, setIsOpen, items, highlightedIndex, setHighlightedIndex, selectItem, inputRef } =
      useAutocompleteContext();

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(items.length - 1);
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        }
      } else if (e.key === "Enter") {
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < items.length) {
          e.preventDefault();
          selectItem(items[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    return (
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
          {icon || <Search className="w-3.5 h-3.5" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            onFocus?.(e);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 transition-colors",
            className
          )}
          {...props}
        />
        {showClear && value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onValueChange("");
              onClear?.();
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Clear</span>
          </button>
        )}
      </div>
    );
  }
);
AutocompleteInput.displayName = "AutocompleteInput";

export interface AutocompleteContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AutocompleteContent({ className, children, ...props }: AutocompleteContentProps) {
  const { isOpen } = useAutocompleteContext();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 animate-in fade-in-0 zoom-in-95 duration-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AutocompleteEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AutocompleteEmpty({ className, children, ...props }: AutocompleteEmptyProps) {
  const { items } = useAutocompleteContext();

  if (items.length > 0) return null;

  return (
    <div
      className={cn("py-3 text-center text-xs text-slate-500 dark:text-slate-400", className)}
      {...props}
    >
      {children || "No results found."}
    </div>
  );
}

export interface AutocompleteListProps<T = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children?: React.ReactNode | ((item: T, index: number) => React.ReactNode);
}

export function AutocompleteList<T = any>({ className, children, ...props }: AutocompleteListProps<T>) {
  const { items } = useAutocompleteContext<T>();

  if (items.length === 0) return null;

  return (
    <div
      className={cn("max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin", className)}
      {...props}
    >
      {typeof children === "function"
        ? items.map((item, index) => (children as (item: T, index: number) => React.ReactNode)(item, index))
        : children}
    </div>
  );
}

export interface AutocompleteItemProps<T = any> extends React.HTMLAttributes<HTMLDivElement> {
  value: T;
  disabled?: boolean;
}

export function AutocompleteItem<T = any>({
  value,
  children,
  className,
  disabled = false,
  onClick,
  ...props
}: AutocompleteItemProps<T>) {
  const { selectItem, itemToStringValue, value: currentValue } = useAutocompleteContext<T>();
  const strVal = itemToStringValue(value);
  const isSelected = currentValue === strVal;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={(e) => {
        if (disabled) return;
        selectItem(value);
        onClick?.(e);
      }}
      className={cn(
        "relative flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs select-none transition-colors",
        isSelected
          ? "bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      <span className="truncate">{children || strVal}</span>
      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
    </div>
  );
}
