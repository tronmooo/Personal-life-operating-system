'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from './card'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
  variant = 'spinner',
  size = 'md',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12'

  return (
    <div className={containerClasses}>
      <div className="text-center space-y-4 animate-fade-in">
        {variant === 'spinner' && (
          <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600 mx-auto`} />
        )}

        {variant === 'dots' && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {variant === 'pulse' && (
          <div className={`${sizeClasses[size]} mx-auto rounded-full bg-purple-600 animate-pulse-slow`} />
        )}

        {variant === 'skeleton' && (
          <div className="space-y-3 w-full max-w-md">
            <div className="h-12 w-full skeleton rounded-lg" />
            <div className="h-12 w-3/4 skeleton rounded-lg" />
            <div className="h-12 w-5/6 skeleton rounded-lg" />
          </div>
        )}

        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6 space-y-4">
        <div className="h-6 w-1/3 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-2/3 skeleton rounded" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-24 skeleton rounded-lg" />
          <div className="h-24 skeleton rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="h-10 w-64 skeleton rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}


























