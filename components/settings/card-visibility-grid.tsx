'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, CheckSquare, Square } from 'lucide-react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'
import { DashboardCard, DEFAULT_DOMAIN_CARDS } from '@/lib/types/dashboard-layout-types'

interface CardVisibilityGridProps {
  onVisibilityChange?: () => void
}

interface CardWithVisibility extends Omit<DashboardCard, 'position'> {
  category: string
}

// Organize cards by category
const CATEGORIZED_CARDS: Record<string, CardWithVisibility[]> = {
  'Financial': [
    { ...DEFAULT_DOMAIN_CARDS[4], category: 'Financial' }, // Finance
    { ...DEFAULT_DOMAIN_CARDS[1], category: 'Financial' }, // Insurance
  ],
  'Health & Wellness': [
    { ...DEFAULT_DOMAIN_CARDS[0], category: 'Health & Wellness' }, // Health
    { id: 'fitness', domain: 'fitness', title: 'Fitness', visible: true, size: 'medium', icon: '💪', color: '#F97316', category: 'Health & Wellness' },
    { id: 'nutrition', domain: 'nutrition', title: 'Nutrition', visible: true, size: 'medium', icon: '🍎', color: '#10B981', category: 'Health & Wellness' },
    { id: 'mindfulness', domain: 'mindfulness', title: 'Mindfulness', visible: true, size: 'small', icon: '🧘', color: '#8B5CF6', category: 'Health & Wellness' },
  ],
  'Personal': [
    { ...DEFAULT_DOMAIN_CARDS[5], category: 'Personal' }, // Pets
    { ...DEFAULT_DOMAIN_CARDS[8], category: 'Personal' }, // Relationships
  ],
  'Property & Assets': [
    { ...DEFAULT_DOMAIN_CARDS[3], category: 'Property & Assets' }, // Home
    { ...DEFAULT_DOMAIN_CARDS[2], category: 'Property & Assets' }, // Vehicles
    { ...DEFAULT_DOMAIN_CARDS[7], category: 'Property & Assets' }, // Collectibles
    { id: 'appliances', domain: 'appliances', title: 'Appliances', visible: true, size: 'small', icon: '🔧', color: '#6366F1', category: 'Property & Assets' },
  ],
  'Other': [
    { ...DEFAULT_DOMAIN_CARDS[6], category: 'Other' }, // Digital
    { id: 'legal', domain: 'legal', title: 'Legal', visible: true, size: 'small', icon: '⚖️', color: '#EAB308', category: 'Other' },
  ],
}

export function CardVisibilityGrid({ onVisibilityChange }: CardVisibilityGridProps) {
  const [cardStates, setCardStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Initialize card states from Supabase user_settings or defaults
    (async () => {
      try {
        const settings = await getUserSettings()
        const saved = settings?.dashboardCardVisibility as Record<string, boolean> | undefined
        if (saved && typeof saved === 'object') {
          setCardStates(saved)
        } else {
          initializeDefaults()
        }
      } catch (error) {
        console.error('Error loading card visibility:', error)
        initializeDefaults()
      }
    })()
  }, [])

  const initializeDefaults = () => {
    const defaults: Record<string, boolean> = {}
    Object.values(CATEGORIZED_CARDS).flat().forEach(card => {
      defaults[card.id] = card.visible
    })
    setCardStates(defaults)
  }

  const toggleCard = (cardId: string) => {
    const newStates = { ...cardStates, [cardId]: !cardStates[cardId] }
    setCardStates(newStates)
    updateUserSettings({ dashboardCardVisibility: newStates }).catch(() => {})
    onVisibilityChange?.()
  }

  const selectAll = () => {
    const allVisible: Record<string, boolean> = {}
    Object.values(CATEGORIZED_CARDS).flat().forEach(card => {
      allVisible[card.id] = true
    })
    setCardStates(allVisible)
    updateUserSettings({ dashboardCardVisibility: allVisible }).catch(() => {})
    onVisibilityChange?.()
  }

  const deselectAll = () => {
    const allHidden: Record<string, boolean> = {}
    Object.values(CATEGORIZED_CARDS).flat().forEach(card => {
      allHidden[card.id] = false
    })
    setCardStates(allHidden)
    updateUserSettings({ dashboardCardVisibility: allHidden }).catch(() => {})
    onVisibilityChange?.()
  }

  const visibleCount = Object.values(cardStates).filter(Boolean).length
  const totalCount = Object.values(CATEGORIZED_CARDS).flat().length

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {visibleCount} / {totalCount} cards visible
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={selectAll}>
            <CheckSquare className="w-4 h-4 mr-1" />
            Show All
          </Button>
          <Button size="sm" variant="outline" onClick={deselectAll}>
            <Square className="w-4 h-4 mr-1" />
            Hide All
          </Button>
        </div>
      </div>

      {/* Cards by Category */}
      <div className="space-y-6">
        {Object.entries(CATEGORIZED_CARDS).map(([category, cards]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              {category}
              <span className="text-xs text-muted-foreground font-normal">
                ({cards.filter(c => cardStates[c.id]).length}/{cards.length})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((card) => {
                const isVisible = cardStates[card.id] ?? card.visible
                
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                      ${isVisible
                        ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                      }
                      hover:shadow-md
                    `}
                  >
                    {/* Visibility Icon */}
                    <div className={`flex-shrink-0 ${isVisible ? 'text-green-600' : 'text-gray-400'}`}>
                      {isVisible ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{card.icon}</span>
                        <span className="font-medium text-sm">{card.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0"
                        >
                          {card.size}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {card.domain}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {isVisible ? (
                        <Badge className="bg-green-600">Visible</Badge>
                      ) : (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Tip:</strong> Hidden cards won't appear on your dashboard. 
          You can show them again anytime from here. Changes apply immediately when saved.
        </p>
      </div>
    </div>
  )
}


















