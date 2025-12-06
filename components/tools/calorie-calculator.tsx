'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Apple } from 'lucide-react'

export function CalorieCalculator() {
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState('30')
  const [weight, setWeight] = useState('70')
  const [height, setHeight] = useState('175')
  const [activity, setActivity] = useState('moderate')
  const [result, setResult] = useState<any>(null)

  const calculate = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)

    // Mifflin-St Jeor Equation
    let bmr: number
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    }

    const tdee = bmr * activityMultipliers[activity]

    setResult({
      bmr: Math.round(bmr),
      maintain: Math.round(tdee),
      mildWeightLoss: Math.round(tdee - 250),
      weightLoss: Math.round(tdee - 500),
      extremeWeightLoss: Math.round(tdee - 1000),
      mildWeightGain: Math.round(tdee + 250),
      weightGain: Math.round(tdee + 500)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Apple className="h-5 w-5 mr-2" />
            Calorie Calculator
          </CardTitle>
          <CardDescription>
            Calculate your daily calorie needs based on your goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
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
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select value={activity} onValueChange={setActivity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                  <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="veryActive">Very Active (intense exercise daily)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={calculate} className="w-full">Calculate Calories</Button>

          {result && (
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Maintenance Calories</p>
                    <p className="text-4xl font-bold text-primary">{result.maintain}</p>
                    <p className="text-xs text-muted-foreground mt-1">calories/day</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extreme Weight Loss</span>
                    <span className="font-semibold">{result.extremeWeightLoss} cal/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weight Loss</span>
                    <span className="font-semibold">{result.weightLoss} cal/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mild Weight Loss</span>
                    <span className="font-semibold">{result.mildWeightLoss} cal/day</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-sm">Maintain Weight</span>
                    <span className="font-semibold text-primary">{result.maintain} cal/day</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-sm">Mild Weight Gain</span>
                    <span className="font-semibold">{result.mildWeightGain} cal/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weight Gain</span>
                    <span className="font-semibold">{result.weightGain} cal/day</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    <strong>BMR:</strong> {result.bmr} calories/day
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your Basal Metabolic Rate (BMR) is the number of calories your body burns at rest.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}








