'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Coffee, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work')
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const durations = {
    work: 25,
    break: 5,
    longBreak: 15,
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            playSound()
            handleTimerComplete()
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, minutes, seconds])

  const playSound = () => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {
        // Fallback if audio fails
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      })
    }
  }

  const handleTimerComplete = () => {
    setIsActive(false)
    
    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1
      setSessionsCompleted(newSessionsCompleted)
      
      // Every 4 sessions, take a long break
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak')
        setMinutes(durations.longBreak)
      } else {
        setMode('break')
        setMinutes(durations.break)
      }
    } else {
      setMode('work')
      setMinutes(durations.work)
    }
    setSeconds(0)
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setMinutes(durations[mode])
    setSeconds(0)
  }

  const switchMode = (newMode: 'work' | 'break' | 'longBreak') => {
    setIsActive(false)
    setMode(newMode)
    setMinutes(durations[newMode])
    setSeconds(0)
  }

  const percentage = ((durations[mode] * 60 - (minutes * 60 + seconds)) / (durations[mode] * 60)) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-red-500" />
            Pomodoro Timer
          </CardTitle>
          <CardDescription>
            Boost productivity with the Pomodoro Technique: 25 min work, 5 min break
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={mode === 'work' ? 'default' : 'outline'}
              onClick={() => switchMode('work')}
              disabled={isActive}
            >
              Work ({durations.work} min)
            </Button>
            <Button
              variant={mode === 'break' ? 'default' : 'outline'}
              onClick={() => switchMode('break')}
              disabled={isActive}
            >
              Break ({durations.break} min)
            </Button>
            <Button
              variant={mode === 'longBreak' ? 'default' : 'outline'}
              onClick={() => switchMode('longBreak')}
              disabled={isActive}
            >
              Long Break ({durations.longBreak} min)
            </Button>
          </div>

          {/* Timer Display */}
          <div className="relative">
            <div className="w-64 h-64 mx-auto relative">
              {/* Progress Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - percentage / 100)}`}
                  className={
                    mode === 'work'
                      ? 'text-red-500'
                      : mode === 'break'
                      ? 'text-green-500'
                      : 'text-blue-500'
                  }
                  strokeLinecap="round"
                />
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <Badge
                  variant={mode === 'work' ? 'destructive' : 'default'}
                  className="mt-2 capitalize"
                >
                  {mode === 'longBreak' ? 'Long Break' : mode}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              onClick={toggleTimer}
              className="w-32"
            >
              {isActive ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Sessions Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Sessions Completed Today</p>
            <div className="flex gap-2 justify-center mt-2">
              {[...Array(Math.min(sessionsCompleted, 8))].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold"
                >
                  {i + 1}
                </div>
              ))}
              {sessionsCompleted > 8 && (
                <Badge variant="outline">+{sessionsCompleted - 8} more</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">How the Pomodoro Technique Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>1. Choose a task</strong> - Pick what you want to work on
          </div>
          <div>
            <strong>2. Work for 25 minutes</strong> - Focus without distractions
          </div>
          <div>
            <strong>3. Take a 5-minute break</strong> - Rest and recharge
          </div>
          <div>
            <strong>4. Repeat</strong> - After 4 sessions, take a longer 15-minute break
          </div>
          <div className="mt-3 pt-3 border-t">
            <strong>Benefits:</strong>
            <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
              <li>Improves focus and concentration</li>
              <li>Reduces burnout with regular breaks</li>
              <li>Makes large tasks feel manageable</li>
              <li>Tracks your productivity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







