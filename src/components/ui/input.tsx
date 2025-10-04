import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-6 py-4 text-base ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "transition-all duration-200",
          // Hover state
          "hover:bg-background/80 hover:border-[1.5px] hover:shadow-[0_0_12px_rgba(var(--primary)/0.15)]",
          // Focus state - remove all borders except bottom, make bottom thicker
          "focus-visible:outline-none focus-visible:border-t-0 focus-visible:border-l-0 focus-visible:border-r-0 focus-visible:border-b-[3px] focus-visible:border-b-primary focus-visible:shadow-[0_4px_16px_rgba(var(--primary)/0.2)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
