'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ProteinIntakeCalculator() {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<'kg' | 'lbs'>('lbs')
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'>('moderate')
  const [goal, setGoal] = useState<'maintain' | 'lose' | 'gain'>('maintain')
  const [result, setResult] = useState<number | null>(null)

  const calculateProtein = () => {
    if (!weight) return

    const weightInKg = unit === 'kg' ? parseFloat(weight) : parseFloat(weight) * 0.453592

    // Base protein per kg based on goal
    let proteinPerKg = 0

    if (goal === 'lose') {
      proteinPerKg = 1.8 // Higher protein for weight loss (preserves muscle)
    } else if (goal === 'gain') {
      proteinPerKg = 2.0 // Higher protein for muscle gain
    } else {
      proteinPerKg = 1.6 // Moderate for maintenance
    }

    // Adjust based on activity level
    const activityMultipliers = {
      'sedentary': 0.9,
      'light': 1.0,
      'moderate': 1.1,
      'active': 1.2,
      'very-active': 1.3
    }

    const dailyProtein = weightInKg * proteinPerKg * activityMultipliers[activityLevel]
    setResult(Math.round(dailyProtein))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <div className="flex gap-2">
            <Input
              id="weight"
              type="number"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Select value={unit} onValueChange={(value: 'kg' | 'lbs') => setUnit(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity">Activity Level</Label>
          <Select value={activityLevel} onValueChange={(value: any) => setActivityLevel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
              <SelectItem value="light">Light (1-3 days/week)</SelectItem>
              <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
              <SelectItem value="active">Active (6-7 days/week)</SelectItem>
              <SelectItem value="very-active">Very Active (athlete)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Select value={goal} onValueChange={(value: any) => setGoal(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose Weight</SelectItem>
              <SelectItem value="maintain">Maintain Weight</SelectItem>
              <SelectItem value="gain">Gain Muscle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calculateProtein} className="w-full">
        Calculate Daily Protein
      </Button>

      {result !== null && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
          <CardHeader>
            <CardTitle>Daily Protein Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">{result}g</div>
              <p className="text-muted-foreground">per day</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
              <div>
                <div className="text-2xl font-bold">{Math.round(result / 3)}g</div>
                <div className="text-xs text-muted-foreground">Per Meal (3 meals)</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(result * 4)}</div>
                <div className="text-xs text-muted-foreground">Calories from Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round((result * 4) / 2000 * 100)}%</div>
                <div className="text-xs text-muted-foreground">Of 2000 cal diet</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-white/50 dark:bg-black/20 p-3 rounded-lg">
              <strong>Tip:</strong> Spread protein intake throughout the day for optimal absorption.
              Good sources include chicken, fish, eggs, Greek yogurt, beans, and protein powder.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
