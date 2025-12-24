'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Masonry from 'react-masonry-css'
import { idbGet, idbSet, idbDel } from '@/lib/utils/idb-cache'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { debugIngest } from '@/lib/utils/debug-ingest'
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
  Zap,
  CreditCard,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { calculateUnifiedNetWorth } from '@/lib/utils/unified-financial-calculator'
import { useServiceProviders } from '@/lib/hooks/use-service-providers'
import { CategorizedAlertsDialog } from '../dialogs/categorized-alerts-dialog'
import { FinancialBreakdownDialog, type BreakdownViewType } from '../dialogs/financial-breakdown-dialog'
import { getTodayNutrition, calculateTodayTotals } from '@/lib/nutrition-daily-tracker'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleCalendarCard } from './google-calendar-card'
import { SmartInboxCard } from './smart-inbox-card'
import { InsightsCardWorking } from './insights-card-working'
import { AIInsightsCard } from './ai-insights-card'
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
import { useCrossDomainExpenses, type ExpenseCategory } from '@/lib/hooks/use-cross-domain-expenses'
import type { ExpenseItemWithDomain } from '../dialogs/financial-breakdown-dialog'
import type { GenericMetadata } from '@/lib/dashboard/metrics-normalizers'

// Helper function to get the upcoming occurrence of an annual date (birthday, anniversary)
function getUpcomingAnnualDate(dateStr: string): Date {
  const today = new Date()
  const thisYear = today.getFullYear()
  
  // Parse the date - could be "YYYY-MM-DD" or "MM-DD" or other formats
  let month: number, day: number
  const parts = dateStr.split('-')
  
  if (parts.length === 3) {
    // YYYY-MM-DD format
    month = parseInt(parts[1], 10) - 1 // months are 0-indexed
    day = parseInt(parts[2], 10)
  } else if (parts.length === 2) {
    // MM-DD format
    month = parseInt(parts[0], 10) - 1
    day = parseInt(parts[1], 10)
  } else {
    // Try to parse as a full date
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      month = parsed.getMonth()
      day = parsed.getDate()
    } else {
      // If all else fails, return a date far in the future
      return new Date(thisYear + 100, 0, 1)
    }
  }
  
  // Create date for this year
  const thisYearDate = new Date(thisYear, month, day)
  
  // If the date has already passed this year, use next year
  if (thisYearDate < today) {
    return new Date(thisYear + 1, month, day)
  }
  
  return thisYearDate
}

