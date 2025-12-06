'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { idbGet, idbSet, idbDel } from '@/lib/utils/idb-cache'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  AlertTriangle,
  CheckCircle,
  Target,
  Heart,
  DollarSign,
  Shield,
  TrendingUp,
  Plus,
  Activity,
  Home,
  Car,
  Briefcase,
  Utensils,
  Brain,
  Users,
  BookOpen,
  Plane,
  Upload,
  Bell,
  MessageSquare,
  Trash2,
  Package,
  Dumbbell,
  Scale,
  FileText,
  Wrench,
  Lightbulb,
  MapPin,
  Palette,
  Baby,
  Star,
  Calendar,
  Loader2,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { calculateUnifiedNetWorth } from '@/lib/utils/unified-financial-calculator'
import { CategorizedAlertsDialog } from '../dialogs/categorized-alerts-dialog'
import { getTodayNutrition, calculateTodayTotals } from '@/lib/nutrition-daily-tracker'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleCalendarCard } from './google-calendar-card'
import { SmartInboxCard } from './smart-inbox-card'
import { InsightsCardWorking } from './insights-card-working'
import { SpecialDatesCard } from './special-dates-card'
import { WeatherFreeCard } from './weather-free-card'
import { NewsFreeCard } from './news-free-card'
import { UpcomingBillsCard } from './upcoming-bills-card'
import { RecentActivityCard } from './recent-activity-card'
import { DocumentExpirationCard } from './document-expiration-card'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import type { DomainData } from '@/types/domains'
import {
  computeHealthStats,
  computePetsStats,
  computeDigitalStats,
  computeAppliancesStats,
  extractMetadata,
  hasTruthyValue,
  parseNumeric,
  pickFirstDate,
  pickStringTokens,
} from '@/lib/dashboard/metrics-normalizers'
import { usePetsStats } from '@/lib/hooks/use-pets-stats'
import type { GenericMetadata } from '@/lib/dashboard/metrics-normalizers'

