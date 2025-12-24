'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from './button'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  className?: string
  fallbackPath?: string // Path to navigate to if no history exists
}

export function BackButton({ label = 'Back', className, fallbackPath = '/domains' }: BackButtonProps) {
  const router = useRouter()
  
  // 🔧 FIX: Safe back navigation with fallback
  const handleBack = useCallback(() => {
    // Check if there's history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      // Fallback to specified path if no history
      router.push(fallbackPath)
    }
  }, [router, fallbackPath])
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleBack} 
      className={cn("min-h-[44px] touch-manipulation", className)}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}








