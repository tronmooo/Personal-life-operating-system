'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Cake } from 'lucide-react'

export function AgeCalculator() {
  const [birthDate, setBirthDate] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [result, setResult] = useState<{
    years: number
    months: number
    days: number
    totalDays: number
    totalMonths: number
    totalWeeks: number
    nextBirthday: string
    daysUntilBirthday: number
  } | null>(null)

  const calculateAge = () => {
    if (!birthDate) return

    const birth = new Date(birthDate)
    const target = new Date(targetDate)

    // Calculate exact age
    let years = target.getFullYear() - birth.getFullYear()
    let months = target.getMonth() - birth.getMonth()
    let days = target.getDate() - birth.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    // Total values
    const totalDays = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
    const totalMonths = years * 12 + months
    const totalWeeks = Math.floor(totalDays / 7)

    // Next birthday
    let nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday < target) {
      nextBirthday = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate())
    }
    const daysUntilBirthday = Math.floor((nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

    setResult({
      years,
      months,
      days,
      totalDays,
      totalMonths,
      totalWeeks,
      nextBirthday: nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      daysUntilBirthday
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birth">Date of Birth</Label>
          <Input
            id="birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Calculate Age On</Label>
          <Input
            id="target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculateAge} className="w-full">
        <Calendar className="mr-2 h-4 w-4" />
        Calculate Age
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5" />
                Your Age
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-600 mb-2">
                  {result.years}
                </div>
                <p className="text-muted-foreground">Years Old</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.years} years, {result.months} months, {result.days} days
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.totalMonths}</div>
                  <p className="text-xs text-muted-foreground">Total Months</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.totalWeeks}</div>
                  <p className="text-xs text-muted-foreground">Total Weeks</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.totalDays}</div>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Birthday</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">{result.nextBirthday}</p>
                <p className="text-3xl font-bold text-pink-600">{result.daysUntilBirthday} days</p>
                <p className="text-sm text-muted-foreground">until you turn {result.years + 1}!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
