'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Plus, Trash2, Calendar, AlertCircle, Bell } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface Deadline {
  id: string
  title: string
  date: string
  category: string
  priority: 'high' | 'medium' | 'low'
  daysUntil: number
  notes?: string
}

export function DeadlineTracker() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    date: '',
    category: 'personal',
    notes: ''
  })

  const { requestAI } = useAITool()

  useEffect(() => {
    // Calculate days until for each deadline
    const updated = deadlines.map(d => ({
      ...d,
      daysUntil: Math.ceil((new Date(d.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    setDeadlines(updated)
  }, [])

  const analyzePriority = async (title: string, date: string, category: string) => {
    try {
      const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      const prompt = `Analyze this deadline and assign a priority (high/medium/low):

Title: ${title}
Category: ${category}
Days Until: ${daysUntil}

Consider:
- Time urgency
- Category importance
- Typical consequences of missing

Return ONLY one word: high, medium, or low`

      const result = await requestAI(prompt, {
        systemPrompt: 'You are a productivity expert. Assess deadline priorities objectively.',
        temperature: 0.3
      })

      const priority = result.content.toLowerCase().trim()
      return ['high', 'medium', 'low'].includes(priority) ? priority as 'high' | 'medium' | 'low' : 'medium'
    } catch {
      return 'medium' as const
    }
  }

  const addDeadline = async () => {
    if (!newDeadline.title || !newDeadline.date) return

    const priority = await analyzePriority(newDeadline.title, newDeadline.date, newDeadline.category)
    const daysUntil = Math.ceil((new Date(newDeadline.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const deadline: Deadline = {
      id: Date.now().toString(),
      title: newDeadline.title,
      date: newDeadline.date,
      category: newDeadline.category,
      priority,
      daysUntil,
      notes: newDeadline.notes
    }

    setDeadlines([...deadlines, deadline].sort((a, b) => a.daysUntil - b.daysUntil))
    setNewDeadline({ title: '', date: '', category: 'personal', notes: '' })
  }

  const removeDeadline = (id: string) => {
    setDeadlines(deadlines.filter(d => d.id !== id))
  }

  const getPriorityColor = (priority: string, daysUntil: number) => {
    if (daysUntil < 0) return 'bg-gray-500'
    if (daysUntil <= 3 || priority === 'high') return 'bg-red-500'
    if (daysUntil <= 7 || priority === 'medium') return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const upcomingDeadlines = deadlines.filter(d => d.daysUntil >= 0)
  const pastDeadlines = deadlines.filter(d => d.daysUntil < 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Deadline Tracker Pro
          </CardTitle>
          <CardDescription>
            Track deadlines across multiple categories with AI-powered priority assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Deadline Title</Label>
              <Input 
                placeholder="e.g. Submit tax return"
                value={newDeadline.title}
                onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={newDeadline.date}
                  onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newDeadline.category} onValueChange={(val) => setNewDeadline({ ...newDeadline, category: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="taxes">Taxes</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input 
                placeholder="Additional details..."
                value={newDeadline.notes}
                onChange={(e) => setNewDeadline({ ...newDeadline, notes: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addDeadline} disabled={!newDeadline.title || !newDeadline.date} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Deadline
          </Button>
        </CardContent>
      </Card>

      {upcomingDeadlines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
          {upcomingDeadlines.map((deadline) => (
            <Card key={deadline.id} className={`border-l-4 ${
              deadline.daysUntil <= 3 ? 'border-l-red-500' :
              deadline.daysUntil <= 7 ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{deadline.title}</h4>
                      <Badge className={getPriorityColor(deadline.priority, deadline.daysUntil)}>
                        {deadline.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{deadline.category}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(deadline.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {deadline.daysUntil === 0 ? 'Today!' : 
                         deadline.daysUntil === 1 ? 'Tomorrow' :
                         `${deadline.daysUntil} days`}
                      </div>
                    </div>
                    
                    {deadline.notes && (
                      <p className="text-sm text-muted-foreground">{deadline.notes}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeadline(deadline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pastDeadlines.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Past Deadlines</h3>
          {pastDeadlines.map((deadline) => (
            <Card key={deadline.id} className="opacity-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold line-through">{deadline.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {Math.abs(deadline.daysUntil)} days overdue
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeadline(deadline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deadlines.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No deadlines tracked yet. Add your first deadline above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}






