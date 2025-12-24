'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { GoalFormData } from '@/types/finance'
import { format } from 'date-fns'

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GOAL_TYPES: Record<GoalFormData['goalType'], string> = {
  'savings': 'Savings Goal',
  'emergency-fund': 'Emergency Fund',
  'debt-payoff': 'Debt Payoff',
  'purchase': 'Major Purchase',
  'investment': 'Investment',
  'other': 'Other'
}

export function GoalDialog({ open, onOpenChange }: GoalDialogProps) {
  const { createGoal } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    goalType: 'savings',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    monthlyContribution: 0,
    priority: 'medium'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createGoal(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        title: '',
        description: '',
        goalType: 'savings',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        monthlyContribution: 0,
        priority: 'medium'
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add Financial Goal</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set a target and track your progress toward financial milestones
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-200">Goal Name</Label>
            <Input
              id="title"
              placeholder="e.g., Emergency Fund, Pay off Credit Card"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-slate-100"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalType" className="text-slate-200">Type</Label>
              <Select 
                value={formData.goalType} 
                onValueChange={(value: GoalFormData['goalType']) => setFormData({ ...formData, goalType: value })}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(GOAL_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-slate-200">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-200">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: GoalFormData['priority']) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="critical" className="text-slate-200">Critical</SelectItem>
                  <SelectItem value="high" className="text-slate-200">High</SelectItem>
                  <SelectItem value="medium" className="text-slate-200">Medium</SelectItem>
                  <SelectItem value="low" className="text-slate-200">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="text-slate-200">Target Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.targetAmount || ''}
                  onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="pl-7 bg-slate-700/50 border-slate-600 text-slate-100"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAmount" className="text-slate-200">Current Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.currentAmount || ''}
                  onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="pl-7 bg-slate-700/50 border-slate-600 text-slate-100"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-slate-200">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-slate-100"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthlyContribution" className="text-slate-200">Monthly Contribution</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  id="monthlyContribution"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.monthlyContribution || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: parseFloat(e.target.value) || 0 })}
                  className="pl-7 bg-slate-700/50 border-slate-600 text-slate-100"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Why is this goal important to you?"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="bg-slate-700/50 border-slate-600 text-slate-100"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Goal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

