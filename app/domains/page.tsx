'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DOMAIN_CONFIGS } from '@/types/domains'
import type { Domain, DomainData } from '@/types/domains'
import { cn } from '@/lib/utils'
import {
  computeHealthStats,
  computePetsStats,
  extractMetadata,
  hasTruthyValue,
  parseNumeric,
  pickFirstDate,
} from '@/lib/dashboard/metrics-normalizers'
import type { GenericMetadata } from '@/lib/dashboard/metrics-normalizers'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

// Helper to safely convert metadata values to Date
function toSafeDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}
import { 
  Heart, DollarSign, Briefcase, Shield, Home, Car, Users, 
  GraduationCap, PawPrint, Plane, Star, Smartphone, Leaf, 
  Mountain, Utensils, FileText, Zap, Activity, Calendar, 
  Target, AlertCircle, CheckCircle, BarChart3, Sparkles, 
  Grid3x3, List, Eye, Plus, TrendingUp, Moon, Globe, ChevronRight, User, Flame
} from 'lucide-react'
import Link from 'next/link'

const DOMAIN_ICONS: Record<string, any> = {
  health: Heart,
  financial: DollarSign,
  insurance: Shield,
  home: Home,
  vehicles: Car,
  relationships: Users,
  education: GraduationCap,
  pets: PawPrint,
  travel: Plane,
  digital: Smartphone,
  mindfulness: Leaf,
  outdoor: Mountain,
  nutrition: Utensils,
  documents: FileText,
  utilities: Zap,
  appliances: Activity,
  schedule: Calendar,
  legal: FileText,
  miscellaneous: Star
}

const DOMAIN_GRADIENTS: Record<string, string> = {
  health: 'from-red-500 to-pink-500',
  financial: 'from-green-500 to-emerald-500',
  career: 'from-blue-500 to-indigo-500',
  insurance: 'from-purple-500 to-violet-500',
  home: 'from-orange-500 to-amber-500',
  vehicles: 'from-indigo-500 to-blue-500',
  relationships: 'from-pink-500 to-rose-500',
  education: 'from-cyan-500 to-blue-500',
  pets: 'from-amber-500 to-yellow-500',
  travel: 'from-sky-500 to-cyan-500',
  digital: 'from-gray-500 to-slate-500',
  mindfulness: 'from-emerald-500 to-teal-500',
  outdoor: 'from-green-600 to-lime-500',
  nutrition: 'from-orange-600 to-red-500',
  documents: 'from-slate-500 to-gray-500',
  utilities: 'from-yellow-500 to-orange-500',
  appliances: 'from-teal-500 to-cyan-500',
  schedule: 'from-lime-500 to-green-500',
  legal: 'from-slate-600 to-gray-600',
  miscellaneous: 'from-violet-500 to-purple-500'
}

