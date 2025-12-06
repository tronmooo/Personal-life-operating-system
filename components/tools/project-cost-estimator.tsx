'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus, Trash2 } from 'lucide-react'

interface Task {
  id: number
  name: string
  hours: string
  rate: string
}

export function ProjectCostEstimator() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: '', hours: '', rate: '' }
  ])
  const [contingency, setContingency] = useState('15')
  const [result, setResult] = useState<{
    subtotal: number
    contingencyAmount: number
    total: number
    tasks: Array<{ name: string; cost: number }>
  } | null>(null)

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), name: '', hours: '', rate: '' }])
  }

  const removeTask = (id: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id))
    }
  }

  const updateTask = (id: number, field: keyof Task, value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const calculateCost = () => {
    const taskCosts = tasks
      .filter(t => t.name && t.hours && t.rate)
      .map(t => ({
        name: t.name,
        cost: parseFloat(t.hours) * parseFloat(t.rate)
      }))

    if (taskCosts.length === 0) return

    const subtotal = taskCosts.reduce((sum, t) => sum + t.cost, 0)
    const contingencyAmount = subtotal * (parseFloat(contingency) / 100)
    const total = subtotal + contingencyAmount

    setResult({
      subtotal,
      contingencyAmount,
      total,
      tasks: taskCosts
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Project Tasks</Label>
        {tasks.map((task, index) => (
          <div key={task.id} className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <Input
                placeholder="Task name"
                value={task.name}
                onChange={(e) => updateTask(task.id, 'name', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                placeholder="Hours"
                value={task.hours}
                onChange={(e) => updateTask(task.id, 'hours', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                placeholder="$/hr"
                value={task.rate}
                onChange={(e) => updateTask(task.id, 'rate', e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTask(task.id)}
                disabled={tasks.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addTask} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contingency">Contingency Buffer (%)</Label>
        <Input
          id="contingency"
          type="number"
          placeholder="e.g., 15"
          value={contingency}
          onChange={(e) => setContingency(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Typical: 10-20% for unexpected work</p>
      </div>

      <Button onClick={calculateCost} className="w-full">
        <Briefcase className="mr-2 h-4 w-4" />
        Calculate Project Cost
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle>Project Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.total)}
                </div>
                <p className="text-muted-foreground">Total Project Cost</p>
              </div>

              <div className="space-y-2">
                {result.tasks.map((task, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <span className="font-medium">{task.name}</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(task.cost)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.subtotal)}</div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(result.contingencyAmount)}</div>
                  <p className="text-xs text-muted-foreground">Contingency ({contingency}%)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Best Practices:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Break projects into detailed tasks for accurate estimates</li>
                <li>Include time for meetings, revisions, and communication</li>
                <li>Add contingency for scope creep and unexpected issues</li>
                <li>Track actual time vs. estimates to improve future quotes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
