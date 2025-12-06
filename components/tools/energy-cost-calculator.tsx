'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Lightbulb } from 'lucide-react'

export function EnergyCostCalculator() {
  const [watts, setWatts] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('')
  const [costPerKwh, setCostPerKwh] = useState('0.13')
  const [applianceType, setApplianceType] = useState<'custom' | 'light' | 'tv' | 'computer' | 'ac' | 'heater'>('custom')
  const [result, setResult] = useState<{
    dailyCost: number
    monthlyCost: number
    annualCost: number
    kwhPerDay: number
    kwhPerMonth: number
    kwhPerYear: number
  } | null>(null)

  const applianceWatts: Record<string, number> = {
    light: 60,
    tv: 150,
    computer: 200,
    ac: 3500,
    heater: 1500
  }

  const calculateEnergyCost = () => {
    let wattage = parseFloat(watts)
    if (applianceType !== 'custom') {
      wattage = applianceWatts[applianceType]
    }

    if (!wattage || !hoursPerDay) return

    const hours = parseFloat(hoursPerDay)
    const rate = parseFloat(costPerKwh)

    // Convert watts to kilowatts
    const kw = wattage / 1000

    // Calculate energy consumption
    const kwhPerDay = kw * hours
    const kwhPerMonth = kwhPerDay * 30
    const kwhPerYear = kwhPerDay * 365

    // Calculate costs
    const dailyCost = kwhPerDay * rate
    const monthlyCost = kwhPerMonth * rate
    const annualCost = kwhPerYear * rate

    setResult({
      dailyCost,
      monthlyCost,
      annualCost,
      kwhPerDay,
      kwhPerMonth,
      kwhPerYear
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="type">Appliance Type</Label>
          <Select value={applianceType} onValueChange={(value: any) => setApplianceType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="light">Light Bulb (60W)</SelectItem>
              <SelectItem value="tv">TV (150W)</SelectItem>
              <SelectItem value="computer">Computer (200W)</SelectItem>
              <SelectItem value="ac">Air Conditioner (3500W)</SelectItem>
              <SelectItem value="heater">Space Heater (1500W)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {applianceType === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="watts">Power (Watts)</Label>
            <Input
              id="watts"
              type="number"
              placeholder="e.g., 100"
              value={watts}
              onChange={(e) => setWatts(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Check appliance label</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="hours">Hours Used Per Day</Label>
          <Input
            id="hours"
            type="number"
            step="0.5"
            placeholder="e.g., 5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Cost Per kWh ($)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            placeholder="e.g., 0.13"
            value={costPerKwh}
            onChange={(e) => setCostPerKwh(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">US average: $0.13/kWh</p>
        </div>
      </div>

      <Button onClick={calculateEnergyCost} className="w-full">
        <Zap className="mr-2 h-4 w-4" />
        Calculate Energy Cost
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Energy Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">${result.dailyCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per Day</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">${result.monthlyCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per Month</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">${result.annualCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per Year</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-3">Energy Consumption:</p>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Daily:</span>
                    <span className="font-semibold">{result.kwhPerDay.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Monthly:</span>
                    <span className="font-semibold">{result.kwhPerMonth.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Yearly:</span>
                    <span className="font-semibold">{result.kwhPerYear.toFixed(2)} kWh</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Energy Saving Tips:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Switch to LED bulbs (use 75% less energy)</li>
                <li>Unplug devices when not in use (phantom load)</li>
                <li>Use power strips to easily turn off multiple devices</li>
                <li>Upgrade to Energy Star certified appliances</li>
                <li>Adjust thermostat by 7-10°F when away</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
