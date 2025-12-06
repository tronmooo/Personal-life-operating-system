'use client'

import { useMemo } from 'react'
import { LogChartRenderer } from './log-chart-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FinancialLogChartsProps {
  logs: any[]
  selectedLogType?: string
}

export function FinancialLogCharts({ logs, selectedLogType }: FinancialLogChartsProps) {
  // Filter logs by selectedLogType
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const { expenseLogs, incomeLogs, expenseByCategory, incomeVsExpense } = useMemo(() => {
    const expenses = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'expense'
    })
    const incomes = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'income'
    })

    // Group expenses by category
    const categoryTotals: Record<string, number> = {}
    expenses.forEach(log => {
      const data = log.data || log.metadata || {}
      const category = data.category || 'Uncategorized'
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(data.amount || data.value || 0)
    })

    const expenseByCategory = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100
    }))

    // Daily totals for line chart
    const dailyTotals: Record<string, { date: string, expenses: number, income: number }> = {}
    
    expenses.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      if (!dailyTotals[date]) {
        dailyTotals[date] = { date, expenses: 0, income: 0 }
      }
      dailyTotals[date].expenses += parseFloat(data.amount || data.value || 0)
    })

    incomes.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      if (!dailyTotals[date]) {
        dailyTotals[date] = { date, expenses: 0, income: 0 }
      }
      dailyTotals[date].income += parseFloat(data.amount || data.value || 0)
    })

    const incomeVsExpense = Object.values(dailyTotals)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        expenses: Math.round(day.expenses * 100) / 100,
        income: Math.round(day.income * 100) / 100
      }))

    return {
      expenseLogs: expenses.map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          amount: parseFloat(data.amount || data.value || 0),
          category: data.category
        }
      }),
      incomeLogs: incomes.map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          amount: parseFloat(data.amount || data.value || 0),
          source: data.source
        }
      }),
      expenseByCategory,
      incomeVsExpense
    }
  }, [filteredLogs])

  // If selectedLogType is provided, show ONLY that chart
  if (selectedLogType) {
    if (selectedLogType === 'expense') {
      return (
        <>
          <LogChartRenderer
            data={expenseLogs.slice(-30)}
            chartType="line"
            xKey="date"
            yKey="amount"
            title="Expense Trend"
            description="Track your spending over time"
            valuePrefix="$"
          />
          <div className="mt-4">
            <LogChartRenderer
              data={expenseByCategory}
              chartType="pie"
              xKey="category"
              yKey="amount"
              title="Expense Breakdown"
              description="Distribution of spending across categories"
              valuePrefix="$"
            />
          </div>
        </>
      )
    }

    if (selectedLogType === 'income') {
      return (
        <LogChartRenderer
          data={incomeLogs.slice(-30)}
          chartType="bar"
          xKey="date"
          yKey="amount"
          title="Income Trend"
          description="Track your earnings over time"
          valuePrefix="$"
        />
      )
    }

    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No visualization available for this log type yet.</p>
        <p className="text-sm mt-2">Keep logging to see your progress!</p>
      </div>
    )
  }

  // If NO selectedLogType, show all charts with tabs
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <LogChartRenderer
            data={incomeVsExpense}
            chartType="bar"
            xKey="date"
            yKey={['income', 'expenses']}
            title="Income vs Expenses"
            description="Daily comparison of income and expenses"
            valuePrefix="$"
          />

          <LogChartRenderer
            data={expenseByCategory}
            chartType="pie"
            xKey="category"
            yKey="amount"
            title="Expense Breakdown by Category"
            description="Distribution of spending across categories"
            valuePrefix="$"
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <LogChartRenderer
            data={expenseLogs.slice(-30)}
            chartType="line"
            xKey="date"
            yKey="amount"
            title="Expense Trend (Last 30 days)"
            description="Track your spending over time"
            valuePrefix="$"
          />

          <LogChartRenderer
            data={expenseByCategory}
            chartType="bar"
            xKey="category"
            yKey="amount"
            title="Total Spending by Category"
            valuePrefix="$"
          />
        </TabsContent>

        <TabsContent value="income" className="space-y-4 mt-4">
          <LogChartRenderer
            data={incomeLogs.slice(-30)}
            chartType="area"
            xKey="date"
            yKey="amount"
            title="Income Trend (Last 30 days)"
            description="Track your earnings over time"
            valuePrefix="$"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}







