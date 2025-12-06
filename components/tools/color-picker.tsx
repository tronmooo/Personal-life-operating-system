'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Palette, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function ColorPicker() {
  const { toast } = useToast()
  const [hexColor, setHexColor] = useState('#3b82f6')
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 })
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 })

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 }
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  useEffect(() => {
    const rgbValue = hexToRgb(hexColor)
    setRgb(rgbValue)
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b))
  }, [hexColor])

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b })
    setHexColor(rgbToHex(r, g, b))
    setHsl(rgbToHsl(r, g, b))
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: `${label} copied to clipboard` })
  }

  const generateRandomColor = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    setHexColor(randomHex)
  }

  const shades = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(factor => {
    const r = Math.round(rgb.r + (255 - rgb.r) * factor)
    const g = Math.round(rgb.g + (255 - rgb.g) * factor)
    const b = Math.round(rgb.b + (255 - rgb.b) * factor)
    return rgbToHex(r, g, b)
  })

  const tints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(factor => {
    const r = Math.round(rgb.r * (1 - factor))
    const g = Math.round(rgb.g * (1 - factor))
    const b = Math.round(rgb.b * (1 - factor))
    return rgbToHex(r, g, b)
  })

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="color">Select Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="h-12 cursor-pointer"
            />
            <Input
              type="text"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              placeholder="#000000"
              className="h-12 font-mono"
            />
          </div>
        </div>

        <Button onClick={generateRandomColor} className="w-full" variant="outline">
          <Palette className="mr-2 h-4 w-4" />
          Random Color
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="w-full h-32 rounded-lg border-2 border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: hexColor }}
          />

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">HEX</p>
                <p className="font-mono font-semibold">{hexColor.toUpperCase()}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copy(hexColor, 'HEX')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">RGB</p>
                <p className="font-mono font-semibold">
                  rgb({rgb.r}, {rgb.g}, {rgb.b})
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">HSL</p>
                <p className="font-mono font-semibold">
                  hsl({hsl.h}°, {hsl.s}%, {hsl.l}%)
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Shades (Lighter)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-9 gap-2">
            {shades.map((shade, idx) => (
              <div
                key={idx}
                className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: shade }}
                onClick={() => setHexColor(shade)}
                title={shade}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Tints (Darker)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-9 gap-2">
            {tints.map((tint, idx) => (
              <div
                key={idx}
                className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: tint }}
                onClick={() => setHexColor(tint)}
                title={tint}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RGB Sliders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Red: {rgb.r}</Label>
            <Input
              type="range"
              min="0"
              max="255"
              value={rgb.r}
              onChange={(e) => updateFromRgb(parseInt(e.target.value), rgb.g, rgb.b)}
              className="cursor-pointer"
            />
          </div>
          <div>
            <Label>Green: {rgb.g}</Label>
            <Input
              type="range"
              min="0"
              max="255"
              value={rgb.g}
              onChange={(e) => updateFromRgb(rgb.r, parseInt(e.target.value), rgb.b)}
              className="cursor-pointer"
            />
          </div>
          <div>
            <Label>Blue: {rgb.b}</Label>
            <Input
              type="range"
              min="0"
              max="255"
              value={rgb.b}
              onChange={(e) => updateFromRgb(rgb.r, rgb.g, parseInt(e.target.value))}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
