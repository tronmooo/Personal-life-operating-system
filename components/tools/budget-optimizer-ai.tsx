'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, PieChart, Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useAutoFillData, formatCurrency } from '@/lib/tools/auto-fill'
import { getAISuggestions, AISuggestion } from '@/lib/tools/ai-suggestions'
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface BudgetCategory {
  id: string
  name: string
  budgeted: number
  spent: number
  type: 'income' | 'expense'
  category: string
}

const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Savings',
  'Debt Payment',
  'Other'
]

const RECOMMENDED_PERCENTAGES: Record<string, number> = {
  'Housing': 30,
  'Transportation': 15,
  'Food & Dining': 12,
  'Utilities': 5,
  'Insurance': 10,
  'Healthcare': 5,
  'Entertainment': 5,
  'Shopping': 5,
  'Savings': 20,
  'Debt Payment': 10,
  'Other': 3
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function BudgetOptimizerAI() {
  const { data } = useData()
  const autoFillData = useAutoFillData()
  
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isAutoFilled, setIsAutoFilled] = useState(false)
  
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryBudget, setNewCategoryBudget] = useState('')
  const [newCategoryCategory, setNewCategoryCategory] = useState('Other')

  // Auto-fill from user data
  const handleAutoFill = () => {
    const autoCategories: BudgetCategory[] = []
    let id = 1
    
    // Add income
    if (autoFillData.income.monthly > 0) {
      autoCategories.push({
        id: `auto-${id++}`,
        name: 'Monthly Income',
        budgeted: autoFillData.income.monthly,
        spent: autoFillData.income.monthly,
        type: 'income',
        category: 'Income'
      })
    }
    
    // Add expenses from user data
    Object.entries(autoFillData.expenses.byCategory).forEach(([category, amount]) => {
      if (amount > 0) {
        autoCategories.push({
          id: `auto-${id++}`,
          name: category,
          budgeted: amount,
          spent: amount,
          type: 'expense',
          category: category
        })
      }
    })
    
    // If no auto-fill data, create default template based on income
    if (autoCategories.length === 1 && autoFillData.income.monthly > 0) {
      const income = autoFillData.income.monthly
      
      EXPENSE_CATEGORIES.forEach((cat, idx) => {
        const recommended = RECOMMENDED_PERCENTAGES[cat] || 5
        const amount = Math.round(income * (recommended / 100))
        
        if (amount > 0) {
          autoCategories.push({
            id: `auto-${id++}`,
            name: cat,
            budgeted: amount,
            spent: 0,
            type: 'expense',
            category: cat
          })
        }
      })
    }
    
    // Fallback to template
    if (autoCategories.length === 0) {
      autoCategories.push(
        { id: '1', name: 'Salary', budgeted: 5000, spent: 5000, type: 'income', category: 'Income' },
        { id: '2', name: 'Rent/Mortgage', budgeted: 1500, spent: 0, type: 'expense', category: 'Housing' },
        { id: '3', name: 'Groceries', budgeted: 500, spent: 0, type: 'expense', category: 'Food & Dining' },
        { id: '4', name: 'Utilities', budgeted: 200, spent: 0, type: 'expense', category: 'Utilities' },
        { id: '5', name: 'Transportation', budgeted: 300, spent: 0, type: 'expense', category: 'Transportation' }
      )
    }
    
    setCategories(autoCategories)
    setIsAutoFilled(true)
  }
  
  // Auto-fill on mount
  useEffect(() => {
    handleAutoFill()
  }, [])

  const addCategory = () => {
    if (!newCategoryName || !newCategoryBudget) return

    setCategories([
      ...categories,
      {
        id: Date.now().toString(),
        name: newCategoryName,
        budgeted: parseFloat(newCategoryBudget),
        spent: 0,
        type: 'expense',
        category: newCategoryCategory
      },
    ])
    setNewCategoryName('')
    setNewCategoryBudget('')
  }

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const updateSpent = (id: string, amount: number) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, spent: amount } : c))
    )
  }

  const updateBudgeted = (id: string, amount: number) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, budgeted: amount } : c))
    )
  }

  const income = categories.filter((c) => c.type === 'income')
  const expenses = categories.filter((c) => c.type === 'expense')

  const totalIncomeBudgeted = income.reduce((sum, c) => sum + c.budgeted, 0)
  const totalIncomeActual = income.reduce((sum, c) => sum + c.spent, 0)
  const totalExpensesBudgeted = expenses.reduce((sum, c) => sum + c.budgeted, 0)
  const totalExpensesActual = expenses.reduce((sum, c) => sum + c.spent, 0)

  const budgetedRemaining = totalIncomeBudgeted - totalExpensesBudgeted
  const actualRemaining = totalIncomeActual - totalExpensesActual
  const savingsRate = totalIncomeActual > 0 ? ((actualRemaining / totalIncomeActual) * 100) : 0

  // Get AI suggestions
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true)
    try {
      const budgetByCategory: Record<string, number> = {}
      expenses.forEach(e => {
        budgetByCategory[e.category] = (budgetByCategory[e.category] || 0) + e.spent
      })
      
      const suggestions = await getAISuggestions('budget', {
        totalIncome: totalIncomeActual,
        expenses: totalExpensesActual,
        budgetCategories: budgetByCategory
      })
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Chart data
  const expenseBreakdown = expenses
    .filter(e => e.spent > 0)
    .reduce((acc, e) => {
      const existing = acc.find(a => a.category === e.category)
      if (existing) {
        existing.value += e.spent
      } else {
        acc.push({ category: e.category, value: e.spent })
      }
      return acc
    }, [] as Array<{ category: string; value: number }>)

  // Calculate category percentages vs recommended
  const categoryAnalysis = EXPENSE_CATEGORIES.map(cat => {
    const spent = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.spent, 0)
    const percentage = totalIncomeActual > 0 ? (spent / totalIncomeActual) * 100 : 0
    const recommended = RECOMMENDED_PERCENTAGES[cat] || 5
    const difference = percentage - recommended
    
    return {
      category: cat,
      spent,
      percentage: parseFloat(percentage.toFixed(1)),
      recommended,
      difference: parseFloat(difference.toFixed(1)),
      status: Math.abs(difference) <= 2 ? 'good' : (difference > 0 ? 'over' : 'under')
    }
  }).filter(c => c.spent > 0 || c.recommended > 0)

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
      {/* Header with Auto-Fill */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Budget Optimizer
            {isAutoFilled && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto-Filled
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered budget planning and optimization
          </p>
        </div>
        <Button onClick={handleAutoFill} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload My Data
        </Button>
      </div>

      {/* Summary Cards */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncomeActual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: {formatCurrency(totalIncomeBudgeted)}
              </p>
            </div>

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpensesActual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: {formatCurrency(totalExpensesBudgeted)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${actualRemaining >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${actualRemaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(actualRemaining)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Budgeted: {formatCurrency(budgetedRemaining)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${savingsRate >= 20 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {savingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 20%+
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie */}
        {expenseBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.category}: ${formatCurrency(entry.value)}`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Analysis vs Recommended */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget vs Recommended</CardTitle>
            <CardDescription>How your spending compares to the 50/30/20 rule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryAnalysis.slice(0, 6).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {cat.percentage}% 
                        {cat.status !== 'good' && (
                          <span className={cat.status === 'over' ? 'text-red-600' : 'text-blue-600'}>
                            {' '}({cat.difference > 0 ? '+' : ''}{cat.difference}%)
                          </span>
                        )}
                      </span>
                      {cat.status === 'good' && <Badge variant="secondary" className="text-xs">✓</Badge>}
                      {cat.status === 'over' && <Badge variant="destructive" className="text-xs">High</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.status === 'over' ? 'bg-red-500' : cat.status === 'good' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((cat.percentage / cat.recommended) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12">
                      {cat.recommended}% rec
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories */}
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
              <div key={category.id} className="space-y-2 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline" className="text-xs">{category.category}</Badge>
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
                  {formatCurrency(category.spent)} of {formatCurrency(category.budgeted)}
                  {category.budgeted > 0 && (
                    <span> ({formatCurrency(category.budgeted - category.spent)} remaining)</span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Add Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Netflix"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryBudget">Amount</Label>
              <Input
                id="categoryBudget"
                type="number"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryCategory">Category</Label>
              <select
                id="categoryCategory"
                value={newCategoryCategory}
                onChange={(e) => setNewCategoryCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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

      {/* AI Suggestions */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">AI Budget Optimization</CardTitle>
            </div>
            <Button 
              onClick={handleGetAISuggestions} 
              disabled={isLoadingAI}
              size="sm"
              variant="outline"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize My Budget
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Personalized recommendations to improve your spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiSuggestions.length > 0 ? (
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        {suggestion.priority && (
                          <Badge 
                            variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {suggestion.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      {suggestion.impact && (
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          💰 {suggestion.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Click "Optimize My Budget" to receive AI-powered spending recommendations
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>50/30/20 Rule:</strong> Allocate 50% to needs, 30% to wants, and 20% to savings/debt.
            This budget tool helps you visualize and optimize your spending to match these guidelines.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}































