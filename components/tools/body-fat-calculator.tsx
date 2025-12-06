'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function BodyFatCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [result, setResult] = useState<{
    bodyFat: number
    leanMass: number
    fatMass: number
    category: string
    color: string
  } | null>(null)

  const getBodyFatCategory = (bf: number, isMale: boolean) => {
    if (isMale) {
      if (bf < 6) return { category: 'Essential Fat', color: 'text-blue-600' }
      if (bf < 14) return { category: 'Athletes', color: 'text-green-600' }
      if (bf < 18) return { category: 'Fitness', color: 'text-green-500' }
      if (bf < 25) return { category: 'Average', color: 'text-yellow-600' }
      return { category: 'Obese', color: 'text-red-600' }
    } else {
      if (bf < 14) return { category: 'Essential Fat', color: 'text-blue-600' }
      if (bf < 21) return { category: 'Athletes', color: 'text-green-600' }
      if (bf < 25) return { category: 'Fitness', color: 'text-green-500' }
      if (bf < 32) return { category: 'Average', color: 'text-yellow-600' }
      return { category: 'Obese', color: 'text-red-600' }
    }
  }

  const calculateBodyFat = () => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const n = parseFloat(neck)
    const wa = parseFloat(waist)
    const hi = parseFloat(hip)

    if (!h || !w || !n || !wa || (gender === 'female' && !hi)) return

    // US Navy Method
    let bodyFatPercentage: number

    if (gender === 'male') {
      // Male formula
      bodyFatPercentage =
        495 /
          (1.0324 -
            0.19077 * Math.log10(wa - n) +
            0.15456 * Math.log10(h)) -
        450
    } else {
      // Female formula
      bodyFatPercentage =
        495 /
          (1.29579 -
            0.35004 * Math.log10(wa + hi - n) +
            0.221 * Math.log10(h)) -
        450
    }

    const fatMass = (w * bodyFatPercentage) / 100
    const leanMass = w - fatMass
    const { category, color } = getBodyFatCategory(bodyFatPercentage, gender === 'male')

    setResult({
      bodyFat: Math.round(bodyFatPercentage * 10) / 10,
      leanMass: Math.round(leanMass * 10) / 10,
      fatMass: Math.round(fatMass * 10) / 10,
      category,
      color,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Body Fat Percentage Calculator</CardTitle>
          <CardDescription>
            Calculate your body fat percentage using the US Navy Method (requires measurements)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
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
                step="0.1"
                placeholder="175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neck">Neck Circumference (cm)</Label>
              <Input
                id="neck"
                type="number"
                step="0.1"
                placeholder="38"
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waist">Waist Circumference (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="85"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Measure at navel level
              </p>
            </div>

            {gender === 'female' && (
              <div className="space-y-2">
                <Label htmlFor="hip">Hip Circumference (cm)</Label>
                <Input
                  id="hip"
                  type="number"
                  step="0.1"
                  placeholder="95"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Measure at widest point
                </p>
              </div>
            )}
          </div>

          <Button onClick={calculateBodyFat} className="w-full">
            Calculate Body Fat
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your Body Composition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Body Fat Percentage</p>
              <p className={`text-5xl font-bold ${result.color}`}>
                {result.bodyFat}%
              </p>
              <p className={`text-lg font-medium mt-2 ${result.color}`}>
                {result.category}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground">Lean Body Mass</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.leanMass} kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Muscle, bone, organs, water
                </p>
              </div>

              <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-sm text-muted-foreground">Fat Mass</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {result.fatMass} kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Stored body fat
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Body Fat Categories ({gender === 'male' ? 'Men' : 'Women'})</h4>
              <div className="space-y-2 text-sm">
                {gender === 'male' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Essential Fat:</span>
                      <span>2-5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Athletes:</span>
                      <span>6-13%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-500">Fitness:</span>
                      <span>14-17%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Average:</span>
                      <span>18-24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Obese:</span>
                      <span>25%+</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Essential Fat:</span>
                      <span>10-13%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Athletes:</span>
                      <span>14-20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-500">Fitness:</span>
                      <span>21-24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Average:</span>
                      <span>25-31%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Obese:</span>
                      <span>32%+</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-semibold mb-2">Tips for Measuring</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Use a flexible measuring tape</li>
                <li>• Measure in the morning before eating</li>
                <li>• Keep tape snug but not tight</li>
                <li>• Measure 3 times and use the average</li>
                <li>• Track measurements weekly for progress</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







