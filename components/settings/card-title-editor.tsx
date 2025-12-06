'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit3, Type, Smile, Check, RotateCcw } from 'lucide-react'
import { DashboardCard } from '@/lib/types/dashboard-layout-types'

interface CardTitleEditorProps {
  cards: DashboardCard[]
  onTitleChange: (cardId: string, title: string) => void
  onIconChange: (cardId: string, icon: string) => void
  onReset: (cardId: string) => void
}

// Emoji categories
const EMOJI_CATEGORIES = {
  common: {
    name: 'Common',
    emojis: ['📊', '📈', '💰', '🏥', '🏠', '🚗', '🛡️', '💼', '👥', '🎨', '💻', '🐾', '📱', '⚡', '🌟']
  },
  finance: {
    name: 'Finance',
    emojis: ['💰', '💵', '💴', '💶', '💷', '💳', '💸', '🏦', '📊', '📈', '📉', '💹', '🪙', '💎', '🏆']
  },
  health: {
    name: 'Health',
    emojis: ['🏥', '💊', '💉', '🩺', '🧬', '🧪', '🩹', '🦷', '👨‍⚕️', '👩‍⚕️', '🏃', '🧘', '💪', '❤️', '🫀']
  },
  home: {
    name: 'Home',
    emojis: ['🏠', '🏡', '🏢', '🏰', '🏗️', '🏘️', '🪴', '🛋️', '🛏️', '🪟', '🚪', '🔑', '🏠', '🏪', '🏬']
  },
  transport: {
    name: 'Transport',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🏍️']
  },
  work: {
    name: 'Work',
    emojis: ['💼', '👔', '🎯', '📊', '📈', '💻', '⌨️', '🖥️', '📱', '☎️', '📞', '📠', '📧', '📝', '✍️']
  },
  people: {
    name: 'People',
    emojis: ['👥', '👨', '👩', '👦', '👧', '👶', '👴', '👵', '👨‍👩‍👧‍👦', '💑', '👫', '👬', '👭', '🤝', '👏']
  },
  activities: {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🎮', '🎯', '🎲', '🎪']
  },
  objects: {
    name: 'Objects',
    emojis: ['📱', '💻', '⌚', '📷', '📹', '🎥', '📺', '📻', '🎙️', '📡', '🔭', '🔬', '💡', '🔦', '🕯️']
  },
  symbols: {
    name: 'Symbols',
    emojis: ['⭐', '✨', '💫', '🌟', '⚡', '🔥', '💥', '✅', '❌', '❓', '❗', '💯', '🔔', '🎵', '🎶']
  }
}

// Font size options
const FONT_SIZES = [
  { label: 'Small', value: 'text-sm' },
  { label: 'Medium', value: 'text-base' },
  { label: 'Large', value: 'text-lg' },
  { label: 'Extra Large', value: 'text-xl' },
]

// Default card titles
const DEFAULT_TITLES: Record<string, { title: string; icon: string }> = {
  health: { title: 'Health', icon: '🏥' },
  insurance: { title: 'Insurance', icon: '🛡️' },
  vehicles: { title: 'Vehicles', icon: '🚗' },
  home: { title: 'Home', icon: '🏠' },
  financial: { title: 'Finance', icon: '💰' },
  pets: { title: 'Pets', icon: '🐾' },
  digital: { title: 'Digital', icon: '💻' },
  miscellaneous: { title: 'Miscellaneous', icon: '🎨' },
  relationships: { title: 'Relationships', icon: '👥' },
  legal: { title: 'Legal', icon: '⚖️' },
  appliances: { title: 'Appliances', icon: '🔧' },
  fitness: { title: 'Fitness', icon: '💪' },
  nutrition: { title: 'Nutrition', icon: '🍎' },
  mindfulness: { title: 'Mindfulness', icon: '🧘' },
}

export function CardTitleEditor({ cards, onTitleChange, onIconChange, onReset }: CardTitleEditorProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(cards[0]?.id || null)
  const [editingTitle, setEditingTitle] = useState('')
  const [fontSize, setFontSize] = useState('text-base')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const selectedCardData = cards.find(c => c.id === selectedCard)

  const handleTitleChange = (title: string) => {
    setEditingTitle(title)
  }

  const applyTitle = () => {
    if (selectedCard && editingTitle.trim()) {
      onTitleChange(selectedCard, editingTitle.trim())
    }
  }

  const selectEmoji = (emoji: string) => {
    if (selectedCard) {
      onIconChange(selectedCard, emoji)
      setShowEmojiPicker(false)
    }
  }

  const resetCard = () => {
    if (selectedCard) {
      onReset(selectedCard)
      const defaults = DEFAULT_TITLES[selectedCardData?.domain || '']
      if (defaults) {
        setEditingTitle(defaults.title)
      }
    }
  }

  // Update editing title when card selection changes
  useState(() => {
    if (selectedCardData) {
      setEditingTitle(selectedCardData.title)
    }
  })

  return (
    <div className="space-y-6">
      {/* Card Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            Select Card to Customize
          </CardTitle>
          <CardDescription>Choose which card you want to rename</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => {
                  setSelectedCard(card.id)
                  setEditingTitle(card.title)
                }}
                className={`
                  p-3 rounded-lg border-2 transition-all text-left
                  ${selectedCard === card.id 
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{card.icon || '📊'}</span>
                  <div>
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className="text-xs text-gray-500">{card.domain}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Title Editor */}
      {selectedCardData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-green-600" />
                Edit Title
              </CardTitle>
              <CardDescription>Rename "{selectedCardData.title}" to something custom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-title">Custom Title</Label>
                <div className="flex gap-2">
                  <Input
                    id="card-title"
                    value={editingTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter custom title..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyTitle()
                      }
                    }}
                  />
                  <Button onClick={applyTitle}>
                    <Check className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Examples: "My Money", "Health Tracker", "Family", "Work Stuff"
                </p>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Title Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Larger sizes are better for accessibility
                </p>
              </div>

              {/* Reset Button */}
              <Button
                onClick={resetCard}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>

          {/* Emoji Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-yellow-600" />
                Choose Icon
              </CardTitle>
              <CardDescription>Pick an emoji icon for this card</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                  <div key={key}>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
                      {category.emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => selectEmoji(emoji)}
                          className={`
                            text-2xl p-2 rounded-lg transition-all hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-800
                            ${selectedCardData.icon === emoji ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110' : ''}
                          `}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>How your customized card will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCardData.icon || '📊'}</span>
                  <div>
                    <h3 className={`font-bold ${fontSize}`}>
                      {editingTitle || selectedCardData.title}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedCardData.domain}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}


























