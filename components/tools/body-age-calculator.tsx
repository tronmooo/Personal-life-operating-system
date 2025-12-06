'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'

export function BodyAgeCalculator() {
  const [actualAge, setActualAge] = useState('')
  const [restingHR, setRestingHR] = useState('')
  const [exerciseFrequency, setExerciseFrequency] = useState<'0' | '1-2' | '3-4' | '5+'>('1-2')
  const [smokingStatus, setSmokingStatus] = useState<'never' | 'former' | 'current'>('never')
  const [sleepHours, setSleepHours] = useState('')
  const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [chronicConditions, setChronicConditions] = useState(false)
  const [result, setResult] = useState<{ bodyAge: number; difference: number; factors: string[] } | null>(null)

  const calculateBodyAge = () => {
    if (!actualAge || !restingHR || !sleepHours) return

    let bodyAge = parseInt(actualAge)
    const factors: string[] = []

    // Resting Heart Rate Impact
    const rhr = parseInt(restingHR)
    if (rhr < 60) {
      bodyAge -= 5
      factors.push('✓ Excellent resting heart rate')
    } else if (rhr < 70) {
      bodyAge -= 2
      factors.push('✓ Good resting heart rate')
    } else if (rhr > 80) {
      bodyAge += 3
      factors.push('✗ High resting heart rate')
    }

    // Exercise Frequency
    if (exerciseFrequency === '5+') {
      bodyAge -= 5
      factors.push('✓ Very active lifestyle')
    } else if (exerciseFrequency === '3-4') {
      bodyAge -= 3
      factors.push('✓ Regular exercise')
    } else if (exerciseFrequency === '1-2') {
      bodyAge -= 1
      factors.push('○ Light exercise')
    } else {
      bodyAge += 4
      factors.push('✗ Sedentary lifestyle')
    }

    // Smoking Status
    if (smokingStatus === 'current') {
      bodyAge += 8
      factors.push('✗ Current smoker')
    } else if (smokingStatus === 'former') {
      bodyAge += 2
      factors.push('○ Former smoker')
    } else {
      factors.push('✓ Non-smoker')
    }

    // Sleep Quality
    const sleep = parseInt(sleepHours)
    if (sleep >= 7 && sleep <= 9) {
      bodyAge -= 2
      factors.push('✓ Optimal sleep duration')
    } else if (sleep < 6) {
      bodyAge += 4
      factors.push('✗ Sleep deprivation')
    } else {
      bodyAge += 1
      factors.push('○ Suboptimal sleep')
    }

    // Stress Level
    if (stressLevel === 'low') {
      bodyAge -= 3
      factors.push('✓ Low stress levels')
    } else if (stressLevel === 'high') {
      bodyAge += 5
      factors.push('✗ High stress levels')
    } else {
      factors.push('○ Moderate stress')
    }

    // Chronic Conditions
    if (chronicConditions) {
      bodyAge += 4
      factors.push('✗ Chronic health conditions')
    }

    const difference = bodyAge - parseInt(actualAge)
    setResult({ bodyAge, difference, factors })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="age">Actual Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter age"
            value={actualAge}
            onChange={(e) => setActualAge(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rhr">Resting Heart Rate (bpm)</Label>
          <Input
            id="rhr"
            type="number"
            placeholder="e.g., 70"
            value={restingHR}
            onChange={(e) => setRestingHR(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise">Exercise (days/week)</Label>
          <Select value={exerciseFrequency} onValueChange={(value: any) => setExerciseFrequency(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Never</SelectItem>
              <SelectItem value="1-2">1-2 days</SelectItem>
              <SelectItem value="3-4">3-4 days</SelectItem>
              <SelectItem value="5+">5+ days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="smoking">Smoking Status</Label>
          <Select value={smokingStatus} onValueChange={(value: any) => setSmokingStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never Smoked</SelectItem>
              <SelectItem value="former">Former Smoker</SelectItem>
              <SelectItem value="current">Current Smoker</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sleep">Sleep Hours/Night</Label>
          <Input
            id="sleep"
            type="number"
            step="0.5"
            placeholder="e.g., 7.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stress">Stress Level</Label>
          <Select value={stressLevel} onValueChange={(value: any) => setStressLevel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="chronic"
          checked={chronicConditions}
          onCheckedChange={(checked) => setChronicConditions(checked as boolean)}
        />
        <Label htmlFor="chronic" className="cursor-pointer">
          I have chronic health conditions (diabetes, hypertension, etc.)
        </Label>
      </div>

      <Button onClick={calculateBodyAge} className="w-full">
        Calculate Body Age
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className={`${result.difference <= 0 ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200' : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.difference <= 0 ? <TrendingDown className="h-5 w-5 text-green-600" /> : <TrendingUp className="h-5 w-5 text-orange-600" />}
                Your Biological Age
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${result.difference <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.bodyAge}
                </div>
                <p className="text-muted-foreground">years old</p>
                {result.difference !== 0 && (
                  <div className="mt-4 text-lg">
                    {result.difference < 0 ? (
                      <span className="text-green-600 font-semibold">
                        {Math.abs(result.difference)} years younger than your actual age!
                      </span>
                    ) : (
                      <span className="text-orange-600 font-semibold">
                        {result.difference} years older than your actual age
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Contributing Factors:
                </h4>
                <div className="space-y-2">
                  {result.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        factor.startsWith('✓')
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : factor.startsWith('✗')
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm">
                <strong>How to Improve Your Biological Age:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Exercise regularly (aim for 150 min/week of moderate activity)</li>
                <li>Prioritize 7-9 hours of quality sleep each night</li>
                <li>Manage stress through meditation, yoga, or hobbies</li>
                <li>Quit smoking and limit alcohol consumption</li>
                <li>Maintain a healthy diet rich in fruits, vegetables, and whole grains</li>
                <li>Stay socially connected and mentally active</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
