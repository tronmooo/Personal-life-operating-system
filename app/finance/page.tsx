'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, TrendingUp, Receipt, Wallet, CreditCard, 
  Calendar, Target, BarChart3, Plus, DollarSign 
} from 'lucide-react'

type Tab = 'dashboard' | 'transactions' | 'assets' | 'debts' | 'bills' | 'budget' | 'analysis'

export default function FinancePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: TrendingUp },
    { id: 'transactions' as const, label: 'Transactions', icon: Receipt },
    { id: 'assets' as const, label: 'Assets', icon: Wallet },
    { id: 'debts' as const, label: 'Debts', icon: CreditCard },
    { id: 'bills' as const, label: 'Bills', icon: Calendar },
    { id: 'budget' as const, label: 'Budget', icon: Target },
    { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 }
  ]

  // Sample data
  const stats = {
    netWorth: 125000,
    monthlyIncome: 8500,
    monthlyExpenses: 5200,
    savingsRate: 38.8
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/domains')}
                className="p-2 rounded-lg hover:bg-slate-800 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Financial Command Center
                </h1>
                <p className="text-sm text-slate-400">
                  Your complete financial dashboard for clarity and control
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[73px] z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
                <p className="text-green-400 text-sm font-medium">Net Worth</p>
                <p className="text-3xl font-bold text-white mt-2">
                  ${stats.netWorth.toLocaleString()}
                </p>
                <p className="text-green-400 text-sm mt-1">+12.5% this month</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
                <p className="text-blue-400 text-sm font-medium">Monthly Income</p>
                <p className="text-3xl font-bold text-white mt-2">
                  ${stats.monthlyIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-6">
                <p className="text-orange-400 text-sm font-medium">Monthly Expenses</p>
                <p className="text-3xl font-bold text-white mt-2">
                  ${stats.monthlyExpenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-xl p-6">
                <p className="text-purple-400 text-sm font-medium">Savings Rate</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.savingsRate}%
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <Plus className="h-6 w-6 text-blue-400" />
                  <span className="text-sm text-slate-300">Add Transaction</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <CreditCard className="h-6 w-6 text-green-400" />
                  <span className="text-sm text-slate-300">Pay Bill</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <Target className="h-6 w-6 text-purple-400" />
                  <span className="text-sm text-slate-300">Set Goal</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <BarChart3 className="h-6 w-6 text-orange-400" />
                  <span className="text-sm text-slate-300">View Reports</span>
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {[
                  { name: 'Grocery Store', amount: -125.50, date: 'Today' },
                  { name: 'Salary Deposit', amount: 4250.00, date: 'Dec 1' },
                  { name: 'Electric Bill', amount: -145.00, date: 'Nov 28' },
                  { name: 'Coffee Shop', amount: -6.50, date: 'Nov 27' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <DollarSign className={`h-5 w-5 ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`} />
                      <div>
                        <p className="text-white font-medium">{tx.name}</p>
                        <p className="text-sm text-slate-400">{tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
