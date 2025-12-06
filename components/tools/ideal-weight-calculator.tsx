'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scale, Target } from 'lucide-react'

export function IdealWeightCalculator() {
  const [height, setHeight] = useState('')
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('ft')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [frame, setFrame] = useState<'small' | 'medium' | 'large'>('medium')
  const [currentWeight, setCurrentWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs')
  const [result, setResult] = useState<{
    hamwi: number
    devine: number
    robinson: number
    miller: number
    average: number
    range: { min: number; max: number }
  } | null>(null)

  const calculateIdealWeight = () => {
    let heightCm = 0

    if (heightUnit === 'cm') {
      heightCm = parseFloat(height)
    } else {
      heightCm = (parseInt(feet) * 12 + parseInt(inches)) * 2.54
    }

    if (!heightCm) return

    const heightInches = heightCm / 2.54

    // Different formulas for ideal weight (all in kg)
    let hamwi, devine, robinson, miller

    if (gender === 'male') {
      // Hamwi Formula
      hamwi = 48 + 2.7 * Math.max(0, (heightCm - 152) / 2.54)
      // Devine Formula
      devine = 50 + 2.3 * Math.max(0, heightInches - 60)
      // Robinson Formula
      robinson = 52 + 1.9 * Math.max(0, heightInches - 60)
      // Miller Formula
      miller = 56.2 + 1.41 * Math.max(0, heightInches - 60)
    } else {
      // Hamwi Formula
      hamwi = 45.5 + 2.2 * Math.max(0, (heightCm - 152) / 2.54)
      // Devine Formula
      devine = 45.5 + 2.3 * Math.max(0, heightInches - 60)
      // Robinson Formula
      robinson = 49 + 1.7 * Math.max(0, heightInches - 60)
      // Miller Formula
      miller = 53.1 + 1.36 * Math.max(0, heightInches - 60)
    }

    const average = (hamwi + devine + robinson + miller) / 4

    // Adjust for frame size
    const frameAdjustment = frame === 'small' ? 0.9 : frame === 'large' ? 1.1 : 1
    const adjustedAverage = average * frameAdjustment

    // Healthy weight range (BMI 18.5-24.9)
    const heightM = heightCm / 100
    const minWeight = 18.5 * heightM * heightM
    const maxWeight = 24.9 * heightM * heightM

    setResult({
      hamwi: Math.round(hamwi * frameAdjustment),
      devine: Math.round(devine * frameAdjustment),
      robinson: Math.round(robinson * frameAdjustment),
      miller: Math.round(miller * frameAdjustment),
      average: Math.round(adjustedAverage),
      range: { min: Math.round(minWeight), max: Math.round(maxWeight) }
    })
  }

  const convertWeight = (kg: number) => {
    return weightUnit === 'kg' ? kg : Math.round(kg * 2.20462)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          {heightUnit === 'cm' ? (
            <div className="flex gap-2">
              <Input
                id="height"
                type="number"
                placeholder="Enter height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <Select value={heightUnit} onValueChange={(value: 'cm' | 'ft') => setHeightUnit(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Feet"
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Inches"
                value={inches}
                onChange={(e) => setInches(e.target.value)}
              />
              <Select value={heightUnit} onValueChange={(value: 'cm' | 'ft') => setHeightUnit(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
          <Label htmlFor="frame">Body Frame</Label>
          <Select value={frame} onValueChange={(value: any) => setFrame(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small Frame</SelectItem>
              <SelectItem value="medium">Medium Frame</SelectItem>
              <SelectItem value="large">Large Frame</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current">Current Weight (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="current"
              type="number"
              placeholder="Current weight"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
            />
            <Select value={weightUnit} onValueChange={(value: 'kg' | 'lbs') => setWeightUnit(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={calculateIdealWeight} className="w-full">
        <Scale className="mr-2 h-4 w-4" />
        Calculate Ideal Weight
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Ideal Weight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {convertWeight(result.average)} {weightUnit}
                </div>
                <p className="text-muted-foreground">Average of all formulas</p>
                {currentWeight && (
                  <div className="mt-3 text-lg">
                    {Math.abs(parseFloat(currentWeight) - convertWeight(result.average)) < 5 ? (
                      <span className="text-green-600">✓ You're at your ideal weight!</span>
                    ) : parseFloat(currentWeight) < convertWeight(result.average) ? (
                      <span className="text-blue-600">
                        {(convertWeight(result.average) - parseFloat(currentWeight)).toFixed(1)} {weightUnit} below ideal
                      </span>
                    ) : (
                      <span className="text-orange-600">
                        {(parseFloat(currentWeight) - convertWeight(result.average)).toFixed(1)} {weightUnit} above ideal
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold mb-3">Healthy Weight Range:</div>
                <div className="text-center text-2xl font-bold text-blue-600">
                  {convertWeight(result.range.min)} - {convertWeight(result.range.max)} {weightUnit}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1">Based on BMI 18.5-24.9</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                  <div className="text-sm text-muted-foreground">Hamwi</div>
                  <div className="text-lg font-semibold">{convertWeight(result.hamwi)} {weightUnit}</div>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                  <div className="text-sm text-muted-foreground">Devine</div>
                  <div className="text-lg font-semibold">{convertWeight(result.devine)} {weightUnit}</div>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                  <div className="text-sm text-muted-foreground">Robinson</div>
                  <div className="text-lg font-semibold">{convertWeight(result.robinson)} {weightUnit}</div>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                  <div className="text-sm text-muted-foreground">Miller</div>
                  <div className="text-lg font-semibold">{convertWeight(result.miller)} {weightUnit}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These formulas provide estimates based on height, gender, and frame size.
                Individual ideal weight can vary based on muscle mass, bone density, and overall health.
                Consult with a healthcare provider for personalized advice.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
