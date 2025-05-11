"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, className, ...props }) {
        return (
          <Toast key={id} variant={variant} className={cn(
              // Add default neon styling based on variant
              variant === "destructive"
                ? "border-destructive/50 bg-destructive/90 text-destructive-foreground shadow-destructive/40" // Destructive neon
                : "border-primary/50 bg-card/95 backdrop-blur-sm text-foreground shadow-neon", // Default neon
                className
            )} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle className={cn(variant === "destructive" ? "text-destructive-foreground" : "text-primary")}>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
