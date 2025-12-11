// @ts-nocheck
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { Search, Download, Plus, Building, Trash2, Filter, TrendingDown } from 'lucide-react'
import { TransactionsVisual } from '../visuals/tab-visuals'
import { SpendingDonutChart, SpendingSparkline } from '../charts/finance-visualizations'
import { cn } from '@/lib/utils'

interface TransactionsTabProps {
  onOpenTransactionDialog?: () => void
  onOpenRecurringDialog?: () => void
}

export function TransactionsTab({ onOpenTransactionDialog, onOpenRecurringDialog }: TransactionsTabProps = {}) {
  const { transactions, recurringTransactions, generateRecurringTransactions, deleteTransaction, deleteRecurringTransaction, loading } = useFinance()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Calculate spending by category for donut chart
  const spendingByCategory = useMemo(() => {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Other'
        acc[category] = (acc[category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Calculate daily spending for sparkline (last 14 days)
  const dailySpending = useMemo(() => {
    const today = new Date()
    const days = 14
    const dailyTotals: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayTotal = transactions
        .filter(t => {
          const txDate = new Date(t.date).toISOString().split('T')[0]
          return t.type === 'expense' && txDate === dateStr
        })
        .reduce((sum, t) => sum + t.amount, 0)

      dailyTotals.push(dayTotal)
    }

    return dailyTotals
  }, [transactions])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category || 'Other'))
    return ['all', ...Array.from(cats)]
  }, [transactions])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = searchQuery === '' || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.payee && t.payee.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [transactions, searchQuery, selectedCategory])

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [filteredTransactions])
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <TransactionsVisual />

      {/* NEW: Spending Overview Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category Donut */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-slate-200">Spending by Category</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Where your money goes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingByCategory.length > 0 ? (
              <SpendingDonutChart data={spendingByCategory} height={200} showLegend={true} />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Spending Sparkline & Quick Stats */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Daily spending trend (last 14 days)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sparkline */}
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Daily Spending</p>
              <SpendingSparkline data={dailySpending} width={280} height={60} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Income</p>
                <p className="text-lg font-bold text-emerald-400">
                  ${totals.income.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Expenses</p>
                <p className="text-lg font-bold text-rose-400">
                  ${totals.expenses.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Net</p>
                <p className={cn(
                  "text-lg font-bold",
                  totals.net >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  ${Math.abs(totals.net).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bank Account Integration Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-slate-200">Bank Account Integration</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Connect your bank accounts to automatically import transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plaid Info Box */}
          <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="text-blue-400">🔒</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Secure Bank Connection via Plaid</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Plaid uses bank-level encryption to securely connect to over 12,000 financial institutions. 
                  Your credentials are never stored on our servers.
                </p>
                
                {/* Benefits List */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span>✅</span>
                    <span>Automatic transaction imports - no manual entry</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span>✅</span>
                    <span>Real-time account balances and updates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span>✅</span>
                    <span>Smart categorization based on merchant data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span>✅</span>
                    <span>Detect duplicate transactions automatically</span>
                  </div>
                </div>
                
                {/* CTA Button */}
                <Button className="w-full btn-finance">
                  <Building className="h-4 w-4 mr-2" />
                  Connect Bank Account with Plaid
                </Button>
                
                <p className="text-xs text-slate-500 text-center mt-2">
                  By connecting, you agree to Plaid's <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recurring Transactions Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🔄</span>
                <CardTitle className="text-slate-200">Recurring Transactions</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Automate your regular income and expenses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="btn-finance"
                onClick={() => generateRecurringTransactions()}
              >
                ▶️ Generate
              </Button>
              <Button 
                size="sm" 
                className="btn-finance"
                onClick={() => onOpenRecurringDialog?.()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recurring
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="text-4xl mb-4">🔄</div>
              <p>No recurring transactions yet. Add one to automate your finances!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTransactions.map(rt => (
                <div key={rt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white text-base">{rt.name}</p>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                          rt.type === 'income'
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : 'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {rt.type.charAt(0).toUpperCase() + rt.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        • {rt.frequency} • {rt.account}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-semibold text-white">${rt.amount.toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-900/30"
                      onClick={() => deleteRecurringTransaction(rt.id)}
                    >
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transactions Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-200">Transactions</CardTitle>
              <CardDescription className="text-slate-400">
                Log and track all your financial transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="btn-finance">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                className="btn-finance"
                onClick={() => onOpenTransactionDialog?.()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10 bg-slate-900 border-slate-700 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none bg-slate-900 border border-slate-700 rounded-md px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-600"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Account</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      {transactions.length === 0 
                        ? 'No transactions yet. Add your first transaction to get started.'
                        : 'No transactions match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4 text-sm text-slate-300">{transaction.date}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-900/30 text-green-400 border border-green-800' 
                            : transaction.type === 'expense'
                            ? 'bg-red-900/30 text-red-400 border border-red-800'
                            : 'bg-blue-900/30 text-blue-400 border border-blue-800'
                        }`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-white font-medium">{transaction.category}</td>
                      <td className="py-4 px-4 text-sm text-slate-400 uppercase">{transaction.title}</td>
                      <td className="py-4 px-4 text-sm text-slate-400">{transaction.account || '-'}</td>
                      <td className="py-4 px-4 text-sm text-right font-medium text-white">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-900/30"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
