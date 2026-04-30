import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 px-4 py-2 text-base transition-all duration-200 backdrop-blur-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-inner",
        className
      )}
      {...props}
    />
  )
}

export { Input }
