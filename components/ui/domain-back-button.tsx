'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DomainBackButtonProps {
  href?: string
  label?: string
  className?: string
  variant?: 'default' | 'light' | 'dark'
}

/**
 * Consistent back button for all domain pages
 * Use this component at the top of every domain page for navigation consistency
 */
export function DomainBackButton({ 
  href = '/domains', 
  label = 'Back to Domains',
  className,
  variant = 'default'
}: DomainBackButtonProps) {
  const variantStyles = {
    default: 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700',
    light: 'bg-white/20 text-white border-white/30 hover:bg-white/30',
    dark: 'bg-gray-900/80 text-white border-gray-700 hover:bg-gray-800'
  }

  return (
    <Link 
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        // Mobile touch-friendly
        'min-h-[44px] min-w-[44px] touch-manipulation',
        variantStyles[variant],
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 flex-shrink-0" />
      <span className="hidden xs:inline sm:inline">{label}</span>
      <span className="xs:hidden sm:hidden">Back</span>
    </Link>
  )
}



























