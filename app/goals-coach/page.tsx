'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import {
  Target, Brain, Sparkles, TrendingUp, Calendar, CheckCircle,
  Plus, Lightbulb, AlertCircle, Trophy,
  Loader2, RefreshCw, ChevronRight, Zap
} from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'
import Link from 'next/link'

interface Goal {
  id: string
  title: string
  description?: string
  domain: string
  targetValue?: number
  currentValue?: number
  progress: number
  deadline?: string
  status: 'on_track' | 'behind' | 'ahead' | 'completed'
  aiSuggestions?: string[]
  milestones?: { title: string; completed: boolean }[]
  createdAt: string
}

interface AICoachingSession {
  goalId: string
  recommendations: string[]
  actionItems: { task: string; priority: 'high' | 'medium' | 'low'; deadline?: string }[]
  insights: string
}

const DOMAIN_OPTIONS = [
  { value: 'financial', label: 'Financial', icon: '💰' },
  { value: 'health', label: 'Health', icon: '❤️' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'relationships', label: 'Relationships', icon: '👥' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'personal', label: 'Personal', icon: '⭐' },
]

export default function GoalsCoachPage() {
  const { data } = useData()
  const { items: goalEntries, create: createGoal, update: updateGoal, loading: goalsLoading } = useDomainCRUD('miscellaneous')
  
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false)
  const [coachingSession, setCoachingSession] = useState<AICoachingSession | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)
  const [aiGoalSuggestions, setAiGoalSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    domain: 'personal',
    targetValue: '',
    deadline: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  })

  useEffect(() => {
    const parsedGoals: Goal[] = goalEntries.map((entry: any) => {
      const meta = entry.metadata || {}
      const progress = meta.progress || 0
      const deadline = meta.deadline || meta.target_date
      
      let status: Goal['status'] = 'on_track'
      if (progress >= 100) {
        status = 'completed'
      } else if (deadline) {
        const daysRemaining = differenceInDays(new Date(deadline), new Date())
        const expectedProgress = Math.max(0, 100 - (daysRemaining / 30) * 100)
        if (progress < expectedProgress - 10) status = 'behind'
        else if (progress > expectedProgress + 10) status = 'ahead'
      }

      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        domain: meta.domain || entry.domain || 'personal',
        targetValue: meta.target_value,
        currentValue: meta.current_value,
        progress,
        deadline,
        status,
        aiSuggestions: meta.ai_suggestions,
        milestones: meta.milestones,
        createdAt: entry.created_at
      }
    })

    Object.entries(data).forEach(([domain, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item.metadata?.type === 'goal' || item.metadata?.isGoal) {
            const exists = parsedGoals.some(g => g.id === item.id)
            if (!exists) {
              const meta = item.metadata || {}
              parsedGoals.push({
                id: item.id,
                title: item.title,
                description: item.description,
                domain,
                targetValue: meta.target_value,
                currentValue: meta.current_value,
                progress: meta.progress || 0,
                deadline: meta.deadline || meta.target_date,
                status: meta.progress >= 100 ? 'completed' : 'on_track',
                aiSuggestions: meta.ai_suggestions,
                milestones: meta.milestones,
                createdAt: item.created_at
              })
            }
          }
        })
      }
    })

    setGoals(parsedGoals.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return 0
    }))
  }, [goalEntries, data])

  const fetchAIGoalSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true)
    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on my life data, suggest 5 SMART goals I should set. Consider my current data across all domains and identify areas for improvement. Format as a numbered list with specific, measurable goals.`,
          userData: data,
          conversationHistory: [],
          requestType: 'goal_suggestions'
        })
      })

      if (response.ok) {
        const result = await response.json()
        const suggestions = parseGoalSuggestions(result.response || '')
        setAiGoalSuggestions(suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch goal suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [data])

  const parseGoalSuggestions = (response: string): string[] => {
    const lines = response.split('\n').filter(l => l.trim())
    const suggestions: string[] = []
    
    for (const line of lines) {
      const match = line.match(/^\d+[.)]\s*(.+)/)
      if (match) {
        suggestions.push(match[1].trim())
      } else if (line.match(/^[-•*]\s*/) && line.length > 20) {
        suggestions.push(line.replace(/^[-•*]\s*/, '').trim())
      }
    }
    
    return suggestions.slice(0, 5)
  }

  const getAICoaching = async (goal: Goal) => {
    setSelectedGoalId(goal.id)
    setIsLoadingCoaching(true)
    setCoachingSession(null)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Provide coaching for my goal: "${goal.title}". 
Current progress: ${goal.progress}%
Domain: ${goal.domain}
${goal.deadline ? `Deadline: ${goal.deadline}` : ''}
${goal.description ? `Description: ${goal.description}` : ''}

Please provide:
1. Analysis of my current progress
2. 3-5 specific action items to make progress this week
3. Potential blockers to watch out for
4. Motivational insight

Consider my other life data to provide cross-domain insights.`,
          userData: data,
          conversationHistory: [],
          requestType: 'goal_coaching'
        })
      })

      if (response.ok) {
        const result = await response.json()
        const coaching = parseCoachingResponse(goal.id, result.response || '')
        setCoachingSession(coaching)
      }
    } catch (error) {
      console.error('Failed to get AI coaching:', error)
    } finally {
      setIsLoadingCoaching(false)
    }
  }

  const parseCoachingResponse = (goalId: string, response: string): AICoachingSession => {
    const actionItems: AICoachingSession['actionItems'] = []
    const recommendations: string[] = []
    let insights = ''

    const lines = response.split('\n').filter(l => l.trim())
    let currentSection = ''

    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.toLowerCase().includes('action') || trimmed.includes('📋') || trimmed.includes('to-do')) {
        currentSection = 'actions'
        continue
      }
      if (trimmed.toLowerCase().includes('blocker') || trimmed.toLowerCase().includes('watch out') || trimmed.includes('⚠️')) {
        currentSection = 'blockers'
        continue
      }
      if (trimmed.toLowerCase().includes('insight') || trimmed.toLowerCase().includes('motivat') || trimmed.includes('💡')) {
        currentSection = 'insights'
        continue
      }

      if (trimmed.match(/^[-•*\d.]\s*/)) {
        const content = trimmed.replace(/^[-•*\d.]\s*/, '').trim()
        if (content.length > 5) {
          if (currentSection === 'actions') {
            actionItems.push({
              task: content,
              priority: content.toLowerCase().includes('urgent') || content.toLowerCase().includes('immediate') ? 'high' : 'medium'
            })
          } else if (currentSection === 'blockers') {
            recommendations.push(`⚠️ ${content}`)
          } else {
            recommendations.push(content)
          }
        }
      } else if (currentSection === 'insights' && trimmed.length > 20) {
        insights += (insights ? ' ' : '') + trimmed
      }
    }

    if (actionItems.length === 0 && recommendations.length === 0) {
      insights = response.slice(0, 500)
    }

    return {
      goalId,
      recommendations,
      actionItems: actionItems.slice(0, 5),
      insights: insights || 'Keep making progress! Every step counts toward your goal.'
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return

    setIsCreatingGoal(true)
    try {
      await createGoal({
        title: newGoal.title,
        description: newGoal.description,
        metadata: {
          type: 'goal',
          isGoal: true,
          domain: newGoal.domain,
          target_value: newGoal.targetValue ? parseFloat(newGoal.targetValue) : undefined,
          current_value: 0,
          progress: 0,
          deadline: newGoal.deadline,
          milestones: [],
          created_via: 'goals_coach'
        }
      })

      setNewGoal({
        title: '',
        description: '',
        domain: 'personal',
        targetValue: '',
        deadline: format(addDays(new Date(), 30), 'yyyy-MM-dd')
      })
      setShowNewGoalDialog(false)
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsCreatingGoal(false)
    }
  }

  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      await updateGoal(goalId, {
        metadata: {
          progress: Math.min(100, Math.max(0, newProgress)),
          current_value: goal.targetValue ? (goal.targetValue * newProgress / 100) : undefined
        }
      })
    } catch (error) {
      console.error('Failed to update goal progress:', error)
    }
  }

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'ahead': return 'bg-blue-500'
      case 'behind': return 'bg-orange-500'
      default: return 'bg-primary'
    }
  }

  const getStatusBadge = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>
      case 'ahead': return <Badge className="bg-blue-500">Ahead</Badge>
      case 'behind': return <Badge variant="destructive">Behind</Badge>
      default: return <Badge variant="secondary">On Track</Badge>
    }
  }

  const activeGoals = goals.filter(g => g.status !== 'completed')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-10 w-10 text-green-600" />
            AI Goals Coach
          </h1>
          <p className="text-muted-foreground mt-2">
            Set, track, and achieve your goals with personalized AI coaching
          </p>
        </div>
        <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a SMART goal with AI assistance</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input
                  placeholder="e.g., Save $5,000 for emergency fund"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Why is this goal important to you?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Select value={newGoal.domain} onValueChange={(v) => setNewGoal({ ...newGoal, domain: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOMAIN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Value (optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewGoalDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateGoal} disabled={!newGoal.title.trim() || isCreatingGoal}>
                {isCreatingGoal ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Goal</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals.length}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals.filter(g => g.status === 'behind').length}</p>
                <p className="text-xs text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              AI-Suggested Goals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchAIGoalSuggestions} disabled={isLoadingSuggestions}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
              Get Suggestions
            </Button>
          </div>
          <CardDescription>Based on your life data, here are goals that could improve your life</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSuggestions ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : aiGoalSuggestions.length > 0 ? (
            <div className="space-y-2">
              {aiGoalSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setNewGoal({ ...newGoal, title: suggestion })
                    setShowNewGoalDialog(true)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">{suggestion}</span>
                  </div>
                  <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Click &quot;Get Suggestions&quot; for AI-powered goal recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            <TrendingUp className="h-4 w-4 mr-2" />
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {goalsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : activeGoals.length > 0 ? (
            activeGoals.map((goal) => (
              <Card key={goal.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {goal.title}
                        {getStatusBadge(goal.status)}
                      </CardTitle>
                      {goal.description && <CardDescription className="mt-1">{goal.description}</CardDescription>}
                    </div>
                    <Badge variant="outline">{goal.domain}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className={`h-2 ${getStatusColor(goal.status)}`} />
                    {goal.deadline && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {differenceInDays(new Date(goal.deadline), new Date()) > 0
                            ? `${differenceInDays(new Date(goal.deadline), new Date())} days remaining`
                            : 'Deadline passed'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUpdateProgress(goal.id, goal.progress + 10)}>+10%</Button>
                    <Button size="sm" variant="outline" onClick={() => handleUpdateProgress(goal.id, goal.progress + 25)}>+25%</Button>
                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateProgress(goal.id, 100)}>
                      <CheckCircle className="h-4 w-4 mr-1" />Complete
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" onClick={() => getAICoaching(goal)} disabled={isLoadingCoaching && selectedGoalId === goal.id}>
                      {isLoadingCoaching && selectedGoalId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Brain className="h-4 w-4 mr-1" />Get Coaching</>}
                    </Button>
                  </div>

                  {coachingSession && coachingSession.goalId === goal.id && (
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-600">AI Coach Says</span>
                      </div>
                      {coachingSession.insights && <p className="text-sm">{coachingSession.insights}</p>}
                      {coachingSession.actionItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Action Items This Week:</p>
                          {coachingSession.actionItems.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">{item.priority}</Badge>
                              <span>{item.task}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {coachingSession.recommendations.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Additional Tips:</p>
                          {coachingSession.recommendations.slice(0, 3).map((rec, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground">• {rec}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                <p className="text-muted-foreground mb-4">Set your first goal to start getting AI coaching!</p>
                <Button onClick={() => setShowNewGoalDialog(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Goal</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedGoals.length > 0 ? (
            completedGoals.map((goal) => (
              <Card key={goal.id} className="bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">Completed • {goal.domain}</p>
                    </div>
                    <Badge className="bg-green-500">100%</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Completed Goals Yet</h3>
                <p className="text-muted-foreground">Complete your goals to see them celebrated here!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Goal Check-in
          </CardTitle>
          <CardDescription>Review your progress and get personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Get Your Weekly AI Review</p>
                <p className="text-sm text-muted-foreground">Comprehensive analysis of all your goals with action items</p>
              </div>
            </div>
            <Link href="/insights">
              <Button>Start Check-in<ChevronRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

