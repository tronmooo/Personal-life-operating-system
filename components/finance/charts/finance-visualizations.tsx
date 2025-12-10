'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// ============ NET WORTH TREND CHART ============
interface NetWorthTrendProps {
  data: Array<{ month: string; value: number }>
}

export function NetWorthTrendChart({ data }: NetWorthTrendProps) {
  const { maxValue, minValue } = useMemo(() => {
    const values = data.map(d => d.value)
    return {
      maxValue: Math.max(...values, 1),
      minValue: Math.min(...values, 0)
    }
  }, [data])

  const range = maxValue - minValue || 1

  return (
    <div className="h-40 relative">
      <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
        {/* Grid lines */}
        <g className="text-slate-700/30">
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 30}
              x2="400"
              y2={i * 30}
              stroke="currentColor"
              strokeDasharray="4,4"
            />
          ))}
        </g>

        {/* Area gradient */}
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`
            M 0,${120 - ((data[0]?.value - minValue) / range) * 100}
            ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 400
              const y = 120 - ((d.value - minValue) / range) * 100
              return `L ${x},${y}`
            }).join(' ')}
            L 400,120
            L 0,120
            Z
          `}
          fill="url(#netWorthGradient)"
        />

        {/* Line */}
        <path
          d={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 400
            const y = 120 - ((d.value - minValue) / range) * 100
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`
          }).join(' ')}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 400
          const y = 120 - ((d.value - minValue) / range) * 100
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="rgb(34, 197, 94)"
              className="drop-shadow-md"
            />
          )
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-slate-400">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

// ============ CASH FLOW BAR CHART ============
interface CashFlowBarChartProps {
  data: Array<{ month: string; income: number; expenses: number }>
}

export function CashFlowBarChart({ data }: CashFlowBarChartProps) {
  const maxValue = useMemo(() => {
    const allValues = data.flatMap(d => [d.income, d.expenses])
    return Math.max(...allValues, 1)
  }, [data])

  return (
    <div className="h-40 flex items-end gap-2">
      {data.map((d, i) => {
        const incomeHeight = (d.income / maxValue) * 100
        const expenseHeight = (d.expenses / maxValue) * 100

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end justify-center h-28">
              <div
                className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-500"
                style={{ height: `${incomeHeight}%` }}
              />
              <div
                className="w-3 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t transition-all duration-500"
                style={{ height: `${expenseHeight}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{d.month}</span>
          </div>
        )
      })}
    </div>
  )
}

// ============ BUDGET PROGRESS RING ============
interface BudgetProgressRingProps {
  categories?: Array<{
    category: string
    budgetedAmount: number
    spentAmount: number
  }>
}

