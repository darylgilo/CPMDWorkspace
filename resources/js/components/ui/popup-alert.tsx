import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Bookmark, Trash2, Info, AlertTriangle } from "lucide-react"

const popupAlertVariants = cva(
  "fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out animate-in slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800",
        error: "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800",
        warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800",
        info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800",
        bookmarked: "bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-900/20 dark:text-purple-100 dark:border-purple-800",
        deleted: "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-900/20 dark:text-orange-100 dark:border-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface PopupAlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof popupAlertVariants> {
  title?: string
  description?: string
  isOpen: boolean
  onClose: () => void
  duration?: number
  showCloseButton?: boolean
}

const iconMap = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  bookmarked: Bookmark,
  deleted: Trash2,
}

const PopupAlert = React.forwardRef<HTMLDivElement, PopupAlertProps>(
  ({ className, variant, title, description, isOpen, onClose, duration = 5000, showCloseButton = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(isOpen)
    const Icon = iconMap[variant as keyof typeof iconMap] || iconMap.default

    React.useEffect(() => {
      setIsVisible(isOpen)
    }, [isOpen])

    React.useEffect(() => {
      if (isVisible && duration > 0) {
        const timer = setTimeout(() => {
          handleClose()
        }, duration)
        return () => clearTimeout(timer)
      }
    }, [isVisible, duration])

    const handleClose = () => {
      setIsVisible(false)
      onClose()
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(popupAlertVariants({ variant }), className)}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold text-sm leading-none tracking-tight mb-1">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-sm opacity-90 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
PopupAlert.displayName = "PopupAlert"

// Global alert state
let globalAlerts: Array<{
  id: string
  variant: "default" | "success" | "error" | "warning" | "info" | "bookmarked" | "deleted"
  title?: string
  description?: string
  duration?: number
}> = []

let alertListeners: Set<() => void> = new Set()

function notifyListeners() {
  alertListeners.forEach(listener => listener())
}

// Hook for managing popup alerts
export function usePopupAlert() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  React.useEffect(() => {
    alertListeners.add(forceUpdate)
    return () => {
      alertListeners.delete(forceUpdate)
    }
  }, [])

  const showAlert = React.useCallback((
    variant: "default" | "success" | "error" | "warning" | "info" | "bookmarked" | "deleted",
    title?: string,
    description?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newAlert = { id, variant, title, description, duration }
    
    globalAlerts = [...globalAlerts, newAlert]
    notifyListeners()
    
    if (duration !== 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration || 5000)
    }
    
    return id
  }, [])

  const removeAlert = React.useCallback((id: string) => {
    globalAlerts = globalAlerts.filter(alert => alert.id !== id)
    notifyListeners()
  }, [])

  const clearAllAlerts = React.useCallback(() => {
    globalAlerts = []
    notifyListeners()
  }, [])

  // Convenience methods
  const showSuccess = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("success", title, description, duration), [showAlert])
  
  const showError = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("error", title, description, duration), [showAlert])
  
  const showWarning = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("warning", title, description, duration), [showAlert])
  
  const showInfo = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("info", title, description, duration), [showAlert])
  
  const showBookmarked = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("bookmarked", title, description, duration), [showAlert])
  
  const showDeleted = React.useCallback((title?: string, description?: string, duration?: number) => 
    showAlert("deleted", title, description, duration), [showAlert])

  return {
    alerts: globalAlerts,
    showAlert,
    removeAlert,
    clearAllAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBookmarked,
    showDeleted,
  }
}

// Container component for displaying multiple alerts
export function PopupAlertContainer() {
  const { alerts, removeAlert } = usePopupAlert()

  return (
    <>
      {alerts.map((alert) => (
        <PopupAlert
          key={alert.id}
          variant={alert.variant}
          title={alert.title}
          description={alert.description}
          isOpen={true}
          onClose={() => removeAlert(alert.id)}
          duration={0} // Don't auto-dismiss since we handle it globally
        />
      ))}
    </>
  )
}

export { PopupAlert, popupAlertVariants }
export type { PopupAlertProps }
