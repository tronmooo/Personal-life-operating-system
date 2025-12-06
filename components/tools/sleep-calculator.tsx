'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SleepCalculator() {
  const [wakeTime, setWakeTime] = useState('')
  const [bedTimes, setBedTimes] = useState<string[]>([])
  const [sleepTime, setSleepTime] = useState('')
  const [wakeTimes, setWakeTimes] = useState<string[]>([])

  const SLEEP_CYCLE = 90 // minutes
  const FALL_ASLEEP_TIME = 14 // minutes to fall asleep

  const calculateBedTimes = () => {
    if (!wakeTime) return

    const [hours, minutes] = wakeTime.split(':').map(Number)
    const wakeDate = new Date()
    wakeDate.setHours(hours, minutes, 0, 0)

    const times: string[] = []

    // Calculate for 4, 5, 6 sleep cycles (6h, 7.5h, 9h)
    for (let cycles = 4; cycles <= 6; cycles++) {
      const totalMinutes = cycles * SLEEP_CYCLE + FALL_ASLEEP_TIME
      const bedDate = new Date(wakeDate.getTime() - totalMinutes * 60000)
      
      times.push(
        bedDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }

    setBedTimes(times.reverse())
  }

  const calculateWakeTimes = () => {
    if (!sleepTime) return

    const [hours, minutes] = sleepTime.split(':').map(Number)
    const sleepDate = new Date()
    sleepDate.setHours(hours, minutes, 0, 0)
    sleepDate.setMinutes(sleepDate.getMinutes() + FALL_ASLEEP_TIME)

    const times: string[] = []

    // Calculate for 4, 5, 6 sleep cycles
    for (let cycles = 4; cycles <= 6; cycles++) {
      const totalMinutes = cycles * SLEEP_CYCLE
      const wakeDate = new Date(sleepDate.getTime() + totalMinutes * 60000)
      
      times.push(
        wakeDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }

    setWakeTimes(times)
  }

  const getCycleHours = (cycles: number) => {
    return (cycles * SLEEP_CYCLE) / 60
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-6 w-6 text-indigo-500" />
            Sleep Calculator
          </CardTitle>
          <CardDescription>
            Calculate optimal sleep and wake times based on 90-minute sleep cycles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wake Time Calculator */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">When to Go to Bed</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium whitespace-nowrap">
                  I need to wake up at:
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                />
                <Button onClick={calculateBedTimes}>
                  <Clock className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </div>

              {bedTimes.length > 0 && (
                <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <p className="text-sm font-medium mb-3">You should go to bed at one of these times:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {bedTimes.map((time, index) => (
                      <div
                        key={index}
                        className="p-3 bg-background rounded-lg text-center border border-border"
                      >
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {time}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {getCycleHours(6 - index)} hours ({6 - index} cycles)
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Times include {FALL_ASLEEP_TIME} minutes to fall asleep
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Sleep Time Calculator */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold">When to Wake Up</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium whitespace-nowrap">
                    I'm going to bed at:
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                  <Button onClick={calculateWakeTimes}>
                    <Clock className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </div>

                {wakeTimes.length > 0 && (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm font-medium mb-3">You should wake up at one of these times:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {wakeTimes.map((time, index) => (
                        <div
                          key={index}
                          className="p-3 bg-background rounded-lg text-center border border-border"
                        >
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {time}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {getCycleHours(4 + index)} hours ({4 + index} cycles)
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Times include {FALL_ASLEEP_TIME} minutes to fall asleep
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Understanding Sleep Cycles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>What is a sleep cycle?</strong>
            <p className="text-muted-foreground mt-1">
              Sleep occurs in cycles of approximately 90 minutes. Each cycle includes light sleep, deep sleep, and REM sleep.
            </p>
          </div>
          <div>
            <strong>Why 90-minute cycles?</strong>
            <p className="text-muted-foreground mt-1">
              Waking up at the end of a cycle (not in the middle) helps you feel more refreshed and energized.
            </p>
          </div>
          <div>
            <strong>Recommended sleep:</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
              <li>Adults: 4-6 cycles (6-9 hours)</li>
              <li>Teenagers: 5-6 cycles (7.5-9 hours)</li>
              <li>Optimal for most adults: 5 cycles (7.5 hours)</li>
            </ul>
          </div>
          <div>
            <strong>Sleep hygiene tips:</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
              <li>Maintain a consistent sleep schedule</li>
              <li>Avoid screens 1 hour before bed</li>
              <li>Keep bedroom cool (60-67°F)</li>
              <li>Avoid caffeine after 2 PM</li>
              <li>Exercise regularly, but not close to bedtime</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







