'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

type Goal = 'lose' | 'maintain' | 'gain'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'

export function MacroCalculator() {
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('maintain')
  const [result, setResult] = useState<{
    calories: number
    protein: number
    carbs: number
    fats: number
    proteinCal: number
    carbsCal: number
    fatsCal: number
  } | null>(null)

  const calculateMacros = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)

    if (!w || !h || !a) return

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very: 1.725,
      extra: 1.9,
    }

    // Calculate TDEE
    let tdee = bmr * activityMultipliers[activityLevel]

    // Adjust for goal
    if (goal === 'lose') {
      tdee -= 500 // 500 calorie deficit for weight loss
    } else if (goal === 'gain') {
      tdee += 500 // 500 calorie surplus for muscle gain
    }

    // Macro ratios based on goal
    let proteinRatio = 0.30
    let carbsRatio = 0.40
    let fatsRatio = 0.30

    if (goal === 'lose') {
      proteinRatio = 0.40 // Higher protein for muscle preservation
      carbsRatio = 0.30
      fatsRatio = 0.30
    } else if (goal === 'gain') {
      proteinRatio = 0.30
      carbsRatio = 0.45 // Higher carbs for muscle building
      fatsRatio = 0.25
    }

    // Calculate calories from each macro
    const proteinCal = tdee * proteinRatio
    const carbsCal = tdee * carbsRatio
    const fatsCal = tdee * fatsRatio

    // Convert to grams (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
    const protein = Math.round(proteinCal / 4)
    const carbs = Math.round(carbsCal / 4)
    const fats = Math.round(fatsCal / 9)

    setResult({
      calories: Math.round(tdee),
      protein,
      carbs,
      fats,
      proteinCal: Math.round(proteinCal),
      carbsCal: Math.round(carbsCal),
      fatsCal: Math.round(fatsCal),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Macro Calculator</CardTitle>
          <CardDescription>
            Calculate your daily macronutrient targets (protein, carbs, fats) based on your goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <select
                id="activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                <option value="very">Very Active (exercise 6-7 days/week)</option>
                <option value="extra">Extra Active (physical job + exercise)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Muscle</option>
              </select>
            </div>
          </div>

          <Button onClick={calculateMacros} className="w-full">
            Calculate Macros
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your Daily Macro Targets</CardTitle>
            <CardDescription>Based on your profile and {goal === 'lose' ? 'weight loss' : goal === 'gain' ? 'muscle gain' : 'maintenance'} goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Daily Calorie Target</p>
              <p className="text-3xl font-bold text-primary">{result.calories} cal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Protein</p>
                <p className="text-2xl font-bold">{result.protein}g</p>
                <p className="text-xs text-muted-foreground mt-1">{result.proteinCal} cal ({Math.round((result.proteinCal / result.calories) * 100)}%)</p>
                <p className="text-xs text-muted-foreground mt-2">4 calories per gram</p>
              </div>

              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Carbohydrates</p>
                <p className="text-2xl font-bold">{result.carbs}g</p>
                <p className="text-xs text-muted-foreground mt-1">{result.carbsCal} cal ({Math.round((result.carbsCal / result.calories) * 100)}%)</p>
                <p className="text-xs text-muted-foreground mt-2">4 calories per gram</p>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Fats</p>
                <p className="text-2xl font-bold">{result.fats}g</p>
                <p className="text-xs text-muted-foreground mt-1">{result.fatsCal} cal ({Math.round((result.fatsCal / result.calories) * 100)}%)</p>
                <p className="text-xs text-muted-foreground mt-2">9 calories per gram</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Tips for Success</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Track your macros consistently for best results</li>
                <li>• Aim to hit protein targets daily for muscle preservation</li>
                <li>• Adjust based on your progress after 2-3 weeks</li>
                <li>• Stay hydrated - drink at least 2-3 liters of water daily</li>
                <li>• {goal === 'lose' ? 'Prioritize protein to preserve muscle while losing fat' : goal === 'gain' ? 'Combine with strength training for optimal muscle growth' : 'Maintain balance for sustainable health'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







