import { toast as sonnerToast } from 'sonner'
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      icon: <CheckCircle2 className="h-5 w-5" />,
      className: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    })
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      icon: <XCircle className="h-5 w-5" />,
      className: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    })
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      icon: <AlertCircle className="h-5 w-5" />,
      className: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
    })
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      icon: <Info className="h-5 w-5" />,
      className: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    })
  },

  loading: (message: string) => {
    return sonnerToast.loading(message, {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },
}

// Export for convenience
export { Toaster } from 'sonner'


























