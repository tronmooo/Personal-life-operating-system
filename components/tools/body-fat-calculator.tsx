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
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
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
    // Convert height from feet/inches to total inches
    const totalHeightInches = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)
    const w = parseFloat(weight) // Already in lbs
    const n = parseFloat(neck) // Already in inches
    const wa = parseFloat(waist) // Already in inches
    const hi = parseFloat(hip) // Already in inches

    if (!totalHeightInches || !n || !wa || (gender === 'female' && !hi)) return

    // US Navy Method (uses inches for all measurements)
    let bodyFatPercentage: number

    if (gender === 'male') {
      // Male formula: BF% = 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
      bodyFatPercentage =
        86.010 * Math.log10(wa - n) -
        70.041 * Math.log10(totalHeightInches) +
        36.76
    } else {
      // Female formula: BF% = 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
      bodyFatPercentage =
        163.205 * Math.log10(wa + hi - n) -
        97.684 * Math.log10(totalHeightInches) -
        78.387
    }

    // Calculate fat and lean mass in lbs if weight is provided
    let fatMass = 0
    let leanMass = 0
    if (w) {
      fatMass = (w * bodyFatPercentage) / 100
      leanMass = w - fatMass
    }
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
            Calculate your body fat percentage using the US Navy Method. All fields are optional except height and circumferences.
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
              <Label htmlFor="age">Age (optional)</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs) - optional</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="165"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For lean/fat mass calculation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Height (ft / in)</Label>
              <div className="flex gap-2">
                <Input
                  id="heightFt"
                  type="number"
                  placeholder="5"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                />
                <Input
                  id="heightIn"
                  type="number"
                  step="0.5"
                  placeholder="10"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neck">Neck Circumference (inches)</Label>
              <Input
                id="neck"
                type="number"
                step="0.25"
                placeholder="15"
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waist">Waist Circumference (inches)</Label>
              <Input
                id="waist"
                type="number"
                step="0.25"
                placeholder="33"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Measure at navel level
              </p>
            </div>

            {gender === 'female' && (
              <div className="space-y-2">
                <Label htmlFor="hip">Hip Circumference (inches)</Label>
                <Input
                  id="hip"
                  type="number"
                  step="0.25"
                  placeholder="38"
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

            {result.leanMass > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Lean Body Mass</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.leanMass} lbs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Muscle, bone, organs, water
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Fat Mass</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.fatMass} lbs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stored body fat
                  </p>
                </div>
              </div>
            )}

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
                <li>• Use a flexible measuring tape (in inches)</li>
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







