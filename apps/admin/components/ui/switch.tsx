"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-border/80 transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 data-[size=default]:h-[22px] data-[size=default]:w-[38px] data-[size=sm]:h-[16px] data-[size=sm]:w-[28px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 data-disabled:cursor-not-allowed data-disabled:opacity-50 shadow-xs",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white dark:bg-slate-100 shadow-sm ring-0 transition-transform group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-[12px] group-data-[size=default]/switch:data-[state=checked]:translate-x-[16px] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[12px] group-data-[size=default]/switch:data-[state=unchecked]:translate-x-[2px] group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-[2px]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
