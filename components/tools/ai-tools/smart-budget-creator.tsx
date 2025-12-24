'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PieChart, DollarSign, TrendingUp, Sparkles, Loader2, Download, Check } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/utils/toast'

export function SmartBudgetCreator() {
  const autoFillData = useAutoFillData()
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [budgetName, setBudgetName] = useState(`Budget ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`)
  const [saving, setSaving] = useState(false)
  const [savedBudgets, setSavedBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load existing budgets and auto-fill income
  useEffect(() => {
    setMonthlyIncome(autoFillData.income.monthly || 0)
    fetchBudgets()
  }, [autoFillData.income.monthly])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/ai-tools/budgets', { credentials: 'include' })
      if (response.ok) {
        const result = await response.json()
        setSavedBudgets(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 50/30/20 rule
  const needs = monthlyIncome * 0.5
  const wants = monthlyIncome * 0.3
  const savings = monthlyIncome * 0.2

  const categories = [
    { name: 'Housing', amount: needs * 0.35, type: 'needs' },
    { name: 'Transportation', amount: needs * 0.15, type: 'needs' },
    { name: 'Groceries', amount: needs * 0.15, type: 'needs' },
    { name: 'Utilities', amount: needs * 0.10, type: 'needs' },
    { name: 'Insurance', amount: needs * 0.25, type: 'needs' },
    { name: 'Entertainment', amount: wants * 0.4, type: 'wants' },
    { name: 'Dining Out', amount: wants * 0.3, type: 'wants' },
    { name: 'Shopping', amount: wants * 0.3, type: 'wants' },
    { name: 'Emergency Fund', amount: savings * 0.5, type: 'savings' },
    { name: 'Investments', amount: savings * 0.5, type: 'savings' },
  ]

  const categoryColors: Record<string, string> = {
    'Housing': 'bg-blue-500',
    'Transportation': 'bg-green-500',
    'Groceries': 'bg-yellow-500',
    'Utilities': 'bg-purple-500',
    'Insurance': 'bg-pink-500',
    'Entertainment': 'bg-orange-500',
    'Dining Out': 'bg-red-500',
    'Shopping': 'bg-indigo-500',
    'Emergency Fund': 'bg-emerald-500',
    'Investments': 'bg-teal-500',
  }

  const saveBudget = async () => {
    if (monthlyIncome <= 0) {
      toast.error('Invalid Income', 'Please enter a valid monthly income')
      return
    }

    setSaving(true)
    try {
      const categoriesObj: Record<string, number> = {}
      categories.forEach(cat => {
        categoriesObj[cat.name] = cat.amount
      })

      const response = await fetch('/api/ai-tools/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: budgetName,
          period: 'monthly',
          income: monthlyIncome,
          categories: categoriesObj,
          goals: [
            { name: 'Needs Budget', target: needs, type: 'needs' },
            { name: 'Wants Budget', target: wants, type: 'wants' },
            { name: 'Savings Goal', target: savings, type: 'savings' },
          ],
          start_date: new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSavedBudgets([result.data, ...savedBudgets])
        toast.success('Budget Created!', `Your ${budgetName} has been saved`)
      } else {
        const error = await response.json()
        toast.error('Failed to Save', error.error || 'Could not save budget')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create budget')
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Category', 'Amount', 'Percentage', 'Type'],
      ...categories.map(cat => [
        cat.name,
        cat.amount.toFixed(2),
        ((cat.amount / monthlyIncome) * 100).toFixed(1) + '%',
        cat.type
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${budgetName.replace(/\s+/g, '_')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Exported!', 'Budget exported to CSV')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">💰</span>
          Smart Budget Creator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered budget creation with the 50/30/20 rule
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Name & Income Input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Budget Name</Label>
            <Input 
              value={budgetName} 
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Enter budget name..."
            />
          </div>
          <div>
            <Label>Monthly Income</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={monthlyIncome || ''} 
                onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                placeholder="Enter your monthly income..."
              />
              {autoFillData.income.monthly > 0 && (
                <Button variant="outline" onClick={() => setMonthlyIncome(autoFillData.income.monthly)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Fill
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Needs (50%)</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${needs.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Essential expenses</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Wants (30%)</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${wants.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Discretionary spending</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Savings (20%)</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${savings.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Future goals</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Suggested Budget Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${categoryColors[category.name]}`} />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground">${category.amount.toFixed(2)}</span>
                </div>
                <Badge variant="outline">
                  {monthlyIncome > 0 ? ((category.amount / monthlyIncome) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            AI Recommendations:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Your savings rate is {monthlyIncome > 0 ? ((savings/monthlyIncome)*100).toFixed(0) : 0}% - {monthlyIncome > 0 ? 'Great job!' : 'Enter income to see rate'}</li>
            <li>• Consider setting up automatic transfers to savings</li>
            <li>• Track spending weekly to stay on budget</li>
            <li>• Build 3-6 months of expenses in emergency fund</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={saveBudget} disabled={saving || monthlyIncome <= 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Create Budget
              </>
            )}
          </Button>
          <Button variant="outline" className="flex-1" onClick={exportToCSV} disabled={monthlyIncome <= 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Saved Budgets */}
        {savedBudgets.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Saved Budgets ({savedBudgets.length})
            </h4>
            <div className="space-y-2">
              {savedBudgets.slice(0, 3).map((budget) => (
                <div key={budget.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="font-medium">{budget.name}</span>
                  <span className="text-muted-foreground">
                    ${budget.income?.toLocaleString()} / month
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}































