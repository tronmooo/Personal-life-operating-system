'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Type, 
  Eye, 
  Sparkles,
  Check,
  Loader2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'
import { cn } from '@/lib/utils'

// Accent color options
const ACCENT_COLORS = [
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
  { name: 'Slate', value: 'slate', class: 'bg-slate-500' },
]

// Font options
const FONT_OPTIONS = [
  { name: 'System Default', value: 'system' },
  { name: 'Inter', value: 'inter' },
  { name: 'SF Pro', value: 'sf-pro' },
  { name: 'Roboto', value: 'roboto' },
]

interface AppearanceSettings {
  accentColor: string
  fontSize: number
  fontFamily: string
  reduceMotion: boolean
  compactMode: boolean
  highContrast: boolean
  sidebarCollapsed: boolean
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  accentColor: 'indigo',
  fontSize: 100,
  fontFamily: 'system',
  reduceMotion: false,
  compactMode: false,
  highContrast: false,
  sidebarCollapsed: false,
}

export function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings on mount
  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const userSettings = await getUserSettings()
      if (userSettings?.appearance) {
        setSettings(prev => ({ ...prev, ...userSettings.appearance }))
      }
    } catch (error) {
      console.error('Failed to load appearance settings:', error)
    }
  }

  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K, 
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      await updateUserSettings({ appearance: settings })
      setHasChanges(false)
      
      // Apply settings to DOM
      applySettings(settings)
    } catch (error) {
      console.error('Failed to save appearance settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const applySettings = (s: AppearanceSettings) => {
    // Apply font size
    document.documentElement.style.fontSize = `${s.fontSize}%`
    
    // Apply reduce motion
    if (s.reduceMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
    
    // Apply high contrast
    if (s.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    // Apply compact mode
    if (s.compactMode) {
      document.documentElement.classList.add('compact')
    } else {
      document.documentElement.classList.remove('compact')
    }

    // Apply accent color as CSS variable
    document.documentElement.setAttribute('data-accent', s.accentColor)
  }

  // Apply settings on load
  useEffect(() => {
    if (mounted) {
      applySettings(settings)
    }
  }, [mounted, settings])

  if (!mounted) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Theme
          </CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Light Theme */}
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                theme === 'light' 
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium">Light</span>
              {theme === 'light' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {/* Dark Theme */}
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                theme === 'dark' 
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium">Dark</span>
              {theme === 'dark' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            {/* System Theme */}
            <button
              onClick={() => setTheme('system')}
              className={cn(
                "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                theme === 'system' 
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium">System</span>
              {theme === 'system' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Currently using: <span className="font-medium capitalize">{resolvedTheme}</span> mode
          </p>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Accent Color
          </CardTitle>
          <CardDescription>Choose a primary accent color for highlights and interactive elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateSetting('accentColor', color.value)}
                className={cn(
                  "relative w-12 h-12 rounded-full transition-all hover:scale-110",
                  color.class,
                  settings.accentColor === color.value && "ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600"
                )}
                title={color.name}
              >
                {settings.accentColor === color.value && (
                  <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-green-600" />
            Typography
          </CardTitle>
          <CardDescription>Customize text size and font</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {settings.fontSize}%
              </span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={80}
              max={150}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Smaller</span>
              <span>Default</span>
              <span>Larger</span>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <Label>Font Family</Label>
            <RadioGroup
              value={settings.fontFamily}
              onValueChange={(value) => updateSetting('fontFamily', value)}
              className="grid grid-cols-2 gap-2"
            >
              {FONT_OPTIONS.map((font) => (
                <div key={font.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={font.value} id={`font-${font.value}`} />
                  <Label htmlFor={`font-${font.value}`} className="cursor-pointer">
                    {font.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" />
            Accessibility
          </CardTitle>
          <CardDescription>Make the interface easier to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reduce Motion */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
            />
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase text and border contrast
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce padding and spacing for more content
              </p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => updateSetting('compactMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4">
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  You have unsaved changes
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={loadSettings}
                    disabled={isSaving}
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}










