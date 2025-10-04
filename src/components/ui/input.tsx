import * as React from "react"
import { useState } from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    const [isPulsing, setIsPulsing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Trigger pulse animation on keystroke
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 150);
      
      // Call original onChange if provided
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-6 py-4 text-base ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "transition-all duration-200",
          // Hover state
          "hover:bg-muted/30 hover:border-[1.5px] hover:shadow-[0_0_12px_hsl(var(--fm-gold)/0.15)]",
          // Focus state - remove all borders except bottom, make bottom thicker, lighter background, gold glow
          "focus-visible:outline-none focus-visible:bg-muted/20 focus-visible:border-t-0 focus-visible:border-l-0 focus-visible:border-r-0 focus-visible:border-b-[3px] focus-visible:border-b-fm-gold focus-visible:shadow-[0_4px_16px_hsl(var(--fm-gold)/0.25)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          isPulsing && "animate-input-pulse",
          className
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
