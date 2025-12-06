'use client'

import { useEffect } from 'react'

import {
  Home, Car, Heart, Dumbbell, Apple, Brain, Dog, Users, GraduationCap,
  Monitor, Scale, FileText, Shield, Lightbulb, Briefcase, Package
} from 'lucide-react'

interface GenericDomainCardProps {
  domain: string
  size: 'small' | 'medium' | 'large'
  data: any
  icon?: string
  title?: string
  color?: string
}

const DOMAIN_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  home: { icon: Home, color: 'blue', label: 'Home' },
  vehicles: { icon: Car, color: 'purple', label: 'Vehicles' },
  health: { icon: Heart, color: 'red', label: 'Health' },
  fitness: { icon: Dumbbell, color: 'orange', label: 'Fitness' },
  nutrition: { icon: Apple, color: 'green', label: 'Nutrition' },
  mindfulness: { icon: Brain, color: 'indigo', label: 'Mindfulness' },
  pets: { icon: Dog, color: 'amber', label: 'Pets' },
  relationships: { icon: Users, color: 'pink', label: 'Relationships' },
  education: { icon: GraduationCap, color: 'blue', label: 'Education' },
  digital: { icon: Monitor, color: 'cyan', label: 'Digital' },
  collectibles: { icon: Package, color: 'purple', label: 'Collectibles' },
  appliances: { icon: Scale, color: 'gray', label: 'Appliances' },
  legal: { icon: FileText, color: 'slate', label: 'Legal' },
  insurance: { icon: Shield, color: 'green', label: 'Insurance' },
  utilities: { icon: Lightbulb, color: 'yellow', label: 'Utilities' },
  career: { icon: Briefcase, color: 'blue', label: 'Career' },
}

export function GenericDomainCard({ domain, size, data, icon, title, color }: GenericDomainCardProps) {
  const config = DOMAIN_CONFIG[domain] || { icon: Package, color: 'gray', label: domain }
  const Icon = config.icon
  const domainData = data?.[domain] || []
  const count = Array.isArray(domainData) ? domainData.length : 0
  
  const colorClasses = getColorClasses(color || config.color)

  useEffect(() => {
    console.log('[GenericDomainCard] Component mounting')
    console.log('[GenericDomainCard] Props received:', { domain, size, data, icon, title, color })
    console.log('[GenericDomainCard] Hook data:', { domainData })
  }, [domain, size, data, icon, title, color, domainData])

  console.log('[GenericDomainCard] Rendering with values:', {
    domain,
    size,
    count,
    colorClasses,
  })

  if (size === 'small') {
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{icon || '📦'}</span>
          <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
        </div>
        <div>
          <div className="text-3xl font-bold">{count}</div>
          <div className="text-xs text-gray-500">{count === 1 ? 'Item' : 'Items'}</div>
        </div>
      </div>
    )
  }

  if (size === 'medium') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
            <span className="font-semibold">{title || config.label}</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${colorClasses.badge}`}>
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className={`${colorClasses.bg} p-3 rounded-lg`}>
            <div className={`text-2xl font-bold ${colorClasses.text}`}>{count}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{getStats(domainData).active}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>
        </div>
      </div>
    )
  }

  // Large size
  const stats = getStats(domainData)
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
          <span className="text-lg font-semibold">{title || config.label}</span>
        </div>
        <span className={`text-xs px-3 py-1 ${colorClasses.badge} rounded-full font-medium`}>
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`${colorClasses.gradientBg} p-4 rounded-lg ${colorClasses.border}`}>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</div>
          <div className={`text-3xl font-bold ${colorClasses.text}`}>{count}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Inactive</div>
          <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Completion</span>
          <span className="text-xs font-medium">{stats.completion}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses.bgSolid} transition-all`}
            style={{ width: `${stats.completion}%` }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Recent Activity</div>
        <div className="space-y-2">
          {domainData.slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${colorClasses.bgSolid}`} />
              <span className="flex-1 truncate">{item.name || item.title || `Item ${i + 1}`}</span>
              <span className="text-gray-500">{formatDate(item.date || item.created_at)}</span>
            </div>
          ))}
          {domainData.length === 0 && (
            <div className="text-center text-gray-400 py-4">No items yet</div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-center text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}

function getColorClasses(color: string) {
  const colorMap: Record<string, any> = {
    blue: {
      icon: 'text-blue-600',
      text: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      bgSolid: 'bg-blue-500',
      gradientBg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 text-blue-700',
    },
    purple: {
      icon: 'text-purple-600',
      text: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      bgSolid: 'bg-purple-500',
      gradientBg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-100 text-purple-700',
    },
    green: {
      icon: 'text-green-600',
      text: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      bgSolid: 'bg-green-500',
      gradientBg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border border-green-200 dark:border-green-800',
      badge: 'bg-green-100 text-green-700',
    },
    red: {
      icon: 'text-red-600',
      text: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      bgSolid: 'bg-red-500',
      gradientBg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-700',
    },
    orange: {
      icon: 'text-orange-600',
      text: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      bgSolid: 'bg-orange-500',
      gradientBg: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      border: 'border border-orange-200 dark:border-orange-800',
      badge: 'bg-orange-100 text-orange-700',
    },
  }

  return colorMap[color] || colorMap.blue
}

function getStats(data: any[]) {
  if (!Array.isArray(data)) {
    return { active: 0, inactive: 0, completion: 0 }
  }

  const active = data.filter(item => item.status === 'active' || !item.status).length
  const inactive = data.length - active
  const completion = data.length > 0 ? Math.round((active / data.length) * 100) : 0

  return { active, inactive, completion }
}

function formatDate(date: any): string {
  if (!date) return 'Today'
  try {
    const d = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - d.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}




























