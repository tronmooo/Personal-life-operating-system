'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMoods } from '@/lib/hooks/use-moods'

interface MoodGraphDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoodGraphDialog({ open, onOpenChange }: MoodGraphDialogProps) {
  const [moodData, setMoodData] = useState<any[]>([])
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const { moods, add } = useMoods()

  const moodOptions = [
    { value: 1, label: '😢 Very Bad', emoji: '😢', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
    { value: 2, label: '😕 Bad', emoji: '😕', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
    { value: 3, label: '😐 Okay', emoji: '😐', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
    { value: 4, label: '😊 Good', emoji: '😊', color: 'bg-lime-100 hover:bg-lime-200 border-lime-300' },
    { value: 5, label: '😄 Great', emoji: '😄', color: 'bg-green-100 hover:bg-green-200 border-green-300' }
  ]

  // Load mood data for the last 7 days
  useEffect(() => {
    if (open) {
      const moodsByDate = moods.reduce<Record<string, { score: number; loggedAt: number }>>((acc, entry) => {
        const dateStr = format(new Date(entry.logged_at), 'yyyy-MM-dd')
        const loggedAt = new Date(entry.logged_at).getTime()
        const existing = acc[dateStr]
        if (!existing || loggedAt > existing.loggedAt) {
          acc[dateStr] = { score: entry.score, loggedAt }
        }
        return acc
      }, {})

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const score = moodsByDate[dateStr]?.score ?? null

        return {
          date: format(date, 'MMM dd'),
          mood: score,
          fullDate: dateStr
        }
      })

      setMoodData(last7Days)
    }
  }, [open, moods])

  const handleMoodSelect = async (moodValue: number) => {
    setSelectedMood(moodValue)
    const moodOption = moodOptions.find(m => m.value === moodValue)

    try {
      await add({
        logged_at: new Date().toISOString(),
        score: moodValue,
        note: `Mood logged: ${moodOption?.emoji} ${moodOption?.label} (${format(new Date(), 'yyyy-MM-dd')})`,
        tags: ['mood'],
      })
    } catch (error) {
      console.error('Failed to save mood entry:', error)
    }

    setTimeout(() => {
      onOpenChange(false)
      setSelectedMood(null)
    }, 500)
  }

  const chartData = moodData.map(day => ({
    ...day,
    mood: day.mood || 0 // Show 0 for days without mood data
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            😊 Mood Tracking - Last 7 Days
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mood Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip 
                  formatter={(value: any) => [
                    value === 0 ? 'No data' : moodOptions.find(m => m.value === value)?.label || value,
                    'Mood'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Mood Selection */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Log your current mood (1-5)
            </p>

            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  size="lg"
                  className={`${mood.color} transition-all ${
                    selectedMood === mood.value ? 'ring-2 ring-offset-2' : ''
                  }`}
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs font-medium">{mood.value}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {selectedMood && (
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Mood logged successfully! 🎉
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}






















