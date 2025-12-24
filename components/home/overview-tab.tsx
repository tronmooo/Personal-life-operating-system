'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Package, Settings, FileText, Home, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface OverviewTabProps {
  home: any
}

export function OverviewTab({ home }: OverviewTabProps) {
  const [pieData, setPieData] = useState<any[]>([])

  // Calculate total property value = base property value + assets value
  const basePropertyValue = Number(home.propertyValue || 0)
  const assetsValue = Number(home.totalAssetsValue || 0)
  const totalPropertyValue = basePropertyValue + assetsValue

  useEffect(() => {
    // Prepare pie chart data
    const maintenance = home.totalMaintenanceTasks || 0
    const assets = home.totalAssets || 0
    const projects = home.totalProjects || 0
    
    setPieData([
      { name: 'Maintenance', value: maintenance || 1, color: '#3b82f6' },
      { name: 'Assets', value: assets || 1, color: '#10b981' },
      { name: 'Projects', value: projects || 1, color: '#f59e0b' },
    ])
  }, [home])

  const stats = [
    { 
      icon: Wrench, 
      label: 'Maintenance Tasks', 
      value: home.totalMaintenanceTasks || 0,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: Package, 
      label: 'Assets', 
      value: home.totalAssets || 0,
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: Settings, 
      label: 'Projects', 
      value: home.totalProjects || 0,
      color: 'from-yellow-500 to-yellow-600'
    },
    { 
      icon: FileText, 
      label: 'Documents', 
      value: home.totalDocuments || 0,
      color: 'from-purple-500 to-purple-600'
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Total Property Value Card - includes assets */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500 rounded-xl">
            <Home className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-1">Total Property Value</p>
            <p className="text-2xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
              ${totalPropertyValue.toLocaleString()}
            </p>
            
            {/* Breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Property Value</p>
                </div>
                <p className="text-lg font-semibold text-blue-600" suppressHydrationWarning>
                  ${basePropertyValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Home Contents</p>
                </div>
                <p className="text-lg font-semibold text-purple-600" suppressHydrationWarning>
                  ${assetsValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{home.totalAssets || 0} items</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* Pie Chart at Top */}
      <Card className="p-3 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
        <h3 className="text-base sm:text-2xl font-bold mb-2 sm:mb-4">Activity Distribution</h3>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={180} className="sm:!h-[280px]">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={55}
                fill="#8884d8"
                dataKey="value"
                fontSize={11}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-2.5 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <div className={`w-7 h-7 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1.5 sm:mb-3`}>
                <Icon className="h-3.5 w-3.5 sm:h-6 sm:w-6 text-white" />
              </div>
              <p className="text-lg sm:text-3xl font-bold mb-0.5">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{stat.label}</p>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
