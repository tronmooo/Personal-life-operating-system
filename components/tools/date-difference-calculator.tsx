'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'

export function DateDifferenceCalculator() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [result, setResult] = useState<{
    years: number
    months: number
    days: number
    totalDays: number
    totalWeeks: number
    totalHours: number
    totalMinutes: number
    workdays: number
  } | null>(null)

  const calculateDifference = () => {
    if (!startDate || !endDate) return

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Ensure start is before end
    const [earlier, later] = start < end ? [start, end] : [end, start]

    // Calculate difference
    let years = later.getFullYear() - earlier.getFullYear()
    let months = later.getMonth() - earlier.getMonth()
    let days = later.getDate() - earlier.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    // Total values
    const totalDays = Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.floor(totalDays / 7)
    const totalHours = totalDays * 24
    const totalMinutes = totalHours * 60

    // Calculate workdays (excluding weekends)
    let workdays = 0
    const current = new Date(earlier)
    while (current <= later) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workdays++
      }
      current.setDate(current.getDate() + 1)
    }

    setResult({
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalHours,
      totalMinutes,
      workdays
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start">Start Date</Label>
          <Input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end">End Date</Label>
          <Input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculateDifference} className="w-full">
        <Calendar className="mr-2 h-4 w-4" />
        Calculate Difference
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Time Difference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {result.years > 0 && `${result.years} ${result.years === 1 ? 'year' : 'years'}`}
                  {result.years > 0 && (result.months > 0 || result.days > 0) && ', '}
                  {result.months > 0 && `${result.months} ${result.months === 1 ? 'month' : 'months'}`}
                  {result.months > 0 && result.days > 0 && ', '}
                  {result.days > 0 && `${result.days} ${result.days === 1 ? 'day' : 'days'}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{result.totalDays.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{result.totalWeeks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Weeks</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{result.totalHours.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{result.totalMinutes.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Minutes</p>
                </div>
              </div>

              <div className="pt-4 border-t text-center">
                <div className="text-2xl font-bold text-indigo-600">{result.workdays}</div>
                <p className="text-sm text-muted-foreground">Business Days (excluding weekends)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Use Cases:</strong> Project planning, age calculation, time tracking, countdown timers, anniversary reminders, deadline management
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
