'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

interface BudgetCategory {
  id: string
  name: string
  budgeted: number
  spent: number
  type: 'income' | 'expense'
}

const defaultCategories: BudgetCategory[] = [
  { id: '1', name: 'Salary', budgeted: 5000, spent: 5000, type: 'income' },
  { id: '2', name: 'Rent/Mortgage', budgeted: 1500, spent: 1500, type: 'expense' },
  { id: '3', name: 'Groceries', budgeted: 500, spent: 0, type: 'expense' },
  { id: '4', name: 'Utilities', budgeted: 200, spent: 0, type: 'expense' },
  { id: '5', name: 'Transportation', budgeted: 300, spent: 0, type: 'expense' },
]

export function BudgetPlanner() {
  const { value: categories, setValue: saveCategories, loading } = useUserPreferences<BudgetCategory[]>(
    'budgetCategories',
    defaultCategories
  )
  
  const { setValue: saveBudgetSummary } = useUserPreferences<{
    totalIncome: number
    totalExpenses: number
    remaining: number
    categories: BudgetCategory[]
  }>(
    'monthlyBudget',
    { totalIncome: 0, totalExpenses: 0, remaining: 0, categories: [] }
  )
  
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryBudget, setNewCategoryBudget] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense')

  // Save budget to Supabase whenever categories change
  useEffect(() => {
    if (!categories || loading) return
    
    const income = categories.filter((c) => c.type === 'income')
    const expenses = categories.filter((c) => c.type === 'expense')
    
    const totalIncome = income.reduce((sum, c) => sum + c.budgeted, 0)
    const totalExpenses = expenses.reduce((sum, c) => sum + c.budgeted, 0)
    
    const budgetData = {
      totalIncome,
      totalExpenses,
      remaining: totalIncome - totalExpenses,
      categories
    }
    
    // Save budget summary for Command Center
    saveBudgetSummary(budgetData)
  }, [categories, loading])

  const addCategory = async () => {
    if (!newCategoryName || !newCategoryBudget || !categories) return

    await saveCategories([
      ...(categories || []),
      {
        id: Date.now().toString(),
        name: newCategoryName,
        budgeted: parseFloat(newCategoryBudget),
        spent: 0,
        type: newCategoryType,
      },
    ])
    setNewCategoryName('')
    setNewCategoryBudget('')
  }

  const removeCategory = async (id: string) => {
    if (!categories) return
    await saveCategories(categories.filter((c) => c.id !== id))
  }

  const updateSpent = async (id: string, amount: number) => {
    if (!categories) return
    await saveCategories(
      categories.map((c) => (c.id === id ? { ...c, spent: amount } : c))
    )
  }

  const updateBudgeted = async (id: string, amount: number) => {
    if (!categories) return
    await saveCategories(
      categories.map((c) => (c.id === id ? { ...c, budgeted: amount } : c))
    )
  }

  const income = (categories || []).filter((c) => c.type === 'income')
  const expenses = (categories || []).filter((c) => c.type === 'expense')

  const totalIncomeBudgeted = income.reduce((sum, c) => sum + c.budgeted, 0)
  const totalIncomeActual = income.reduce((sum, c) => sum + c.spent, 0)
  const totalExpensesBudgeted = expenses.reduce((sum, c) => sum + c.budgeted, 0)
  const totalExpensesActual = expenses.reduce((sum, c) => sum + c.spent, 0)

  const budgetedRemaining = totalIncomeBudgeted - totalExpensesBudgeted
  const actualRemaining = totalIncomeActual - totalExpensesActual

  const getPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0
    return (spent / budgeted) * 100
  }

  const getStatusColor = (percent: number) => {
    if (percent <= 75) return 'bg-green-500'
    if (percent <= 90) return 'bg-yellow-500'
    if (percent <= 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Budget Planner
          </CardTitle>
          <CardDescription>
            Plan and track your monthly income and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalIncomeActual.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: ${totalIncomeBudgeted.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${totalExpensesActual.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: ${totalExpensesBudgeted.toLocaleString()}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${actualRemaining >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${actualRemaining >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                ${actualRemaining.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: ${budgetedRemaining.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Income
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {income.map((category) => {
            const percent = getPercentage(category.spent, category.budgeted)
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeCategory(category.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Budgeted</Label>
                    <Input
                      type="number"
                      value={category.budgeted}
                      onChange={(e) => updateBudgeted(category.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Actual</Label>
                    <Input
                      type="number"
                      value={category.spent}
                      onChange={(e) => updateSpent(category.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{percent.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.map((category) => {
            const percent = getPercentage(category.spent, category.budgeted)
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {percent > 100 && (
                      <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                    )}
                    {percent > 90 && percent <= 100 && (
                      <Badge variant="outline" className="text-xs text-orange-600">Near Limit</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeCategory(category.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Budgeted</Label>
                    <Input
                      type="number"
                      value={category.budgeted}
                      onChange={(e) => updateBudgeted(category.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Spent</Label>
                    <Input
                      type="number"
                      value={category.spent}
                      onChange={(e) => updateSpent(category.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(percent)}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{percent.toFixed(0)}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${category.spent.toLocaleString()} of ${category.budgeted.toLocaleString()} 
                  ({category.budgeted > 0 ? `$${(category.budgeted - category.spent).toLocaleString()} remaining` : 'no budget'})
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Add Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Entertainment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryBudget">Budgeted Amount</Label>
              <Input
                id="categoryBudget"
                type="number"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryType">Type</Label>
              <select
                id="categoryType"
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={addCategory} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-base">Budget Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Budget Utilization:</span>
            <span className="font-bold">
              {totalExpensesBudgeted > 0 
                ? `${((totalExpensesActual / totalExpensesBudgeted) * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Savings Rate:</span>
            <span className="font-bold">
              {totalIncomeActual > 0
                ? `${(((totalIncomeActual - totalExpensesActual) / totalIncomeActual) * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <Badge variant={actualRemaining >= 0 ? 'default' : 'destructive'}>
              {actualRemaining >= 0 ? 'On Track' : 'Over Budget'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