const pickString = (meta: GenericMetadata, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = meta[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

const hasMetaValue = (meta: GenericMetadata, ...keys: string[]): boolean => hasTruthyValue(meta, keys)

const pickDate = (meta: GenericMetadata, ...keys: string[]): Date | null => pickFirstDate(meta, keys)

const FILTER_OPTIONS: Array<'all' | 'active' | 'inactive'> = ['all', 'active', 'inactive']

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Helper function to get KPIs for each domain
export function getDomainKPIs(domainKey: string, data: Record<string, DomainData[]>) {
  const domainData = (data[domainKey] ?? []) as DomainData[]
  const itemCount = domainData.length

  switch (domainKey) {
    case 'appliances': {
      const totalValue = domainData.reduce((sum, item) => {
        const meta = extractMetadata(item)
        const price = parseNumeric(
          meta['value'] ?? meta['purchasePrice'] ?? meta['estimatedValue'] ?? meta['cost']
        )
        return sum + price
      }, 0)

      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      // Warranties expiring within 30 days
      const warrantiesDue = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const expiry = pickString(meta, 'warrantyExpiry', 'warrantyExpires')
        const expiryDate = toSafeDate(expiry)
        return expiryDate ? (expiryDate > now && expiryDate <= thirtyDaysFromNow) : false
      }).length

      // Total cost: purchase price + maintenance costs + all costs from appliance_costs table
      const totalCost = domainData.reduce((sum, item) => {
        const meta = extractMetadata(item)
        
        // Add purchase price
        const purchasePrice = parseNumeric(
          meta['purchasePrice'] ?? meta['purchase_price'] ?? meta['value']
        )
        
        // Add maintenance costs
        const maintenanceCost = parseNumeric(
          meta['cost'] ?? meta['maintenanceCost'] ?? meta['annualCost'] ?? meta['maintenance_cost']
        )
        
        // Add all costs from appliance_costs table
        const allCosts = parseNumeric(
          meta['totalCostsFromTable'] ?? meta['allCosts']
        )
        
        return sum + purchasePrice + maintenanceCost + allCosts
      }, 0)

      const underWarranty = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const expiry = pickString(meta, 'warrantyExpiry', 'warrantyExpires')
        const expiryDate = toSafeDate(expiry)
        return expiryDate ? expiryDate > now : false
      }).length

      return {
        kpi1: { label: 'Total Value', value: totalValue > 0 ? `$${(totalValue / 1000).toFixed(1)}K` : '$0', icon: DollarSign },
        kpi2: { label: 'Under Warranty', value: underWarranty.toString(), icon: Shield },
        kpi3: { label: 'Warranties Expiring Soon', value: warrantiesDue.toString(), icon: AlertCircle },
        kpi4: { label: 'Total Cost', value: totalCost > 0 ? `$${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0', icon: DollarSign },
      }
    }
    case 'career': {
      const applications = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('application')) return true
        return Boolean(meta.jobTitle || meta.company)
      }).length
      const skills = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('skill')) return true
        return Boolean(meta.skillName || meta.skillLevel)
      }).length
      const certs = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('certification') || itemType.includes('certificate')) return true
        return Boolean(meta.certificationName)
      }).length
      const interviews = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('interview')) return true
        return Boolean(meta.interviewDate)
      }).length
      
      return {
        kpi1: { label: 'Applications', value: applications.toString(), icon: FileText },
        kpi2: { label: 'Skills Tracked', value: skills.toString(), icon: Star },
        kpi3: { label: 'Certifications', value: certs.toString(), icon: GraduationCap },
        kpi4: { label: 'Interviews', value: interviews.toString(), icon: Users }
      }
    }
    case 'digital': {
      const subs = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const category = String(meta.category || meta.itemType || meta.type || '').toLowerCase()
        return category.includes('subscription') || Boolean(meta.subscriptionName || meta.monthlyCost || meta.monthlyFee)
      })
      const totalCost = subs.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.monthlyCost ?? meta.monthlyFee ?? meta.cost ?? meta.amount)
      }, 0)
      const passwords = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const category = String(meta.category || meta.itemType || '').toLowerCase()
        return category.includes('password') || Boolean(meta.username && meta.password)
      }).length
      const expiring = subs.filter((item) => {
        const meta = extractMetadata(item)
        const renewal = meta.renewalDate || meta.expiryDate || meta.expirationDate
        const renewalDate = toSafeDate(renewal)
        if (!renewalDate) return false
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return renewalDate <= thirtyDays
      }).length
      
      return {
        kpi1: { label: 'Monthly Cost', value: totalCost > 0 ? `$${totalCost.toFixed(0)}` : '$0', icon: DollarSign },
        kpi2: { label: 'Subscriptions', value: subs.length.toString(), icon: Smartphone },
        kpi3: { label: 'Passwords', value: passwords.toString(), icon: Shield },
        kpi4: { label: 'Expiring Soon', value: expiring.toString(), icon: AlertCircle }
      }
    }
    case 'education': {
      const courses = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('course') || itemType.includes('class')) return true
        return Boolean(meta.courseName || meta.program)
      })
      const completed = courses.filter((item) => {
        const meta = extractMetadata(item)
        const status = String(meta.status || '').toLowerCase()
        return status.includes('completed') || status.includes('finished') || meta.completed === true
      }).length
      const active = courses.filter((item) => {
        const meta = extractMetadata(item)
        const status = String(meta.status || '').toLowerCase()
        if (status.includes('active') || status.includes('progress')) return true
        if (meta.completed === false) return true
        return status === ''
      }).length
      const studyHours = courses.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.studyHours ?? meta.hours ?? meta.timeInvested)
      }, 0)
      const certificates = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('certificate') || itemType.includes('certification')) return true
        return Boolean(meta.certificateName)
      }).length
      
      return {
        kpi1: { label: 'Active Courses', value: active.toString(), icon: GraduationCap },
        kpi2: { label: 'Completed', value: completed.toString(), icon: CheckCircle },
        kpi3: { label: 'Study Hours', value: studyHours > 0 ? `${studyHours}h` : '0h', icon: Calendar },
        kpi4: { label: 'Certificates', value: certificates.toString(), icon: Star }
      }
    }
    case 'financial': {
      // Separate assets from liabilities
      let totalAssets = 0
      let totalLiabilities = 0
      let accountCount = 0

      domainData.forEach((item) => {
        const meta = extractMetadata(item)
        const title = item.title?.toLowerCase() || ''
        const type = String(meta.itemType || meta.type || meta.accountType || '').toLowerCase()
        
        // Identify if this is a liability (debt)
        const isDebt = 
          type.includes('loan') || 
          type.includes('debt') || 
          type.includes('credit card') ||
          type.includes('mortgage') ||
          title.includes('loan') ||
          title.includes('debt') ||
          title.includes('credit card') ||
          title.includes('mortgage') ||
          Boolean(meta.debtType) ||
          Boolean(meta.loanType)
        
        // Get the balance/value
        const value = parseNumeric(meta.balance ?? meta.currentBalance ?? meta.value ?? meta.amount)
        
        if (value > 0) {
          // Identify if this is an account-like item
          const isAccount = 
            type.includes('account') || 
            type.includes('bank') || 
            type.includes('checking') ||
            type.includes('savings') ||
            type.includes('card') ||
            Boolean(meta.accountName || meta.accountNumber)
          
          if (isAccount || value > 100) {  // Only count significant amounts
            accountCount++
            
            if (isDebt) {
              totalLiabilities += value
            } else {
              totalAssets += value
            }
          }
        }
      })

      // Calculate net worth (assets - liabilities)
      const netWorth = totalAssets - totalLiabilities

      // Get investments
      const investments = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const type = String(meta.itemType || meta.type || meta.accountType || '').toLowerCase()
        if (type.includes('investment') || type.includes('portfolio') || type.includes('brokerage')) return true
        return Boolean(meta.investmentName || meta.ticker || meta.shares)
      })

      const investmentValue = investments.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.value ?? meta.balance ?? meta.currentValue ?? meta.amount)
      }, 0)

      // Get budget
      const budgetEntry = domainData.find((item) => {
        const meta = extractMetadata(item)
        const type = String(meta.itemType || meta.type || '').toLowerCase()
        return type.includes('budget') || Boolean(meta.monthlyBudget || meta.budgetAmount)
      })

      const budgetMeta = budgetEntry ? extractMetadata(budgetEntry) : null
      const monthlyBudget = budgetMeta ? parseNumeric(budgetMeta.monthlyBudget ?? budgetMeta.amount ?? budgetMeta.value) : 0
      
      // Format net worth with proper sign
      const netWorthDisplay = netWorth >= 1000 
        ? `$${(netWorth / 1000).toFixed(1)}K`
        : netWorth >= 0 
          ? `$${netWorth.toFixed(0)}`
          : `-$${Math.abs(netWorth / 1000).toFixed(1)}K`
      
      return {
        kpi1: { label: 'Net Worth', value: netWorthDisplay, icon: DollarSign },
        kpi2: { label: 'Monthly Budget', value: monthlyBudget > 0 ? `$${(monthlyBudget / 1000).toFixed(1)}K` : '$0', icon: Calendar },
        kpi3: { label: 'Investments', value: investmentValue > 0 ? `$${(investmentValue / 1000).toFixed(1)}K` : '$0', icon: TrendingUp },
        kpi4: { label: 'Accounts', value: accountCount.toString(), icon: Target }
      }
    }
    case 'health': {
      const stats = computeHealthStats(domainData)

      const heartRateDisplay = stats.heartRate > 0 ? `${Math.round(stats.heartRate)} bpm` : '--'
      const weightDisplay = stats.weight > 0 ? `${stats.weight.toFixed(1)} lbs` : '--'

      return {
        kpi1: { label: 'Heart Rate', value: heartRateDisplay, icon: Activity },
        kpi2: { label: 'Weight', value: weightDisplay, icon: Target },
        kpi3: { label: 'Vitals Tracked', value: stats.vitalsCount.toString(), icon: Heart },
        kpi4: { label: 'Items', value: stats.itemsCount.toString(), icon: Calendar }
      }
    }
    case 'home': {
      const totalValue = domainData.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
      const value = parseNumeric(meta.propertyValue ?? meta.currentValue ?? meta.value ?? meta.purchasePrice ?? meta.estimatedValue)
        return sum + value
      }, 0)
      const tasks = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        return itemType.includes('task') || itemType.includes('maintenance') || Boolean(meta.taskName)
      }).length
      const projects = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        return itemType.includes('project') || Boolean(meta.projectName)
      }).length
      
      return {
        kpi1: { label: 'Property Value', value: totalValue > 0 ? `$${(totalValue / 1000).toFixed(0)}K` : '$0', icon: DollarSign },
        kpi2: { label: 'Tasks Pending', value: tasks.toString(), icon: AlertCircle },
        kpi3: { label: 'Projects', value: projects.toString(), icon: Target },
        kpi4: { label: 'Items', value: itemCount.toString(), icon: Calendar }
      }
    }
    case 'insurance': {
      // Document Manager - track documents, expiration status, active/inactive
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      // Count all documents (including policies, legal docs, contracts, etc.)
      const totalDocuments = domainData.length
      
      // Categorize documents by expiration status
      let activeDocuments = 0
      let expiredDocuments = 0
      let expiringSoon = 0
      
      domainData.forEach((item) => {
        const meta = extractMetadata(item)
        
        // Check for expiration date in various fields
        const expiryDate = toSafeDate(
          meta.expiryDate || 
          meta.expirationDate || 
          meta.expiration_date ||
          meta.renewalDate ||
          meta.endDate
        )
        
        // Check status field
        const status = String(meta.status || '').toLowerCase()
        
        // Determine document status
        if (status === 'expired' || status === 'cancelled') {
          expiredDocuments++
        } else if (expiryDate) {
          if (expiryDate < now) {
            // Document has expired based on date
            expiredDocuments++
          } else if (expiryDate <= thirtyDaysFromNow) {
            // Document is expiring within 30 days
            expiringSoon++
            activeDocuments++ // Still active but expiring soon
          } else {
            // Document is active and not expiring soon
            activeDocuments++
          }
        } else {
          // No expiry date - assume active unless status says otherwise
          if (status === 'active' || status === 'pending' || status === 'under review' || !status) {
            activeDocuments++
          } else {
            expiredDocuments++
          }
        }
      })
      
      return {
        kpi1: { label: 'Total Documents', value: totalDocuments.toString(), icon: FileText },
        kpi2: { label: 'Active', value: activeDocuments.toString(), icon: CheckCircle },
        kpi3: { label: 'Expiring Soon', value: expiringSoon.toString(), icon: AlertCircle },
        kpi4: { label: 'Expired', value: expiredDocuments.toString(), icon: AlertCircle }
      }
    }
    case 'legal': {
      const documents = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('document') || itemType.includes('contract')) return true
        return Boolean(meta.documentName || meta.documentType)
      })
      const expiring = documents.filter((item) => {
        const meta = extractMetadata(item)
        const expiry = meta.expiryDate || meta.expirationDate || meta.renewalDate
        const expiryDate = toSafeDate(expiry)
        if (!expiryDate) return false
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return expiryDate <= thirtyDays
      }).length
      const contacts = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('contact') || itemType.includes('attorney')) return true
        return Boolean(meta.contactName || meta.attorney)
      }).length
      
      return {
        kpi1: { label: 'Documents', value: documents.length.toString(), icon: FileText },
        kpi2: { label: 'Expiring Soon', value: expiring.toString(), icon: AlertCircle },
        kpi3: { label: 'Contacts', value: contacts.toString(), icon: Users },
        kpi4: { label: 'Items', value: itemCount.toString(), icon: Calendar }
      }
    }
    case 'mindfulness': {
      const meditations = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.entryType || meta.type || '').toLowerCase()
        if (entryType.includes('meditation') || entryType.includes('mindful')) return true
        return Boolean(meta.meditationMinutes || meta.duration)
      })
      const totalMinutes = meditations.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.meditationMinutes ?? meta.duration)
      }, 0)
      const journals = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.entryType || meta.type || '').toLowerCase()
        if (entryType.includes('journal')) return true
        return Boolean(meta.journalEntry || meta.entry)
      }).length
      const moods = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.entryType || meta.type || '').toLowerCase()
        if (entryType.includes('mood')) return true
        return meta.moodRating !== undefined || meta.moodScore !== undefined
      })
      const avgMood = moods.length > 0 ? moods.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.moodRating ?? meta.moodScore)
      }, 0) / moods.length : 0
      
      return {
        kpi1: { label: 'Meditation', value: totalMinutes > 0 ? `${totalMinutes}m` : '0m', icon: Leaf },
        kpi2: { label: 'Streak', value: itemCount > 0 ? `${itemCount}d` : '0d', icon: Target },
        kpi3: { label: 'Journal Entries', value: journals.toString(), icon: FileText },
        kpi4: { label: 'Mood Avg', value: avgMood > 0 ? avgMood.toFixed(1) : 'N/A', icon: Heart }
      }
    }
    case 'miscellaneous': {
      const totalValue = domainData.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.estimatedValue ?? meta.value ?? meta.cost ?? meta.purchasePrice)
      }, 0)
      const insured = domainData.filter((item) => {
        const meta = extractMetadata(item)
        return meta.insured === true || Boolean(meta.insurancePolicy || meta.policyNumber)
      }).length
      const categories = [...new Set(domainData.map((item) => {
        const meta = extractMetadata(item)
        return meta.category
      }).filter(Boolean))].length
      
      return {
        kpi1: { label: 'Total Value', value: totalValue > 0 ? `$${(totalValue / 1000).toFixed(1)}K` : '$0', icon: DollarSign },
        kpi2: { label: 'Insured Items', value: insured.toString(), icon: Shield },
        kpi3: { label: 'Categories', value: categories.toString(), icon: Grid3x3 },
        kpi4: { label: 'Items', value: itemCount.toString(), icon: Calendar }
      }
    }
    case 'nutrition': {
      const meals = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.itemType || meta.type || meta.mealType || '').toLowerCase()
        if (entryType.includes('meal') || entryType.includes('food') || entryType.includes('log')) return true
        return Boolean(meta.mealName || meta.calories || meta.protein)
      })
      
      // Group meals by date to calculate average daily calories
      const mealsByDate = new Map<string, number>()
      meals.forEach((item) => {
        const meta = extractMetadata(item)
        const dateStr = pickDate(meta, 'date', 'createdAt')?.toISOString().split('T')[0] || 'unknown'
        const calories = parseNumeric(meta.calories ?? meta.energy)
        mealsByDate.set(dateStr, (mealsByDate.get(dateStr) || 0) + calories)
      })
      
      // Calculate average daily calories (only for days with data)
      const daysWithData = Array.from(mealsByDate.values()).filter(cal => cal > 0)
      const avgDailyCalories = daysWithData.length > 0
        ? Math.round(daysWithData.reduce((a, b) => a + b, 0) / daysWithData.length)
        : 0
      
      const totalProtein = meals.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.protein ?? meta.proteinGrams)
      }, 0)
      const recipes = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.itemType || meta.type || '').toLowerCase()
        return entryType.includes('recipe') || Boolean(meta.recipeName)
      }).length
      
      return {
        kpi1: { label: 'Daily Calories', value: avgDailyCalories.toString(), icon: Utensils },
        kpi2: { label: 'Protein', value: `${totalProtein}g`, icon: Activity },
        kpi3: { label: 'Meals Logged', value: meals.length.toString(), icon: CheckCircle },
        kpi4: { label: 'Recipes Saved', value: recipes.toString(), icon: Star }
      }
    }
    case 'outdoor': {
      const gear = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('gear') || itemType.includes('equipment')) return true
        return Boolean(meta.gearName)
      })
      const activities = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('activity') || itemType.includes('outing')) return true
        return Boolean(meta.activityName)
      }).length
      const totalDistance = domainData.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.distance ?? meta.miles ?? meta.kilometers)
      }, 0)
      const trips = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('trip')) return true
        return Boolean(meta.tripDate || meta.startDate)
      })
      const nextTrip = trips.filter((item) => {
        const meta = extractMetadata(item)
        const tripDate = meta.tripDate || meta.startDate
        const date = toSafeDate(tripDate)
        if (!date) return false
        return date > new Date()
      })[0]
      
      return {
        kpi1: { label: 'Gear Items', value: gear.length.toString(), icon: Mountain },
        kpi2: { label: 'Activities YTD', value: activities.toString(), icon: Activity },
        kpi3: { label: 'Distance', value: totalDistance > 0 ? `${totalDistance.toFixed(0)}mi` : '0mi', icon: Target },
        kpi4: { label: 'Items', value: itemCount.toString(), icon: Calendar }
      }
    }
    case 'pets': {
      const stats = computePetsStats(domainData)

      return {
        kpi1: { label: 'Pets', value: stats.petProfileCount.toString(), icon: PawPrint },
        kpi2: { label: 'Vet Visits YTD', value: stats.vetVisitCountYear.toString(), icon: Calendar },
        kpi3: { label: 'Vaccines Due', value: stats.vaccinesDue.toString(), icon: AlertCircle },
        kpi4: { label: 'Monthly Cost', value: stats.monthlyCost > 0 ? `$${stats.monthlyCost.toFixed(0)}` : '$0', icon: DollarSign }
      }
    }
    case 'relationships': {
      const contacts = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.itemType || meta.type || meta.relationshipType || '').toLowerCase()
        if (entryType.includes('contact') || entryType.includes('person') || entryType.includes('relationship')) return true
        return Boolean(meta.contactName || meta.name)
      })
      const events = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const entryType = String(meta.itemType || meta.type || '').toLowerCase()
        if (entryType.includes('event') || entryType.includes('reminder')) return true
        return Boolean(meta.eventDate || meta.specialDate)
      }).length
      const anniversaries = domainData.filter((item) => {
        const meta = extractMetadata(item)
        return Boolean(meta.anniversaryDate || meta.anniversary)
      }).length
      
      return {
        kpi1: { label: 'Contacts', value: contacts.length.toString(), icon: Users },
        kpi2: { label: 'Upcoming Events', value: events.toString(), icon: Calendar },
        kpi3: { label: 'Items', value: itemCount.toString(), icon: Heart },
        kpi4: { label: 'Anniversaries', value: anniversaries.toString(), icon: Star }
      }
    }
    case 'schedule': {
      const events = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('event') || itemType.includes('meeting') || itemType.includes('appointment')) return true
        return Boolean(meta.eventDate || meta.startTime || meta.date)
      })
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const eventsToday = events.filter((item) => {
        const meta = extractMetadata(item)
        const eventDate = toSafeDate(meta.eventDate || meta.date)
        if (!eventDate) return false
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.getTime() === today.getTime()
      }).length
      const thisWeek = events.filter((item) => {
        const meta = extractMetadata(item)
        const eventDate = toSafeDate(meta.eventDate || meta.date)
        if (!eventDate) return false
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        return eventDate >= today && eventDate <= weekFromNow
      }).length
      const timeBlocked = events.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.duration ?? meta.length ?? 1)
      }, 0)
      const overdue = events.filter((item) => {
        const meta = extractMetadata(item)
        const eventDate = toSafeDate(meta.eventDate || meta.date)
        if (!eventDate) return false
        const status = String(meta.status || '').toLowerCase()
        return eventDate < today && !status.includes('completed')
      }).length
      
      return {
        kpi1: { label: 'Events Today', value: eventsToday.toString(), icon: Calendar },
        kpi2: { label: 'This Week', value: thisWeek.toString(), icon: BarChart3 },
        kpi3: { label: 'Time Blocked', value: timeBlocked > 0 ? `${timeBlocked}h` : '0h', icon: Target },
        kpi4: { label: 'Overdue', value: overdue.toString(), icon: AlertCircle }
      }
    }
    case 'travel': {
      const trips = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('trip') || itemType.includes('travel') || itemType.includes('vacation')) return true
        return Boolean(meta.destination || meta.tripName)
      })
      const countries = [...new Set(trips.map((item) => {
        const meta = extractMetadata(item)
        return meta.country || meta.countryCode
      }).filter(Boolean))].length
      const upcoming = trips.filter((item) => {
        const meta = extractMetadata(item)
        const startDate = meta.startDate || meta.departureDate
        const date = toSafeDate(startDate)
        if (!date) return false
        return date > new Date()
      }).length
      const totalSpent = trips.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.cost ?? meta.totalCost ?? meta.budget)
      }, 0)
      
      return {
        kpi1: { label: 'Trips YTD', value: trips.length.toString(), icon: Plane },
        kpi2: { label: 'Countries', value: countries.toString(), icon: Globe },
        kpi3: { label: 'Upcoming', value: upcoming.toString(), icon: Calendar },
        kpi4: { label: 'Total Spent', value: totalSpent > 0 ? `$${(totalSpent / 1000).toFixed(1)}K` : '$0', icon: DollarSign }
      }
    }
    case 'utilities': {
      const utilities = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('utility') || itemType.includes('bill')) return true
        return Boolean(meta.utilityName || meta.serviceName || meta.monthlyCost)
      })
      const totalCost = utilities.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.monthlyCost ?? meta.cost ?? meta.amount)
      }, 0)
      const dueThisWeek = utilities.filter((item) => {
        const meta = extractMetadata(item)
        const dueDate = meta.dueDate || meta.nextDueDate || meta.renewalDate
        const due = toSafeDate(dueDate)
        if (!due) return false
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        return due <= weekFromNow
      }).length
      const autopay = utilities.filter((item) => {
        const meta = extractMetadata(item)
        return meta.autopay === true || meta.autoPayEnabled === true
      }).length
      
      return {
        kpi1: { label: 'Monthly Cost', value: totalCost > 0 ? `$${totalCost.toFixed(0)}` : '$0', icon: DollarSign },
        kpi2: { label: 'Services', value: utilities.length.toString(), icon: Zap },
        kpi3: { label: 'Due This Week', value: dueThisWeek.toString(), icon: AlertCircle },
        kpi4: { label: 'Autopay', value: autopay.toString(), icon: CheckCircle }
      }
    }
    case 'vehicles': {
      const vehicles = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        if (itemType.includes('vehicle') || itemType.includes('car') || itemType.includes('truck') || itemType.includes('auto')) {
          return true
        }
        return Boolean(meta.make || meta.model || meta.vehicleName || meta.licensePlate)
      })
      
      // Also find maintenance entries to check for upcoming services
      const maintenanceEntries = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const itemType = String(meta.itemType || meta.type || '').toLowerCase()
        return itemType.includes('maintenance')
      })
      
      const totalMileage = vehicles.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        return sum + parseNumeric(meta.mileage ?? meta.currentMileage ?? meta.odometer ?? meta.totalMileage)
      }, 0)
      
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      // Count service due from both vehicles AND maintenance entries
      let serviceDue = 0
      
      // Check vehicles for service dates
      vehicles.forEach((item) => {
        const meta = extractMetadata(item)
        const nextService = meta.nextServiceDate || meta.serviceDue || meta.nextMaintenance || meta.inspectionDue
        const serviceDate = toSafeDate(nextService)
        if (serviceDate && serviceDate <= thirtyDays) {
          serviceDue++
          return
        }
        // Also check needsService flag
        if (meta.needsService === true) {
          serviceDue++
          return
        }
        const status = String(meta.status || meta.serviceStatus || '').toLowerCase()
        if (['due', 'overdue', 'needs service', 'attention'].some(flag => status.includes(flag))) {
          serviceDue++
        }
      })
      
      // Check maintenance entries for upcoming service dates
      maintenanceEntries.forEach((item) => {
        const meta = extractMetadata(item)
        const nextService = meta.nextServiceDate || meta.serviceDue || meta.dueDate
        const serviceDate = toSafeDate(nextService)
        if (serviceDate && serviceDate <= thirtyDays) {
          serviceDue++
        }
      })
      
      const mpgValues = vehicles.map((item) => {
        const meta = extractMetadata(item)
        return parseNumeric(meta.mpg ?? meta.milesPerGallon ?? meta.fuelEfficiency)
      }).filter(value => value > 0)
      const avgMpg = mpgValues.length > 0 ? mpgValues.reduce((sum, mpg) => sum + mpg, 0) / mpgValues.length : 0
      
      return {
        kpi1: { label: 'Vehicles', value: vehicles.length.toString(), icon: Car },
        kpi2: { label: 'Total Mileage', value: totalMileage > 0 ? `${(totalMileage / 1000).toFixed(0)}K mi` : '0mi', icon: BarChart3 },
        kpi3: { label: 'Service Due', value: serviceDue.toString(), icon: AlertCircle },
        kpi4: { label: 'MPG Avg', value: avgMpg > 0 ? avgMpg.toFixed(1) : '0', icon: Target }
      }
    }
    case 'fitness': {
      const now = new Date()
      const today = now.toDateString()
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Estimation function for calories when missing
      const estimateCalories = (type: string, minutes: number) => {
        const perMin: Record<string, number> = {
          'Running': 11, 'Walking': 4, 'Hiking': 7, 'Cycling': 8,
          'Swimming': 9, 'Yoga': 3, 'Strength Training': 6, 'Other': 5,
        }
        const key = perMin[type] !== undefined ? type : 'Other'
        return Math.max(0, Math.round(minutes * (perMin[key] || 0)))
      }
      
      const todayWorkouts = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const workoutDate = pickDate(meta, 'date', 'createdAt')
        return workoutDate ? workoutDate.toDateString() === today : false
      }).length
      
      const weekWorkouts = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const workoutDate = pickDate(meta, 'date', 'createdAt')
        return workoutDate ? workoutDate >= thisWeek : false
      }).length
      
      const monthWorkouts = domainData.filter((item) => {
        const meta = extractMetadata(item)
        const workoutDate = pickDate(meta, 'date', 'createdAt')
        return workoutDate ? workoutDate >= thisMonth : false
      }).length
      
      const totalCalories = domainData.reduce((sum: number, item) => {
        const meta = extractMetadata(item)
        const workoutDate = pickDate(meta, 'date', 'createdAt')
        if (!workoutDate || workoutDate.toDateString() !== today) return sum
        
        let calories = parseNumeric(meta.calories ?? meta.caloriesBurned)
        
        // If no calories logged, estimate based on activity type and duration
        if (calories === 0) {
          const activityType = String(meta.activityType || 'Other')
          const duration = parseNumeric(meta.duration)
          if (duration > 0) {
            calories = estimateCalories(activityType, duration)
          }
        }
        
        return sum + calories
      }, 0)
      
      return {
        kpi1: { label: 'Today', value: todayWorkouts.toString(), icon: Activity },
        kpi2: { label: 'This Week', value: weekWorkouts.toString(), icon: Calendar },
        kpi3: { label: 'This Month', value: monthWorkouts.toString(), icon: BarChart3 },
        kpi4: { label: 'Calories Today', value: totalCalories > 0 ? totalCalories.toFixed(0) : '0', icon: Flame }
      }
    }
    case 'services': {
      // Service providers use special data structure from service_providers table
      // Check for _serviceProvidersAnalytics which is injected separately
      const analytics = (data as any)._serviceProvidersAnalytics || { active: 0, pending: 0, monthlyTotal: 0 }
      const providersCount = (data as any)._serviceProvidersCount || itemCount
      
      return {
        kpi1: { label: 'Items', value: providersCount.toString(), icon: FileText },
        kpi2: { label: 'Active', value: analytics.active.toString(), icon: Activity },
        kpi3: { label: 'Pending', value: analytics.pending.toString(), icon: AlertCircle },
        kpi4: { label: 'Monthly', value: `$${analytics.monthlyTotal.toFixed(0)}`, icon: DollarSign }
      }
    }
    default:
      return {
        kpi1: { label: 'Items', value: itemCount.toString(), icon: FileText },
        kpi2: { label: 'Active', value: '0', icon: Activity },
        kpi3: { label: 'Pending', value: '0', icon: AlertCircle },
        kpi4: { label: 'Completed', value: '0', icon: CheckCircle }
      }
  }
}

export default function DomainsPage() {
  const { data, getData, isLoading, isLoaded, reloadDomain } = useData()
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const isMobile = useIsMobile()
  // Default to mobile-friendly cards; auto-switch based on screen size
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  // Track refresh key to force re-render on data updates
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Auto-switch to grid on mobile when user hasn't explicitly chosen a view
  const [hasUserChosenView, setHasUserChosenView] = useState(false)
  useEffect(() => {
    if (!hasUserChosenView && isMobile && viewMode === 'table') {
      setViewMode('grid')
    }
  }, [isMobile, hasUserChosenView, viewMode])
  
  // 🔥 CRITICAL FIX: Listen for data updates across ALL domains
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('📊 [DomainsPage] Received data-updated event:', event.detail)
      // Force a refresh by incrementing the key
      setRefreshKey(prev => prev + 1)
    }
    
    // Listen for the global data-updated event
    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    
    // Also listen for specific domain events
    const domains = ['digital', 'financial', 'health', 'home', 'vehicles', 'pets', 'insurance', 'appliances', 'fitness', 'nutrition', 'mindfulness', 'relationships', 'education', 'career', 'travel', 'legal', 'miscellaneous', 'services', 'collectibles', 'utilities']
    domains.forEach(domain => {
      window.addEventListener(`${domain}-data-updated`, handleDataUpdate as EventListener)
    })
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
      domains.forEach(domain => {
        window.removeEventListener(`${domain}-data-updated`, handleDataUpdate as EventListener)
      })
    }
  }, [])
  
  const [appliancesFromTable, setAppliancesFromTable] = useState<DomainData[]>([])
  const [serviceProvidersFromTable, setServiceProvidersFromTable] = useState<{
    providers: any[]
    payments: any[]
    analytics: { active: number; pending: number; monthlyTotal: number }
  }>({ providers: [], payments: [], analytics: { active: 0, pending: 0, monthlyTotal: 0 } })
  const [documentsFromTable, setDocumentsFromTable] = useState<DomainData[]>([])
  const supabase = createClientComponentClient()

  // Load appliances from appliances table (separate from domain_entries)
  useEffect(() => {
    const loadAppliances = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data: appliances, error } = await supabase
          .from('appliances')
          .select('*')
          .eq('user_id', user.id)
        
        if (error) {
          console.error('Error loading appliances:', error)
          return
        }
        
        // Load all costs for these appliances
        const applianceIds = (appliances || []).map((a: any) => a.id)
        const { data: allCosts } = await supabase
          .from('appliance_costs')
          .select('appliance_id, amount')
          .in('appliance_id', applianceIds)
        
        // Load all warranties for these appliances
        const { data: allWarranties } = await supabase
          .from('appliance_warranties')
          .select('appliance_id, expiry_date, warranty_name, provider')
          .in('appliance_id', applianceIds)
        
        // Calculate total costs per appliance
        const costsMap = new Map<string, number>()
        ;(allCosts || []).forEach((cost: any) => {
          const current = costsMap.get(cost.appliance_id) || 0
          costsMap.set(cost.appliance_id, current + parseFloat(cost.amount || 0))
        })
        
        // Group warranties by appliance
        const warrantiesMap = new Map<string, any[]>()
        ;(allWarranties || []).forEach((warranty: any) => {
          const warranties = warrantiesMap.get(warranty.appliance_id) || []
          warranties.push(warranty)
          warrantiesMap.set(warranty.appliance_id, warranties)
        })
        
        // Convert appliances table format to domain_entries format for compatibility
        const formatted = (appliances || []).map((app: any) => {
          const totalCostsFromTable = costsMap.get(app.id) || 0
          const warranties = warrantiesMap.get(app.id) || []
          
          // Find the latest warranty expiry date from warranties table
          const latestWarrantyExpiry = warranties.length > 0
            ? warranties.reduce((latest: any, w: any) => {
                if (!latest) return w.expiry_date
                return new Date(w.expiry_date) > new Date(latest) ? w.expiry_date : latest
              }, null)
            : null
          
          return {
            id: app.id,
            domain: 'appliances',
            title: app.name,
            description: `${app.brand || ''} ${app.model_number || ''}`.trim(),
            metadata: {
              category: app.category,
              brand: app.brand,
              model: app.model_number,
              serialNumber: app.serial_number,
              purchaseDate: app.purchase_date,
              purchasePrice: app.purchase_price,
              location: app.location,
              condition: app.condition,
              estimatedLifespan: app.expected_lifespan,
              value: app.purchase_price || app.current_value || app.estimated_value,
              // Use latest warranty from warranties table, fallback to appliances table
              warrantyExpiry: latestWarrantyExpiry || app.warranty_expiry || app.warranty_expires,
              warrantyType: app.warranty_type,
              warrantyCount: warranties.length,
              warranties: warranties,
              maintenanceDue: app.maintenance_due || app.next_maintenance,
              needsMaintenance: app.needs_maintenance || Boolean(app.maintenance_due),
              cost: app.maintenance_cost,
              maintenanceCost: app.maintenance_cost,
              maintenance_cost: app.maintenance_cost,
              // Add total costs from appliance_costs table
              totalCostsFromTable: totalCostsFromTable,
              allCosts: totalCostsFromTable
            },
            createdAt: app.created_at,
            updatedAt: app.updated_at
          }
        }) as DomainData[]
        
        setAppliancesFromTable(formatted)
        console.log(`✅ Loaded ${formatted.length} appliances from appliances table for domains page with costs`)
      } catch (error) {
        console.error('Failed to load appliances:', error)
      }
    }
    
    loadAppliances()
  }, [supabase])

  // Load service providers from dedicated service_providers table
  useEffect(() => {
    const loadServiceProviders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get providers
        const { data: providers, error: provError } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', user.id)
        
        if (provError) {
          console.error('Error loading service providers:', provError)
          return
        }
        
        // Get pending payments
        const { data: payments, error: payError } = await supabase
          .from('service_payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
        
        if (payError) {
          console.error('Error loading service payments:', payError)
        }
        
        // Calculate analytics
        const activeProviders = (providers || []).filter((p: any) => p.status === 'active')
        const monthlyTotal = activeProviders.reduce((sum: number, p: any) => sum + (p.monthly_amount || 0), 0)
        const pendingPayments = (payments || []).length
        
        setServiceProvidersFromTable({
          providers: providers || [],
          payments: payments || [],
          analytics: {
            active: activeProviders.length,
            pending: pendingPayments,
            monthlyTotal
          }
        })
        
        console.log(`✅ Loaded ${(providers || []).length} service providers from service_providers table`)
      } catch (error) {
        console.error('Failed to load service providers:', error)
      }
    }
    
    loadServiceProviders()
  }, [supabase])

  // Load documents from documents table (for Document Manager / insurance domain)
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data: docs, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
        
        if (error) {
          console.error('Error loading documents:', error)
          return
        }
        
        // Convert documents table format to domain_entries format for compatibility
        const formatted = (docs || []).map((doc: any) => {
          // Determine status based on expiration_date
          let status = 'active'
          if (doc.expiration_date) {
            const expiryDate = new Date(doc.expiration_date)
            const now = new Date()
            if (expiryDate < now) {
              status = 'expired'
            } else {
              const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
              if (expiryDate <= thirtyDays) {
                status = 'expiring'
              }
            }
          }
          
          return {
            id: doc.id,
            domain: 'insurance' as Domain, // Maps to Document Manager
            title: doc.document_name || doc.file_name || 'Untitled Document',
            description: doc.document_type || doc.category || '',
            metadata: {
              category: doc.category || doc.document_type,
              documentType: doc.document_type,
              expiryDate: doc.expiration_date,
              expirationDate: doc.expiration_date,
              renewalDate: doc.renewal_date,
              policyNumber: doc.policy_number,
              accountNumber: doc.account_number,
              issuer: doc.issuer,
              fileUrl: doc.file_url || doc.file_data,
              ocrProcessed: doc.ocr_processed,
              status: status,
              tags: doc.tags,
              notes: doc.notes
            },
            createdAt: doc.created_at,
            updatedAt: doc.updated_at || doc.created_at
          }
        }) as DomainData[]
        
        setDocumentsFromTable(formatted)
        console.log(`✅ Loaded ${formatted.length} documents from documents table for Document Manager`)
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    }
    
    loadDocuments()
  }, [supabase])

  // Enhanced getData that includes appliances, service providers, and documents from separate tables
  const getDataWithAppliances = (domainKey: Domain): DomainData[] => {
    if (domainKey === 'appliances') {
      // For appliances, combine data from domain_entries and appliances table
      const fromDomainEntries = getData(domainKey)
      // Dedupe by ID, preferring appliances table data
      const applianceIds = new Set(appliancesFromTable.map(a => a.id))
      const uniqueFromDomainEntries = fromDomainEntries.filter(item => !applianceIds.has(item.id))
      return [...appliancesFromTable, ...uniqueFromDomainEntries]
    }
    if (domainKey === 'insurance') {
      // For Document Manager (insurance), combine data from domain_entries and documents table
      const fromDomainEntries = getData(domainKey)
      // Dedupe by ID, preferring documents table data
      const documentIds = new Set(documentsFromTable.map(d => d.id))
      const uniqueFromDomainEntries = fromDomainEntries.filter(item => !documentIds.has(item.id))
      return [...documentsFromTable, ...uniqueFromDomainEntries]
    }
    if (domainKey === 'services') {
      // For services, use the service_providers table data
      // Convert service providers to DomainData format for item count
      const fromTable = serviceProvidersFromTable.providers.map((p: any) => ({
        id: p.id,
        domain: 'services' as Domain,
        title: p.provider_name,
        description: p.subcategory || p.category,
        metadata: {
          category: p.category,
          monthly_amount: p.monthly_amount,
          billing_day: p.billing_day,
          auto_pay: p.auto_pay_enabled,
          status: p.status
        },
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })) as DomainData[]
      
      // Also include any entries from domain_entries
      const fromDomainEntries = getData(domainKey)
      const providerIds = new Set(fromTable.map(p => p.id))
      const uniqueFromDomainEntries = fromDomainEntries.filter(item => !providerIds.has(item.id))
      return [...fromTable, ...uniqueFromDomainEntries]
    }
    return getData(domainKey)
  }

  // Calculate domain metrics
  const domainMetrics = (Object.keys(DOMAIN_CONFIGS) as Domain[]).map((domainKey) => {
    const domain = DOMAIN_CONFIGS[domainKey]
    const domainData = getDataWithAppliances(domainKey)
    const itemCount = domainData.length
    
    // Build data object for getDomainKPIs
    const dataForKPIs: any = { ...data }
    if (domainKey === 'appliances') {
      dataForKPIs.appliances = domainData
    }
    // Inject service providers analytics for the services domain
    if (domainKey === 'services') {
      dataForKPIs._serviceProvidersAnalytics = serviceProvidersFromTable.analytics
      dataForKPIs._serviceProvidersCount = serviceProvidersFromTable.providers.length
    }
    const kpis = getDomainKPIs(domainKey, dataForKPIs)
    
    // Calculate score
    let score = 50
    if (itemCount > 0) score += 20
    if (itemCount > 5) score += 10
    if (itemCount > 10) score += 10
    
    const recentItems = domainData.filter(item => {
      const daysSince = Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= 7
    })
    if (recentItems.length > 0) score += 10
    score = Math.min(score, 100)
    
    let status: 'Excellent' | 'Good' | 'Warning' | 'Critical'
    if (score >= 85) status = 'Excellent'
    else if (score >= 70) status = 'Good'
    else if (score >= 50) status = 'Warning'
    else status = 'Critical'
    
    const hasEnhancedView = ['financial', 'health', 'career', 'home', 'vehicles', 'insurance', 'miscellaneous', 'appliances', 'mindfulness', 'relationships'].includes(domainKey)
    
    return {
      id: domainKey,
      name: domain.name,
      description: domain.description,
      icon: DOMAIN_ICONS[domainKey] || FileText,
      gradient: DOMAIN_GRADIENTS[domainKey] || 'from-gray-500 to-slate-500',
      score,
      status,
      itemCount,
      recentCount: recentItems.length,
      hasEnhancedView,
      kpis,
      // Avoid mutating the domainData array in-place (it may be the provider's state)
      lastUpdated: domainData.length > 0
        ? [...domainData].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
        : null
    }
  })

  const filteredDomains = domainMetrics
    .filter(domain => {
      if (filter === 'active') return domain.itemCount > 0
      if (filter === 'inactive') return domain.itemCount === 0
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

  const activeDomains = domainMetrics.filter(d => d.itemCount > 0).length
  const avgScore = Math.round(domainMetrics.reduce((sum, d) => sum + d.score, 0) / domainMetrics.length)
  
  // Debug log for data loading issues
  useEffect(() => {
    console.log('📊 [DomainsPage] Data state:', {
      isLoading,
      isLoaded,
      dataKeys: Object.keys(data),
      totalItems: Object.values(data).flat().length,
      activeDomains,
      refreshKey
    })
  }, [isLoading, isLoaded, data, activeDomains, refreshKey])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading your data...</span>
          </div>
        )}
        
        {/* Filter & View Mode */}
        <div className="flex justify-center items-center gap-4 pt-4">
          <div className="flex gap-2">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('table'); setHasUserChosenView(true) }}
              className="h-8 px-3 text-xs"
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('grid'); setHasUserChosenView(true) }}
              className="h-8 px-3 text-xs"
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              Cards
            </Button>
          </div>
        </div>

        {/* KPI Table View */}
        {viewMode === 'table' && (
          <>
            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {filteredDomains.map(domain => {
                const Icon = domain.icon
                const domainHref = domain.id === 'financial' ? '/finance' : domain.id === 'health' ? '/health' : `/domains/${domain.id}`
                
                return (
                  <Link key={domain.id} href={domainHref}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${domain.gradient} shadow-sm`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{domain.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{domain.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{domain.itemCount}</div>
                            <div className="text-xs text-muted-foreground">items</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                            <div className="text-xs text-muted-foreground truncate">{domain.kpis.kpi1.label}</div>
                            <div className="font-semibold">{domain.kpis.kpi1.value}</div>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                            <div className="text-xs text-muted-foreground truncate">{domain.kpis.kpi2.label}</div>
                            <div className="font-semibold">{domain.kpis.kpi2.value}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            
            {/* Desktop Table View */}
            <Card className="shadow-lg hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Domain
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                          
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                          
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                          
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                          
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredDomains.map(domain => {
                        const Icon = domain.icon
                        const kpi1Icon = domain.kpis.kpi1.icon
                        const kpi2Icon = domain.kpis.kpi2.icon
                        const kpi3Icon = domain.kpis.kpi3.icon
                        const kpi4Icon = domain.kpis.kpi4.icon
                        const domainHref = domain.id === 'financial' ? '/finance' : domain.id === 'health' ? '/health' : `/domains/${domain.id}`
                        
                        return (
                          <tr key={domain.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <Link
                                href={domainHref}
                                className="flex items-center gap-3 cursor-pointer"
                                data-testid={`domain-${domain.id}`}
                              >
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${domain.gradient} shadow-sm`}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold hover:text-purple-600 transition-colors">{domain.name}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">{domain.description}</div>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="font-bold text-lg">{domain.itemCount}</div>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                  {React.createElement(kpi1Icon, { className: 'h-3 w-3' })}
                                  <span>{domain.kpis.kpi1.label}</span>
                                </div>
                                <div className="font-semibold">{domain.kpis.kpi1.value}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                  {React.createElement(kpi2Icon, { className: 'h-3 w-3' })}
                                  <span>{domain.kpis.kpi2.label}</span>
                                </div>
                                <div className="font-semibold">{domain.kpis.kpi2.value}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden xl:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                  {React.createElement(kpi3Icon, { className: 'h-3 w-3' })}
                                  <span>{domain.kpis.kpi3.label}</span>
                                </div>
                                <div className="font-semibold">{domain.kpis.kpi3.value}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden xl:table-cell">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                  {React.createElement(kpi4Icon, { className: 'h-3 w-3' })}
                                  <span>{domain.kpis.kpi4.label}</span>
                                </div>
                                <div className="font-semibold">{domain.kpis.kpi4.value}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link href={domainHref}>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={domainHref}>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Grid View (existing) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDomains.map(domain => {
              const Icon = domain.icon
              const isActive = domain.itemCount > 0
              
              return (
                <Link key={domain.id} href={domain.id === 'financial' ? '/finance' : domain.id === 'health' ? '/health' : `/domains/${domain.id}`}>
                  <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-2 ${
                    isActive ? 'border-transparent' : 'border-dashed'
                  }`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${domain.gradient} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        {domain.hasEnhancedView && (
                          <Badge variant="secondary" className="gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Enhanced
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-xl">{domain.name}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {domain.description}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-xs text-muted-foreground">{domain.kpis.kpi1.label}</div>
                          <div className="font-bold">{domain.kpis.kpi1.value}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-xs text-muted-foreground">{domain.kpis.kpi2.label}</div>
                          <div className="font-bold">{domain.kpis.kpi2.value}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-xs text-muted-foreground">{domain.kpis.kpi3.label}</div>
                          <div className="font-bold">{domain.kpis.kpi3.value}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-xs text-muted-foreground">{domain.kpis.kpi4.label}</div>
                          <div className="font-bold">{domain.kpis.kpi4.value}</div>
                        </div>
                      </div>

                      <Button 
                        className={`w-full bg-gradient-to-r ${domain.gradient} hover:opacity-90 text-white border-0 group-hover:shadow-lg transition-shadow`}
                        size="sm"
                      >
                        {isActive ? 'View Details' : 'Get Started'}
                        <Eye className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredDomains.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No domains found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'active' ? 'Start tracking data in a domain to see it here' : 'No inactive domains'}
            </p>
            <Button onClick={() => setFilter('all')}>View All Domains</Button>
          </div>
        )}
      </div>
    </main>
  )
}