export function CommandCenterRedesigned() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { data, tasks, habits, events, addTask, updateTask, deleteTask, addHabit, toggleHabit, deleteHabit, addEvent, isLoading, isLoaded } = useData()
  const { analytics: serviceProvidersAnalytics, analyticsLoading: serviceProvidersLoading } = useServiceProviders()
  
  // Cross-domain expense aggregation for unified Command Center view
  const crossDomainExpenses = useCrossDomainExpenses(30)
  
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false)
  const [financialBreakdownOpen, setFinancialBreakdownOpen] = useState(false)
  const [financialBreakdownView, setFinancialBreakdownView] = useState<BreakdownViewType>('net-worth')
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
  const [travelBookings, setTravelBookings] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Force re-render on data updates
  
  // 🔥 Listen for immediate data updates from DataProvider mutations
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('🔔 Dashboard received data update event:', event.detail)
      // #region agent log
      debugIngest({
        location: 'command-center-redesigned.tsx:handleDataUpdate',
        message: 'Dashboard received data-updated event',
        data: { domain: event.detail?.domain, action: event.detail?.action, dataCount: event.detail?.data?.length },
        sessionId: 'debug-session',
        hypothesisId: 'H5',
      })
      // #endregion
      setRefreshTrigger(prev => prev + 1) // Force re-render of memoized stats
    }

    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    window.addEventListener('fitness-data-updated', handleDataUpdate as EventListener)
    window.addEventListener('financial-data-updated', handleDataUpdate as EventListener)
    window.addEventListener('digital-data-updated', handleDataUpdate as EventListener)
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('fitness-data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('financial-data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('digital-data-updated', handleDataUpdate as EventListener)
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
        
        // #region agent log
        console.log('🔴🔴🔴 [DEBUG] Vehicles table query result:', {
          vehiclesCount: vehicles?.length||0,
          vehicleIds: vehicles?.map((v:any)=>v.id)||[],
          error: error?.message||null
        });
        debugIngest({
          location: 'command-center-redesigned.tsx:loadVehicles',
          message: 'Loaded from vehicles table',
          data: { vehiclesCount: vehicles?.length || 0, vehicleIds: vehicles?.map((v: any) => v.id) || [], error: error?.message || null },
          sessionId: 'debug-session',
          hypothesisId: 'H2',
        })
        // #endregion

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

  // Load travel bookings for departure alerts
  useEffect(() => {
    const loadTravelBookings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get bookings with start_date within the next 30 days
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        
        const { data: bookings, error } = await supabase
          .from('travel_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .lte('start_date', thirtyDaysFromNow.toISOString().split('T')[0])
          .order('start_date', { ascending: true })
        
        if (error) {
          // Travel bookings table might not exist - that's OK
          console.log('⚠️ Travel bookings not accessible:', error.message)
          setTravelBookings([])
          return
        }
        
        setTravelBookings(bookings || [])
        console.log(`✅ Loaded ${(bookings || []).length} upcoming travel bookings`)
      } catch (error) {
        console.error('Failed to load travel bookings:', error)
        setTravelBookings([])
      }
    }
    
    if (isLoaded) {
      loadTravelBookings()
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
        unified.breakdown.miscValue +
        unified.breakdown.appliancesValue,
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
    const initial = { housing: 0, food: 0, insurance: 0, transport: 0, utilities: 0, pets: 0, other: 0 }

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

    // Add digital subscriptions to "Other" category
    // #region agent log
    console.log('🔍 [DEBUG-H1] Digital items for monthlyExpenses:', digitalItems.length, digitalItems.slice(0, 5).map((i: any) => ({ title: i.title, type: i.metadata?.type, cost: i.metadata?.monthlyCost || i.metadata?.cost })))
    // #endregion
    digitalItems.forEach(item => {
      const meta = item?.metadata || {}
      const tokens = normaliseTokens(meta)
      const isSubscription = tokens.includes('subscription') || 
                            meta?.type === 'subscription' || 
                            meta?.category === 'subscription'
      
      // #region agent log
      console.log('🔍 [DEBUG-H2] Checking digital item:', item.title, { isSubscription, type: meta?.type, tokens, monthlyCost: meta?.monthlyCost, cost: meta?.cost })
      // #endregion
      if (isSubscription) {
        const cost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
        // #region agent log
        console.log('🔍 [DEBUG-H2] Subscription found:', item.title, 'cost:', cost)
        // #endregion
        if (cost > 0) {
          result.other += cost  // Changed from utilities to other
        }
      }
    })

    // Add ALL home domain bills to appropriate categories
    const homeItems = Array.isArray(data.home) ? data.home : []
    console.log('🏠 [MONTHLY-EXPENSES] Processing home domain for bills:', {
      homeItemsCount: homeItems.length,
      homeItemsSample: homeItems.slice(0, 5).map((i: any) => ({
        id: i.id,
        title: i.title,
        itemType: i.metadata?.itemType,
        category: i.metadata?.category,
        amount: i.metadata?.amount
      }))
    })
    
    homeItems.forEach(item => {
      const meta = item?.metadata || {}
      
      // Check if this is a bill from the home domain
      const itemType = String(meta?.itemType || '').toLowerCase()
      if (itemType !== 'bill') return
      
      const amount = parseFloat(String(meta?.amount || meta?.monthlyCost || meta?.cost || 0))
      if (amount <= 0) return
      
      const category = String(meta?.category || '').toLowerCase()
      
      // Categorize home bills into the appropriate expense bucket
      if (category === 'mortgage' || category === 'rent' || category === 'tax') {
        // Mortgage, rent, and property tax go to housing
        result.housing += amount
        console.log(`🏠 Added home ${category} bill to housing: $${amount} (${item.title})`)
      } else if (category === 'utilities') {
        result.utilities += amount
        console.log(`💡 Added home utilities bill to utilities: $${amount} (${item.title})`)
      } else if (category === 'insurance') {
        result.insurance += amount
        console.log(`🛡️ Added home insurance bill to insurance: $${amount} (${item.title})`)
      } else {
        // 'other' or any unknown category
        result.other += amount
        console.log(`📄 Added home ${category || 'other'} bill to other: $${amount} (${item.title})`)
      }
    })

    // Add service provider costs from dedicated service_providers table
    if (serviceProvidersAnalytics?.spending_by_category) {
      serviceProvidersAnalytics.spending_by_category.forEach(({ category, amount }) => {
        if (category === 'insurance') {
          result.insurance += amount
        } else if (category === 'utilities' || category === 'telecom') {
          result.utilities += amount
        } else {
          result.other += amount
        }
      })
    }

    // Add vehicle domain costs (fuel, repair, maintenance) to transport category
    // Include costs from the CURRENT MONTH (not just last 30 days)
    const vehicleItems = Array.isArray(data.vehicles) ? data.vehicles : []
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    console.log('🚗 [MONTHLY-EXPENSES] Processing vehicle domain for costs:', {
      vehicleItemsCount: vehicleItems.length,
      startOfMonth: startOfMonth.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString(),
      vehicleItemsSample: vehicleItems.slice(0, 15).map((i: any) => ({
        id: i.id,
        title: i.title,
        type: i.metadata?.type,
        costType: i.metadata?.costType,
        amount: i.metadata?.amount,
        date: i.metadata?.date
      }))
    })
    
    let vehicleCostTotal = 0
    vehicleItems.forEach(item => {
      const meta = item?.metadata || {}
      const itemType = String(meta?.type || '').toLowerCase()
      
      // Only process cost entries from vehicles domain
      if (itemType !== 'cost') {
        return
      }
      
      const amount = parseFloat(String(meta?.amount || 0))
      if (amount <= 0) {
        console.log(`🚗 [TRANSPORT] Skipping ${item.title}: amount <= 0 (${meta?.amount})`)
        return
      }
      
      // Check if within current month OR last 30 days (whichever is more inclusive)
      const dateValue = meta?.date || item?.createdAt
      if (dateValue) {
        const costDate = new Date(String(dateValue))
        const isInCurrentMonth = costDate >= startOfMonth
        const isInLast30Days = costDate >= thirtyDaysAgo
        
        if (!isInCurrentMonth && !isInLast30Days) {
          console.log(`🚗 [TRANSPORT] Skipping ${item.title}: date ${costDate.toISOString()} is before ${startOfMonth.toISOString()} (start of month) AND ${thirtyDaysAgo.toISOString()} (30 days ago)`)
          return
        }
      }
      
      // All vehicle costs (fuel, repair, maintenance, insurance, etc.) go to transport
      result.transport += amount
      vehicleCostTotal += amount
      console.log(`🚗 [TRANSPORT] ✅ Added vehicle cost: $${amount} (${item.title}, type: ${meta?.costType})`)
    })
    
    console.log('🚗 [MONTHLY-EXPENSES] Vehicle costs total added to transport:', vehicleCostTotal)

    // Add bills from the financial domain (items with itemType='bill')
    // These are the bills stored via the FinanceProvider (like Auto insurance, Netflix, etc.)
    const financialBills = items.filter(item => {
      const meta = item?.metadata || {}
      return String(meta?.itemType || '').toLowerCase() === 'bill'
    })
    
    console.log('💵 [MONTHLY-EXPENSES] Processing financial domain bills:', {
      billsCount: financialBills.length,
      billsSample: financialBills.map((b: any) => ({
        title: b.title,
        category: b.metadata?.category,
        amount: b.metadata?.amount
      }))
    })
    
    financialBills.forEach(item => {
      const meta = item?.metadata || {}
      const amount = parseFloat(String(meta?.amount || 0))
      if (amount <= 0) return
      
      const category = String(meta?.category || '').toLowerCase()
      
      // Categorize bills into the appropriate expense bucket
      if (category === 'insurance' || category.includes('insur')) {
        result.insurance += amount
        console.log(`🛡️ [BILLS] Added ${category} bill to insurance: $${amount} (${item.title})`)
      } else if (category === 'utilities' || category.includes('utilit') || category.includes('electric') || category.includes('water') || category.includes('internet') || category.includes('phone')) {
        result.utilities += amount
        console.log(`💡 [BILLS] Added ${category} bill to utilities: $${amount} (${item.title})`)
      } else if (category === 'housing' || category.includes('rent') || category.includes('mort')) {
        result.housing += amount
        console.log(`🏠 [BILLS] Added ${category} bill to housing: $${amount} (${item.title})`)
      } else if (category === 'food' || category.includes('groc') || category.includes('dining')) {
        result.food += amount
        console.log(`🍔 [BILLS] Added ${category} bill to food: $${amount} (${item.title})`)
      } else if (category === 'transport' || category.includes('trans') || category.includes('car') || category.includes('gas')) {
        result.transport += amount
        console.log(`🚗 [BILLS] Added ${category} bill to transport: $${amount} (${item.title})`)
      } else {
        result.other += amount
        console.log(`📄 [BILLS] Added ${category || 'other'} bill to other: $${amount} (${item.title})`)
      }
    })

    return result
  }, [data.financial, data.insurance, data.digital, data.home, data.vehicles, serviceProvidersAnalytics])
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

  // Open financial breakdown dialog with specified view
  const openFinancialBreakdown = (view: BreakdownViewType) => {
    setFinancialBreakdownView(view)
    setFinancialBreakdownOpen(true)
  }

  // Calculate expense items for the breakdown dialog using cross-domain aggregation
  // This provides unified expense tracking with domain attribution
  const expenseItems = useMemo(() => {
    // Convert cross-domain expenses to dialog format with domain attribution
    const convertToDialogFormat = (category: ExpenseCategory): ExpenseItemWithDomain[] => {
      return crossDomainExpenses.byCategory[category].map(item => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        domain: item.domain,
        domainLabel: item.domainLabel,
        domainIcon: item.domainIcon,
        isRecurring: item.isRecurring,
      }))
    }

    return {
      housing: convertToDialogFormat('housing'),
      food: convertToDialogFormat('food'),
      insurance: convertToDialogFormat('insurance'),
      transport: convertToDialogFormat('transport'),
      utilities: convertToDialogFormat('utilities'),
      pets: convertToDialogFormat('pets'),
      health: convertToDialogFormat('health'),
      education: convertToDialogFormat('education'),
      subscriptions: convertToDialogFormat('subscriptions'),
      other: convertToDialogFormat('other'),
    }
  }, [crossDomainExpenses.byCategory])

  // Calculate asset items for the breakdown dialog
  const assetItems = useMemo(() => {
    const homeData = Array.isArray(data.home) ? data.home : []
    const vehicleData = Array.isArray(data.vehicles) ? data.vehicles : []
    const collectiblesData = Array.isArray(data.collectibles) ? data.collectibles : []
    const appliancesData = Array.isArray(data.appliances) ? data.appliances : []
    const miscData = Array.isArray(data.miscellaneous) ? data.miscellaneous : []
    const financialData = Array.isArray(data.financial) ? data.financial : []

    const result: {
      home: Array<{ title: string; value: number; type?: string }>
      vehicles: Array<{ title: string; value: number; type?: string }>
      collectibles: Array<{ title: string; value: number; type?: string }>
      appliances: Array<{ title: string; value: number; type?: string }>
      misc: Array<{ title: string; value: number; type?: string }>
      financial: Array<{ title: string; value: number; type?: string }>
    } = {
      home: [],
      vehicles: [],
      collectibles: [],
      appliances: [],
      misc: [],
      financial: [],
    }

    // Home/Property
    homeData.forEach(item => {
      const meta = item?.metadata as any
      if (meta?.type === 'property' || meta?.itemType === 'property' || meta?.logType === 'property-value') {
        const value = parseFloat(meta?.value || meta?.estimatedValue || meta?.propertyValue || '0')
        if (value > 0) {
          result.home.push({ title: item.title || 'Property', value, type: 'property' })
        }
      }
    })

    // Vehicles
    vehicleData.forEach(item => {
      const meta = item?.metadata as any
      if (meta?.type === 'vehicle') {
        const value = parseFloat(meta?.estimatedValue || meta?.value || '0')
        if (value > 0) {
          result.vehicles.push({ title: item.title || 'Vehicle', value, type: meta?.make })
        }
      }
    })

    // Collectibles
    collectiblesData.forEach(item => {
      const meta = item?.metadata as any
      const value = parseFloat(meta?.estimatedValue || meta?.value || meta?.currentValue || '0')
      if (value > 0) {
        result.collectibles.push({ title: item.title || 'Collectible', value, type: meta?.category })
      }
    })

    // Appliances
    appliancesData.forEach(item => {
      const meta = item?.metadata as any
      const value = parseFloat(meta?.estimatedValue || meta?.currentValue || meta?.purchasePrice || '0')
      if (value > 0) {
        result.appliances.push({ title: item.title || 'Appliance', value, type: meta?.category })
      }
    })

    // Miscellaneous
    miscData.forEach(item => {
      const meta = item?.metadata as any
      if (meta?.itemType === 'general-notes') return
      const value = parseFloat(meta?.estimatedValue || meta?.value || meta?.purchasePrice || '0')
      if (value > 0) {
        result.misc.push({ title: item.title || 'Item', value, type: meta?.category })
      }
    })

    // Financial Assets (non-debt items)
    financialData.forEach(item => {
      const meta = item?.metadata as any
      const type = String(meta?.accountType || meta?.type || '').toLowerCase()
      const itemType = String(meta?.itemType || '').toLowerCase()
      const isDebt = itemType === 'debt' || ['credit', 'loan', 'mortgage', 'liability', 'debt'].some(k => type.includes(k))
      
      if (!isDebt) {
        const value = Number(meta?.balance ?? meta?.currentValue ?? meta?.value ?? 0)
        if (value > 0) {
          result.financial.push({ title: item.title || 'Account', value, type: meta?.accountType })
        }
      }
    })

    return result
  }, [data.home, data.vehicles, data.collectibles, data.appliances, data.miscellaneous, data.financial])

  // Calculate liability items for the breakdown dialog
  const liabilityItems = useMemo(() => {
    const financialData = Array.isArray(data.financial) ? data.financial : []
    const items: Array<{ title: string; amount: number; type?: string }> = []

    financialData.forEach(item => {
      const meta = item?.metadata as any
      const type = String(meta?.accountType || meta?.type || '').toLowerCase()
      const itemType = String(meta?.itemType || '').toLowerCase()
      const loanType = String(meta?.loanType || '').toLowerCase()
      
      const isDebt = itemType === 'debt' || 
        ['credit', 'loan', 'mortgage', 'liability', 'debt'].some(k => type.includes(k) || loanType.includes(k))

      if (isDebt) {
        const amount = Math.abs(Number(meta?.currentBalance ?? meta?.balance ?? meta?.currentValue ?? meta?.value ?? 0))
        if (amount > 0) {
          items.push({ title: item.title || 'Debt', amount, type: itemType || loanType || type })
        }
      }
    })

    return items
  }, [data.financial])

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
    const today = new Date()
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    
    // #region agent log
    console.log('🔴🔴🔴 [DEBUG] vehiclesStats computing:', {
      fromDomainEntriesCount: fromDomainEntries.length,
      fromDomainEntriesIds: fromDomainEntries.map((e:any)=>e.id),
      fromTableCount: fromTable.length,
      fromTableIds: fromTable.map((e:any)=>e.id),
      refreshTrigger
    });
    debugIngest({
      location: 'command-center-redesigned.tsx:vehiclesStats',
      message: 'Computing vehiclesStats',
      data: {
        fromDomainEntriesCount: fromDomainEntries.length,
        fromDomainEntriesIds: fromDomainEntries.map((e: any) => e.id),
        fromTableCount: fromTable.length,
        fromTableIds: fromTable.map((e: any) => e.id),
        refreshTrigger,
      },
      sessionId: 'debug-session',
      hypothesisId: 'H2,H4',
    })
    // #endregion
    
    // Filter domain_entries for actual vehicle entries (not maintenance/costs)
    const vehiclesFromEntries = fromDomainEntries.filter((entry) => {
      const meta = extractMetadata(entry)
      const itemType = pickStringTokens(meta, ['itemType', 'type']).join(' ')
      const hasVehicleIdentifiers = hasTruthyValue(meta, ['make', 'model', 'vin', 'vehicleName'])
      // Only include actual vehicles, not maintenance/cost entries
      const isVehicleEntry = itemType.includes('vehicle') || hasVehicleIdentifiers
      const isMaintenanceOrCost = itemType.includes('maintenance') || itemType.includes('cost') || itemType.includes('warranty')
      return isVehicleEntry && !isMaintenanceOrCost
    })
    
    // Filter for maintenance entries to count upcoming services
    const maintenanceEntries = fromDomainEntries.filter((entry) => {
      const meta = extractMetadata(entry)
      const itemType = pickStringTokens(meta, ['itemType', 'type']).join(' ')
      const isMaintenance = itemType.includes('maintenance')
      if (isMaintenance) {
        console.log('🔧 [SERVICE-DUE] Found maintenance entry:', {
          id: entry.id,
          title: entry.title,
          itemType,
          nextServiceDate: meta['nextServiceDate'],
          serviceDue: meta['serviceDue'],
          dueDate: meta['dueDate']
        })
      }
      return isMaintenance
    })
    
    // Merge both sources for vehicle count
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

    // Count services due: check both vehicle entries AND separate maintenance entries
    let needsServiceCount = 0
    
    // Check vehicle entries themselves for service dates
    vehicles.forEach((entry) => {
      const meta = extractMetadata(entry)
      if (meta['needsService'] === true) {
        needsServiceCount++
        return
      }

      const serviceDate = pickFirstDate(meta, ['serviceDue', 'nextServiceDate', 'nextMaintenance', 'inspectionDue'])
      if (serviceDate && serviceDate <= fourteenDaysFromNow) {
        needsServiceCount++
        return
      }

      const statusTokens = pickStringTokens(meta, ['status', 'serviceStatus'])
      if (statusTokens.some((token) => ['due', 'overdue', 'needs service', 'attention'].some((flag) => token.includes(flag)))) {
        needsServiceCount++
      }
    })
    
    // Check separate maintenance entries for upcoming service dates
    // Use 30-day window to match alert system behavior
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    maintenanceEntries.forEach((entry) => {
      const meta = extractMetadata(entry)
      const nextServiceDate = pickFirstDate(meta, ['nextServiceDate', 'serviceDue', 'dueDate'])
      console.log('🔧 [SERVICE-DUE] Checking maintenance:', {
        title: entry.title,
        nextServiceDate: nextServiceDate?.toISOString(),
        thirtyDaysFromNow: thirtyDaysFromNow.toISOString(),
        isWithinWindow: nextServiceDate && nextServiceDate <= thirtyDaysFromNow
      })
      if (nextServiceDate && nextServiceDate <= thirtyDaysFromNow) {
        needsServiceCount++
        console.log('🔧 [SERVICE-DUE] ✅ Counted maintenance entry:', entry.title)
      }
    })

    const totalMileage = vehicles.reduce((sum, entry) => {
      const meta = extractMetadata(entry)
      const mileage = parseNumeric(
        meta['mileage'] ?? meta['currentMileage'] ?? meta['odometer'] ?? meta['totalMileage']
      )
      return sum + mileage
    }, 0)

    console.log('🚗 Vehicles Stats:', { 
      count: vehicles.length, 
      totalValue, 
      needsService: needsServiceCount, 
      totalMileage, 
      fromDomainEntries: vehiclesFromEntries.length, 
      fromTable: fromTable.length,
      maintenanceEntriesCount: maintenanceEntries.length
    })
    
    return { totalValue, needsService: needsServiceCount, totalMileage, count: vehicles.length }
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
  // #region agent log
  console.log('🔍 [DEBUG-H1] data.digital for computeDigitalStats:', data.digital?.length ?? 0, data.digital?.slice(0, 3).map((e: any) => ({ id: e.id, title: e.title, type: e.metadata?.type, monthlyCost: e.metadata?.monthlyCost })))
  // #endregion
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

  // Service Providers metrics
  const serviceProvidersStats = useMemo(() => {
    const servicesEntries = mapWithMeta(Array.isArray(data.services) ? data.services : [])
    if (!servicesEntries.length) {
      return { 
        count: 0, 
        totalMonthlyCost: 0, 
        insuranceCount: 0, 
        utilitiesCount: 0,
        renewingSoon: 0,
        hasData: false
      }
    }

    let totalMonthlyCost = 0
    let insuranceCount = 0
    let utilitiesCount = 0
    let renewingSoon = 0
    const now = new Date()

    servicesEntries.forEach(({ meta }) => {
      // Sum monthly costs
      const monthlyCost = Number(meta.monthlyCost ?? 0)
      const annualCost = Number(meta.annualCost ?? 0)
      if (monthlyCost > 0) {
        totalMonthlyCost += monthlyCost
      } else if (annualCost > 0) {
        totalMonthlyCost += annualCost / 12
      }

      // Count by type
      const serviceType = String(meta.serviceType ?? '').toLowerCase()
      if (serviceType.includes('insurance')) {
        insuranceCount++
      }
      if (serviceType.includes('utility') || serviceType.includes('electric') || 
          serviceType.includes('gas') || serviceType.includes('water') ||
          serviceType.includes('internet') || serviceType.includes('mobile')) {
        utilitiesCount++
      }

      // Check for contracts ending soon
      const contractEnd = meta.contractEnd ?? meta.contractEndDate
      if (contractEnd) {
        const endDate = new Date(String(contractEnd))
        if (!isNaN(endDate.getTime())) {
          const daysUntil = differenceInDays(endDate, now)
          if (daysUntil >= 0 && daysUntil <= 30) {
            renewingSoon++
          }
        }
      }
    })

    return { 
      count: servicesEntries.length, 
      totalMonthlyCost,
      insuranceCount,
      utilitiesCount,
      renewingSoon,
      hasData: true
    }
  }, [data.services, mapWithMeta])

  const hasServiceProvidersData = serviceProvidersStats.hasData

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

      // Check upcoming health appointments (within 3 days)
      const isAppointment = item.metadata?.type === 'appointment' || 
                           item.metadata?.itemType === 'appointment' ||
                           item.metadata?.logType === 'appointment'
      
      if (isAppointment) {
        const appointmentDateStr = item.metadata?.date || item.metadata?.appointmentDate
        if (appointmentDateStr && (typeof appointmentDateStr === 'string' || typeof appointmentDateStr === 'number')) {
          const appointmentDate = new Date(appointmentDateStr)
          const daysUntilAppt = differenceInDays(appointmentDate, today)
          
          // Alert for appointments within 3 days
          if (daysUntilAppt >= 0 && daysUntilAppt <= 3) {
            const alertId = `appointment-${item.id}-${appointmentDateStr}`
            const doctorName = item.metadata?.doctor || item.metadata?.provider || ''
            urgentAlerts.push({
              id: alertId,
              type: 'appointment',
              title: `🏥 ${item.title}${doctorName ? ` - ${doctorName}` : ''}`,
              daysLeft: daysUntilAppt,
              priority: daysUntilAppt === 0 ? 'high' : 'medium',
              link: '/domains/health'
            })
          }
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

    // Check vehicle registration and service alerts
    const allVehicles = [
      ...(Array.isArray(data.vehicles) ? data.vehicles : []),
      ...vehiclesFromTable.filter(v => !(data.vehicles || []).some((dv: any) => dv.id === v.id))
    ]
    
    allVehicles.forEach(vehicle => {
      const meta = vehicle.metadata || {}
      const vehicleName = vehicle.title || `${meta.year || ''} ${meta.make || ''} ${meta.model || ''}`.trim() || 'Vehicle'
      
      // Check registration expiration
      const regExpiry = meta.registrationExpiration || meta.registrationDate || meta.registrationExpiry
      if (regExpiry && (typeof regExpiry === 'string' || typeof regExpiry === 'number')) {
        const regDate = new Date(regExpiry)
        const daysUntilReg = differenceInDays(regDate, today)
        
        if (daysUntilReg < 0) {
          // Overdue registration
          const alertId = `vehicle-reg-overdue-${vehicle.id}-${regExpiry}`
          urgentAlerts.push({
            id: alertId,
            type: 'vehicle-registration',
            title: `🚗 ${vehicleName} - Registration OVERDUE`,
            daysLeft: daysUntilReg,
            priority: 'high',
            link: '/domains/vehicles'
          })
        } else if (daysUntilReg <= 30) {
          // Registration expiring soon
          const alertId = `vehicle-reg-${vehicle.id}-${regExpiry}`
          urgentAlerts.push({
            id: alertId,
            type: 'vehicle-registration',
            title: `🚗 ${vehicleName} - Registration`,
            daysLeft: daysUntilReg,
            priority: daysUntilReg <= 7 ? 'high' : 'medium',
            link: '/domains/vehicles'
          })
        }
      }
      
      // Check service due
      const serviceDate = meta.nextServiceDate || meta.serviceDue || meta.nextMaintenance || meta.inspectionDue
      if (serviceDate && (typeof serviceDate === 'string' || typeof serviceDate === 'number')) {
        const svcDate = new Date(serviceDate)
        const daysUntilService = differenceInDays(svcDate, today)
        
        if (daysUntilService >= -7 && daysUntilService <= 14) {
          // Service due within 14 days or up to 7 days overdue
          const alertId = `vehicle-service-${vehicle.id}-${serviceDate}`
          urgentAlerts.push({
            id: alertId,
            type: 'vehicle-service',
            title: `🔧 ${vehicleName} - Service ${daysUntilService < 0 ? 'Overdue' : 'Due'}`,
            daysLeft: daysUntilService,
            priority: daysUntilService <= 3 ? 'high' : 'medium',
            link: '/domains/vehicles'
          })
        }
      }
    })

    // Check home maintenance items due
    const homeData = Array.isArray(data.home) ? data.home : []
    homeData.forEach(item => {
      const meta = item.metadata || {}
      const dueDateStr = meta.dueDate || meta.targetDate || meta.nextDue
      
      if (dueDateStr && (typeof dueDateStr === 'string' || typeof dueDateStr === 'number')) {
        const dueDate = new Date(dueDateStr)
        const daysUntilDue = differenceInDays(dueDate, today)
        
        // Check for maintenance tasks due within 14 days
        if (daysUntilDue >= -7 && daysUntilDue <= 14) {
          const categoryText = typeof meta.category === 'string' ? meta.category.toLowerCase() : ''
          const isMaintenance = meta.itemType === 'maintenance' || 
                                meta.type === 'maintenance' ||
                                categoryText.includes('maintenance')
          
          if (isMaintenance || meta.dueDate) {
            const alertId = `home-maint-${item.id}-${dueDateStr}`
            urgentAlerts.push({
              id: alertId,
              type: 'home-maintenance',
              title: `🏠 ${item.title}${daysUntilDue < 0 ? ' - Overdue' : ''}`,
              daysLeft: daysUntilDue,
              priority: daysUntilDue <= 3 ? 'high' : 'medium',
              link: '/domains/home'
            })
          }
        }
      }
    })

    // Check upcoming birthdays and anniversaries from relationships
    const relationshipsData = Array.isArray(data.relationships) ? data.relationships : []
    relationshipsData.forEach(person => {
      const meta = person.metadata || {}
      const personName = person.title || meta.name || 'Someone'
      
      // Check birthday
      if (meta.birthday && typeof meta.birthday === 'string') {
        const birthdayThisYear = getUpcomingAnnualDate(meta.birthday)
        const daysUntilBirthday = differenceInDays(birthdayThisYear, today)
        
        if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
          const alertId = `birthday-${person.id}-${meta.birthday}`
          urgentAlerts.push({
            id: alertId,
            type: 'birthday',
            title: `🎂 ${personName}'s Birthday`,
            daysLeft: daysUntilBirthday,
            priority: daysUntilBirthday <= 2 ? 'high' : 'medium',
            link: '/domains/relationships'
          })
        }
      }
      
      // Check anniversary
      if (meta.anniversaryDate && typeof meta.anniversaryDate === 'string') {
        const anniversaryThisYear = getUpcomingAnnualDate(meta.anniversaryDate)
        const daysUntilAnniversary = differenceInDays(anniversaryThisYear, today)
        
        if (daysUntilAnniversary >= 0 && daysUntilAnniversary <= 7) {
          const alertId = `anniversary-${person.id}-${meta.anniversaryDate}`
          urgentAlerts.push({
            id: alertId,
            type: 'anniversary',
            title: `💍 Anniversary with ${personName}`,
            daysLeft: daysUntilAnniversary,
            priority: daysUntilAnniversary <= 2 ? 'high' : 'medium',
            link: '/domains/relationships'
          })
        }
      }
      
      // Check importantDates array for more dates
      const importantDates = Array.isArray(meta.importantDates) ? meta.importantDates : []
      importantDates.forEach((dateItem: any, idx: number) => {
        if (dateItem?.date && typeof dateItem.date === 'string') {
          const label = dateItem.label || dateItem.name || dateItem.type || 'Important Date'
          const isBirthday = label.toLowerCase().includes('birthday')
          const isAnniversary = label.toLowerCase().includes('anniversary')
          
          if (isBirthday || isAnniversary) {
            const upcomingDate = getUpcomingAnnualDate(dateItem.date)
            const daysUntil = differenceInDays(upcomingDate, today)
            
            if (daysUntil >= 0 && daysUntil <= 7) {
              const alertId = `important-date-${person.id}-${idx}-${dateItem.date}`
              urgentAlerts.push({
                id: alertId,
                type: isBirthday ? 'birthday' : 'anniversary',
                title: `${isBirthday ? '🎂' : '💍'} ${personName} - ${label}`,
                daysLeft: daysUntil,
                priority: daysUntil <= 2 ? 'high' : 'medium',
                link: '/domains/relationships'
              })
            }
          }
        }
      })
    })

    // Check travel bookings (from travelBookings state if loaded)
    travelBookings.forEach(booking => {
      if (booking.start_date) {
        const departureDate = new Date(booking.start_date)
        const daysUntilDeparture = differenceInDays(departureDate, today)
        
        // Alert for trips departing within 7 days
        if (daysUntilDeparture >= 0 && daysUntilDeparture <= 7) {
          const alertId = `travel-${booking.id}-${booking.start_date}`
          const typeIcon = booking.booking_type === 'flight' ? '✈️' : 
                          booking.booking_type === 'hotel' ? '🏨' : 
                          booking.booking_type === 'car' ? '🚗' : '🧳'
          urgentAlerts.push({
            id: alertId,
            type: 'travel',
            title: `${typeIcon} ${booking.name}${booking.destination ? ` to ${booking.destination}` : ''}`,
            daysLeft: daysUntilDeparture,
            priority: daysUntilDeparture <= 2 ? 'high' : 'medium',
            link: '/travel'
          })
        }
      }
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
      .slice(0, 8) // Increased from 5 to 8 to show more alerts
  }, [data, expiringDocuments, tasks, dismissedAlerts, petsStats, appliancesFromTable, vehiclesFromTable, travelBookings])

  // Include pet costs in total monthly expenses
  const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0) + (petsStats.totalCosts || 0)

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

        {/* Dashboard Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
        </div>

        {/* Top Row - Priority Cards - True Masonry layout */}
        <Masonry
          breakpointCols={{ default: 2, 768: 1 }}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {/* Smart Inbox Card - AI Email Parsing */}
          <div className="mb-4"><SmartInboxCard /></div>

          {/* Critical Alerts Card */}
          <div className="mb-4">
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
          </div>

          {/* Tasks Card */}
          <div className="mb-4">
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
          </div>

          {/* Habits Card */}
          <div className="mb-4">
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
          </div>

          {/* Google Calendar Card - Upcoming Events */}
          <div className="mb-4"><GoogleCalendarCard /></div>

          {/* Special Dates Card - Birthdays & Anniversaries from Relationships */}
          <div className="mb-4"><SpecialDatesCard /></div>

          {/* AI-Powered Insights - OpenAI GPT-4 powered personalized insights */}
          <div className="mb-4"><AIInsightsCard /></div>
          
          {/* Weekly Insights (Rule-based) - Real-time insights from your data */}
          <div className="mb-4"><InsightsCardWorking /></div>

          {/* Weather Forecast - 7 Day Outlook (FREE API - No Key Needed!) */}
          <div className="mb-4"><WeatherFreeCard /></div>

          {/* Tech News - Hacker News Top Stories (FREE API - No Key Needed!) */}
          <div className="mb-4"><NewsFreeCard /></div>

          {/* Document Expiration Tracker - Critical Documents Expiring Soon */}
          <div className="mb-4"><DocumentExpirationCard /></div>

          {/* Upcoming Bills - Next 30 Days */}
          <div className="mb-4"><UpcomingBillsCard /></div>
        </Masonry>

        {/* Dialogs - Outside Masonry */}
        {alertsDialogOpen && (
          <CategorizedAlertsDialog open={alertsDialogOpen} onClose={() => setAlertsDialogOpen(false)} />
        )}
        
        {/* Financial Breakdown Dialog - Aggregates expenses from ALL domains */}
        <FinancialBreakdownDialog
          open={financialBreakdownOpen}
          onClose={() => setFinancialBreakdownOpen(false)}
          viewType={financialBreakdownView}
          netWorthData={{
            totalAssets: financeNetWorth.assets,
            totalLiabilities: financeNetWorth.liabilities,
            netWorth: financeNetWorth.netWorth,
            breakdown: {
              homeValue: calculateUnifiedNetWorth(data).breakdown.homeValue,
              vehicleValue: calculateUnifiedNetWorth(data).breakdown.vehicleValue,
              collectiblesValue: calculateUnifiedNetWorth(data).breakdown.collectiblesValue,
              miscValue: calculateUnifiedNetWorth(data).breakdown.miscValue,
              appliancesValue: calculateUnifiedNetWorth(data).breakdown.appliancesValue,
              financialAssets: calculateUnifiedNetWorth(data).breakdown.financialAssets,
              financialLiabilities: calculateUnifiedNetWorth(data).breakdown.financialLiabilities,
              cashIncome: financeNetWorth.income,
            }
          }}
          monthlyExpenses={{
            housing: crossDomainExpenses.totals.housing,
            food: crossDomainExpenses.totals.food,
            insurance: crossDomainExpenses.totals.insurance,
            transport: crossDomainExpenses.totals.transport,
            utilities: crossDomainExpenses.totals.utilities,
            pets: crossDomainExpenses.totals.pets,
            health: crossDomainExpenses.totals.health,
            education: crossDomainExpenses.totals.education,
            subscriptions: crossDomainExpenses.totals.subscriptions,
            other: crossDomainExpenses.totals.other,
          }}
          expenseItems={expenseItems}
          assetItems={assetItems}
          liabilityItems={liabilityItems}
        />

        {/* Financial Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => openFinancialBreakdown('net-worth')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (financeNetWorth.netWorth / 1000).toFixed(0) : 0}K
              </div>
              <div className="text-sm opacity-90">Net Worth</div>
              <div className="text-xs opacity-75 mt-1">Click for breakdown</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => openFinancialBreakdown('assets')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (financeNetWorth.assets / 1000).toFixed(0) : 0}K
              </div>
              <div className="text-sm opacity-90">Total Assets</div>
              <div className="text-xs opacity-75 mt-1">Click for breakdown</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => openFinancialBreakdown('liabilities')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (financeNetWorth.liabilities / 1000).toFixed(1) : 0}K
              </div>
              <div className="text-sm opacity-90">Liabilities</div>
              <div className="text-xs opacity-75 mt-1">
                Click for breakdown
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => openFinancialBreakdown('monthly-bills')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1" suppressHydrationWarning>
                ${isClient ? (totalMonthlyExpenses / 1000).toFixed(1) : 0}K
              </div>
              <div className="text-sm opacity-90">Monthly Bills</div>
              <div className="text-xs opacity-75 mt-1">Click for breakdown</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Expenses Breakdown - Aggregated from ALL domains */}
        <Card className="p-0">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {/* Display all expense categories with their cross-domain totals */}
              {[
                { key: 'housing', icon: '🏠', color: 'text-orange-600 dark:text-orange-400' },
                { key: 'food', icon: '🍽️', color: 'text-red-600 dark:text-red-400' },
                { key: 'insurance', icon: '🛡️', color: 'text-purple-600 dark:text-purple-400' },
                { key: 'transport', icon: '⛽', color: 'text-blue-600 dark:text-blue-400' },
                { key: 'utilities', icon: '💡', color: 'text-yellow-600 dark:text-yellow-400' },
                { key: 'pets', icon: '🐾', color: 'text-pink-600 dark:text-pink-400' },
                { key: 'health', icon: '🏥', color: 'text-teal-600 dark:text-teal-400' },
                { key: 'education', icon: '🎓', color: 'text-indigo-600 dark:text-indigo-400' },
                { key: 'subscriptions', icon: '🔄', color: 'text-cyan-600 dark:text-cyan-400' },
                { key: 'other', icon: '📋', color: 'text-gray-600 dark:text-gray-400' },
              ].map(({ key, icon, color }) => {
                const amount = crossDomainExpenses.totals[key as keyof typeof crossDomainExpenses.totals]
                const itemCount = crossDomainExpenses.byCategory[key as keyof typeof crossDomainExpenses.byCategory]?.length || 0
                
                // Skip categories with no expenses
                if (amount === 0 && itemCount === 0) return null
                
                return (
                  <div 
                    key={key} 
                    className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all hover:scale-105 relative group"
                    onClick={() => openFinancialBreakdown(`expense-${key}` as BreakdownViewType)}
                  >
                    <div className="text-xl mb-1">{icon}</div>
                    <div className={`text-xl font-bold ${color}`} suppressHydrationWarning>
                      ${isClient ? Math.round(amount).toLocaleString() : 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {key}
                    </div>
                    {itemCount > 0 && (
                      <div className="text-xs text-muted-foreground opacity-75">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )
              }).filter(Boolean)}
            </div>
            
          </CardContent>
        </Card>

        {/* All Domains Grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
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
                      <div className="text-gray-500">Total Costs</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatCurrency(petsStats.totalCosts, hasPetsData, 0) : '--'}
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

            {/* Service Providers Domain */}
            <Link href="/domains/services">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-500" />
                      <h3 className="font-semibold text-sm">Service Providers</h3>
                    </div>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                      {isClient ? (serviceProvidersAnalytics?.active_providers ?? 0) : 0}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Monthly Cost</div>
                      <div className="font-semibold text-cyan-600" suppressHydrationWarning>
                        {isClient ? formatCurrency(serviceProvidersAnalytics?.monthly_total ?? 0, !!serviceProvidersAnalytics?.active_providers, 0) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Insurance</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(serviceProvidersAnalytics?.spending_by_category?.find(c => c.category === 'insurance')?.count ?? 0, 0, !!serviceProvidersAnalytics?.active_providers) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Utilities</div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(serviceProvidersAnalytics?.spending_by_category?.find(c => c.category === 'utilities')?.count ?? 0, 0, !!serviceProvidersAnalytics?.active_providers) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        Renewing
                        {isClient && (serviceProvidersAnalytics?.expiring_soon ?? 0) > 0 && (
                          <span className="text-amber-500 font-bold" title={`${serviceProvidersAnalytics?.expiring_soon} contracts renewing soon!`}>
                            ⚠️
                          </span>
                        )}
                      </div>
                      <div className="font-semibold" suppressHydrationWarning>
                        {isClient ? formatNumber(serviceProvidersAnalytics?.expiring_soon ?? 0, 0, !!serviceProvidersAnalytics?.active_providers) : '--'}
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

        {/* Recent Activity - Latest Updates Across Domains (Bottom of Page) */}
        <RecentActivityCard />

        </div>
      </div>
    </div>
  )
}