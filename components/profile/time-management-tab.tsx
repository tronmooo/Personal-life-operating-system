'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Plus, Trash2, Clock, Timer, Calendar, TrendingUp, Target, Play, Pause, Square, AlertCircle } from 'lucide-react'

type TimeEntry = {
  id: string
  activity: string
  category: string
  startTime: string
  endTime?: string
  duration: number // minutes
  date: string
  notes: string
}

type TimeGoal = {
  id: string
  category: string
  targetHoursPerWeek: number
  currentHoursThisWeek: number
  color: string
}

type PomodoroSession = {
  id: string
  task: string
  sessions: number // 25 min sessions
  breaks: number // 5 min breaks
  date: string
  completed: boolean
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Work': '#3b82f6',
  'Learning': '#8b5cf6',
  'Health': '#10b981',
  'Social': '#ec4899',
  'Entertainment': '#f59e0b',
  'Personal': '#06b6d4',
  'Sleep': '#6366f1',
  'Commute': '#94a3b8',
  'Other': '#64748b'
}

export function TimeManagementTab() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: '1', activity: 'Software Development', category: 'Work', startTime: '09:00', endTime: '12:00', duration: 180, date: '2025-10-20', notes: 'Built new features' },
    { id: '2', activity: 'React Course', category: 'Learning', startTime: '14:00', endTime: '16:00', duration: 120, date: '2025-10-20', notes: 'Learned hooks patterns' },
    { id: '3', activity: 'Gym Workout', category: 'Health', startTime: '18:00', endTime: '19:30', duration: 90, date: '2025-10-20', notes: 'Strength training' },
    { id: '4', activity: 'Code Review', category: 'Work', startTime: '10:00', endTime: '11:30', duration: 90, date: '2025-10-19', notes: 'Reviewed PRs' },
    { id: '5', activity: 'Reading Tech Articles', category: 'Learning', startTime: '20:00', endTime: '21:00', duration: 60, date: '2025-10-19', notes: 'Performance optimization' },
  ])

  const [timeGoals, setTimeGoals] = useState<TimeGoal[]>([
    { id: '1', category: 'Work', targetHoursPerWeek: 40, currentHoursThisWeek: 32.5, color: '#3b82f6' },
    { id: '2', category: 'Learning', targetHoursPerWeek: 10, currentHoursThisWeek: 8, color: '#8b5cf6' },
    { id: '3', category: 'Health', targetHoursPerWeek: 7, currentHoursThisWeek: 5.5, color: '#10b981' },
    { id: '4', category: 'Social', targetHoursPerWeek: 5, currentHoursThisWeek: 3, color: '#ec4899' }
  ])

  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([
    { id: '1', task: 'Write Documentation', sessions: 4, breaks: 3, date: '2025-10-20', completed: true },
    { id: '2', task: 'Study Algorithms', sessions: 6, breaks: 5, date: '2025-10-19', completed: true }
  ])

  const [addEntryOpen, setAddEntryOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [pomodoroOpen, setPomodoroOpen] = useState(false)

  const [currentTimer, setCurrentTimer] = useState<{ isRunning: boolean; seconds: number; activity: string; category: string } | null>(null)

  const [newEntry, setNewEntry] = useState<Partial<TimeEntry>>({
    activity: '',
    category: 'Work',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [newGoal, setNewGoal] = useState<Partial<TimeGoal>>({
    category: '',
    targetHoursPerWeek: 10,
    currentHoursThisWeek: 0,
    color: '#3b82f6'
  })

  const [pomodoroTask, setPomodoroTask] = useState('')
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25)
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0)

  // Calculate stats
  const thisWeekEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return entryDate >= weekAgo
  })

  const totalHoursThisWeek = thisWeekEntries.reduce((sum, entry) => sum + entry.duration / 60, 0)
  const todayEntries = timeEntries.filter(entry => entry.date === new Date().toISOString().split('T')[0])
  const hoursToday = todayEntries.reduce((sum, entry) => sum + entry.duration / 60, 0)

  const categoryDistribution = Object.keys(CATEGORY_COLORS).map(category => {
    const categoryEntries = thisWeekEntries.filter(entry => entry.category === category)
    const hours = categoryEntries.reduce((sum, entry) => sum + entry.duration / 60, 0)
    return { category, hours, fill: CATEGORY_COLORS[category] }
  }).filter(item => item.hours > 0)

  const dailyTimeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayEntries = timeEntries.filter(entry => entry.date === dateStr)
    const hours = dayEntries.reduce((sum, entry) => sum + entry.duration / 60, 0)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: parseFloat(hours.toFixed(1))
    }
  })

  const weeklyTrendData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= weekStart && entryDate < weekEnd
    })
    const hours = weekEntries.reduce((sum, entry) => sum + entry.duration / 60, 0)
    return {
      week: `Week ${4 - i}`,
      hours: parseFloat(hours.toFixed(1))
    }
  }).reverse()

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return endMinutes - startMinutes
  }

  const addTimeEntry = () => {
    if (!newEntry.activity || !newEntry.startTime || !newEntry.endTime) return
    const duration = calculateDuration(newEntry.startTime, newEntry.endTime)
    if (duration <= 0) {
      alert('End time must be after start time')
      return
    }

    const entry: TimeEntry = {
      id: Date.now().toString(),
      activity: newEntry.activity,
      category: newEntry.category || 'Other',
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      duration,
      date: newEntry.date || new Date().toISOString().split('T')[0],
      notes: newEntry.notes || ''
    }
    setTimeEntries([entry, ...timeEntries])
    setNewEntry({ activity: '', category: 'Work', startTime: '', endTime: '', date: new Date().toISOString().split('T')[0], notes: '' })
    setAddEntryOpen(false)
  }

  const addTimeGoal = () => {
    if (!newGoal.category) return
    const goal: TimeGoal = {
      id: Date.now().toString(),
      category: newGoal.category,
      targetHoursPerWeek: newGoal.targetHoursPerWeek || 10,
      currentHoursThisWeek: 0,
      color: newGoal.color || '#3b82f6'
    }
    setTimeGoals([...timeGoals, goal])
    setNewGoal({ category: '', targetHoursPerWeek: 10, currentHoursThisWeek: 0, color: '#3b82f6' })
    setAddGoalOpen(false)
  }

  const startPomodoro = () => {
    if (!pomodoroTask) return
    setPomodoroRunning(true)
    // In a real app, implement timer logic here
  }

  const pausePomodoro = () => {
    setPomodoroRunning(false)
  }

  const stopPomodoro = () => {
    setPomodoroRunning(false)
    setPomodoroTimeLeft(pomodoroMinutes * 60)
    if (pomodoroTask) {
      const session: PomodoroSession = {
        id: Date.now().toString(),
        task: pomodoroTask,
        sessions: pomodoroSessionCount,
        breaks: pomodoroSessionCount - 1,
        date: new Date().toISOString().split('T')[0],
        completed: true
      }
      setPomodoroSessions([session, ...pomodoroSessions])
      setPomodoroTask('')
      setPomodoroSessionCount(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Time Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Today</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{hoursToday.toFixed(1)}h</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{todayEntries.length} activities</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">This Week</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalHoursThisWeek.toFixed(1)}h</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{thisWeekEntries.length} entries</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Goals</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{timeGoals.length}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Active tracking</p>
              </div>
              <Target className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Pomodoros</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{pomodoroSessions.length}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Sessions completed</p>
              </div>
              <Timer className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution (This Week)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.category}: ${entry.hours.toFixed(1)}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTimeData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>4-Week Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrendData}>
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={() => setAddEntryOpen(true)} className="h-20 bg-blue-600 hover:bg-blue-700 text-lg">
          <Plus className="w-6 h-6 mr-2" /> Log Time Entry
        </Button>
        <Button onClick={() => setPomodoroOpen(true)} className="h-20 bg-orange-600 hover:bg-orange-700 text-lg">
          <Timer className="w-6 h-6 mr-2" /> Start Pomodoro
        </Button>
        <Button onClick={() => setAddGoalOpen(true)} className="h-20 bg-green-600 hover:bg-green-700 text-lg">
          <Target className="w-6 h-6 mr-2" /> Add Time Goal
        </Button>
      </div>

      {/* Time Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Time Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeGoals.map((goal) => {
            const progress = (goal.currentHoursThisWeek / goal.targetHoursPerWeek) * 100
            const categoryHours = thisWeekEntries
              .filter(entry => entry.category === goal.category)
              .reduce((sum, entry) => sum + entry.duration / 60, 0)
            const actualProgress = (categoryHours / goal.targetHoursPerWeek) * 100

            return (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: goal.color }}></div>
                      <h3 className="font-bold text-lg">{goal.category}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryHours.toFixed(1)} / {goal.targetHoursPerWeek} hours this week
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setTimeGoals(timeGoals.filter(g => g.id !== goal.id))}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-bold">{actualProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(actualProgress, 100)} className="h-3" style={{ backgroundColor: '#e5e7eb' }} />
                  {actualProgress >= 100 && (
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">Goal achieved!</span>
                    </div>
                  )}
                  {actualProgress < 50 && (
                    <div className="flex items-center gap-1 text-orange-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Need {(goal.targetHoursPerWeek - categoryHours).toFixed(1)}h more to reach goal</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Time Entries</CardTitle>
          <Button onClick={() => setAddEntryOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="w-2 h-12 rounded" style={{ backgroundColor: CATEGORY_COLORS[entry.category] || '#64748b' }}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{entry.activity}</h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">{entry.category}</span>
                    <span>{entry.startTime} - {entry.endTime}</span>
                    <span className="font-semibold">{(entry.duration / 60).toFixed(1)}h</span>
                  </div>
                  {entry.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setTimeEntries(timeEntries.filter(e => e.id !== entry.id))}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Pomodoro Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pomodoroSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold">{session.task}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPomodoroSessions(pomodoroSessions.filter(s => s.id !== session.id))}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Timer className="w-4 h-4 text-orange-600" />
                    <span>{session.sessions} sessions</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {session.sessions * 25} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Time Entry Dialog */}
      <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Log Time Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Activity *</Label>
              <Input value={newEntry.activity} onChange={(e) => setNewEntry({ ...newEntry, activity: e.target.value })} placeholder="What did you work on?" />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
              >
                {Object.keys(CATEGORY_COLORS).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input type="time" value={newEntry.startTime} onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })} />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input type="time" value={newEntry.endTime} onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={newEntry.notes} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEntryOpen(false)}>Cancel</Button>
            <Button onClick={addTimeEntry} className="bg-blue-600 hover:bg-blue-700">Log Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Time Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Category *</Label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
              >
                <option value="">Select category</option>
                {Object.keys(CATEGORY_COLORS).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Target Hours Per Week</Label>
              <Input type="number" value={newGoal.targetHoursPerWeek} onChange={(e) => setNewGoal({ ...newGoal, targetHoursPerWeek: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.values(CATEGORY_COLORS).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewGoal({ ...newGoal, color })}
                    className={`w-8 h-8 rounded border-2 ${newGoal.color === color ? 'border-black dark:border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>Cancel</Button>
            <Button onClick={addTimeGoal} className="bg-green-600 hover:bg-green-700">Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pomodoro Timer Dialog */}
      <Dialog open={pomodoroOpen} onOpenChange={setPomodoroOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Pomodoro Timer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Task</Label>
              <Input value={pomodoroTask} onChange={(e) => setPomodoroTask(e.target.value)} placeholder="What are you working on?" />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={pomodoroMinutes} onChange={(e) => setPomodoroMinutes(parseInt(e.target.value))} />
            </div>
            <div className="text-center py-8">
              <div className="text-6xl font-bold mb-4">
                {Math.floor(pomodoroTimeLeft / 60)}:{(pomodoroTimeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center justify-center gap-3">
                {!pomodoroRunning ? (
                  <Button onClick={startPomodoro} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-5 h-5 mr-2" /> Start
                  </Button>
                ) : (
                  <Button onClick={pausePomodoro} className="bg-orange-600 hover:bg-orange-700">
                    <Pause className="w-5 h-5 mr-2" /> Pause
                  </Button>
                )}
                <Button onClick={stopPomodoro} variant="outline">
                  <Square className="w-5 h-5 mr-2" /> Stop
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Sessions completed: {pomodoroSessionCount}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



