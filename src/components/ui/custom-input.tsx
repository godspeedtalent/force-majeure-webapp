import * as React from "react"
import { cn } from "@/lib/utils"

const CustomInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full bg-transparent px-0 py-2 text-foreground/80 border-0 border-b border-border/50 transition-all duration-200 ease-in-out",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-fm-gold focus-visible:bg-background/5",
          "hover:bg-background/10 hover:border-border/80",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CustomInput.displayName = "CustomInput"

export { CustomInput }