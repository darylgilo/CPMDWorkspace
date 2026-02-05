import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, buttonVariants, type VariantProps } from "./button"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  asChild?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, children, disabled, className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={className}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || "Loading..."}
          </>
        )}
        {!loading && children}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
