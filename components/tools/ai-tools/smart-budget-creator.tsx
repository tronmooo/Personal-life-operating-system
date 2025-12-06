'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PieChart, DollarSign, TrendingUp, Sparkles } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { Badge } from '@/components/ui/badge'

export function SmartBudgetCreator() {
  const autoFillData = useAutoFillData()
  const [monthlyIncome, setMonthlyIncome] = useState(autoFillData.income.monthly || 0)
  
  // 50/30/20 rule
  const needs = monthlyIncome * 0.5
  const wants = monthlyIncome * 0.3
  const savings = monthlyIncome * 0.2

  const categories = [
    { name: 'Housing', amount: needs * 0.35, color: 'bg-blue-500' },
    { name: 'Transportation', amount: needs * 0.15, color: 'bg-green-500' },
    { name: 'Groceries', amount: needs * 0.15, color: 'bg-yellow-500' },
    { name: 'Utilities', amount: needs * 0.10, color: 'bg-purple-500' },
    { name: 'Insurance', amount: needs * 0.25, color: 'bg-pink-500' },
    { name: 'Entertainment', amount: wants * 0.4, color: 'bg-orange-500' },
    { name: 'Dining Out', amount: wants * 0.3, color: 'bg-red-500' },
    { name: 'Shopping', amount: wants * 0.3, color: 'bg-indigo-500' },
    { name: 'Emergency Fund', amount: savings * 0.5, color: 'bg-emerald-500' },
    { name: 'Investments', amount: savings * 0.5, color: 'bg-teal-500' },
  ]

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
        {/* Income Input */}
        <div>
          <Label>Monthly Income</Label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={monthlyIncome} 
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
                <div className={`w-4 h-4 rounded ${category.color}`} />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground">${category.amount.toFixed(2)}</span>
                </div>
                <Badge variant="outline">{((category.amount / monthlyIncome) * 100).toFixed(1)}%</Badge>
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
            <li>• Your savings rate is {((savings/monthlyIncome)*100).toFixed(0)}% - Great job!</li>
            <li>• Consider setting up automatic transfers to savings</li>
            <li>• Track spending weekly to stay on budget</li>
            <li>• Build 3-6 months of expenses in emergency fund</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
          <Button variant="outline" className="flex-1">
            Export to CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}