export function CommandCenterRedesigned() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { data, tasks, habits, events, addTask, updateTask, deleteTask, addHabit, toggleHabit, deleteHabit, addEvent, isLoading, isLoaded } = useData()
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false)
  const [nutritionGoalsVersion, setNutritionGoalsVersion] = useState(0)
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]) // Google Drive documents from Supabase
  const [isExpiringDocsLoading, setIsExpiringDocsLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set()) // Track dismissed alerts by unique ID

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low'|'medium'|'high'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskNotes, setNewTaskNotes] = useState('')
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily'|'weekly'|'monthly'>('daily')
  const [newHabitTarget, setNewHabitTarget] = useState<number>(1)
  const [newHabitIcon, setNewHabitIcon] = useState('⭐')
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', notes: '' })
  const [appliancesFromTable, setAppliancesFromTable] = useState<any[]>([])
  const [vehiclesFromTable, setVehiclesFromTable] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Force re-render on data updates
  
  // 🔥 Listen for immediate data updates from DataProvider mutations
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('🔔 Dashboard received data update event:', event.detail)
      setRefreshTrigger(prev => prev + 1) // Force re-render of memoized stats
    }

    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    window.addEventListener('fitness-data-updated', handleDataUpdate as EventListener)
    window.addEventListener('financial-data-updated', handleDataUpdate as EventListener)
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('fitness-data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('financial-data-updated', handleDataUpdate as EventListener)
    }
  }, [])
  
  const getMeta = useCallback((entry: any): Record<string, any> => {
    const raw = entry?.metadata
    if (raw && typeof raw === 'object') {
      const nested = (raw as any).metadata
      if (nested && typeof nested === 'object') {
        return nested as Record<string, any>
      }
      return raw as Record<string, any>
    }
    return {}
  }, [])

  const mapWithMeta = useCallback((entries: any[] = []) => {
    return entries.map(entry => ({ entry, meta: getMeta(entry) }))
  }, [getMeta])
  
  // Load dismissed alerts from storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    idbGet<string[]>('dismissed-alerts').then((stored) => {
      if (Array.isArray(stored)) setDismissedAlerts(new Set(stored))
    })
  }, [])
  
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
              // Add total costs from appliance_costs table
              totalCostsFromTable: totalCostsFromTable,
              allCosts: totalCostsFromTable
            },
            createdAt: app.created_at,
            updatedAt: app.updated_at
          }
        })
        
        setAppliancesFromTable(formatted)
        console.log(`✅ Loaded ${formatted.length} appliances from appliances table with costs`)
      } catch (error) {
        console.error('Failed to load appliances:', error)
      }
    }
    
    if (isLoaded) {
      loadAppliances()
    }
  }, [supabase, isLoaded])
  
  // Load vehicles from vehicles table (separate from domain_entries)
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data: vehicles, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
        
        if (error) {
          // Vehicles table might not exist or have different structure - that's OK
          // We'll rely on domain_entries for vehicles
          console.log('⚠️ Vehicles table not accessible (using domain_entries):', error.message)
          setVehiclesFromTable([])
          return
        }
        
        // Convert vehicles table format to domain_entries format
        const formatted = (vehicles || []).map((v: any) => ({
          id: v.id,
          domain: 'vehicles',
          title: `${v.make || ''} ${v.model || ''}`.trim() || 'Vehicle',
          description: v.year ? `${v.year}` : '',
          metadata: {
            make: v.make,
            model: v.model,
            year: v.year,
            vin: v.vin,
            mileage: v.current_mileage,
            value: v.estimated_value || v.purchase_price,
            purchasePrice: v.purchase_price,
            licensePlate: v.license_plate,
            color: v.color
          },
          createdAt: v.created_at,
          updatedAt: v.updated_at
        }))
        
        setVehiclesFromTable(formatted)
        console.log(`✅ Loaded ${formatted.length} vehicles from vehicles table`)
      } catch (error) {
        console.error('Failed to load vehicles:', error)
      }
    }
    
    if (isLoaded) {
      loadVehicles()
    }
  }, [supabase, isLoaded])

  // Dismiss an alert
  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts)
    newDismissed.add(alertId)
    setDismissedAlerts(newDismissed)
    idbSet('dismissed-alerts', Array.from(newDismissed))
  }

  // Clear all dismissed alerts (optional utility)
  const clearDismissedAlerts = () => {
    setDismissedAlerts(new Set())
    idbDel('dismissed-alerts')
  }

  // Handle habit deletion with confirmation
  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    if (!confirm(`Are you sure you want to delete "${habitName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await deleteHabit(habitId)
    } catch (error) {
      console.error('Failed to delete habit:', error)
      alert('Failed to delete habit. Please try again.')
    }
  }

  // Derive finance metrics directly from Supabase-backed domain data
  const financialActivity = useMemo(() => {
    const items = Array.isArray(data.financial) ? data.financial : []
    const insuranceItems = Array.isArray(data.insurance) ? data.insurance : []
    const digitalItems = Array.isArray(data.digital) ? data.digital : []
    
    // Cross-domain expense sources
    const petsItems = Array.isArray(data.pets) ? data.pets : []
    const homeItems = Array.isArray(data.home) ? data.home : []
    const propertyItems = Array.isArray(data.property) ? data.property : []
    const vehiclesItems = Array.isArray(data.vehicles) ? data.vehicles : []
    const healthItems = Array.isArray(data.health) ? data.health : []
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    let incomeLast30 = 0
    let expensesLast30 = 0
    let billsTotal = 0

    const parseAmount = (meta: any) => {
      const raw = meta?.amount ?? meta?.value ?? meta?.balance ?? meta?.currentBalance ?? 0
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw))
      return Number.isFinite(parsed) ? parsed : 0
    }

    const normaliseTokens = (meta: any) =>
      [
        meta?.type,
        meta?.itemType,
        meta?.logType,
        meta?.entryType,
        meta?.category,
        meta?.transactionType,
        meta?.accountType,
      ]
        .filter(Boolean)
        .map((value: any) => String(value).toLowerCase())

    // Process financial domain items
    items.forEach(item => {
      const meta = item?.metadata || {}
      const amount = parseAmount(meta)
      const tokens = normaliseTokens(meta)
      const dateValue =
        meta?.date ||
        meta?.timestamp ||
        meta?.transactionDate ||
        meta?.postedAt ||
        item?.updatedAt ||
        item?.createdAt
      const occurredAt = dateValue && (typeof dateValue === 'string' || typeof dateValue === 'number') ? new Date(dateValue) : null
      const withinLast30 = occurredAt ? occurredAt >= thirtyDaysAgo : true

      const isIncome =
        tokens.some(token =>
          [
            'income',
            'paycheck',
            'salary',
            'deposit',
            'earning',
            'cashflow-income',
            'revenue',
          ].includes(token)
        ) || meta?.logType === 'income'

      const isExpense =
        tokens.some(token =>
          ['expense', 'spending', 'purchase', 'payment', 'cashflow-expense'].includes(token)
        ) || meta?.logType === 'expense'

      const isBill =
        tokens.some(token =>
          [
            'bill',
            'bills',
            'subscription',
            'loan payment',
            'mortgage',
            'utility',
            'recurring-bill',
          ].includes(token)
        ) || meta?.isBill === true

      if (withinLast30 && isIncome) {
        incomeLast30 += Math.abs(amount)
      }

      if (withinLast30 && isExpense) {
        expensesLast30 += Math.abs(amount)
      }

      if (isBill) {
        billsTotal += Math.abs(amount)
      }
    })

    // Add insurance premiums to billsTotal
    insuranceItems.forEach(item => {
      const meta = item?.metadata || {}
      const premium = parseFloat(String(meta?.monthlyPremium || meta?.premium || 0))
      if (premium > 0) {
        billsTotal += premium
      }
    })

    // Add digital subscriptions to billsTotal
    digitalItems.forEach(item => {
      const meta = item?.metadata || {}
      const tokens = normaliseTokens(meta)
      const isSubscription = tokens.includes('subscription') || 
                            meta?.type === 'subscription' || 
                            meta?.category === 'subscription'
      
      if (isSubscription) {
        const cost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
        if (cost > 0) {
          billsTotal += cost
        }
      }
    })

    // Add home domain utility bills to billsTotal
    homeItems.forEach(item => {
      const meta = item?.metadata || {}
      const tokens = normaliseTokens(meta)
      
      // Check if this is a utility bill or recurring bill
      const isUtilityBill = tokens.includes('utility') || 
                           tokens.includes('utility_payment') ||
                           meta?.type === 'utility_payment' ||
                           meta?.type === 'utility' ||
                           (meta?.itemType === 'bill' && meta?.category === 'utilities')
      
      if (isUtilityBill) {
        const amount = parseFloat(String(meta?.amount || meta?.monthlyCost || meta?.cost || 0))
        if (amount > 0) {
          billsTotal += amount
          console.log(`💡 Added utility bill to billsTotal: $${amount}`)
        }
      }
    })

    // 🆕 ADD CROSS-DOMAIN EXPENSES (pets, home, vehicles, health)
    const addDomainExpenses = (domainItems: any[], domainName: string) => {
      domainItems.forEach(item => {
        const meta = item?.metadata || {}
        const tokens = normaliseTokens(meta)
        const amount = parseAmount(meta)
        
        const dateValue = meta?.date || meta?.timestamp || item?.createdAt
        const occurredAt = dateValue ? new Date(dateValue) : null
        const withinLast30 = occurredAt ? occurredAt >= thirtyDaysAgo : true
        
        // Check if this is an expense type entry
        const isExpense = tokens.some(token =>
          ['expense', 'cost', 'vet_appointment', 'maintenance', 'bill', 'payment', 'utility', 'utility_payment'].includes(token)
        )
        
        if (withinLast30 && isExpense && amount > 0) {
          expensesLast30 += Math.abs(amount)
          console.log(`📊 Added ${domainName} expense: $${amount}`)
        }
      })
    }

    // Aggregate from all domains
    addDomainExpenses(petsItems, 'pets')
    addDomainExpenses(homeItems, 'home')
    addDomainExpenses(propertyItems, 'property')
    addDomainExpenses(vehiclesItems, 'vehicles')
    addDomainExpenses(healthItems, 'health')

    console.log(`💰 Total Expenses (all domains): $${expensesLast30}`)

    return {
      incomeLast30,
      expensesLast30,
      billsTotal,
    }
  }, [data.financial, data.insurance, data.digital, data.pets, data.home, data.property, data.vehicles, data.health])

  const billsTotalFallback = useMemo(() => {
    const bills = data.bills || []
    if (!Array.isArray(bills) || bills.length === 0) return 0
    return bills.reduce((sum: number, bill: any) => sum + (Number(bill.amount) || 0), 0)
  }, [data.bills])

  // Calculate finance view using unified calculator backed by Supabase data
  const financeNetWorth = useMemo(() => {
    const unified = calculateUnifiedNetWorth(data, {
      assets: 0,
      liabilities: 0,
      income: financialActivity.incomeLast30,
      expenses: financialActivity.expensesLast30,
    })

    return {
      assets:
        unified.breakdown.financialAssets +
        unified.breakdown.homeValue +
        unified.breakdown.vehicleValue +
        unified.breakdown.collectiblesValue +
        unified.breakdown.miscValue,
      liabilities: unified.breakdown.financialLiabilities,
      netWorth: unified.netWorth,
      income: financialActivity.incomeLast30,
      expenses: financialActivity.expensesLast30,
      billsTotal: financialActivity.billsTotal || billsTotalFallback,
    }
  }, [data, financialActivity, billsTotalFallback])

  const monthlyExpenses = useMemo(() => {
    const items = Array.isArray(data.financial) ? data.financial : []
    const insuranceItems = Array.isArray(data.insurance) ? data.insurance : []
    const digitalItems = Array.isArray(data.digital) ? data.digital : []
    const initial = { housing: 0, food: 0, insurance: 0, transport: 0, utilities: 0, other: 0 }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const parseAmount = (meta: any) => {
      const raw = meta?.amount ?? meta?.value ?? meta?.balance ?? meta?.currentBalance ?? 0
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw))
      return Number.isFinite(parsed) ? parsed : 0
    }

    const normaliseTokens = (meta: any) =>
      [
        meta?.type,
        meta?.itemType,
        meta?.logType,
        meta?.entryType,
        meta?.category,
        meta?.transactionCategory,
        meta?.transactionType,
      ]
        .filter(Boolean)
        .map((value: any) => String(value).toLowerCase())

    // Process financial domain expenses
    const result = items.reduce((acc, item) => {
      const meta = item?.metadata || {}
      const amount = Math.abs(parseAmount(meta))
      if (!amount) return acc

      const tokens = normaliseTokens(meta)
      const dateValue =
        meta?.date ||
        meta?.timestamp ||
        meta?.transactionDate ||
        meta?.postedAt ||
        item?.updatedAt ||
        item?.createdAt
      const occurredAt = dateValue && (typeof dateValue === 'string' || typeof dateValue === 'number') ? new Date(dateValue) : null
      if (occurredAt && occurredAt < thirtyDaysAgo) return acc

      const isExpense =
        tokens.some(token =>
          ['expense', 'spending', 'purchase', 'payment', 'cashflow-expense'].includes(token)
        ) || meta?.logType === 'expense'

      if (!isExpense) return acc

      const categorySource =
        meta?.category ||
        meta?.categoryName ||
        meta?.itemCategory ||
        meta?.transactionCategory ||
        meta?.type ||
        ''
      const category = String(categorySource).toLowerCase()

      if (category.includes('hous') || category.includes('rent') || category.includes('mort')) {
        acc.housing += amount
      } else if (
        category.includes('food') ||
        category.includes('groc') ||
        category.includes('dining') ||
        category.includes('restaurant')
      ) {
        acc.food += amount
      } else if (category.includes('insur')) {
        acc.insurance += amount
      } else if (category.includes('trans') || category.includes('car') || category.includes('gas')) {
        acc.transport += amount
      } else if (
        category.includes('utilit') ||
        category.includes('electric') ||
        category.includes('water') ||
        category.includes('internet') ||
        category.includes('phone')
      ) {
        acc.utilities += amount
      } else {
        acc.other += amount
      }

      return acc
    }, initial)

    // Add insurance premiums to insurance category
    insuranceItems.forEach(item => {
      const meta = item?.metadata || {}
      const premium = parseFloat(String(meta?.monthlyPremium || meta?.premium || 0))
      if (premium > 0) {
        result.insurance += premium
      }
    })

    // Add digital subscriptions to utilities category
    digitalItems.forEach(item => {
      const meta = item?.metadata || {}
      const tokens = normaliseTokens(meta)
      const isSubscription = tokens.includes('subscription') || 
                            meta?.type === 'subscription' || 
                            meta?.category === 'subscription'
      
      if (isSubscription) {
        const cost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
        if (cost > 0) {
          result.utilities += cost
        }
      }
    })

    // Add home domain utility bills to utilities category
    const homeItems = Array.isArray(data.home) ? data.home : []
    homeItems.forEach(item => {
      const meta = item?.metadata || {}
      const tokens = normaliseTokens(meta)
      
      // Check if this is a utility bill or recurring bill
      const isUtilityBill = tokens.includes('utility') || 
                           tokens.includes('utility_payment') ||
                           meta?.type === 'utility_payment' ||
                           meta?.type === 'utility' ||
                           (meta?.itemType === 'bill' && meta?.category === 'utilities')
      
      if (isUtilityBill) {
        const amount = parseFloat(String(meta?.amount || meta?.monthlyCost || meta?.cost || 0))
        if (amount > 0) {
          result.utilities += amount
          console.log(`💡 Added utility bill to monthlyExpenses: $${amount}`)
        }
      }
    })

    return result
  }, [data.financial, data.insurance, data.digital, data.home])
  const [isClient, setIsClient] = useState(false)

  const formatNumber = (value: number | undefined | null, digits = 0, hasData = true) => {
    if (!hasData || value === undefined || value === null || Number.isNaN(value)) return '--'
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
  }

  const formatCurrency = (value: number | undefined | null, hasData = true, maximumFractionDigits = 0) => {
    if (!hasData || value === undefined || value === null || Number.isNaN(value)) return '--'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits,
    }).format(value)
  }

  const formatCurrencyK = (value: number | undefined | null, hasData = true) => {
    if (!hasData || value === undefined || value === null || Number.isNaN(value)) return '--'
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatMileage = (value: number | undefined | null, hasData = true) => {
    if (!hasData || value === undefined || value === null || Number.isNaN(value)) return '--'
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return Number(value).toLocaleString()
  }

  const formatMood = (score: number | undefined | null, hasData = true) => {
    if (!hasData || score === undefined || score === null || Number.isNaN(score)) return '--'
    const rounded = Math.round(score)
    const emoji =
      rounded >= 9 ? '🤩' :
      rounded >= 7 ? '😊' :
      rounded >= 5 ? '🙂' :
      rounded >= 3 ? '😐' :
      '😞'
    return `${emoji} ${rounded}/10`
  }

  const healthStats = useMemo(() => {
    const healthEntries = data.health ?? []
    console.log('🏥 Health Data for Stats - Total entries:', healthEntries.length)
    
    if (healthEntries.length > 0) {
      console.log('🏥 ⚠️ SHOWING ACTUAL DATABASE DATA - These are real entries from your Supabase database!')
      console.log('🏥 Sample entry 0:', JSON.stringify({
        id: healthEntries[0].id,
        title: healthEntries[0].title,
        createdAt: healthEntries[0].createdAt,
        updatedAt: healthEntries[0].updatedAt,
        metadata: healthEntries[0].metadata
      }, null, 2))
      
      if (healthEntries.length > 1) {
        console.log('🏥 Sample entry 1:', JSON.stringify({
          id: healthEntries[1].id,
          title: healthEntries[1].title,
          createdAt: healthEntries[1].createdAt,
          updatedAt: healthEntries[1].updatedAt,
          metadata: healthEntries[1].metadata
        }, null, 2))
      }
      
      console.log('🏥 To delete this data, run the SQL in scripts/clear-health-data.sql')
    } else {
      console.log('🏥 ✅ No health data found - dashboard will show "No data"')
    }
    
    const stats = computeHealthStats(healthEntries)
    
    console.log('🏥 ✅ FINAL Health Stats:', 
      `HasData: ${stats.hasData}, ` +
      `Items: ${stats.itemsCount}, ` +
      `Vitals: ${stats.vitalsCount}, ` +
      `Glucose: ${stats.glucose}, ` +
      `Weight: ${stats.weight}, ` +
      `HR: ${stats.heartRate}, ` +
      `BP: ${stats.bloodPressure}, ` +
      `Meds: ${stats.medicationCount}`
    )
    
    return stats
  }, [data.health])
  const hasHealthData = healthStats.hasData
  const hasHomeData = Array.isArray(data.home) && data.home.length > 0
  const hasVehicleData = Array.isArray(data.vehicles) && data.vehicles.length > 0
  const hasCollectiblesData = Array.isArray(data.collectibles) && data.collectibles.length > 0
  const hasUtilitiesData = Array.isArray(data.utilities) && data.utilities.length > 0
  const hasMiscData = Array.isArray(data.miscellaneous) && data.miscellaneous.length > 0
  const hasNutritionData = Array.isArray(data.nutrition) && data.nutrition.length > 0
  const hasFitnessData = Array.isArray(data.fitness) && data.fitness.length > 0
  const hasMindfulnessData = Array.isArray(data.mindfulness) && data.mindfulness.length > 0
  
  // Use dedicated pets API hook instead of domain_entries
  const { stats: petsStats, isLoading: petsLoading } = usePetsStats()
  const hasPetsData = petsStats.hasData
  
  const hasLegalData = Array.isArray(data.legal) && data.legal.length > 0
  const hasVehiclesData = (Array.isArray(data.vehicles) && data.vehicles.length > 0) || (vehiclesFromTable.length > 0)

  // Fetch expiring documents from Google Drive (via Supabase documents table)
  useEffect(() => {
    const fetchExpiringDocuments = async () => {
      setIsExpiringDocsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.log('⚠️ No user logged in, cannot fetch expiring documents')
          setExpiringDocuments([])
          setIsExpiringDocsLoading(false)
          return
        }

        // Fetch all documents with expiration dates
        const { data: docs, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .not('expiration_date', 'is', null)
          .order('expiration_date', { ascending: true })

        if (error) {
          console.error('Error fetching expiring documents:', error)
          setExpiringDocuments([])
          return
        }

        // Filter to only documents expiring within 30 days
        const today = new Date()
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

        const expiring = (docs || []).filter(doc => {
          const expiryDate = new Date(doc.expiration_date)
          return expiryDate >= today && expiryDate <= thirtyDaysFromNow
        }).map(doc => ({
          id: doc.id,
          name: doc.document_name || doc.file_name,
          domain: doc.domain,
          expirationDate: doc.expiration_date,
          daysLeft: differenceInDays(new Date(doc.expiration_date), today)
        }))

        console.log(`📄 Found ${expiring.length} expiring documents from Google Drive`)
        setExpiringDocuments(expiring)
      } catch (error) {
        console.error('Failed to fetch expiring documents:', error)
        setExpiringDocuments([])
      } finally {
        setIsExpiringDocsLoading(false)
      }
    }

    fetchExpiringDocuments()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchExpiringDocuments, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  // Client-side only flag to fix hydration errors
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Utilities metrics derived from DataProvider so card shows real values
  const utilitiesStats = useMemo(() => {
    const utilities = (data.utilities || []) as any[]
    if (!utilities || utilities.length === 0) {
      return { totalMonthly: 0, services: 0, due: 0, autopay: 0 }
    }
    const items = utilities.map((u: any) => u.metadata || {})
    const totalMonthly = items.reduce((sum: number, u: any) => {
      const amount = Number(u.amount) || 0
      const freq = String(u.frequency || 'monthly').toLowerCase()
      if (freq === 'monthly') return sum + amount
      if (freq === 'weekly') return sum + amount * 4
      if (freq === 'daily') return sum + amount * 30
      if (freq === 'quarterly') return sum + amount / 3
      if (freq === 'annually') return sum + amount / 12
      return sum + amount
    }, 0)
    const due = items.filter((u: any) => (u.status || '').toLowerCase() === 'unpaid').length
    const autopay = items.filter((u: any) => !!u.autoPayEnabled).length
    return { totalMonthly, services: items.length, due, autopay }
  }, [data.utilities])

  // Health metrics from DataProvider (including blood pressure)
  // Collectibles metrics from DataProvider
  const collectiblesStats = useMemo(() => {
    const collectibles = (data.collectibles || []) as any[]
    if (!collectibles || collectibles.length === 0) {
      return { totalValue: 0, insuredCount: 0, count: 0 }
    }
    const totalValue = collectibles.reduce((sum: number, item: any) => {
      const value = Number(
        item.metadata?.currentValue || 
        item.metadata?.estimatedValue || 
        item.metadata?.value || 
        0
      )
      return sum + value
    }, 0)
    const insuredCount = collectibles.filter((item: any) => item.metadata?.isInsured).length
    return { totalValue, insuredCount, count: collectibles.length }
  }, [data.collectibles])

  // Home metrics (including maintenance tasks)
  const homeStats = useMemo(() => {
    const homeEntries = Array.isArray(data.home) ? data.home : []
    if (!homeEntries.length) {
      return { value: 0, tasks: 0, projects: 0, maint: 0, count: 0 }
    }

    const normalized = mapWithMeta(homeEntries)

    const properties = normalized.filter(({ meta }) => {
      const type = String(meta.itemType ?? meta.type ?? meta.category ?? '').toLowerCase()
      return type.includes('property') || type.includes('home') || type.includes('real estate')
    })

    const value = properties.reduce((sum, { meta }) => {
      const propertyValue = Number(meta.propertyValue ?? meta.estimatedValue ?? meta.value ?? meta.purchasePrice ?? 0)
      return sum + (Number.isFinite(propertyValue) ? propertyValue : 0)
    }, 0)

    const tasksFiltered = normalized.filter(({ meta }) => {
      const type = String(meta.itemType ?? meta.type ?? '').toLowerCase()
      const status = String(meta.status ?? '').toLowerCase()
      return type.includes('maintenance') || type.includes('task') || status === 'pending' || status === 'overdue'
    })
    const tasks = tasksFiltered.length

    const projectsFiltered = normalized.filter(({ meta }) => {
      const type = String(meta.itemType ?? meta.type ?? '').toLowerCase()
      return type.includes('project')
    })
    const projects = projectsFiltered.length

    const maintFiltered = normalized.filter(({ meta }) => {
      const type = String(meta.itemType ?? meta.type ?? '').toLowerCase()
      return type.includes('maintenance')
    })
    const maint = maintFiltered.length

    console.log('🏠 [Home Stats] Total entries:', homeEntries.length)
    console.log('🏠 [Home Stats] Breakdown:', { 
      properties: properties.length,
      tasks,
      projects,
      maint,
      value: `$${(value / 1000).toFixed(0)}K`
    })
    
    if (tasksFiltered.length > 0) {
      console.log('🏠 [Home Stats] Sample tasks:', tasksFiltered.slice(0, 3).map(t => ({
        title: t.entry.title || 'Untitled',
        type: t.meta.itemType || t.meta.type,
        status: t.meta.status
      })))
    }

    return { value, tasks, projects, maint, count: properties.length || homeEntries.length }
  }, [data.home, mapWithMeta])

  // Vehicles metrics - merge domain_entries with vehicles table
  const vehiclesStats = useMemo(() => {
    const fromDomainEntries = (data.vehicles || []) as any[]
    const fromTable = vehiclesFromTable || []
    
    // Filter domain_entries for vehicles
    const vehiclesFromEntries = fromDomainEntries.filter((entry) => {
      const meta = extractMetadata(entry)
      const itemType = pickStringTokens(meta, ['itemType', 'type']).join(' ')
      const hasVehicleIdentifiers = hasTruthyValue(meta, ['make', 'model', 'vin', 'vehicleName'])
      return (
        itemType.includes('vehicle') ||
        itemType.includes('car') ||
        itemType.includes('truck') ||
        hasVehicleIdentifiers
      )
    })
    
    // Merge both sources
    const vehicles = [...vehiclesFromEntries, ...fromTable]

    const totalValue = vehicles.reduce((sum, entry) => {
      const meta = extractMetadata(entry)
      const value = parseNumeric(
        meta['value'] ??
          meta['estimatedValue'] ??
          meta['currentValue'] ??
          meta['purchasePrice'] ??
          meta['loanBalance']
      )
      return sum + value
    }, 0)

    const needsService = vehicles.filter((entry) => {
      const meta = extractMetadata(entry)
      if (meta['needsService'] === true) {
        return true
      }

      const serviceDate = pickFirstDate(meta, ['serviceDue', 'nextServiceDate', 'nextMaintenance', 'inspectionDue'])
      if (serviceDate && serviceDate <= new Date()) {
        return true
      }

      const statusTokens = pickStringTokens(meta, ['status', 'serviceStatus'])
      if (statusTokens.some((token) => ['due', 'overdue', 'needs service', 'attention'].some((flag) => token.includes(flag)))) {
        return true
      }

      const itemType = pickStringTokens(meta, ['itemType']).join(' ')
      return itemType.includes('service') || itemType.includes('maintenance')
    }).length

    const totalMileage = vehicles.reduce((sum, entry) => {
      const meta = extractMetadata(entry)
      const mileage = parseNumeric(
        meta['mileage'] ?? meta['currentMileage'] ?? meta['odometer'] ?? meta['totalMileage']
      )
      return sum + mileage
    }, 0)

    console.log('🚗 Vehicles Stats:', { count: vehicles.length, totalValue, needsService, totalMileage, fromDomainEntries: vehiclesFromEntries.length, fromTable: fromTable.length })
    
    return { totalValue, needsService, totalMileage, count: vehicles.length }
  }, [data.vehicles, vehiclesFromTable])

  // Liabilities breakdown from financial domain
  const liabilitiesStats = useMemo(() => {
    const financialItems = Array.isArray(data.financial) ? data.financial : []
    const homeItems = Array.isArray(data.home) ? data.home : []
    const vehicleItems = Array.isArray(data.vehicles) ? data.vehicles : []
    
    console.log('💰 [Liabilities] Financial items count:', financialItems.length)
    console.log('💰 [Liabilities] All financial items:', financialItems)
    
    let mortgage = 0
    let autoLoans = 0
    let creditCards = 0
    let otherLoans = 0
    let totalAccounts = 0
    
    // Check financial domain for debts
    financialItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const balance = Math.abs(Number(meta.balance ?? meta.currentBalance ?? meta.loanBalance ?? 0))
      const type = String(meta.accountType || meta.type || meta.loanType || '').toLowerCase()
      const itemType = String(meta.itemType || '').toLowerCase()
      
      console.log('💰 [Liabilities] Processing item:', {
        title: item.title,
        itemType,
        type,
        balance,
        metadata: meta
      })
      
      if (balance <= 0) return
      
      // Only process items that are debts/liabilities
      const isDebt = itemType === 'debt' || 
                     type.includes('mortgage') || 
                     type.includes('credit') || 
                     type.includes('card') || 
                     type.includes('auto') || 
                     type.includes('car') || 
                     type.includes('vehicle') || 
                     type.includes('loan') || 
                     type.includes('debt') || 
                     type.includes('liability')
      
      if (!isDebt) return
      
      // Categorize the debt
      if (type.includes('mortgage')) {
        mortgage += balance
        totalAccounts++
      } else if (type.includes('credit') || type.includes('card')) {
        creditCards += balance
        totalAccounts++
      } else if (type.includes('auto') || type.includes('car') || type.includes('vehicle')) {
        autoLoans += balance
        totalAccounts++
      } else {
        // Catch all other liabilities (personal loans, student loans, etc.)
        otherLoans += balance
        totalAccounts++
      }
    })
    
    // Check home domain for mortgages
    homeItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      if (meta.mortgage || meta.mortgageBalance) {
        const balance = Math.abs(Number(meta.mortgageBalance ?? 0))
        if (balance > 0) {
          mortgage += balance
          totalAccounts++
        }
      }
    })
    
    // Check vehicles for auto loans
    vehicleItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      if (meta.financed || meta.loanBalance) {
        const balance = Math.abs(Number(meta.loanBalance ?? 0))
        if (balance > 0) {
          autoLoans += balance
          totalAccounts++
        }
      }
    })
    
    const totalLiabilities = mortgage + autoLoans + creditCards + otherLoans
    
    console.log('💰 [Liabilities] Final stats:', {
      total: totalLiabilities,
      mortgage,
      autoLoans,
      creditCards,
      otherLoans,
      accounts: totalAccounts
    })
    
    return {
      total: totalLiabilities,
      mortgage,
      autoLoans,
      creditCards,
      otherLoans,
      accounts: totalAccounts,
      hasData: totalAccounts > 0 || totalLiabilities > 0,
    }
  }, [data.financial, data.home, data.vehicles])

  const relationshipsStats = useMemo(() => {
    const relationships = mapWithMeta(Array.isArray(data.relationships) ? data.relationships : [])

    if (!relationships.length) {
      return { contacts: 0, birthdays: 0, events: 0, reminders: 0 }
    }

    const isBirthdayLabel = (value: unknown): boolean => {
      if (!value) return false
      const normalized = String(value).toLowerCase()
      return normalized.includes('birthday') || normalized.includes('birth day') || normalized.includes('b-day')
    }

    let birthdayCount = 0
    let eventCount = 0
    let reminderCount = 0

    relationships.forEach(({ meta }) => {
      const importantDates = Array.isArray(meta.importantDates) ? meta.importantDates : []
      importantDates.forEach((dateItem: any) => {
        const labels = [dateItem?.label, dateItem?.name, dateItem?.type, dateItem?.category]
        const isBirthday = labels.some(isBirthdayLabel)
        if (isBirthday) {
          birthdayCount += 1
        } else if (dateItem?.date || labels.some(Boolean)) {
          eventCount += 1
        }
      })

      const reminders = Array.isArray(meta.reminders) ? meta.reminders : []
      reminderCount += reminders.length
    })

    return {
      contacts: relationships.length,
      birthdays: birthdayCount,
      events: eventCount,
      reminders: reminderCount,
    }
  }, [data.relationships, mapWithMeta])

  const hasRelationshipsData = relationshipsStats.contacts > 0

  // Nutrition metrics (TODAY ONLY - resets daily, water in OUNCES)
  const nutritionStats = useMemo(() => {
    const nutrition = (data.nutrition || []) as any[]
    // Use the daily tracker to get only today's data
    const todayTotals = calculateTodayTotals(nutrition)
    
    // Read goals from DataProvider (no localStorage)
    const goalsItem = (data.nutrition || []).find((i: any) => {
      const meta = getMeta(i)
      return String(meta.itemType ?? meta.type ?? '').toLowerCase() === 'nutrition-goals'
    })
    const goalsMeta = goalsItem ? getMeta(goalsItem) : {}
    const goals = {
      caloriesGoal: Number(goalsMeta?.caloriesGoal ?? 2000),
      proteinGoal: Number(goalsMeta?.proteinGoal ?? 150),
      waterGoal: Number(goalsMeta?.waterGoal ?? 64), // Default to 64oz (8 cups)
    }
    
    return { ...todayTotals, goals }
  }, [data.nutrition, nutritionGoalsVersion])

  // Fitness metrics (including steps from fitness domain, not health)
  const fitnessStats = useMemo(() => {
    const fitness = (data.fitness || []) as any[]
    console.log('🏋️ Fitness data for stats calculation:', fitness.length, 'entries')
    if (fitness.length > 0) {
      console.log('🏋️ Sample fitness entry:', fitness[0])
      const sampleMeta = getMeta(fitness[0])
      console.log('🏋️ Sample metadata:', sampleMeta)
      console.log('🏋️ Sample calories:', sampleMeta?.calories, sampleMeta?.caloriesBurned)
      console.log('🏋️ Sample steps:', sampleMeta?.steps)
    }
    const today = new Date().toDateString()
    const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    // Estimation functions for when data is missing
    const estimateSteps = (type: string, minutes: number) => {
      const perMin: Record<string, number> = {
        'Running': 180,
        'Walking': 110,
        'Hiking': 120,
        'Cycling': 0,
        'Swimming': 0,
        'Yoga': 0,
        'Strength Training': 0,
        'Other': 0,
      }
      const key = perMin[type] !== undefined ? type : 'Other'
      return Math.round(minutes * (perMin[key] || 0))
    }

    const estimateCalories = (type: string, minutes: number) => {
      const perMin: Record<string, number> = {
        'Running': 11, // ~660 kcal/hour
        'Walking': 4,  // ~240 kcal/hour
        'Hiking': 7,   // ~420 kcal/hour
        'Cycling': 8,  // ~480 kcal/hour
        'Swimming': 9, // ~540 kcal/hour
        'Yoga': 3,     // ~180 kcal/hour
        'Strength Training': 6, // ~360 kcal/hour
        'Other': 5,
      }
      const key = perMin[type] !== undefined ? type : 'Other'
      return Math.max(0, Math.round(minutes * (perMin[key] || 0)))
    }
    
    // Filter today's fitness entries
    const todayEntries = fitness.filter(f => {
      const meta = getMeta(f)
      const entryDate = meta?.date || f.createdAt || f.created_at
      return entryDate && new Date(entryDate).toDateString() === today
    })
    
    console.log('🏋️ Today entries:', todayEntries.length, todayEntries)
    
    const todayWorkouts = todayEntries.length
    
    const weekWorkouts = fitness.filter(f => {
      const meta = getMeta(f)
      const entryDate = meta?.date || f.createdAt || f.created_at
      return entryDate && new Date(entryDate).getTime() >= thisWeek
    }).length
    
    // Calculate calories burned today with estimation
    const caloriesBurned = todayEntries.reduce((sum, f) => {
      const meta = getMeta(f)
      let calories = Number(meta?.calories || meta?.caloriesBurned || 0)
      
      // If no calories logged, estimate based on activity type and duration
      if (calories === 0) {
        const activityType = meta?.activityType || 'Other'
        const duration = Number(meta?.duration || 0)
        if (duration > 0) {
          calories = estimateCalories(activityType, duration)
          console.log('🏋️ Estimated calories:', calories, 'for', activityType, duration, 'min')
        }
      }
      
      console.log('🏋️ Adding calories:', calories, 'from entry:', f.id)
      return sum + calories
    }, 0)
    
    // Calculate steps today with estimation
    const todaySteps = todayEntries.reduce((sum, f) => {
      const meta = getMeta(f)
      let steps = Number(meta?.steps || 0)
      
      // If no steps logged, estimate based on activity type and duration
      if (steps === 0) {
        const activityType = meta?.activityType || 'Other'
        const duration = Number(meta?.duration || 0)
        if (duration > 0) {
          steps = estimateSteps(activityType, duration)
          console.log('🏋️ Estimated steps:', steps, 'for', activityType, duration, 'min')
        }
      }
      
      console.log('🏋️ Adding steps:', steps, 'from entry:', f.id)
      return sum + steps
    }, 0)
    
    // Calculate distance today (in miles)
    const todayDistance = todayEntries.reduce((sum, f) => {
      const meta = getMeta(f)
      return sum + (Number(meta?.distance) || 0)
    }, 0)
    
    // Calculate active minutes today
    const activeMinutes = todayEntries.reduce((sum, f) => {
      const meta = getMeta(f)
      return sum + (Number(meta?.duration) || 0)
    }, 0)
    
    console.log('🏋️ Final stats:', { caloriesBurned, todaySteps, todayDistance, activeMinutes, todayWorkouts })
    
    return { todayWorkouts, weekWorkouts, caloriesBurned, steps: todaySteps, distance: todayDistance, activeMinutes }
  }, [data.fitness, getMeta, refreshTrigger])

  // Mindfulness metrics
  const mindfulnessStats = useMemo(() => {
    const mindfulness = (data.mindfulness || []) as any[]
    if (!mindfulness.length) {
      return { todayMinutes: 0, journals: 0, streak: 0, avgMoodScore: null }
    }

    const today = new Date().toDateString()
    const todayMinutes = mindfulness
      .filter(m => {
        const meta = getMeta(m)
        return new Date(meta?.date || m.createdAt).toDateString() === today
      })
      .reduce((sum, m) => {
        const meta = getMeta(m)
        return sum + (Number(meta?.duration || meta?.minutes) || 0)
      }, 0)

    const journals = mindfulness.filter(m => {
      const meta = getMeta(m)
      const entryType = String(meta.entryType ?? meta.type ?? '').toLowerCase()
      return entryType.includes('journal')
    }).length

    const dateKeys = new Set<string>()
    mindfulness.forEach(item => {
      const meta = getMeta(item)
      const rawDate = meta?.date || item.createdAt
      if (!rawDate) return
      const parsed = new Date(rawDate)
      if (!Number.isNaN(parsed.getTime())) {
        dateKeys.add(parsed.toISOString().split('T')[0])
      }
    })

    let streak = 0
    const cursor = new Date()
    while (true) {
      const key = cursor.toISOString().split('T')[0]
      if (dateKeys.has(key)) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    const moodEntries = mindfulness
      .map(item => {
        const meta = getMeta(item)
        const raw = meta.moodScore ?? meta.moodValue
        if (raw === undefined || raw === null) return null
        let score = Number(raw)
        if (!Number.isFinite(score)) return null
        if (score <= 5) score *= 2
        return Math.min(Math.max(score, 1), 10)
      })
      .filter((value): value is number => value !== null)

    const avgMoodScore = moodEntries.length > 0
      ? moodEntries.reduce((sum, value) => sum + value, 0) / moodEntries.length
      : null

    return { todayMinutes, journals, streak, avgMoodScore }
  }, [data.mindfulness, getMeta])

  // Pets metrics
  // Digital metrics
  const digitalStats = useMemo(() => computeDigitalStats(data.digital ?? []), [data.digital])

  // Assets (Appliances) metrics - merge domain_entries with appliances table
  const appliancesStats = useMemo(
    () => computeAppliancesStats(data.appliances ?? [], appliancesFromTable),
    [data.appliances, appliancesFromTable]
  )

  const hasDigitalData = digitalStats.hasData
  const hasAppliancesData = appliancesStats.hasData

  // Legal metrics
  const legalStats = useMemo(() => {
    const legalEntries = mapWithMeta(Array.isArray(data.legal) ? data.legal : [])
    if (!legalEntries.length) {
      return { contacts: 0, expiring: 0, count: 0 }
    }

    const now = new Date()

    const contacts = legalEntries.filter(({ meta }) => {
      const type = String(meta.type ?? meta.documentType ?? '').toLowerCase()
      return type.includes('contact') || type.includes('advisor')
    }).length

    const expiring = legalEntries.filter(({ meta }) => {
      const exp = meta.expiryDate ?? meta.renewalDate ?? meta.expirationDate
      if (!exp) return false
      const expiryDate = new Date(String(exp))
      if (Number.isNaN(expiryDate.getTime())) return false
      const daysUntil = differenceInDays(expiryDate, now)
      return daysUntil >= 0 && daysUntil <= 30
    }).length

    return { contacts, expiring, count: legalEntries.length }
  }, [data.legal, mapWithMeta])

  // Miscellaneous metrics
  const miscStats = useMemo(() => {
    const miscEntries = mapWithMeta(Array.isArray(data.miscellaneous) ? data.miscellaneous : [])
    if (!miscEntries.length) {
      return { totalValue: 0, categories: 0, count: 0 }
    }

    const totalValue = miscEntries.reduce((sum, { meta }) => {
      const value = Number(meta.estimatedValue ?? meta.value ?? meta.currentValue ?? meta.purchasePrice ?? 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    const categories = new Set(
      miscEntries
        .map(({ meta }) => String(meta.category ?? meta.type ?? '').trim())
        .filter(Boolean)
    ).size

    return { totalValue, categories, count: miscEntries.length }
  }, [data.miscellaneous, mapWithMeta])

  // Get critical alerts from real data
  const alerts = useMemo(() => {
    const urgentAlerts: any[] = []
    
    // Add expiring documents from Google Drive
    expiringDocuments.forEach(doc => {
      const daysLeft = doc.daysLeft
      const alertId = `doc-${doc.id}-${doc.expirationDate}`
      urgentAlerts.push({
        id: alertId,
        type: 'document',
        title: doc.name,
        daysLeft,
        domain: doc.domain,
        priority: daysLeft <= 7 ? 'high' : daysLeft <= 14 ? 'medium' : 'low'
      })
    })

    // Check warranties expiring soon from appliances
    const today = new Date()
    appliancesFromTable.forEach(appliance => {
      const warranties = appliance.metadata?.warranties || []
      warranties.forEach((warranty: any) => {
        if (warranty.expiry_date) {
          const expiryDate = new Date(warranty.expiry_date)
          const daysUntilExpiry = differenceInDays(expiryDate, today)
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            const alertId = `warranty-${warranty.id}-${warranty.expiry_date}`
            urgentAlerts.push({
              id: alertId,
              type: 'warranty',
              title: `${warranty.warranty_name || 'Warranty'} (${appliance.title})`,
              daysLeft: daysUntilExpiry,
              domain: 'appliances',
              priority: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low'
            })
          }
        }
      })
    })

    // Check tasks due soon
    tasks.forEach(task => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate)
        const daysUntilDue = differenceInDays(dueDate, today)
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          const alertId = `task-${task.id}-${task.dueDate}`
          urgentAlerts.push({
            id: alertId,
            type: 'task',
            title: task.title,
            daysLeft: daysUntilDue,
            priority: daysUntilDue <= 2 ? 'high' : 'medium'
          })
        }
      }
    })
    
    // Check health items with expiry (medications, prescriptions)
    const healthData = data.health || []
    healthData.forEach(item => {
      if (item.metadata?.expiryDate && (typeof item.metadata.expiryDate === 'string' || typeof item.metadata.expiryDate === 'number')) {
        const daysUntilExpiry = differenceInDays(new Date(item.metadata.expiryDate), today)
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          const alertId = `health-${item.id}-${item.metadata.expiryDate}`
          urgentAlerts.push({
            id: alertId,
            type: 'health',
            title: item.title,
            daysLeft: daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
          })
        }
      }

      // Check medication refill dates - CRITICAL priority within 7 days
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, today)
        
        // Alert for medications due within 7 days
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          const alertId = `medication-${item.id}-${item.metadata.refillDate}`
          const medicationName = item.metadata?.medicationName || item.metadata?.name || item.title
          urgentAlerts.push({
            id: alertId,
            type: 'medication',
            title: `💊 ${medicationName}`,
            daysLeft: daysUntilRefill,
            priority: 'high', // All medication refills within 7 days are high priority
            link: '/domains/health'
          })
        }
      }
    })

    // Check insurance items with expiry
    const insuranceData = Array.isArray(data.insurance) ? data.insurance : []
    console.log('🔔 Checking insurance alerts:', {
      totalInsurance: insuranceData.length,
      today: today.toISOString(),
      dataType: typeof data.insurance,
      isArray: Array.isArray(data.insurance)
    })
    insuranceData.forEach(item => {
      const expiryDate = item.metadata?.expiryDate || item.metadata?.renewalDate
      if (expiryDate && (typeof expiryDate === 'string' || typeof expiryDate === 'number')) {
        const daysUntilExpiry = differenceInDays(new Date(expiryDate), today)
        console.log('📋 Policy check:', {
          title: item.title,
          expiryDate,
          daysUntilExpiry,
          willAlert: daysUntilExpiry >= 0 && daysUntilExpiry <= 30
        })
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          const alertId = `insurance-${item.id}-${expiryDate}`
          urgentAlerts.push({
            id: alertId,
            type: 'insurance',
            title: item.title,
            daysLeft: daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
          })
        }
      }
    })

    // Add pet vaccination alerts from the stats hook
    petsStats.vaccineAlerts.forEach(alert => {
      const alertId = `vaccine-${alert.id}-${alert.nextDueDate}`
      urgentAlerts.push({
        id: alertId,
        type: 'vaccine',
        title: `🐾 ${alert.petName} - ${alert.vaccineName}`,
        daysLeft: alert.daysUntilDue,
        priority: alert.daysUntilDue <= 7 ? 'high' : 'medium',
        petId: alert.petId,
        vaccinationId: alert.id,
        link: `/pets/${alert.petId}`
      })
    })

    // Filter out dismissed alerts, then sort by priority (high first) then by days left
    return urgentAlerts
      .filter(alert => !dismissedAlerts.has(alert.id))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
        if (priorityDiff !== 0) return priorityDiff
        return a.daysLeft - b.daysLeft
      })
      .slice(0, 5)
  }, [data, expiringDocuments, tasks, dismissedAlerts, petsStats, appliancesFromTable])

  const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0)

  const [activeView, setActiveView] = useState('overview')

  // REMOVED: Loading check that was blocking dashboard
  // Dashboard now renders immediately, even without data
  // if (isLoading || !isLoaded) { ... }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">

        {/* Quick Add Dialogs */}
        {addTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-900 p-4 shadow-lg">
              <div className="text-lg font-semibold mb-2">Add Task</div>
              <input className="w-full border rounded p-2 mb-2 bg-transparent" placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="border rounded p-2 bg-transparent" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input className="border rounded p-2 bg-transparent" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
              </div>
              <textarea className="w-full border rounded p-2 mb-3 bg-transparent" rows={3} placeholder="Notes (optional)" value={newTaskNotes} onChange={(e) => setNewTaskNotes(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!newTaskTitle.trim()) return; addTask({ title: newTaskTitle, completed: false, priority: newTaskPriority, dueDate: newTaskDueDate || undefined, notes: newTaskNotes || undefined } as any); setNewTaskTitle(''); setNewTaskNotes(''); setNewTaskDueDate(''); setNewTaskPriority('medium'); setAddTaskOpen(false); }}>Add</Button>
              </div>
            </div>
          </div>
        )}

        {addHabitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-900 p-4 shadow-lg">
              <div className="text-lg font-semibold mb-2">Add Habit</div>
              <input className="w-full border rounded p-2 mb-2 bg-transparent" placeholder="Habit name" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} />
              <div className="grid grid-cols-3 gap-2 mb-3">
                <select
                  className="border rounded p-2 bg-background col-span-2"
                  value={newHabitFrequency}
                  onChange={(e) => setNewHabitFrequency(e.target.value as any)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  className="border rounded p-2 bg-background"
                  type="number"
                  min={1}
                  value={Number.isFinite(newHabitTarget as any) ? newHabitTarget : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') { setNewHabitTarget(1); return }
                    const n = parseInt(v, 10)
                    if (!Number.isNaN(n)) setNewHabitTarget(Math.max(1, n))
                  }}
                  placeholder="Target"
                  inputMode="numeric"
                />
              </div>
              <input className="w-full border rounded p-2 mb-3 bg-transparent" placeholder="Icon (emoji) e.g. ⭐" value={newHabitIcon} onChange={(e) => setNewHabitIcon(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddHabitOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!newHabitName.trim()) return; addHabit({ name: newHabitName, completed: false, streak: 0, frequency: newHabitFrequency, icon: newHabitIcon } as any); setNewHabitName(''); setNewHabitIcon('⭐'); setNewHabitTarget(1); setNewHabitFrequency('daily'); setAddHabitOpen(false); }}>Add</Button>
              </div>
            </div>
          </div>
        )}

        {addEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-900 p-4 shadow-lg">
              <div className="text-lg font-semibold mb-2">Add Event</div>
              <input className="w-full border rounded p-2 mb-2 bg-transparent" placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input className="border rounded p-2 bg-transparent" type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                <input className="border rounded p-2 bg-transparent" type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
              </div>
              <input className="w-full border rounded p-2 mb-2 bg-transparent" placeholder="Location (optional)" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
              <textarea className="w-full border rounded p-2 mb-3 bg-transparent" rows={3} placeholder="Notes (optional)" value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddEventOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!eventForm.title || !eventForm.date) return; addEvent({ title: eventForm.title, date: eventForm.date, type: eventForm.time, metadata: { location: eventForm.location || undefined, notes: eventForm.notes || undefined } } as any); setEventForm({ title: '', date: '', time: '', location: '', notes: '' }); setAddEventOpen(false); }}>Add</Button>
              </div>
            </div>
          </div>
        )}

        {/* Top Row - Priority Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Smart Inbox Card - AI Email Parsing */}
          <SmartInboxCard />

          {/* Critical Alerts Card */}
          <Card className="border-2 border-red-200 dark:border-red-900 hover:shadow-xl transition-all cursor-pointer" onClick={() => setAlertsDialogOpen(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-lg">Critical Alerts</span>
                </div>
                <Badge variant="destructive" suppressHydrationWarning>{isClient ? alerts.length : 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isExpiringDocsLoading && alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking for expiring documents...</span>
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">All clear! No urgent alerts 🎉</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm truncate">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-red-600">
                          {alert.daysLeft}d
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissAlert(alert.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          title="Dismiss alert"
                        >
                          <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {alertsDialogOpen && (
            <CategorizedAlertsDialog open={alertsDialogOpen} onClose={() => setAlertsDialogOpen(false)} />
          )}

          {/* Tasks Card */}
          <Card className="border-2 border-orange-200 dark:border-orange-900 hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-lg">Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" suppressHydrationWarning>{isClient ? tasks.length : 0}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          type="checkbox" 
                          checked={!!task.completed} 
                          className="w-4 h-4 cursor-pointer" 
                          onChange={() => updateTask(task.id, { completed: !task.completed })} 
                        />
                        <span className={`text-sm flex-1 truncate ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</span>
                      </div>
                      {task.dueDate && (
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{task.dueDate}</span>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (window.confirm('Delete this task?')) {
                            await deleteTask(task.id)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{tasks.length - 3} more tasks
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Habits Card */}
          <Card className="border-2 border-teal-200 dark:border-teal-900 hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-500" />
                  <span className="text-lg">Habits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" suppressHydrationWarning>{isClient ? habits.length : 0}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAddHabitOpen(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No habits tracked yet</p>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 3).map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                      <div className="flex items-center gap-2 flex-1">
                        <input 
                          type="checkbox" 
                          checked={!!habit.completed} 
                          className="w-4 h-4" 
                          onChange={() => toggleHabit(habit.id)} 
                        />
                        <span className={`text-sm ${habit.completed ? 'line-through opacity-60' : ''}`}>{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{habit.streak}d</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteHabit(habit.id, habit.name)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Calendar Card - Upcoming Events */}
          <GoogleCalendarCard />

          {/* Special Dates Card - Birthdays & Anniversaries from Relationships */}
          <SpecialDatesCard />

          {/* Weekly Insights (AI) - Real-time insights from your data */}
          <InsightsCardWorking />

          {/* Weather Forecast - 7 Day Outlook (FREE API - No Key Needed!) */}
          <WeatherFreeCard />

          {/* Tech News - Hacker News Top Stories (FREE API - No Key Needed!) */}
          <NewsFreeCard />

          {/* Document Expiration Tracker - Critical Documents Expiring Soon */}
          <DocumentExpirationCard />

          {/* Upcoming Bills - Next 30 Days */}
          <UpcomingBillsCard />

          {/* Recent Activity - Latest Updates Across Domains */}
          <RecentActivityCard />
        </div>

        {/* Financial Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (financeNetWorth.netWorth / 1000).toFixed(0) : 0}K
              </div>
              <div className="text-sm opacity-90">Net Worth</div>
              <div className="text-xs opacity-75 mt-1">+$18.5K YTD</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (financeNetWorth.assets / 1000).toFixed(0) : 0}K
              </div>
              <div className="text-sm opacity-90">Total Assets</div>
              <div className="text-xs opacity-75 mt-1">6 categories</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (liabilitiesStats.total / 1000).toFixed(0) : 0}K
              </div>
              <div className="text-sm opacity-90">Liabilities</div>
              <div className="text-xs opacity-75 mt-1">Mort + Loans</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (totalMonthlyExpenses / 1000).toFixed(1) : 0}K
              </div>
              <div className="text-sm opacity-90">Monthly Bills</div>
              <div className="text-xs opacity-75 mt-1">All expenses</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Expenses Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Expenses Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.entries(monthlyExpenses).map(([category, amount]) => (
                <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" suppressHydrationWarning>
                    ${isClient ? amount : 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
                    {category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Domains Grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Health Domain */}
            <Link href="/domains/health">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <h3 className="font-semibold text-sm">Health</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? (data.health?.length || 0) : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Glucose</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(healthStats.glucose, 0, hasHealthData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Weight</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(healthStats.weight, 1, hasHealthData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">HR</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(healthStats.heartRate, 0, hasHealthData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">BP</div>
                      <div className="font-semibold text-xs">{healthStats.bloodPressure}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Meds:{' '}
                    <span className="font-semibold" suppressHydrationWarning>
                      {isClient ? formatNumber(healthStats.medicationCount, 0, hasHealthData) : '--'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Home Domain */}
            <Link href="/domains/home">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-sm">Home</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? homeStats.count : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Value</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(homeStats.value, hasHomeData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tasks</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(homeStats.tasks, 0, hasHomeData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Projects</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(homeStats.projects, 0, hasHomeData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Maint</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(homeStats.maint, 0, hasHomeData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Vehicles Domain */}
            <Link href="/domains/vehicles">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold text-sm">Vehicles</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? vehiclesStats.count : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Total Val</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(vehiclesStats.totalValue, hasVehicleData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cars</div>
                      <div className="font-semibold" suppressHydrationWarning>{isClient ? vehiclesStats.count : 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Service</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(vehiclesStats.needsService, 0, hasVehicleData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Mileage</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatMileage(vehiclesStats.totalMileage, hasVehicleData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Miscellaneous Domain */}
            <Link href="/domains/miscellaneous">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-gray-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <h3 className="font-semibold text-sm">Miscellaneous</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                      {isClient ? formatNumber(miscStats.count, 0, hasMiscData) : '--'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Value</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(miscStats.totalValue, hasMiscData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Items</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(miscStats.count, 0, hasMiscData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Categories</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(miscStats.categories, 0, hasMiscData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Track</div>
                      <div className="font-semibold">Add</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Nutrition Domain */}
            <Link href="/domains/nutrition">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-green-500" />
                      <h3 className="font-semibold text-sm">Nutrition</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? (data.nutrition?.length || 0) : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Calories</div>
                      <div className="font-semibold text-xs" suppressHydrationWarning>
                        {isClient ? `${formatNumber(nutritionStats.calories, 0, hasNutritionData)} / ${formatNumber(nutritionStats.goals.caloriesGoal, 0, hasNutritionData)}` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Protein</div>
                      <div className="font-semibold text-xs" suppressHydrationWarning>
                        {isClient ? `${formatNumber(nutritionStats.protein, 0, hasNutritionData)}g / ${formatNumber(nutritionStats.goals.proteinGoal, 0, hasNutritionData)}g` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Meals</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(nutritionStats.meals, 0, hasNutritionData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Water</div>
                      <div className="font-semibold text-xs" suppressHydrationWarning>
                        {isClient ? `${formatNumber(Math.round(nutritionStats.water), 0, hasNutritionData)} / ${formatNumber(nutritionStats.goals.waterGoal, 0, hasNutritionData)} oz` : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Workouts Domain */}
            <Link href="/domains/fitness">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-sm">Workout</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? (data.fitness?.length || 0) : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Steps</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(fitnessStats.steps, 0, hasFitnessData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Calories</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(fitnessStats.caloriesBurned, 0, hasFitnessData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Distance</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? (hasFitnessData && fitnessStats.distance > 0 ? `${fitnessStats.distance.toFixed(1)} mi` : '--') : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Active Min</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(fitnessStats.activeMinutes, 0, hasFitnessData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Fitness Distance Progress Chart */}
            {hasFitnessData && (() => {
              // Calculate last 7 days of distance
              const last7Days: Array<{ date: string; distance: number }> = []
              const today = new Date()
              for (let i = 6; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dateStr = date.toDateString()
                const monthDay = `${date.getMonth() + 1}/${date.getDate()}`
                
                const dayDistance = (data.fitness || []).filter((f: any) => {
                  const meta = getMeta(f)
                  const entryDate = meta?.date || f.createdAt || f.created_at
                  return entryDate && new Date(entryDate).toDateString() === dateStr
                }).reduce((sum, f: any) => {
                  const meta = getMeta(f)
                  return sum + (Number(meta?.distance) || 0)
                }, 0)
                
                last7Days.push({ date: monthDay, distance: dayDistance })
              }
              
              const hasDistanceData = last7Days.some(d => d.distance > 0)
              if (!hasDistanceData) return null
              
              return (
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <Link href="/domains/fitness">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <h3 className="font-semibold text-sm">Distance Progress (7 Days)</h3>
                        </div>
                      </div>
                      <div className="h-20 mt-2">
                        {isClient && (
                          <div className="flex items-end justify-between h-full gap-1">
                            {last7Days.map((day, idx) => {
                              const maxDistance = Math.max(...last7Days.map(d => d.distance), 1)
                              const heightPercent = (day.distance / maxDistance) * 100
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                                  <div 
                                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all hover:from-orange-600 hover:to-orange-500"
                                    style={{ height: `${heightPercent}%`, minHeight: day.distance > 0 ? '8px' : '2px' }}
                                    title={`${day.date}: ${day.distance.toFixed(1)} mi`}
                                  />
                                  <div className="text-[9px] text-gray-500 mt-1">{day.date.split('/')[1]}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-center text-gray-600">
                        Total: <span className="font-semibold">{last7Days.reduce((sum, d) => sum + d.distance, 0).toFixed(1)} mi</span>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Mindful Domain */}
            <Link href="/domains/mindfulness">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <h3 className="font-semibold text-sm">Mindful</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? (data.mindfulness?.length || 0) : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Minutes</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(mindfulnessStats.todayMinutes, 0, hasMindfulnessData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Streak</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {(() => {
                          if (!isClient) return '--'
                          const value = formatNumber(mindfulnessStats.streak, 0, hasMindfulnessData)
                          return value === '--' ? value : `${value}d`
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Journal</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(mindfulnessStats.journals, 0, hasMindfulnessData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Mood</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatMood(mindfulnessStats.avgMoodScore, hasMindfulnessData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Pets Domain */}
            <Link href="/domains/pets">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-pink-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <h3 className="font-semibold text-sm">Pets</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? petsStats.petProfileCount : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Pets</div>
                      <div className="font-semibold" suppressHydrationWarning>{isClient ? formatNumber(petsStats.petProfileCount, 0, hasPetsData) : 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Vet 30d</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrency(petsStats.vetVisitsLast30Cost, hasPetsData, 0) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Vaccines due</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(petsStats.vaccinesDue, 0, hasPetsData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cost/mo</div>
                      <div className="font-semibold" suppressHydrationWarning>{isClient ? formatCurrency(petsStats.monthlyCost, hasPetsData, 0) : '--'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Digital Domain */}
            <Link href="/domains/digital">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-cyan-500" />
                      <h3 className="font-semibold text-sm">Digital</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? (data.digital?.length || 0) : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Subs</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(digitalStats.subscriptions, 0, hasDigitalData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cost/mo</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrency(digitalStats.monthlyCost, hasDigitalData, 2) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Passwords</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(digitalStats.passwords, 0, hasDigitalData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Expiring</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(digitalStats.expiring, 0, hasDigitalData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Assets Domain (formerly Appliances) */}
            <Link href="/domains/appliances">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-indigo-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-semibold text-sm">Assets</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>{isClient ? appliancesStats.count : 0}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Items</div>
                      <div className="font-semibold" suppressHydrationWarning>{isClient ? appliancesStats.count : 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Value</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(appliancesStats.totalValue, hasAppliancesData) : '--'}
                      </div>
                    </div>
              <div>
                <div className="text-gray-500">Under Warranty</div>
                <div className="font-semibold" suppressHydrationWarning>
                  {isClient ? formatNumber(appliancesStats.underWarranty, 0, hasAppliancesData) : '--'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 flex items-center gap-1">
                  Total Cost
                  {isClient && appliancesStats.warrantiesDue > 0 && (
                    <span className="text-red-500 font-bold" title={`${appliancesStats.warrantiesDue} warranties expiring soon!`}>
                      ⚠️
                    </span>
                  )}
                </div>
                <div className="font-semibold" suppressHydrationWarning>
                  {isClient ? formatCurrency(appliancesStats.totalCost, hasAppliancesData, 0) : '--'}
                </div>
              </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Liabilities Domain */}
            <Link href="/domains/financial">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                      <h3 className="font-semibold text-sm">Liabilities</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                      {isClient ? liabilitiesStats.accounts : 0}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Total Debt</div>
                      <div className="font-semibold text-red-600" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(liabilitiesStats.total, liabilitiesStats.hasData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Mortgage</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(liabilitiesStats.mortgage, liabilitiesStats.hasData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Auto Loans</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(liabilitiesStats.autoLoans, liabilitiesStats.hasData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Credit Cards</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrencyK(liabilitiesStats.creditCards, liabilitiesStats.hasData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Relationships Domain */}
            <Link href="/domains/relationships">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-pink-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-500" />
                      <h3 className="font-semibold text-sm">Relationships</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                      {isClient ? formatNumber(relationshipsStats.contacts, 0, hasRelationshipsData) : 0}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Contacts</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(relationshipsStats.contacts, 0, hasRelationshipsData) : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Birthdays</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(relationshipsStats.birthdays, 0, hasRelationshipsData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Events</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(relationshipsStats.events, 0, hasRelationshipsData) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Reminders</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(relationshipsStats.reminders, 0, hasRelationshipsData) : '--'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}