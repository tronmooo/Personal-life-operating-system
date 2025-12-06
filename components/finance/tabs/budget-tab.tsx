// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider'
import { Plus, PieChart, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/finance-utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { calculateGoalProgress } from '@/lib/utils/finance-utils'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { BudgetDialog } from '../dialogs/budget-dialog'
import { GoalDialog } from '../dialogs/goal-dialog'

export function BudgetTab() {
  const { monthlyBudget, goals, currentMonth, budgetLoading, goalsLoading } = useFinance()
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  
  const activeGoals = goals.filter(g => !g.is_completed)
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyBudget?.totalBudgeted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyBudget?.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <PieChart className={cn(
              "h-4 w-4",
              (monthlyBudget?.variance || 0) >= 0 ? "text-green-600" : "text-red-600"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (monthlyBudget?.variance || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(monthlyBudget?.variance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(monthlyBudget?.variance || 0) >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Budget & Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget & Goals</CardTitle>
              <CardDescription>Plan and track your spending by category</CardDescription>
            </div>
            <Button onClick={() => setBudgetDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgetLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading budget...
            </div>
          ) : !monthlyBudget || monthlyBudget.categories.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No budget items yet. Add your first budget category to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyBudget.categories.map((category) => {
                const percentSpent = (Number(category.spent_amount) / Number(category.budgeted_amount)) * 100
                const isOverBudget = percentSpent > 100
                
                return (
                  <div key={category.id} className="space-y-2 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(Number(category.spent_amount))} / {formatCurrency(Number(category.budgeted_amount))}
                        </p>
                        <p className={cn(
                          "text-sm",
                          isOverBudget ? "text-red-600" : "text-green-600"
                        )}>
                          {formatCurrency(Number(category.remaining_amount))} remaining
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(percentSpent, 100)} 
                      className={cn(
                        "h-2",
                        isOverBudget && "bg-red-100 dark:bg-red-900"
                      )}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{percentSpent.toFixed(1)}% used</span>
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          Over Budget
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Financial Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Track your progress toward major financial milestones</CardDescription>
            </div>
            <Button onClick={() => setGoalDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goalsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading goals...
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No financial goals set yet. Create your first goal to stay motivated!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoals.map((goal) => {
                const progress = calculateGoalProgress(goal)
                const daysRemaining = differenceInDays(new Date(goal.target_date), new Date())
                
                return (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{goal.name}</h4>
                          <Badge variant={
                            goal.priority === 'critical' ? 'destructive' :
                            goal.priority === 'high' ? 'default' :
                            'secondary'
                          }>
                            {goal.priority}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Target: {format(new Date(goal.target_date), 'MMM d, yyyy')} ({daysRemaining} days remaining)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(progress.amountRemaining)} remaining
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Progress value={progress.percentComplete} className="h-3" />
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn(
                          "font-medium",
                          progress.onTrack ? "text-green-600" : "text-red-600"
                        )}>
                          {progress.percentComplete.toFixed(1)}% complete - {progress.onTrack ? 'On Track' : 'Behind'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(Number(goal.monthly_contribution))}/mo contributed
                        </span>
                      </div>
                    </div>
                    
                    {!progress.onTrack && (
                      <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                        💡 Increase monthly contribution to {formatCurrency(progress.requiredMonthlyContribution)} to reach your goal on time
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <BudgetDialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} />
    </div>
  )
}

