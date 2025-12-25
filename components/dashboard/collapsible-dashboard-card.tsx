'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface CollapsibleDashboardCardProps {
  id: string // Unique ID for persisting collapse state
  title: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  borderColor?: string
  className?: string
  headerClassName?: string
  onToggle?: (open: boolean) => void
}

export function CollapsibleDashboardCard({
  id,
  title,
  icon,
  badge,
  subtitle,
  children,
  defaultOpen = true,
  borderColor = 'border-gray-200 dark:border-gray-800',
  className,
  headerClassName,
  onToggle,
}: CollapsibleDashboardCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [isHydrated, setIsHydrated] = React.useState(false)

  // Load persisted state from IndexedDB on mount
  React.useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await idbGet<boolean>(`dashboard-card-${id}`)
        if (savedState !== undefined && savedState !== null) {
          setIsOpen(savedState)
        }
      } catch (error) {
        console.error('Failed to load card collapse state:', error)
      } finally {
        setIsHydrated(true)
      }
    }
    loadState()
  }, [id])

  // Save state to IndexedDB when toggled
  const handleToggle = React.useCallback(async (open: boolean) => {
    setIsOpen(open)
    try {
      await idbSet(`dashboard-card-${id}`, open)
    } catch (error) {
      console.error('Failed to save card collapse state:', error)
    }
    onToggle?.(open)
  }, [id, onToggle])

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <Card className={cn(`border-2 ${borderColor} hover:shadow-xl transition-all`, className)}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className={cn(
              'pb-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg',
              headerClassName
            )}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <span className="text-lg">{title}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge}
                <div className={cn(
                  'p-1 rounded-full transition-all duration-200',
                  isOpen ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-600'
                )}>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
            </CardTitle>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className={cn(!isOpen && 'hidden')}>
            {isHydrated && children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}












