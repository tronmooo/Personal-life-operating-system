'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

export function CalendarOptimizer() {
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{
    type: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }> | null>(null)

  const analyzeCalendar = () => {
    setAnalyzing(true)

    // Simulate AI analysis
    setTimeout(() => {
      setSuggestions([
        {
          type: 'Focus Time',
          title: 'Block 2 hours daily for deep work',
          description: 'Schedule uninterrupted focus blocks between 9-11 AM when productivity peaks',
          impact: 'high'
        },
        {
          type: 'Meeting Consolidation',
          title: 'Consolidate meetings to Tue/Thu',
          description: 'Group all meetings on specific days to preserve full days for focused work',
          impact: 'high'
        },
        {
          type: 'Break Scheduling',
          title: 'Add 15-min breaks between meetings',
          description: 'Prevent back-to-back meetings to reduce fatigue and improve focus',
          impact: 'medium'
        },
        {
          type: 'Time Blocking',
          title: 'Block time for email/Slack',
          description: 'Dedicate specific times (10 AM, 2 PM, 4 PM) for communication instead of constant checking',
          impact: 'medium'
        },
        {
          type: 'Energy Management',
          title: 'Schedule creative work in mornings',
          description: 'Move creative/strategic tasks to morning hours when energy is highest',
          impact: 'low'
        }
      ])
      setAnalyzing(false)
    }, 2000)
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            AI Calendar Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Analyze your calendar and get AI-powered suggestions to optimize your schedule for maximum productivity.
          </p>

          <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-semibold">Focus Time</p>
              <p className="text-xs text-muted-foreground">Blocking</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-semibold">Meeting</p>
              <p className="text-xs text-muted-foreground">Consolidation</p>
            </div>
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-semibold">Energy</p>
              <p className="text-xs text-muted-foreground">Management</p>
            </div>
          </div>

          <Button
            onClick={analyzeCalendar}
            className="w-full"
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing Calendar...' : 'Analyze My Calendar'}
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">AI Recommendations</h3>
          {suggestions.map((suggestion, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{suggestion.type}</p>
                  </div>
                  <Badge className={impactColors[suggestion.impact]}>
                    {suggestion.impact} impact
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{suggestion.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
