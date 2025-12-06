'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Gift, Heart, Users, Plus, Cake } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SpecialDay {
  id: string
  type: 'birthday' | 'anniversary' | 'other'
  name: string
  person: string
  date: string // MM-DD format
  year?: number // Optional for anniversaries
  notes?: string
}

export function SpecialDaysTracker() {
  const [specialDays] = useState<SpecialDay[]>([
    { id: '1', type: 'birthday', name: "Mom's Birthday", person: 'Mom', date: '10-15', notes: 'Loves flowers' },
    { id: '2', type: 'anniversary', name: 'Wedding Anniversary', person: 'Us', date: '06-20', year: 2015 },
    { id: '3', type: 'birthday', name: "Dad's Birthday", person: 'Dad', date: '03-08' },
    { id: '4', type: 'birthday', name: "Sister's Birthday", person: 'Sarah', date: '11-22' },
    { id: '5', type: 'other', name: 'First Date Anniversary', person: 'Us', date: '04-14', year: 2014 },
  ])
  const [showAll, setShowAll] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  // Calculate days until each event
  const today = new Date()
  const currentYear = today.getFullYear()
  
  const daysWithCountdown = specialDays.map(day => {
    const [month, date] = day.date.split('-').map(Number)
    const thisYearDate = new Date(currentYear, month - 1, date)
    const nextYearDate = new Date(currentYear + 1, month - 1, date)
    
    let targetDate = thisYearDate
    if (thisYearDate < today) {
      targetDate = nextYearDate
    }
    
    const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate age/years if applicable
    let ageYears: number | undefined
    if (day.year) {
      ageYears = currentYear - day.year + (thisYearDate < today ? 1 : 0)
    }
    
    return {
      ...day,
      daysUntil,
      targetDate,
      ageYears
    }
  }).sort((a, b) => a.daysUntil - b.daysUntil)

  const upcoming = daysWithCountdown.filter(d => d.daysUntil <= 30)
  const displayDays = showAll ? daysWithCountdown : upcoming.slice(0, 4)

  const getIcon = (type: SpecialDay['type']) => {
    switch (type) {
      case 'birthday': return Cake
      case 'anniversary': return Heart
      case 'other': return Gift
    }
  }

  const getColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    if (daysUntil <= 7) return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
    if (daysUntil <= 14) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
  }

  const getDaysText = (daysUntil: number) => {
    if (daysUntil === 0) return 'TODAY! 🎉'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `${daysUntil} days`
    return `${daysUntil} days`
  }

  return (
    <>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowAll(!showAll)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Special Days
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              {upcoming.length} upcoming
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayDays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No special days tracked yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={(e) => {
                  e.stopPropagation()
                  setAddOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Special Day
              </Button>
            </div>
          ) : (
            <>
              {displayDays.map(day => {
                const Icon = getIcon(day.type)
                return (
                  <div 
                    key={day.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getColor(day.daysUntil)}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{day.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{day.person}</span>
                          {day.ageYears && (
                            <>
                              <span>•</span>
                              <span>{day.type === 'birthday' ? `Turning ${day.ageYears}` : `${day.ageYears} years`}</span>
                            </>
                          )}
                        </div>
                        {day.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{day.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className={`text-sm font-bold ${day.daysUntil === 0 ? 'text-purple-600' : day.daysUntil <= 7 ? 'text-red-600' : 'text-blue-600'}`}>
                        {getDaysText(day.daysUntil)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {day.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              
              {!showAll && daysWithCountdown.length > 4 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAll(true)
                  }}
                >
                  View All {daysWithCountdown.length} Special Days
                </Button>
              )}

              {showAll && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAll(false)
                  }}
                >
                  Show Less
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Special Day Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Special Day</DialogTitle>
            <DialogDescription>
              Track birthdays, anniversaries, and other important dates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input placeholder="e.g., Mom's Birthday" />
            </div>
            <div className="space-y-2">
              <Label>Person</Label>
              <Input placeholder="e.g., Mom, Us, Friend Name" />
            </div>
            <div className="space-y-2">
              <Label>Date (MM-DD)</Label>
              <Input type="text" placeholder="10-15" />
            </div>
            <div className="space-y-2">
              <Label>Year (Optional)</Label>
              <Input type="number" placeholder="Birth year or start year" />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="Gift ideas, preferences, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddOpen(false)}>Add Special Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}








