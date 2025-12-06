'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Smartphone, Tablet, Monitor, Eye, EyeOff, Save, Settings2 } from 'lucide-react'
import { DashboardCard } from '@/lib/types/dashboard-layout-types'

interface MobileSettingsSheetProps {
  cards: DashboardCard[]
  onCardToggle: (cardId: string) => void
  onSave: () => void
}

export function MobileSettingsSheet({ cards, onCardToggle, onSave }: MobileSettingsSheetProps) {
  const [open, setOpen] = useState(false)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [touchMode, setTouchMode] = useState(false)

  // Detect device type and orientation
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }

      const isLandscape = window.innerWidth > window.innerHeight
      setOrientation(isLandscape ? 'landscape' : 'portrait')

      // Detect touch capability
      setTouchMode('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  const visibleCards = cards.filter(c => c.visible)
  const hiddenCards = cards.filter(c => !c.visible)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 md:hidden rounded-full w-14 h-14 shadow-lg z-50"
          style={{ touchAction: 'manipulation' }} // Prevent double-tap zoom
        >
          <Settings2 className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Dashboard Settings
          </SheetTitle>
          <SheetDescription>
            Customize your dashboard for mobile viewing
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* Device Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Device Type</Label>
                  <div className="flex items-center gap-2">
                    {deviceType === 'mobile' && <Smartphone className="h-4 w-4 text-blue-600" />}
                    {deviceType === 'tablet' && <Tablet className="h-4 w-4 text-green-600" />}
                    {deviceType === 'desktop' && <Monitor className="h-4 w-4 text-purple-600" />}
                    <span className="font-medium capitalize">{deviceType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Orientation</Label>
                  <span className="font-medium capitalize">{orientation}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Touch Mode</Label>
                  <span className="font-medium">{touchMode ? 'Enabled' : 'Disabled'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Screen Size</Label>
                  <span className="font-medium text-sm">{window.innerWidth}×{window.innerHeight}px</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Toggle Recommendations */}
          {deviceType === 'mobile' && visibleCards.length > 6 && (
            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
              <CardContent className="p-4">
                <p className="text-sm text-orange-900 dark:text-orange-100 font-medium mb-1">
                  💡 Tip for Mobile
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  You have {visibleCards.length} cards visible. Consider hiding some cards for better mobile performance. 
                  We recommend showing 3-6 cards on mobile.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Visible Cards */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              Visible Cards ({visibleCards.length})
            </h3>
            <div className="space-y-2">
              {visibleCards.map(card => (
                <Card
                  key={card.id}
                  className="border-l-4 border-l-green-500"
                  style={{ touchAction: 'manipulation' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{card.icon || '📊'}</span>
                        <div>
                          <p className="font-semibold">{card.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{card.size}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCardToggle(card.id)}
                        className="min-w-[48px] min-h-[48px]" // Touch-friendly size
                      >
                        <EyeOff className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Hidden Cards */}
          {hiddenCards.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-400" />
                Hidden Cards ({hiddenCards.length})
              </h3>
              <div className="space-y-2">
                {hiddenCards.map(card => (
                  <Card
                    key={card.id}
                    className="border-l-4 border-l-gray-300 opacity-60"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl grayscale">{card.icon || '📊'}</span>
                          <div>
                            <p className="font-semibold">{card.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{card.size}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCardToggle(card.id)}
                          className="min-w-[48px] min-h-[48px]" // Touch-friendly size
                        >
                          <Eye className="h-5 w-5 text-green-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={() => {
              onSave()
              setOpen(false)
            }}
            className="w-full min-h-[48px] text-lg"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            Save & Close
          </Button>

          {/* Gesture Hints */}
          {touchMode && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                  📱 Touch Gestures
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Tap</strong> a card to expand details</li>
                  <li>• <strong>Swipe left</strong> on cards for quick actions</li>
                  <li>• <strong>Pull down</strong> to refresh data</li>
                  <li>• <strong>Pinch</strong> to zoom (if enabled)</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


