export function BudgetProgressRing({ categories = [] }: BudgetProgressRingProps) {
  const topCategories = (categories || []).slice(0, 4)

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {topCategories.map((cat, i) => {
        const percent = cat.budgetedAmount > 0
          ? Math.min((cat.spentAmount / cat.budgetedAmount) * 100, 100)
          : 0
        const isOverBudget = cat.spentAmount > cat.budgetedAmount
        const circumference = 2 * Math.PI * 30
        const strokeDashoffset = circumference - (percent / 100) * circumference

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="rgb(51, 65, 85)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke={isOverBudget ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {percent.toFixed(0)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-16 text-center">
              {cat.category}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============ UPCOMING BILLS LIST ============
interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
  provider?: string
}

interface UpcomingBillsListProps {
  bills: Bill[]
  maxItems?: number
}

export function UpcomingBillsList({ bills, maxItems = 5 }: UpcomingBillsListProps) {
  const sortedBills = useMemo(() => {
    return [...bills]
      .filter(b => b.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, maxItems)
  }, [bills, maxItems])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diff < 0) return 'Overdue'
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Tomorrow'
      if (diff <= 7) return `${diff} days`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (sortedBills.length === 0) {
    return (
      <div className="text-center text-slate-400 py-4 text-sm">
        No upcoming bills
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedBills.map(bill => (
        <div
          key={bill.id}
          className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            bill.status === 'overdue' ? 'bg-rose-950/30 border border-rose-900/50' : 'bg-slate-800/50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              bill.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'
            )} />
            <div>
              <p className="text-sm text-white font-medium">{bill.name}</p>
              <p className="text-xs text-slate-400">{bill.provider || 'Provider'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white">
              ${bill.amount.toLocaleString()}
            </p>
            <p className={cn(
              "text-xs",
              bill.status === 'overdue' ? 'text-rose-400' : 'text-slate-400'
            )}>
              {formatDate(bill.dueDate)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============ SPENDING DONUT CHART ============
interface SpendingDonutChartProps {
  data: Array<{ category: string; amount: number; color?: string }>
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food': 'rgb(251, 146, 60)',
  'Transportation': 'rgb(96, 165, 250)',
  'Housing': 'rgb(167, 139, 250)',
  'Entertainment': 'rgb(251, 113, 133)',
  'Utilities': 'rgb(45, 212, 191)',
  'Shopping': 'rgb(250, 204, 21)',
  'Healthcare': 'rgb(244, 114, 182)',
  'Other': 'rgb(148, 163, 184)',
}

export function SpendingDonutChart({ data }: SpendingDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  
  const segments = useMemo(() => {
    let currentAngle = 0
    return data.map((d, i) => {
      const percent = total > 0 ? d.amount / total : 0
      const angle = percent * 360
      const startAngle = currentAngle
      currentAngle += angle
      
      return {
        ...d,
        percent,
        startAngle,
        endAngle: currentAngle,
        color: d.color || CATEGORY_COLORS[d.category] || `hsl(${i * 60}, 70%, 60%)`
      }
    })
  }, [data, total])

  const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, radius, endAngle)
    const end = polarToCartesian(cx, cy, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: cx + (radius * Math.cos(angleInRadians)),
      y: cy + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={describeArc(50, 50, 40, seg.startAngle, seg.endAngle - 0.5)}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-white">${total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-1">
        {segments.slice(0, 4).map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-300 flex-1 truncate">{seg.category}</span>
            <span className="text-xs text-slate-400">{(seg.percent * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ SPENDING SPARKLINE ============
interface SpendingSparklineProps {
  data: Array<{ date: string; amount: number }>
}

export function SpendingSparkline({ data }: SpendingSparklineProps) {
  const maxValue = Math.max(...data.map(d => d.amount), 1)

  return (
    <div className="h-12">
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 10} 40`} preserveAspectRatio="none">
        <path
          d={data.map((d, i) => {
            const x = i * 10 + 5
            const y = 40 - (d.amount / maxValue) * 36
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`
          }).join(' ')}
          fill="none"
          stroke="rgb(96, 165, 250)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ============ ASSET ALLOCATION TREEMAP ============
interface AssetAllocationTreemapProps {
  data: Array<{ name: string; value: number; type?: string }>
}

export function AssetAllocationTreemap({ data }: AssetAllocationTreemapProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)

  const TYPE_COLORS: Record<string, string> = {
    'real-estate': 'from-emerald-600 to-emerald-800',
    'investment': 'from-blue-600 to-blue-800',
    'vehicle': 'from-amber-600 to-amber-800',
    'valuables': 'from-violet-600 to-violet-800',
    'other': 'from-slate-600 to-slate-800',
  }

  return (
    <div className="grid grid-cols-4 gap-1 h-32">
      {sorted.slice(0, 8).map((item, i) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0
        const colorClass = TYPE_COLORS[item.type || 'other'] || TYPE_COLORS.other

        return (
          <div
            key={i}
            className={cn(
              "rounded-lg p-2 flex flex-col justify-end bg-gradient-to-br",
              colorClass,
              i === 0 && "col-span-2 row-span-2"
            )}
          >
            <p className="text-[10px] text-white/80 truncate">{item.name}</p>
            <p className="text-sm font-bold text-white">{percent.toFixed(0)}%</p>
          </div>
        )
      })}
    </div>
  )
}

// ============ ASSET VALUE TREND CHART ============
interface AssetValueTrendChartProps {
  data: Array<{ date: string; value: number }>
}

export function AssetValueTrendChart({ data }: AssetValueTrendChartProps) {
  const { maxValue, minValue } = useMemo(() => {
    const values = data.map(d => d.value)
    return {
      maxValue: Math.max(...values, 1),
      minValue: Math.min(...values, 0)
    }
  }, [data])

  const range = maxValue - minValue || 1

  return (
    <div className="h-32">
      <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`
            M 0,${100 - ((data[0]?.value - minValue) / range) * 80}
            ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 400
              const y = 100 - ((d.value - minValue) / range) * 80
              return `L ${x},${y}`
            }).join(' ')}
            L 400,100
            L 0,100
            Z
          `}
          fill="url(#assetGradient)"
        />

        <path
          d={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 400
            const y = 100 - ((d.value - minValue) / range) * 80
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`
          }).join(' ')}
          fill="none"
          stroke="rgb(251, 191, 36)"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

// ============ DEBT COMPARISON CHART ============
interface DebtComparisonChartProps {
  data: Array<{ name: string; currentBalance: number; originalBalance: number }>
}

export function DebtComparisonChart({ data }: DebtComparisonChartProps) {
  const maxValue = Math.max(...data.flatMap(d => [d.currentBalance, d.originalBalance]), 1)

  return (
    <div className="space-y-3">
      {data.slice(0, 4).map((debt, i) => {
        const currentPercent = (debt.currentBalance / maxValue) * 100
        const originalPercent = (debt.originalBalance / maxValue) * 100
        const paidPercent = debt.originalBalance > 0
          ? ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100
          : 0

        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 truncate">{debt.name}</span>
              <span className="text-emerald-400">{paidPercent.toFixed(0)}% paid</span>
            </div>
            <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-slate-600 rounded-full"
                style={{ width: `${originalPercent}%` }}
              />
              <div
                className="absolute h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ PAYOFF TIMELINE ============
interface PayoffTimelineProps {
  debts: Array<{ name: string; payoffDate?: string; currentBalance: number }>
}

export function PayoffTimeline({ debts }: PayoffTimelineProps) {
  const sortedDebts = useMemo(() => {
    return [...debts]
      .filter(d => d.payoffDate)
      .sort((a, b) => new Date(a.payoffDate!).getTime() - new Date(b.payoffDate!).getTime())
      .slice(0, 4)
  }, [debts])

  if (sortedDebts.length === 0) {
    return (
      <div className="text-center text-slate-400 py-4 text-sm">
        No payoff dates set
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-700" />
      <div className="space-y-4 pl-8">
        {sortedDebts.map((debt, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-rose-500" />
            <p className="text-sm text-white font-medium">{debt.name}</p>
            <p className="text-xs text-slate-400">
              {new Date(debt.payoffDate!).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ DEBT TO INCOME GAUGE ============
interface DebtToIncomeGaugeProps {
  ratio: number
}

export function DebtToIncomeGauge({ ratio }: DebtToIncomeGaugeProps) {
  const clampedRatio = Math.min(ratio, 100)
  const angle = (clampedRatio / 100) * 180 - 90

  const getColor = () => {
    if (ratio <= 36) return 'rgb(34, 197, 94)'
    if (ratio <= 50) return 'rgb(250, 204, 21)'
    return 'rgb(239, 68, 68)'
  }

  return (
    <div className="relative w-32 h-20 mx-auto">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgb(51, 65, 85)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${clampedRatio * 1.26} 126`}
        />
        {/* Needle */}
        <line
          x1="50"
          y1="55"
          x2="50"
          y2="20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${angle}, 50, 55)`}
        />
        <circle cx="50" cy="55" r="4" fill="white" />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-lg font-bold text-white">{ratio.toFixed(0)}%</span>
        <p className="text-xs text-slate-400">DTI Ratio</p>
      </div>
    </div>
  )
}

// ============ BILLS CALENDAR ============
interface BillsCalendarProps {
  bills: Array<{ id: string; name: string; dueDate: string; amount: number; status: string }>
}

export function BillsCalendar({ bills }: BillsCalendarProps) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()

  const billsByDay = useMemo(() => {
    const map: Record<number, typeof bills> = {}
    bills.forEach(bill => {
      try {
        const date = new Date(bill.dueDate)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          const day = date.getDate()
          if (!map[day]) map[day] = []
          map[day].push(bill)
        }
      } catch {}
    })
    return map
  }, [bills, currentMonth, currentYear])

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const hasBills = day && billsByDay[day]?.length > 0
          const isToday = day === now.getDate()

          return (
            <div
              key={i}
              className={cn(
                "h-6 rounded text-[10px] flex items-center justify-center",
                day ? (hasBills 
                  ? "bg-violet-500/30 text-violet-300 font-semibold"
                  : "text-slate-400"
                ) : "bg-transparent",
                isToday && "ring-1 ring-white"
              )}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ BUDGET ALLOCATION DONUT ============
interface BudgetAllocationDonutProps {
  data: Array<{ category: string; amount: number; color?: string }>
  height?: number
}

export function BudgetAllocationDonut({ data, height = 200 }: BudgetAllocationDonutProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  
  const segments = useMemo(() => {
    let currentAngle = 0
    return data.map((d, i) => {
      const percent = total > 0 ? d.amount / total : 0
      const angle = percent * 360
      const startAngle = currentAngle
      currentAngle += angle
      
      const colors = [
        'rgb(34, 197, 94)',   // green
        'rgb(59, 130, 246)',  // blue
        'rgb(168, 85, 247)',  // purple
        'rgb(236, 72, 153)',  // pink
        'rgb(249, 115, 22)',  // orange
        'rgb(234, 179, 8)',   // yellow
        'rgb(20, 184, 166)',  // teal
        'rgb(99, 102, 241)',  // indigo
      ]
      
      return {
        ...d,
        percent,
        startAngle,
        endAngle: currentAngle,
        color: d.color || colors[i % colors.length]
      }
    })
  }, [data, total])

  const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, radius, endAngle)
    const end = polarToCartesian(cx, cy, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: cx + (radius * Math.cos(angleInRadians)),
      y: cy + (radius * Math.sin(angleInRadians))
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No budget data
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6" style={{ height }}>
      <div className="relative" style={{ width: height * 0.7, height: height * 0.7 }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((seg, i) => (
            seg.percent > 0 && (
              <path
                key={i}
                d={describeArc(50, 50, 35, seg.startAngle, seg.endAngle - 0.5)}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-white">${total.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Budget</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 max-h-full overflow-y-auto">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-slate-300 flex-1 truncate">{seg.category}</span>
            <span className="text-sm text-white font-medium">${seg.amount.toLocaleString()}</span>
            <span className="text-xs text-slate-400 w-10 text-right">{(seg.percent * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ MONTH OVER MONTH COMPARISON ============
interface MonthOverMonthComparisonProps {
  current: { budgeted: number; spent: number }
  previous: { budgeted: number; spent: number }
}

export function MonthOverMonthComparison({ current, previous }: MonthOverMonthComparisonProps) {
  const spentChange = previous.spent > 0
    ? ((current.spent - previous.spent) / previous.spent) * 100
    : 0

  const budgetChange = previous.budgeted > 0
    ? ((current.budgeted - previous.budgeted) / previous.budgeted) * 100
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Spending</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            ${current.spent.toLocaleString()}
          </span>
          <span className={cn(
            "text-xs",
            spentChange > 0 ? "text-rose-400" : "text-emerald-400"
          )}>
            {spentChange > 0 ? '↑' : '↓'} {Math.abs(spentChange).toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Budget</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            ${current.budgeted.toLocaleString()}
          </span>
          <span className={cn(
            "text-xs",
            budgetChange > 0 ? "text-emerald-400" : "text-amber-400"
          )}>
            {budgetChange > 0 ? '↑' : '↓'} {Math.abs(budgetChange).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Budget Usage</span>
          <span>
            {current.budgeted > 0 
              ? ((current.spent / current.budgeted) * 100).toFixed(0) 
              : 0
            }%
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              current.spent > current.budgeted
                ? "bg-rose-500"
                : current.spent / current.budgeted > 0.8
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
            style={{ 
              width: `${Math.min((current.spent / current.budgeted) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}
