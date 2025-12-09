'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react'
import { toast } from '@/lib/utils/toast'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Enhanced Error Boundary Component
 * 
 * Provides graceful error handling with user-friendly UI and error reporting.
 * 
 * Features:
 * - Catches React errors in child components
 * - Shows user-friendly error messages
 * - Provides recovery options (retry, go home)
 * - Logs errors for debugging
 * - Supports different levels (page, section, component)
 * - Copy error details for support
 * 
 * @example
 * ```tsx
 * <EnhancedErrorBoundary level="section">
 *   <YourComponent />
 * </EnhancedErrorBoundary>
 * ```
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('Error Boundary Caught:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service (Sentry, etc.)
    this.reportError(error, errorInfo)
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Sentry.captureException(error, { extra: errorInfo })
        
        // For now, log to console in development
        console.log('Error reported:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        })
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state
    const errorDetails = `
Error ID: ${errorId}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim()

    navigator.clipboard.writeText(errorDetails).then(() => {
      toast.success('Copied!', 'Error details copied to clipboard')
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorId } = this.state
      const { level = 'section', showDetails = false } = this.props

      // Different UI based on error level
      if (level === 'component') {
        return (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Component Error
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {error?.message || 'Something went wrong'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleReset}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )
      }

      if (level === 'section') {
        return (
          <Card className="border-red-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
                {errorId && (
                  <Badge variant="outline" className="ml-auto">
                    {errorId}
                  </Badge>
                )}
              </div>
              <CardDescription>
                We encountered an error in this section. You can try again or continue using other parts of the app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showDetails && error && (
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-mono text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleCopyError} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      }

      // Page-level error (most severe)
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full border-red-500">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription className="text-base mt-2">
                We've encountered an unexpected error. Our team has been notified and we're working on a fix.
              </CardDescription>
              {errorId && (
                <div className="mt-4">
                  <Badge variant="outline" className="text-sm">
                    Error ID: {errorId}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {showDetails && error && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">Error Details:</p>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {error.message}
                  </p>
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer hover:underline">
                        Component Stack
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-48 p-2 bg-background rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={this.handleReset} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <Button 
                  onClick={this.handleCopyError} 
                  variant="ghost" 
                  className="w-full"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Details for Support
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  If this problem persists, please contact support with Error ID: <strong>{errorId}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to manually trigger error boundary
 * Useful for catching async errors
 */
export function useErrorHandler() {
  const [, setError] = React.useState()

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

/**
 * HOC to wrap component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Async error boundary for catching errors in async operations
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      setError(event.reason)
    }

    window.addEventListener('unhandledrejection', handleError)
    return () => window.removeEventListener('unhandledrejection', handleError)
  }, [])

  if (error) {
    throw error
  }

  return <>{children}</>
}

/**
 * Error fallback component for common use cases
 */
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  return (
    <Card className="border-red-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-500" />
          <CardTitle>Error</CardTitle>
        </div>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={resetError} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Success boundary for optimistic UI patterns
 */
export function SuccessBoundary({ children }: { children: ReactNode }) {
  const [success, setSuccess] = React.useState(false)

  if (success) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <p className="text-sm text-green-900">Operation completed successfully!</p>
      </div>
    )
  }

  return <>{children}</>
}



































