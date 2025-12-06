'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Droplets } from 'lucide-react'

export function WaterIntakeCalculator() {
  const [weight, setWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'moderate' | 'active' | 'very-active'>('moderate')
  const [climate, setClimate] = useState<'normal' | 'hot' | 'humid'>('normal')
  const [result, setResult] = useState<{
    liters: number
    cups: number
    bottles: number
    ounces: number
  } | null>(null)

  const calculateWaterIntake = () => {
    const w = parseFloat(weight)
    if (!w) return

    // Base calculation: 35ml per kg of body weight
    let waterMl = w * 35

    // Adjust for activity level
    const activityMultipliers = {
      sedentary: 1.0,
      moderate: 1.2,
      active: 1.4,
      'very-active': 1.6,
    }
    waterMl *= activityMultipliers[activityLevel]

    // Adjust for climate
    const climateAdditions = {
      normal: 0,
      hot: 500,
      humid: 300,
    }
    waterMl += climateAdditions[climate]

    const liters = waterMl / 1000
    const cups = liters * 4.227 // 1 liter = 4.227 cups
    const bottles = liters / 0.5 // Standard 500ml bottle
    const ounces = liters * 33.814 // 1 liter = 33.814 oz

    setResult({
      liters: Math.round(liters * 10) / 10,
      cups: Math.round(cups),
      bottles: Math.round(bottles),
      ounces: Math.round(ounces),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-500" />
            Water Intake Calculator
          </CardTitle>
          <CardDescription>
            Calculate your daily water intake needs based on your body weight, activity level, and climate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Body Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your weight in kilograms
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <select
                id="activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                <option value="active">Active (exercise 6-7 days/week)</option>
                <option value="very-active">Very Active (intense daily exercise)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="climate">Climate Conditions</Label>
              <select
                id="climate"
                value={climate}
                onChange={(e) => setClimate(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="normal">Normal Temperature</option>
                <option value="hot">Hot/Dry Climate</option>
                <option value="humid">Hot/Humid Climate</option>
              </select>
            </div>
          </div>

          <Button onClick={calculateWaterIntake} className="w-full">
            Calculate Water Intake
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-blue-500/50">
          <CardHeader>
            <CardTitle>Your Daily Water Intake Goal</CardTitle>
            <CardDescription>Stay hydrated for optimal health and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/20">
                <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.liters}L
                </p>
                <p className="text-xs text-muted-foreground">Liters</p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.cups}
                </p>
                <p className="text-xs text-muted-foreground">Cups</p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.bottles}
                </p>
                <p className="text-xs text-muted-foreground">Bottles (500ml)</p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/20">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.ounces}
                </p>
                <p className="text-xs text-muted-foreground">Fluid Ounces</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Hydration Tips</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Drink a glass of water first thing in the morning to kickstart hydration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Keep a water bottle with you throughout the day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Drink before, during, and after exercise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Increase intake during hot weather or illness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Your urine should be pale yellow - dark urine indicates dehydration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Foods like fruits and vegetables also contribute to hydration</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                Signs of Dehydration
              </h4>
              <p className="text-sm text-muted-foreground">
                Watch for: dry mouth, fatigue, dizziness, dark urine, headache, or decreased urination
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







