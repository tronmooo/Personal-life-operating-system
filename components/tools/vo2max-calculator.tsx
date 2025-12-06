'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, TrendingUp } from 'lucide-react'

export function VO2MaxCalculator() {
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [restingHR, setRestingHR] = useState('')
  const [maxHR, setMaxHR] = useState('')
  const [result, setResult] = useState<{ vo2max: number; category: string; color: string } | null>(null)

  const calculateVO2Max = () => {
    if (!age || !restingHR) return

    const ageNum = parseInt(age)
    const rhr = parseInt(restingHR)
    const mhr = maxHR ? parseInt(maxHR) : (220 - ageNum) // Estimate if not provided

    // Using the Uth-Sørensen-Overgaard-Pedersen estimation
    const vo2max = 15.3 * (mhr / rhr)

    // Determine fitness category
    let category = ''
    let color = ''

    if (gender === 'male') {
      if (ageNum < 30) {
        if (vo2max >= 55) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 45) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 40) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 35) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      } else if (ageNum < 40) {
        if (vo2max >= 52) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 43) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 38) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 33) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      } else {
        if (vo2max >= 48) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 39) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 35) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 30) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      }
    } else {
      if (ageNum < 30) {
        if (vo2max >= 49) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 39) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 35) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 30) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      } else if (ageNum < 40) {
        if (vo2max >= 45) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 36) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 32) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 28) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      } else {
        if (vo2max >= 42) { category = 'Excellent'; color = 'text-green-600' }
        else if (vo2max >= 33) { category = 'Good'; color = 'text-blue-600' }
        else if (vo2max >= 28) { category = 'Average'; color = 'text-yellow-600' }
        else if (vo2max >= 24) { category = 'Below Average'; color = 'text-orange-600' }
        else { category = 'Poor'; color = 'text-red-600' }
      }
    }

    setResult({ vo2max: Math.round(vo2max * 10) / 10, category, color })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={(value: 'male' | 'female') => setGender(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resting">Resting Heart Rate (bpm)</Label>
          <Input
            id="resting"
            type="number"
            placeholder="e.g., 60"
            value={restingHR}
            onChange={(e) => setRestingHR(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Measure first thing in the morning</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Max Heart Rate (optional)</Label>
          <Input
            id="max"
            type="number"
            placeholder={`Estimated: ${age ? 220 - parseInt(age) : '---'}`}
            value={maxHR}
            onChange={(e) => setMaxHR(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Leave blank to estimate</p>
        </div>
      </div>

      <Button onClick={calculateVO2Max} className="w-full">
        <Activity className="mr-2 h-4 w-4" />
        Calculate VO2 Max
      </Button>

      {result && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your VO2 Max
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">{result.vo2max}</div>
              <p className="text-muted-foreground">ml/kg/min</p>
              <div className={`text-2xl font-semibold mt-2 ${result.color}`}>{result.category}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold mb-2">Fitness Level Scale:</div>
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Poor</span>
                <span className="text-orange-600">Below Avg</span>
                <span className="text-yellow-600">Average</span>
                <span className="text-blue-600">Good</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <div className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
            </div>

            <div className="text-sm text-muted-foreground bg-white/50 dark:bg-black/20 p-4 rounded-lg space-y-2">
              <p><strong>What is VO2 Max?</strong></p>
              <p>VO2 Max measures your body's maximum oxygen uptake during intense exercise. It's one of the best indicators of cardiovascular fitness and endurance capacity.</p>
              <p className="mt-2"><strong>How to Improve:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>High-intensity interval training (HIIT)</li>
                <li>Long-distance running or cycling</li>
                <li>Cross-training with varied cardio activities</li>
                <li>Strength training to support cardiovascular health</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
