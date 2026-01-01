'use client'

/**
 * AI Follow-up Suggestions Component
 * Shows contextual follow-up actions after AI commands
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { type FollowUpSuggestion, type QuickAction } from '@/lib/ai/enhanced-ai-personality'
import { 
  MessageSquare, 
  ArrowRight, 
  Plus,
  BarChart3,
  Navigation,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Icon mapping for action types
const actionIcons: Record<string, React.ReactNode> = {
  command: <MessageSquare className="h-3.5 w-3.5" />,
  question: <MessageSquare className="h-3.5 w-3.5" />,
  navigation: <Navigation className="h-3.5 w-3.5" />,
  'quick-log': <Plus className="h-3.5 w-3.5" />
}

const quickActionIcons: Record<string, React.ReactNode> = {
  log: <Plus className="h-3.5 w-3.5" />,
  view: <ExternalLink className="h-3.5 w-3.5" />,
  create: <Plus className="h-3.5 w-3.5" />,
  analyze: <BarChart3 className="h-3.5 w-3.5" />,
  export: <ExternalLink className="h-3.5 w-3.5" />
}

interface AIFollowUpsProps {
  followUps: FollowUpSuggestion[]
  onFollowUpClick?: (followUp: FollowUpSuggestion) => void
  className?: string
}

export function AIFollowUps({ followUps, onFollowUpClick, className }: AIFollowUpsProps) {
  if (followUps.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">What would you like to do next?</p>
      <div className="flex flex-wrap gap-2">
        {followUps.map((followUp) => (
          <FollowUpButton 
            key={followUp.id} 
            followUp={followUp} 
            onClick={() => onFollowUpClick?.(followUp)}
          />
        ))}
      </div>
    </div>
  )
}

function FollowUpButton({ 
  followUp, 
  onClick 
}: { 
  followUp: FollowUpSuggestion
  onClick?: () => void 
}) {
  if (followUp.action === 'navigation' && followUp.value) {
    return (
      <Link href={followUp.value}>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
        >
          {followUp.icon && <span>{followUp.icon}</span>}
          {actionIcons[followUp.action]}
          {followUp.label}
        </Button>
      </Link>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-8 text-xs gap-1.5"
      onClick={onClick}
    >
      {followUp.icon && <span>{followUp.icon}</span>}
      {actionIcons[followUp.action]}
      {followUp.label}
    </Button>
  )
}

interface QuickActionsBarProps {
  actions: QuickAction[]
  onActionClick?: (action: QuickAction) => void
  className?: string
}

export function QuickActionsBar({ actions, onActionClick, className }: QuickActionsBarProps) {
  if (actions.length === 0) return null

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 px-2"
          onClick={() => onActionClick?.(action)}
        >
          {action.icon && <span>{action.icon}</span>}
          {quickActionIcons[action.type]}
          {action.label}
        </Button>
      ))}
    </div>
  )
}

/**
 * Inline follow-up suggestions for chat interface
 */
interface InlineFollowUpsProps {
  followUps: FollowUpSuggestion[]
  onSelect: (value: string) => void
  className?: string
}

export function InlineFollowUps({ followUps, onSelect, className }: InlineFollowUpsProps) {
  if (followUps.length === 0) return null

  return (
    <div className={cn(
      "flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dashed",
      className
    )}>
      {followUps.map((followUp) => (
        <button
          key={followUp.id}
          onClick={() => {
            if (followUp.action === 'navigation') {
              window.location.href = followUp.value
            } else {
              onSelect(followUp.value || followUp.label)
            }
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
            "border border-primary/20"
          )}
        >
          {followUp.icon && <span>{followUp.icon}</span>}
          {followUp.label}
          <ArrowRight className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}

/**
 * Smart suggestion pills for the command input
 */
interface SmartSuggestionPillsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function SmartSuggestionPills({ suggestions, onSelect, className }: SmartSuggestionPillsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs",
            "bg-muted hover:bg-muted/80 transition-colors",
            "border border-border hover:border-primary/30"
          )}
        >
          💡 {suggestion}
        </button>
      ))}
    </div>
  )
}

export default AIFollowUps



