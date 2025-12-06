'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Baby, Calendar, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PregnancyCalculator() {
  const [calculationType, setCalculationType] = useState<'lmp' | 'conception' | 'due-date'>('lmp')
  const [lastPeriodDate, setLastPeriodDate] = useState('')
  const [conceptionDate, setConceptionDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [result, setResult] = useState<{
    dueDate: string
    weeksPregnant: number
    daysPregnant: number
    trimester: number
    conceptionDate: string
    milestones: Array<{ week: number; milestone: string }>
  } | null>(null)

  const calculatePregnancy = () => {
    let calculatedDueDate: Date
    let calculatedConceptionDate: Date

    if (calculationType === 'lmp' && lastPeriodDate) {
      const lmp = new Date(lastPeriodDate)
      calculatedDueDate = new Date(lmp)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 280) // 40 weeks
      calculatedConceptionDate = new Date(lmp)
      calculatedConceptionDate.setDate(calculatedConceptionDate.getDate() + 14)
    } else if (calculationType === 'conception' && conceptionDate) {
      const conception = new Date(conceptionDate)
      calculatedConceptionDate = conception
      calculatedDueDate = new Date(conception)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 266) // 38 weeks
    } else if (calculationType === 'due-date' && dueDate) {
      calculatedDueDate = new Date(dueDate)
      calculatedConceptionDate = new Date(calculatedDueDate)
      calculatedConceptionDate.setDate(calculatedConceptionDate.getDate() - 266)
    } else {
      return
    }

    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - calculatedConceptionDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPregnant = Math.max(0, daysDiff)
    const weeksPregnant = Math.floor(daysPregnant / 7)

    const trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3

    const milestones = [
      { week: 4, milestone: 'Embryo implants in uterus' },
      { week: 8, milestone: 'Baby\'s heart is beating' },
      { week: 12, milestone: 'End of first trimester - reduced miscarriage risk' },
      { week: 16, milestone: 'You may start feeling baby move' },
      { week: 20, milestone: 'Anatomy scan typically scheduled' },
      { week: 24, milestone: 'Baby may survive if born premature' },
      { week: 28, milestone: 'Third trimester begins' },
      { week: 32, milestone: 'Baby practices breathing' },
      { week: 37, milestone: 'Baby is full term' },
      { week: 40, milestone: 'Due date - baby ready to be born' }
    ].filter(m => m.week >= weeksPregnant && m.week <= weeksPregnant + 4)

    setResult({
      dueDate: calculatedDueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      weeksPregnant,
      daysPregnant: daysPregnant % 7,
      trimester,
      conceptionDate: calculatedConceptionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      milestones
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="calc-type">Calculate From:</Label>
          <Select value={calculationType} onValueChange={(value: any) => setCalculationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lmp">Last Menstrual Period (LMP)</SelectItem>
              <SelectItem value="conception">Conception Date</SelectItem>
              <SelectItem value="due-date">Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {calculationType === 'lmp' && (
          <div className="space-y-2">
            <Label htmlFor="lmp">First Day of Last Period</Label>
            <Input
              id="lmp"
              type="date"
              value={lastPeriodDate}
              onChange={(e) => setLastPeriodDate(e.target.value)}
            />
          </div>
        )}

        {calculationType === 'conception' && (
          <div className="space-y-2">
            <Label htmlFor="conception">Conception Date</Label>
            <Input
              id="conception"
              type="date"
              value={conceptionDate}
              onChange={(e) => setConceptionDate(e.target.value)}
            />
          </div>
        )}

        {calculationType === 'due-date' && (
          <div className="space-y-2">
            <Label htmlFor="due">Due Date</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <Button onClick={calculatePregnancy} className="w-full">
        <Baby className="mr-2 h-4 w-4" />
        Calculate Pregnancy
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Your Pregnancy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-pink-600 mb-2">
                  {result.weeksPregnant}w {result.daysPregnant}d
                </div>
                <p className="text-muted-foreground">Weeks + Days Pregnant</p>
                <Badge variant="secondary" className="mt-2">
                  Trimester {result.trimester}
                </Badge>
              </div>

              <div className="grid gap-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Due Date:</span>
                  <span className="font-semibold">{result.dueDate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Conception Date:</span>
                  <span className="font-semibold">{result.conceptionDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-pink-600">{milestone.week}w</span>
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-sm">{milestone.milestone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm">
                <strong>Trimester Breakdown:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li><strong>First Trimester (0-13 weeks):</strong> Baby develops major organs, bones, and muscles</li>
                <li><strong>Second Trimester (14-26 weeks):</strong> Baby grows rapidly, you may feel movement</li>
                <li><strong>Third Trimester (27-40 weeks):</strong> Baby gains weight and prepares for birth</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                <strong>Note:</strong> This calculator provides estimates. Always consult your healthcare provider for accurate pregnancy dating and care.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
