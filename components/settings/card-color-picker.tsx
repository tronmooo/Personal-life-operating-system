'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Paintbrush, Palette, Sparkles, Check } from 'lucide-react'
import { DashboardCard } from '@/lib/types/dashboard-layout-types'

interface CardColorPickerProps {
  cards: DashboardCard[]
  onColorChange: (cardId: string, color: string) => void
}

// Preset color palettes
const PRESET_COLORS = {
  vibrant: [
    { name: 'Red', value: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    { name: 'Orange', value: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    { name: 'Yellow', value: '#EAB308', gradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)' },
    { name: 'Green', value: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    { name: 'Teal', value: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' },
    { name: 'Blue', value: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
    { name: 'Indigo', value: '#6366F1', gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' },
    { name: 'Purple', value: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    { name: 'Pink', value: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
    { name: 'Rose', value: '#F43F5E', gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)' },
  ],
  pastel: [
    { name: 'Soft Red', value: '#FCA5A5', gradient: 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)' },
    { name: 'Soft Orange', value: '#FCD34D', gradient: 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)' },
    { name: 'Soft Yellow', value: '#FDE68A', gradient: 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)' },
    { name: 'Soft Green', value: '#86EFAC', gradient: 'linear-gradient(135deg, #86EFAC 0%, #6EE7B7 100%)' },
    { name: 'Soft Teal', value: '#5EEAD4', gradient: 'linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 100%)' },
    { name: 'Soft Blue', value: '#93C5FD', gradient: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)' },
    { name: 'Soft Purple', value: '#C4B5FD', gradient: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)' },
    { name: 'Soft Pink', value: '#F9A8D4', gradient: 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)' },
  ],
  dark: [
    { name: 'Dark Red', value: '#991B1B', gradient: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)' },
    { name: 'Dark Orange', value: '#9A3412', gradient: 'linear-gradient(135deg, #9A3412 0%, #7C2D12 100%)' },
    { name: 'Dark Green', value: '#065F46', gradient: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)' },
    { name: 'Dark Blue', value: '#1E40AF', gradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)' },
    { name: 'Dark Purple', value: '#6B21A8', gradient: 'linear-gradient(135deg, #6B21A8 0%, #581C87 100%)' },
    { name: 'Dark Gray', value: '#374151', gradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)' },
  ],
  gradients: [
    { name: 'Sunset', value: 'gradient-sunset', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFA06B 50%, #FFD06B 100%)' },
    { name: 'Ocean', value: 'gradient-ocean', gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
    { name: 'Forest', value: 'gradient-forest', gradient: 'linear-gradient(135deg, #56AB2F 0%, #A8E063 100%)' },
    { name: 'Candy', value: 'gradient-candy', gradient: 'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)' },
    { name: 'Fire', value: 'gradient-fire', gradient: 'linear-gradient(135deg, #FA8072 0%, #FF6348 100%)' },
    { name: 'Ice', value: 'gradient-ice', gradient: 'linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)' },
  ]
}

export function CardColorPicker({ cards, onColorChange }: CardColorPickerProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(cards[0]?.id || null)
  const [customColor, setCustomColor] = useState('#3B82F6')

  const selectedCardData = cards.find(c => c.id === selectedCard)

  const applyColor = (color: string) => {
    if (selectedCard) {
      onColorChange(selectedCard, color)
    }
  }

  return (
    <div className="space-y-6">
      {/* Card Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-purple-600" />
            Select Card to Customize
          </CardTitle>
          <CardDescription>Choose which card you want to change the color for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-left
                  ${selectedCard === card.id 
                    ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
                style={{
                  background: card.color?.startsWith('gradient-') 
                    ? PRESET_COLORS.gradients.find(g => g.value === card.color)?.gradient 
                    : card.color
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl filter drop-shadow-lg">{card.icon || '📊'}</span>
                  <div className="text-white filter drop-shadow">
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className="text-xs opacity-80">{card.domain}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Picker */}
      {selectedCardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Choose Color for {selectedCardData.title}
            </CardTitle>
            <CardDescription>Select from presets or use a custom color</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vibrant" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
                <TabsTrigger value="pastel">Pastel</TabsTrigger>
                <TabsTrigger value="dark">Dark</TabsTrigger>
                <TabsTrigger value="gradients">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Gradients
                </TabsTrigger>
              </TabsList>

              {/* Vibrant Colors */}
              <TabsContent value="vibrant" className="space-y-4 mt-4">
                <div className="grid grid-cols-5 gap-3">
                  {PRESET_COLORS.vibrant.map(color => (
                    <button
                      key={color.value}
                      onClick={() => applyColor(color.value)}
                      className="group relative"
                      title={color.name}
                    >
                      <div
                        className={`
                          w-full aspect-square rounded-lg transition-transform
                          hover:scale-110 hover:shadow-lg
                          ${selectedCardData.color === color.value ? 'ring-4 ring-purple-500 scale-110' : ''}
                        `}
                        style={{ background: color.gradient }}
                      />
                      {selectedCardData.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white filter drop-shadow-lg" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                        {color.name}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Pastel Colors */}
              <TabsContent value="pastel" className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-3">
                  {PRESET_COLORS.pastel.map(color => (
                    <button
                      key={color.value}
                      onClick={() => applyColor(color.value)}
                      className="group relative"
                      title={color.name}
                    >
                      <div
                        className={`
                          w-full aspect-square rounded-lg transition-transform
                          hover:scale-110 hover:shadow-lg
                          ${selectedCardData.color === color.value ? 'ring-4 ring-purple-500 scale-110' : ''}
                        `}
                        style={{ background: color.gradient }}
                      />
                      {selectedCardData.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-6 w-6 text-gray-700 filter drop-shadow-lg" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                        {color.name}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Dark Colors */}
              <TabsContent value="dark" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_COLORS.dark.map(color => (
                    <button
                      key={color.value}
                      onClick={() => applyColor(color.value)}
                      className="group relative"
                      title={color.name}
                    >
                      <div
                        className={`
                          w-full aspect-square rounded-lg transition-transform
                          hover:scale-110 hover:shadow-lg
                          ${selectedCardData.color === color.value ? 'ring-4 ring-purple-500 scale-110' : ''}
                        `}
                        style={{ background: color.gradient }}
                      />
                      {selectedCardData.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white filter drop-shadow-lg" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                        {color.name}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Gradients */}
              <TabsContent value="gradients" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_COLORS.gradients.map(color => (
                    <button
                      key={color.value}
                      onClick={() => applyColor(color.value)}
                      className="group relative"
                      title={color.name}
                    >
                      <div
                        className={`
                          w-full aspect-square rounded-lg transition-transform
                          hover:scale-110 hover:shadow-lg
                          ${selectedCardData.color === color.value ? 'ring-4 ring-purple-500 scale-110' : ''}
                        `}
                        style={{ background: color.gradient }}
                      />
                      {selectedCardData.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white filter drop-shadow-lg" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                        {color.name}
                      </p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Custom Color */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label htmlFor="custom-color" className="text-sm font-medium mb-2 block">
                Custom Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
                <Button
                  onClick={() => applyColor(customColor)}
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {selectedCardData && (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>How your card will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 rounded-xl shadow-xl transition-all"
              style={{
                background: selectedCardData.color?.startsWith('gradient-')
                  ? PRESET_COLORS.gradients.find(g => g.value === selectedCardData.color)?.gradient
                  : selectedCardData.color
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl filter drop-shadow-lg">{selectedCardData.icon}</span>
                <div className="text-white filter drop-shadow">
                  <h3 className="text-2xl font-bold">{selectedCardData.title}</h3>
                  <p className="text-sm opacity-90">{selectedCardData.domain}</p>
                </div>
              </div>
              <div className="text-white/90 text-sm">
                This is how your customized card will appear on the dashboard.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


























