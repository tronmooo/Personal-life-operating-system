'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Heart, Activity } from 'lucide-react'

export function HeartRateZones() {
  const [age, setAge] = useState<string>('')
  const [restingHR, setRestingHR] = useState<string>('')
  const [result, setResult] = useState<any>(null)

  const calculateZones = () => {
    const userAge = parseFloat(age) || 30
    const resting = parseFloat(restingHR) || 60
    
    // Maximum heart rate (220 - age)
    const maxHR = 220 - userAge
    
    // Heart Rate Reserve (HRR) = Max HR - Resting HR
    const hrr = maxHR - resting

    // Karvonen Formula: Target HR = ((HRR × %Intensity) + Resting HR)
    const zones = [
      {
        name: 'Zone 1: Recovery',
        description: 'Very light activity, warm-up, cool-down',
        color: 'bg-blue-500',
        intensity: '50-60%',
        min: Math.round(hrr * 0.50 + resting),
        max: Math.round(hrr * 0.60 + resting),
        benefits: 'Recovery, building base fitness'
      },
      {
        name: 'Zone 2: Aerobic',
        description: 'Light to moderate activity, fat burning',
        color: 'bg-green-500',
        intensity: '60-70%',
        min: Math.round(hrr * 0.60 + resting),
        max: Math.round(hrr * 0.70 + resting),
        benefits: 'Fat burning, endurance building'
      },
      {
        name: 'Zone 3: Tempo',
        description: 'Moderate to hard activity',
        color: 'bg-yellow-500',
        intensity: '70-80%',
        min: Math.round(hrr * 0.70 + resting),
        max: Math.round(hrr * 0.80 + resting),
        benefits: 'Improved aerobic capacity'
      },
      {
        name: 'Zone 4: Threshold',
        description: 'Hard activity, lactate threshold',
        color: 'bg-orange-500',
        intensity: '80-90%',
        min: Math.round(hrr * 0.80 + resting),
        max: Math.round(hrr * 0.90 + resting),
        benefits: 'Increased performance, speed'
      },
      {
        name: 'Zone 5: Maximum',
        description: 'Maximum effort, anaerobic',
        color: 'bg-red-500',
        intensity: '90-100%',
        min: Math.round(hrr * 0.90 + resting),
        max: maxHR,
        benefits: 'Peak performance, power'
      }
    ]

    setResult({ maxHR, hrr, resting, zones })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Heart Rate Training Zones
        </h1>
        <p className="text-muted-foreground mt-2">
          Calculate your personalized heart rate zones for optimal training
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Enter your age and resting heart rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
              />
            </div>

            <div>
              <Label htmlFor="resting">Resting Heart Rate (bpm)</Label>
              <Input
                id="resting"
                type="number"
                value={restingHR}
                onChange={(e) => setRestingHR(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Measure first thing in the morning before getting out of bed
              </p>
            </div>

            <Button onClick={calculateZones} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Calculate Zones
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        {result && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle>Your Heart Rate Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                <span className="font-medium">Resting HR</span>
                <span className="text-2xl font-bold">{result.resting} bpm</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                <span className="font-medium">Maximum HR</span>
                <span className="text-2xl font-bold text-red-600">{result.maxHR} bpm</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                <span className="font-medium">HR Reserve</span>
                <span className="text-2xl font-bold">{result.hrr} bpm</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Training Zones */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Training Zones</h2>
          {result.zones.map((zone: any, index: number) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`h-4 w-4 rounded-full ${zone.color}`} />
                      <h3 className="font-semibold text-lg">{zone.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{zone.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{zone.min}-{zone.max}</div>
                    <div className="text-sm text-muted-foreground">bpm</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Intensity: {zone.intensity}</span>
                    <span className="text-muted-foreground">{zone.benefits}</span>
                  </div>
                  <Progress 
                    value={((zone.min - result.resting) / result.hrr) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!result && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your information to calculate your personalized heart rate zones</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

