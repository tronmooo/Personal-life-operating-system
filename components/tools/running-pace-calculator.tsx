'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timer, Activity } from 'lucide-react'

export function RunningPaceCalculator() {
  const [distance, setDistance] = useState('')
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi' | '5k' | '10k' | 'half' | 'full'>('km')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [result, setResult] = useState<{
    pacePerKm: string
    pacePerMile: string
    speed: string
    splits: Array<{ distance: string; time: string }>
  } | null>(null)

  const calculatePace = () => {
    let distanceKm = 0

    // Convert distance to km
    if (distanceUnit === '5k') distanceKm = 5
    else if (distanceUnit === '10k') distanceKm = 10
    else if (distanceUnit === 'half') distanceKm = 21.0975
    else if (distanceUnit === 'full') distanceKm = 42.195
    else if (distanceUnit === 'km') distanceKm = parseFloat(distance)
    else distanceKm = parseFloat(distance) * 1.60934 // miles to km

    const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0)

    if (!distanceKm || !totalSeconds) return

    // Calculate pace per km
    const secondsPerKm = totalSeconds / distanceKm
    const paceMinKm = Math.floor(secondsPerKm / 60)
    const paceSecKm = Math.round(secondsPerKm % 60)
    const pacePerKm = `${paceMinKm}:${paceSecKm.toString().padStart(2, '0')}`

    // Calculate pace per mile
    const secondsPerMile = secondsPerKm * 1.60934
    const paceMinMi = Math.floor(secondsPerMile / 60)
    const paceSecMi = Math.round(secondsPerMile % 60)
    const pacePerMile = `${paceMinMi}:${paceSecMi.toString().padStart(2, '0')}`

    // Calculate speed in km/h
    const speed = ((distanceKm / totalSeconds) * 3600).toFixed(2)

    // Generate splits (every km or mile)
    const splits: Array<{ distance: string; time: string }> = []
    const splitDistance = distanceUnit === 'mi' ? 1.60934 : 1 // 1 mile or 1 km in km
    const numSplits = Math.floor(distanceKm / splitDistance)

    for (let i = 1; i <= Math.min(numSplits, 10); i++) {
      const splitTime = secondsPerKm * splitDistance * i
      const h = Math.floor(splitTime / 3600)
      const m = Math.floor((splitTime % 3600) / 60)
      const s = Math.round(splitTime % 60)
      const timeStr = h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`

      splits.push({
        distance: distanceUnit === 'mi' ? `Mile ${i}` : `${i} km`,
        time: timeStr
      })
    }

    setResult({ pacePerKm, pacePerMile, speed, splits })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="distance">Distance</Label>
          <div className="flex gap-2">
            <Input
              id="distance"
              type="number"
              step="0.1"
              placeholder="Enter distance"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={['5k', '10k', 'half', 'full'].includes(distanceUnit)}
            />
            <Select value={distanceUnit} onValueChange={(value: any) => setDistanceUnit(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">km</SelectItem>
                <SelectItem value="mi">miles</SelectItem>
                <SelectItem value="5k">5K</SelectItem>
                <SelectItem value="10k">10K</SelectItem>
                <SelectItem value="half">Half Marathon</SelectItem>
                <SelectItem value="full">Marathon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="HH"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
            />
            <Input
              type="number"
              placeholder="MM"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
            />
            <Input
              type="number"
              placeholder="SS"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              min="0"
              max="59"
            />
          </div>
        </div>
      </div>

      <Button onClick={calculatePace} className="w-full">
        <Timer className="mr-2 h-4 w-4" />
        Calculate Pace
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Running Pace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{result.pacePerKm}</div>
                  <p className="text-sm text-muted-foreground">min/km</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{result.pacePerMile}</div>
                  <p className="text-sm text-muted-foreground">min/mile</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{result.speed}</div>
                  <p className="text-sm text-muted-foreground">km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.splits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Split Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {result.splits.map((split, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{split.distance}</span>
                      <span className="text-muted-foreground">{split.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Pace Zones:</strong> Easy runs should be 1-2 min/km slower than race pace.
                Tempo runs at 15-30 sec/km slower. Intervals at goal race pace or faster.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
