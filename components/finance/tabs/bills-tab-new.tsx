// @ts-nocheck
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { Plus, Trash2, Calendar, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react'
import { BillsVisual } from '../visuals/tab-visuals'
import { BillsCalendar, UpcomingBillsList } from '../charts/finance-visualizations'
import { cn } from '@/lib/utils'

interface BillsTabProps {
  onOpenBillDialog?: () => void
}

type ViewMode = 'calendar' | 'list'

export function BillsTab({ onOpenBillDialog }: BillsTabProps = {}) {
  const { billSummary, bills, deleteBill } = useFinance()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Prepare bills for calendar view
  const calendarBills = useMemo(() => {
    return bills.map(bill => ({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.due_date,
      status: bill.status as 'paid' | 'pending' | 'overdue'
    }))
  }, [bills])

  // Prepare bills for upcoming list
  const upcomingBillsList = useMemo(() => {
    return bills.map(bill => ({
      id: bill.id,
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.due_date,
      status: bill.status as 'paid' | 'pending' | 'overdue',
      provider: bill.provider
    }))
  }, [bills])

  // Calculate bill statistics
  const billStats = useMemo(() => {
    const now = new Date()
    const overdue = bills.filter(b => {
      const due = new Date(b.due_date)
      return due < now && b.status !== 'paid'
    })
    const dueSoon = bills.filter(b => {
      const due = new Date(b.due_date)
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 7 && b.status !== 'paid'
    })
    const paid = bills.filter(b => b.status === 'paid')
    
    return { overdue, dueSoon, paid }
  }, [bills])

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <BillsVisual />
      
      {/* Top Row - 3 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Upcoming Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {billSummary?.upcomingBillsCount || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Bills due soon</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(billSummary?.totalAmountDue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Upcoming payments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Auto-Pay Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {billSummary?.autoPayCount || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Automated payments</p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Bills Calendar/Timeline View */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-slate-200">Bills Calendar</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    viewMode === 'calendar' 
                      ? "bg-violet-500 text-white" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    viewMode === 'list' 
                      ? "bg-violet-500 text-white" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              {/* Month Navigation (only for calendar view) */}
              {viewMode === 'calendar' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-white min-w-[120px] text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <CardDescription className="text-slate-400">
            {viewMode === 'calendar' 
              ? 'See all your bills at a glance' 
              : 'Upcoming bills sorted by due date'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            <BillsCalendar 
              month={currentMonth} 
              year={currentYear} 
              bills={calendarBills} 
            />
          ) : (
            <UpcomingBillsList bills={upcomingBillsList} limit={10} />
          )}
        </CardContent>
      </Card>

      {/* Bill Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overdue */}
        <Card className={cn(
          "border",
          billStats.overdue.length > 0 
            ? "bg-rose-950/30 border-rose-800/50" 
            : "bg-slate-800/50 border-slate-700"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span>
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              billStats.overdue.length > 0 ? "text-rose-400" : "text-white"
            )}>
              {billStats.overdue.length}
            </div>
            {billStats.overdue.length > 0 && (
              <p className="text-xs text-rose-300 mt-1">
                {formatCurrency(billStats.overdue.reduce((s, b) => s + b.amount, 0))} total
              </p>
            )}
          </CardContent>
        </Card>

        {/* Due This Week */}
        <Card className={cn(
          "border",
          billStats.dueSoon.length > 0 
            ? "bg-amber-950/30 border-amber-800/50" 
            : "bg-slate-800/50 border-slate-700"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <span className="text-amber-500">🔔</span>
              Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              billStats.dueSoon.length > 0 ? "text-amber-400" : "text-white"
            )}>
              {billStats.dueSoon.length}
            </div>
            {billStats.dueSoon.length > 0 && (
              <p className="text-xs text-amber-300 mt-1">
                {formatCurrency(billStats.dueSoon.reduce((s, b) => s + b.amount, 0))} total
              </p>
            )}
          </CardContent>
        </Card>

        {/* Paid This Month */}
        <Card className="bg-emerald-950/30 border-emerald-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Paid This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {billStats.paid.length}
            </div>
            {billStats.paid.length > 0 && (
              <p className="text-xs text-emerald-300 mt-1">
                {formatCurrency(billStats.paid.reduce((s, b) => s + b.amount, 0))} total
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bills Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-200">Recurring Bills & Insurance</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your regular payments and policies
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-slate-900"
              onClick={() => onOpenBillDialog?.()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Provider</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Auto-Pay</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Notes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No bills yet. Add your first recurring bill to stay on top of payments.
                    </td>
                  </tr>
                ) : (
                  bills.map(bill => (
                    <tr key={bill.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4 text-base font-medium text-white">{bill.provider}</td>
                      <td className="py-4 px-4 text-sm text-slate-400">{bill.category}</td>
                      <td className="py-4 px-4 text-base font-semibold text-white">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">{bill.due_date}</td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {bill.is_autopay ? '✓ Yes' : 'No'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'paid'
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : bill.status === 'overdue'
                            ? 'bg-red-900/30 text-red-400 border border-red-800'
                            : 'bg-orange-900/30 text-orange-400 border border-orange-800'
                        }`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">{bill.notes || '-'}</td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-900/30"
                          onClick={() => deleteBill(bill.id)}
                        >
                          <Trash2 className="h-5 w-5 text-red-400" />
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
