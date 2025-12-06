'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  AlertTriangle, CheckCircle, Target, Heart, DollarSign, Shield, 
  TrendingUp, Zap, Plus, Book, Activity, FileText, Calendar,
  Edit3, Sparkles, Trash2, X
} from 'lucide-react'
import { AddDataDialog } from '../add-data-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format, isAfter, isBefore, differenceInDays } from 'date-fns'
import { normalizeMetadata } from '@/lib/utils/normalize-metadata'
import { extractLatestVitals, computeWeeklySleepAvg } from '@/lib/selectors/health'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MOOD_OPTIONS = [
  { emoji: '😊', value: 10, label: 'Amazing' },
  { emoji: '😄', value: 9, label: 'Happy' },
  { emoji: '😌', value: 8, label: 'Content' },
  { emoji: '😐', value: 7, label: 'Neutral' },
  { emoji: '😔', value: 6, label: 'Sad' },
  { emoji: '😢', value: 5, label: 'Very Sad' },
  { emoji: '😠', value: 4, label: 'Angry' },
  { emoji: '😰', value: 3, label: 'Anxious' },
  { emoji: '😴', value: 2, label: 'Tired' },
  { emoji: '🤒', value: 1, label: 'Unwell' }
]

export function CommandCenterFunctional() {
  const { data, tasks, habits, bills, addData, addTask, updateTask, deleteTask, addHabit, updateHabit, toggleHabit, deleteHabit } = useData()
  const [addDataOpen, setAddDataOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [moodDialogOpen, setMoodDialogOpen] = useState(false)
  
  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('⭐')
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily')
  
  const [journalTitle, setJournalTitle] = useState('')
  const [journalEntry, setJournalEntry] = useState('')
  const [journalMood, setJournalMood] = useState(7)
  const [journalEnergy, setJournalEnergy] = useState('Medium')
  const [journalGratitude, setJournalGratitude] = useState('')
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiInsight, setAiInsight] = useState('')

  // Get mood logs from mindfulness domain
  const moodLogs = useMemo(() => {
    const mindfulnessData = data.mindfulness || []
    const logs = mindfulnessData.filter(item => item.metadata?.logType === 'journal' || item.metadata?.mood)
    return logs.slice(0, 14) // Last 14 entries
  }, [data.mindfulness])

  // Get last 7 days mood for display
  const last7DaysMoods = useMemo(() => {
    const moods = moodLogs.slice(0, 7).reverse()
    while (moods.length < 7) {
      moods.unshift({ emoji: '😐', value: 7 } as any)
    }
    return moods.map(m => {
      const moodValue = m.metadata?.mood || m.metadata?.moodValue || 7
      const moodOption = MOOD_OPTIONS.find(opt => opt.value === moodValue)
      return moodOption?.emoji || '😐'
    })
  }, [moodLogs])

  // Calculate stats
  const stats = useMemo(() => {
    const domains = Object.keys(data)
    const totalItems = Object.values(data).reduce((total, domainData) => total + domainData.length, 0)
    const today = new Date().toDateString()
    const addedToday = Object.values(data).reduce((total, domainData) => {
      return total + domainData.filter(item => new Date(item.createdAt).toDateString() === today).length
    }, 0)
    
    return {
      activeDomains: domains.length,
      totalItems,
      addedToday,
    }
  }, [data])

  // Get critical alerts
  const alerts = useMemo(() => {
    const urgentAlerts: any[] = []
    
    // Check bills
    bills.forEach(bill => {
      if (bill.status !== 'paid' && bill.dueDate) {
        const daysUntilDue = differenceInDays(new Date(bill.dueDate), new Date())
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          urgentAlerts.push({
            type: 'bill',
            title: bill.title,
            daysLeft: daysUntilDue,
            priority: daysUntilDue <= 3 ? 'high' : 'medium'
          })
        }
      }
    })
    
    // Check health items with expiry
    const healthData = data.health || []
    healthData.forEach(item => {
      if (item.metadata?.expiryDate && typeof item.metadata.expiryDate === 'string') {
        const daysUntilExpiry = differenceInDays(new Date(item.metadata.expiryDate as string), new Date())
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          urgentAlerts.push({
            type: 'health',
            title: item.title,
            daysLeft: daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
          })
        }
      }

      // Check medication refill dates - CRITICAL priority within 7 days
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, new Date())
        
        // Alert for medications due within 7 days
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          const medicationName = item.metadata?.medicationName || item.metadata?.name || item.title
          urgentAlerts.push({
            type: 'medication',
            title: `💊 ${medicationName}`,
            daysLeft: daysUntilRefill,
            priority: 'high' // All medication refills within 7 days are high priority
          })
        }
      }
    })
    
    return urgentAlerts.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5)
  }, [bills, data.health])

  // Calculate domain scores
  const domainScores = useMemo(() => {
    const financial = data.financial || []
    const health = data.health || []
    const career = data.career || []
    
    const calcScore = (items: any[]) => {
      if (items.length === 0) return 0
      return Math.min(100, 30 + (items.length * 7))
    }
    
    return {
      financial: calcScore(financial),
      health: calcScore(health),
      career: calcScore(career),
    }
  }, [data])

  // Get domain stats
  const domainStats = useMemo(() => {
    const financial = data.financial || []
    const health = data.health || []
    
    // Financial stats
    const expenses = financial.filter(item => item.metadata?.type === 'expense' || item.metadata?.logType === 'expense')
    const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(String(item.metadata?.amount || '0')) || 0), 0)
    
    const income = financial.filter(item => item.metadata?.type === 'income' || item.metadata?.logType === 'income')
    const totalIncome = income.reduce((sum, item) => sum + (parseFloat(String(item.metadata?.amount || '0')) || 0), 0)
    
    // Health stats - latest vitals from unified metadata
    const latest = extractLatestVitals(health)
    const sleepAvg = computeWeeklySleepAvg(health)
    
    return {
      balance: totalIncome - totalExpenses,
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses,
      weight: latest?.weight || 0,
      steps: 0,
      heartRate: latest?.heartRate || 0,
      bloodPressure: latest?.bloodPressure || '',
      glucose: latest?.glucose || 0,
      sleepAvgLabel: sleepAvg.label,
    }
  }, [data])

  // Handle add task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    
    addTask({
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || undefined,
    })
    
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
    setAddTaskOpen(false)
  }

  // Handle add habit
  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    
    addHabit({
      name: newHabitName,
      completed: false,
      streak: 0,
      icon: newHabitIcon,
      frequency: newHabitFrequency,
    })
    
    setNewHabitName('')
    setNewHabitIcon('⭐')
    setNewHabitFrequency('daily')
    setAddHabitOpen(false)
  }

  // Handle journal entry with AI
  const handleSaveJournal = async (withAI: boolean = false) => {
    if (!journalEntry.trim()) return
    
    if (withAI) {
      setAiAnalyzing(true)
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate AI insight based on mood and entry
      const moodOption = MOOD_OPTIONS.find(m => m.value === journalMood)
      const positiveWords = ['happy', 'grateful', 'excited', 'good', 'great', 'wonderful', 'amazing', 'love', 'joy']
      const negativeWords = ['sad', 'anxious', 'worried', 'stress', 'difficult', 'hard', 'tired', 'bad']
      
      const entryLower = journalEntry.toLowerCase()
      const hasPositive = positiveWords.some(word => entryLower.includes(word))
      const hasNegative = negativeWords.some(word => entryLower.includes(word))
      
      let insight = `Your journal entry reflects a ${moodOption?.label.toLowerCase()} mood. `
      
      if (hasPositive && !hasNegative) {
        insight += "I notice positive themes in your writing - that's wonderful! Keep nurturing these positive feelings. "
      } else if (hasNegative && !hasPositive) {
        insight += "I sense some challenging emotions. Remember, it's okay to feel this way. Consider what small step might help you feel better. "
      } else {
        insight += "Your entry shows a mix of emotions, which is perfectly normal. Acknowledging all your feelings is an important part of self-awareness. "
      }
      
      if (journalGratitude.trim()) {
        insight += "Your gratitude practice is valuable - research shows it improves wellbeing over time. "
      }
      
      insight += `\n\n💡 Suggestion: ${
        journalMood <= 5 
          ? "Try a short meditation or reach out to someone you trust." 
          : "Keep up the positive momentum! Consider what made today good and how to recreate it."
      }`
      
      setAiInsight(insight)
      setAiAnalyzing(false)
    }
    
    // Save to mindfulness domain
    addData('mindfulness' as any, {
      title: journalTitle || `Journal Entry - ${format(new Date(), 'MMM d, yyyy')}`,
      description: journalEntry,
      metadata: {
        logType: 'journal',
        mood: journalMood,
        moodValue: journalMood,
        moodLabel: MOOD_OPTIONS.find(m => m.value === journalMood)?.label,
        energy: journalEnergy,
        gratitude: journalGratitude,
        date: format(new Date(), 'yyyy-MM-dd'),
        aiInsight: aiInsight || undefined,
      }
    })
    
    if (!withAI || aiInsight) {
      // Close and reset
      setJournalTitle('')
      setJournalEntry('')
      setJournalMood(7)
      setJournalEnergy('Medium')
      setJournalGratitude('')
      setAiInsight('')
      setJournalOpen(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Priority-focused life overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {stats.activeDomains} domains active
          </Badge>
          <Button onClick={() => setAddDataOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </div>
      </div>

      {/* Top Row - Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Alerts Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alerts
              </div>
              <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No urgent alerts</p>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span className="text-xs truncate max-w-[120px]">{alert.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-red-600">
                      {alert.daysLeft}d left
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAddTaskOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tasks
              </div>
              <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => updateTask(task.id, { completed: !task.completed })}
                    />
                    <span className={cn("text-xs flex-1 truncate", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                ))
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setAddTaskOpen(true)
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Habits Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAddHabitOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Habits
              </div>
              <Badge variant="secondary" className="text-xs">
                {habits.filter(h => h.completed).length}/{habits.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits yet</p>
              ) : (
                habits.slice(0, 3).map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full cursor-pointer transition-colors",
                        habit.completed ? "bg-green-500" : "bg-gray-300"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabit(habit.id)
                      }}
                    ></div>
                    <span className="text-xs flex-1 truncate">{habit.name}</span>
                    {habit.streak > 0 && (
                      <Badge variant="outline" className="text-xs">
                        🔥 {habit.streak}
                      </Badge>
                    )}
                  </div>
                ))
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setAddHabitOpen(true)
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Habit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mood Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setJournalOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-pink-500" />
              Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Last 7 days</div>
              <div className="grid grid-cols-7 gap-1 text-lg">
                {last7DaysMoods.map((emoji, idx) => (
                  <span key={idx} className="text-center">{emoji}</span>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setJournalOpen(true)
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Log Mood
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Card */}
        <Link href="/domains/health">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Health
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{domainScores.health}%</div>
                  <div className="text-xs text-muted-foreground">{(data.health || []).length} items</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Steps</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="text-lg font-bold">
                    {typeof domainStats.steps === 'number' && domainStats.steps > 0 ? `${(domainStats.steps / 1000).toFixed(1)}K` : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weight</span>
                  </div>
                  <div className="text-lg font-bold">
                    {typeof domainStats.weight === 'number' && domainStats.weight > 0 ? `${domainStats.weight} lbs` : '--'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Finance Card */}
        <Link href="/domains/financial">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Finance
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{domainScores.financial}%</div>
                  <div className="text-xs text-muted-foreground">{(data.financial || []).length} items</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Balance</span>
                  <div className="text-lg font-bold text-green-600">
                    ${domainStats.balance.toFixed(0)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Expenses</span>
                  <div className="text-lg font-bold text-red-600">
                    ${domainStats.expenses.toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Career Card */}
        <Link href="/domains/career">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Career
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{domainScores.career}%</div>
                  <div className="text-xs text-muted-foreground">{(data.career || []).length} items</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Projects</span>
                  <div className="text-lg font-bold">{(data.career || []).length}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Goals</span>
                  <div className="text-lg font-bold">{tasks.filter(t => t.category === 'career').length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Fast access to common tasks and data entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => {
                setAddDataOpen(true)
              }}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs">Log Health</span>
            </Button>
            <Button 
              onClick={() => {
                setAddDataOpen(true)
              }}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs">Add Expense</span>
            </Button>
            <Button 
              onClick={() => setAddTaskOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Add Task</span>
            </Button>
            <Button 
              onClick={() => setJournalOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-xs">Journal Entry</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Data Dialog */}
      <AddDataDialog open={addDataOpen} onClose={() => setAddDataOpen(false)} />
      
      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="What do you need to do?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Habit Dialog */}
      <Dialog open={addHabitOpen} onOpenChange={setAddHabitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
            <DialogDescription>Create a new habit to track daily</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Habit Name *</Label>
              <Input
                id="habit-name"
                placeholder="e.g., Morning workout, Read 30 min"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-icon">Icon</Label>
              <Input
                id="habit-icon"
                placeholder="Enter an emoji"
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-frequency">Frequency</Label>
              <select
                id="habit-frequency"
                value={newHabitFrequency}
                onChange={(e) => setNewHabitFrequency(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHabit} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
              <Button variant="outline" onClick={() => setAddHabitOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal Entry Dialog with AI */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Journal Entry
            </DialogTitle>
            <DialogDescription>
              Write your thoughts and let AI help you understand them
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="journal-title">Title (optional)</Label>
              <Input
                id="journal-title"
                placeholder="Give your entry a title..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-entry">Journal Entry *</Label>
              <Textarea
                id="journal-entry"
                placeholder="Write about your day, feelings, or thoughts..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal-mood">How are you feeling?</Label>
                <select
                  id="journal-mood"
                  value={journalMood}
                  onChange={(e) => setJournalMood(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md"
                >
                  {MOOD_OPTIONS.map((mood) => (
                    <option key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="journal-energy">Energy Level</Label>
                <select
                  id="journal-energy"
                  value={journalEnergy}
                  onChange={(e) => setJournalEnergy(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-gratitude">What are you grateful for today?</Label>
              <Textarea
                id="journal-gratitude"
                placeholder="List things you're grateful for..."
                value={journalGratitude}
                onChange={(e) => setJournalGratitude(e.target.value)}
                rows={2}
              />
            </div>
            
            {aiInsight && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400">AI Insights</h4>
                </div>
                <p className="text-sm whitespace-pre-line">{aiInsight}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSaveJournal(true)}
                disabled={!journalEntry.trim() || aiAnalyzing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {aiAnalyzing ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : aiInsight ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Insights & Save
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSaveJournal(false)}
                disabled={!journalEntry.trim() || aiAnalyzing}
              >
                Save Without AI
              </Button>
              <Button variant="outline" onClick={() => setJournalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}







