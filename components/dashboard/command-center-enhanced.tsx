'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { calculateUnifiedNetWorth } from '@/lib/utils/unified-financial-calculator'
import { 
  AlertTriangle, CheckCircle, Target, Heart, DollarSign, Shield, 
  TrendingUp, Zap, Plus, Book, Activity, FileText, Calendar,
  Edit3, Sparkles, Trash2, X, Clock, MapPin, Receipt, Home, Car,
  Star, Layers, Bell, Utensils
} from 'lucide-react'
import { useExpirationAlerts } from '../expiration-tracker'
import { useTrackedAssets } from '../asset-lifespan-tracker'
import { AddDataDialog } from '../add-data-dialog'
import { QuickExpenseForm } from '../forms/quick-expense-form'
import { QuickIncomeForm } from '../forms/quick-income-form'
import { MoodGraphDialog } from '../mood-graph-dialog'
import { MealLogger } from '../meal-logger'
import { QuickHealthForm } from '../forms/quick-health-form'
import { CategorizedAlertsDialog } from '../dialogs/categorized-alerts-dialog'
import { JournalEntryDialog } from '../dialogs/journal-entry-dialog'
import { SupabaseSyncButton } from '../supabase/sync-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format, isAfter, isBefore, differenceInDays, isToday, parseISO } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MOOD_OPTIONS = [
  { emoji: '😊', value: 10, label: 'Amazing' },
  { emoji: '😄', value: 9, label: 'Happy' },
  { emoji: '😌', value: 8, label: 'Content' },
  { emoji: '😐', value: 7, label: 'Neutral' },
  { emoji: '😔', value: 6, label: 'Sad' },
  { emoji: '😢', value: 5, label: 'Very Sad' },
  { emoji: '😠', value: 4, label: 'Angry' },
  { emoji: '😰', value: 3, label: 'Anxious' },
  { emoji: '😴', value: 2, label: 'Tired' },
  { emoji: '🤒', value: 1, label: 'Unwell' }
]

export function CommandCenterEnhanced() {
  const { data, tasks, habits, bills, events, addData, addTask, updateTask, deleteTask, addHabit, updateHabit, toggleHabit, deleteHabit, addEvent } = useData()
  const [addDataOpen, setAddDataOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [addAppointmentOpen, setAddAppointmentOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  
  // Get expiration alerts
  const expirationAlerts = useExpirationAlerts()
  
  // Get tracked assets for maintenance/replacement alerts
  const trackedAssets = useTrackedAssets()
  
  // Bills managed from DataProvider
  const [managedBills, setManagedBills] = useState<any[]>([])
  const [billsRefreshTrigger, setBillsRefreshTrigger] = useState(0)
  
  // State for loans (still needed for liabilities calculation)
  const [totalLoans, setTotalLoans] = useState(0)
  
  // Finance data state
  const [financeNetWorth, setFinanceNetWorth] = useState({ 
    assets: 0, 
    liabilities: 0, 
    netWorth: 0,
    income: 0,
    expenses: 0
  })
  
  // Monthly budget state
  const [monthlyBudget, setMonthlyBudget] = useState({ 
    totalIncome: 0, 
    totalExpenses: 0, 
    remaining: 0,
    amount: 0,
    categories: [] as any[]
  })
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Function to load and calculate finance net worth from DataProvider
  const loadFinanceData = () => {
    try {
      console.log('💰 Loading Finance Data from DataProvider...')
      
      // Use unified calculator which already reads from DataProvider
      const unified = calculateUnifiedNetWorth(data, { assets: 0, liabilities: 0 })
      
      console.log('📊 Unified Financial Data:', unified)
      
      const accountAssets = unified.breakdown.financialAssets
      const accountLiabilities = unified.breakdown.financialLiabilities
      const displayIncome = unified.breakdown.cashIncome
      const investmentValue = unified.breakdown.financialAssets * 0.6 // Estimate investments as 60% of financial assets
      
      // Calculate monthly expenses from bills (from DataProvider)
      const monthlyExpenses = bills.reduce((sum: number, bill: any) => 
        sum + (parseFloat(bill.amount) || 0), 0
      )
      
      console.log('📉 Monthly Expenses from bills:', monthlyExpenses)
      
      // Total assets from unified calculator (includes homes, vehicles, collectibles, misc)
      const totalAssets = unified.breakdown.financialAssets + unified.breakdown.homeValue + 
                         unified.breakdown.vehicleValue + unified.breakdown.collectiblesValue + 
                         unified.breakdown.miscValue
      
      // Total liabilities (financial + loans)
      const totalLiabilities = unified.breakdown.financialLiabilities + totalLoans
      
      // Net worth
      const netWorth = totalAssets - totalLiabilities
      
      console.log('✅ Finance Summary (from DataProvider) - Assets:', totalAssets, 'Liabilities:', totalLiabilities, 'Net Worth:', netWorth)
      
      setFinanceNetWorth({
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth: netWorth,
        income: displayIncome,
        expenses: monthlyExpenses
      })
    } catch (error) {
      console.error('❌ Error loading finance data:', error)
    }
  }
  
  useEffect(() => {
    // Sync managed bills from DataProvider
    setManagedBills(bills)
    
    // Derive monthly budget from financial domain
    try {
      const financial = data.financial || []
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const inThisMonth = (d: string | undefined) => {
        if (!d) return false
        const dt = new Date(d)
        return dt >= monthStart && dt <= monthEnd
      }
      const incomeItems = financial.filter((i: any) => (i.metadata?.type === 'income' || i.metadata?.logType === 'income') && inThisMonth(i.metadata?.date || i.createdAt))
      const expenseItems = financial.filter((i: any) => (i.metadata?.type === 'expense' || i.metadata?.logType === 'expense') && inThisMonth(i.metadata?.date || i.createdAt))
      const totalIncome = incomeItems.reduce((s: number, i: any) => s + (parseFloat(i.metadata?.amount || i.metadata?.value || '0')), 0)
      const totalExpenses = expenseItems.reduce((s: number, i: any) => s + (parseFloat(i.metadata?.amount || i.metadata?.value || '0')), 0)
      setMonthlyBudget({ totalIncome, totalExpenses, remaining: totalIncome - totalExpenses, amount: totalExpenses, categories: [] })
    } catch (error) {
      console.error('Failed to calculate monthly budget:', error)
      // Keep default budget values
    }
    
    // Derive total loans from financial domain items marked as loans
    try {
      const financial = data.financial || []
      const loans = financial.filter((i: any) => i.metadata?.type === 'loan' || i.metadata?.itemType === 'loan')
      const totalLoanDebt = loans.reduce((sum: number, loan: any) => sum + (parseFloat(loan.metadata?.currentBalance || loan.metadata?.amount || '0') || 0), 0)
      setTotalLoans(totalLoanDebt)
    } catch (error) {
      console.error('Failed to calculate total loans:', error)
      // Keep default loan values
    }
    
    // Load finance aggregates
    loadFinanceData()
    
    // Listen for finance/data updates to recompute derived values
    const handleFinanceUpdate = () => {
      loadFinanceData()
      setRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('finance-data-updated', handleFinanceUpdate)
    window.addEventListener('data-updated', handleFinanceUpdate)
    
    // Listen for health data updates
    const handleHealthUpdate = () => {
      console.log('🏥 Health data updated, refreshing command center...')
      setRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('health-data-updated', handleHealthUpdate)
    
    return () => {
      window.removeEventListener('finance-data-updated', handleFinanceUpdate)
      window.removeEventListener('data-updated', handleFinanceUpdate)
      window.removeEventListener('health-data-updated', handleHealthUpdate)
    }
  }, [bills, data.financial])
  
  // Use managed bills if available, fallback to old bills
  const activeBills = managedBills.length > 0 ? managedBills : bills
  
  // Debug bills
  useEffect(() => {
    console.log('💳 Bills Debug:', {
      managedBillsCount: managedBills.length,
      billsCount: bills.length,
      activeBillsCount: activeBills.length
    })
  }, [managedBills, bills, activeBills])
  
  // NEW: Specialized forms
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false)
  const [quickIncomeOpen, setQuickIncomeOpen] = useState(false)
  const [moodGraphOpen, setMoodGraphOpen] = useState(false)
  const [mealLoggerOpen, setMealLoggerOpen] = useState(false)
  const [quickHealthOpen, setQuickHealthOpen] = useState(false)
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [moodJustLogged, setMoodJustLogged] = useState(false)
  
  // CRITICAL FIX: Force re-render when data changes
  useEffect(() => {
    console.log('✅ Command Center data updated:', {
      domains: Object.keys(data).length,
      tasks: tasks.length,
      habits: habits.length,
      bills: bills.length,
      events: events.length
    })
  }, [data, tasks, habits, bills, events])
  
  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('⭐')
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily')
  
  const [appointmentTitle, setAppointmentTitle] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentLocation, setAppointmentLocation] = useState('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  
  const [journalTitle, setJournalTitle] = useState('')
  const [journalEntry, setJournalEntry] = useState('')
  const [journalMood, setJournalMood] = useState(7)
  const [journalEnergy, setJournalEnergy] = useState('Medium')
  const [journalGratitude, setJournalGratitude] = useState('')
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiInsight, setAiInsight] = useState('')

  // Get mood logs from mindfulness domain
  const moodLogs = useMemo(() => {
    const mindfulnessData = data.mindfulness || []
    const logs = mindfulnessData.filter(item => item.metadata?.logType === 'journal' || item.metadata?.mood)
    return logs.slice(0, 14) // Last 14 entries
  }, [data.mindfulness])

  // Get last 7 days mood for display
  const last7DaysMoods = useMemo(() => {
    const moods = moodLogs.slice(0, 7).reverse()
    const result = []
    for (let i = 0; i < 7; i++) {
      if (moods[i]) {
        const moodValue = moods[i].metadata?.mood || moods[i].metadata?.moodValue || 7
        const moodOption = MOOD_OPTIONS.find(opt => opt.value === moodValue)
        result.push(moodOption?.emoji || '😐')
      } else {
        result.push('○') // Empty circle for no data
      }
    }
    return result
  }, [moodLogs])

  // Get today's appointments
  const todaysAppointments = useMemo(() => {
    return events.filter(event => {
      try {
        return isToday(parseISO(event.date))
      } catch {
        return false
      }
    }).sort((a, b) => {
      const timeA = a.date + (a.type || '')
      const timeB = b.date + (b.type || '')
      return timeA.localeCompare(timeB)
    })
  }, [events])

  // Calculate stats
  const stats = useMemo(() => {
    const domains = Object.keys(data).filter(key => Array.isArray(data[key]) && data[key].length > 0)
    const totalItems = Object.values(data).reduce((total, domainData) => {
      return total + (Array.isArray(domainData) ? domainData.length : 0)
    }, 0)
    const today = new Date().toDateString()
    const addedToday = Object.values(data).reduce((total, domainData) => {
      if (!Array.isArray(domainData)) return total
      return total + domainData.filter(item => new Date(item.createdAt).toDateString() === today).length
    }, 0)
    
    return {
      activeDomains: domains.length,
      totalItems,
      addedToday,
    }
  }, [data])

  // Get critical alerts - NO PLACEHOLDER DATA!
  const alerts = useMemo(() => {
    const urgentAlerts: any[] = []
    
    // Check bills
    activeBills.forEach(bill => {
      if (bill.status !== 'paid') {
        // Calculate days until due (bill.dueDate is day of month for Bills Manager)
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const dueDate = new Date(currentYear, currentMonth, bill.dueDate || 1)
        const daysUntilDue = differenceInDays(dueDate, today)
        
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          urgentAlerts.push({
            type: 'bill',
            title: bill.name || bill.title,
            daysLeft: daysUntilDue,
            priority: daysUntilDue <= 3 ? 'high' : 'medium',
            id: bill.id,
            link: '/domains/financial'
          })
        }
      }
    })
    
    // Check health items with expiry
    const healthData = data.health || []
    healthData.forEach(item => {
      if (item.metadata?.expiryDate && (typeof item.metadata.expiryDate === 'string' || typeof item.metadata.expiryDate === 'number')) {
        const daysUntilExpiry = differenceInDays(new Date(item.metadata.expiryDate), new Date())
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          urgentAlerts.push({
            type: 'health',
            title: item.title,
            daysLeft: daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            id: item.id,
            link: '/domains/health'
          })
        }
      }

      // Check medication refill dates - CRITICAL priority within 7 days
      const isMedication = item.metadata?.type === 'medication' || 
                          item.metadata?.itemType === 'medication' || 
                          item.metadata?.logType === 'medication'
      
      if (isMedication && item.metadata?.refillDate && (typeof item.metadata.refillDate === 'string' || typeof item.metadata.refillDate === 'number')) {
        const refillDate = new Date(item.metadata.refillDate)
        const daysUntilRefill = differenceInDays(refillDate, new Date())
        
        // Alert for medications due within 7 days
        if (daysUntilRefill >= 0 && daysUntilRefill <= 7) {
          const medicationName = item.metadata?.medicationName || item.metadata?.name || item.title
          urgentAlerts.push({
            type: 'medication',
            title: `💊 ${medicationName}`,
            daysLeft: daysUntilRefill,
            priority: 'high', // All medication refills within 7 days are high priority
            id: item.id,
            link: '/domains/health'
          })
        }
      }
    })

    // Check insurance items with expiry
    const insuranceData = data.insurance || []
    insuranceData.forEach(item => {
      const expiryDate = item.metadata?.expiryDate || item.metadata?.renewalDate
      if (expiryDate && (typeof expiryDate === 'string' || typeof expiryDate === 'number')) {
        const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date())
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          urgentAlerts.push({
            type: 'insurance',
            title: item.title,
            daysLeft: daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            id: item.id,
            link: '/domains/insurance'
          })
        }
      }
    })

    // Add document expiration alerts (from expiration tracker)
    expirationAlerts.forEach(alert => {
      const daysUntilExpiry = differenceInDays(new Date(alert.expirationDate), new Date())
      urgentAlerts.push({
        type: 'document',
        title: `${alert.documentName} expires soon`,
        subtitle: `Expires: ${format(new Date(alert.expirationDate), 'MMM dd, yyyy')}`,
        daysLeft: daysUntilExpiry,
        priority: daysUntilExpiry <= 14 ? 'high' : 'medium',
        id: alert.id,
        icon: Bell,
        link: '/domains/' + (alert.domain || 'insurance')
      })
    })

    // Add relationship alerts (birthdays and anniversaries)
    const relationships = data.relationships || []
    relationships.forEach((person: any) => {
      const today = new Date()
      
      // Check birthday
      if (person.metadata?.birthday) {
        const bday = new Date(person.metadata.birthday)
        const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = Math.floor((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        const reminderDays = parseInt(person.metadata?.reminderDaysBefore) || 7
        if (daysUntil >= 0 && daysUntil <= reminderDays) {
          urgentAlerts.push({
            type: 'relationship',
            title: `${person.metadata.name}'s Birthday`,
            subtitle: format(nextBday, 'MMMM dd') + (daysUntil === 0 ? ' - TODAY!' : ` - ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} away`),
            daysLeft: daysUntil,
            priority: daysUntil <= 2 ? 'high' : 'medium',
            id: `bday-${person.id}`,
            icon: Heart,
            link: '/domains/relationships'
          })
        }
      }
      
      // Check anniversary
      if (person.metadata?.anniversaryDate) {
        const anniv = new Date(person.metadata.anniversaryDate)
        const nextAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate())
        if (nextAnniv < today) {
          nextAnniv.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = Math.floor((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        const reminderDays = parseInt(person.metadata?.reminderDaysBefore) || 14 // Default 2 weeks for anniversaries
        if (daysUntil >= 0 && daysUntil <= reminderDays) {
          const yearsAgo = today.getFullYear() - anniv.getFullYear()
          urgentAlerts.push({
            type: 'relationship',
            title: `${person.metadata.name}'s Anniversary`,
            subtitle: format(nextAnniv, 'MMMM dd') + ` - ${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'}` + (daysUntil === 0 ? ' - TODAY!' : ` - ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} away`),
            daysLeft: daysUntil,
            priority: daysUntil <= 3 ? 'high' : 'medium',
            id: `anniv-${person.id}`,
            icon: Heart,
            link: '/domains/relationships'
          })
        }
      }
      
      // Check other important dates
      if (person.metadata?.otherImportantDate1) {
        const date1 = new Date(person.metadata.otherImportantDate1)
        const nextDate1 = new Date(today.getFullYear(), date1.getMonth(), date1.getDate())
        if (nextDate1 < today) {
          nextDate1.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = Math.floor((nextDate1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        const reminderDays = parseInt(person.metadata?.reminderDaysBefore) || 7
        if (daysUntil >= 0 && daysUntil <= reminderDays) {
          const label = person.metadata?.otherDateLabel1 || 'Important Date'
          urgentAlerts.push({
            type: 'relationship',
            title: `${person.metadata.name}: ${label}`,
            subtitle: format(nextDate1, 'MMMM dd, yyyy') + (daysUntil === 0 ? ' - TODAY!' : ` - ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} away`),
            daysLeft: daysUntil,
            priority: daysUntil <= 3 ? 'high' : 'medium',
            id: `date1-${person.id}`,
            icon: Calendar,
            link: '/domains/relationships'
          })
        }
      }
    })

    // Add home maintenance alerts
    const homeItems = data.home || []
    homeItems.forEach((item: any) => {
      const today = new Date()
      
      // Maintenance task alerts
      if (item.metadata?.itemType === 'Maintenance Task' && item.metadata?.dueDate) {
        const status = item.metadata?.status
        if (status !== 'Completed' && status !== 'Cancelled') {
          const dueDate = new Date(item.metadata.dueDate)
          const daysUntil = differenceInDays(dueDate, today)
          const reminderDays = parseInt(item.metadata?.reminderDays) || 7
          
          if (daysUntil <= reminderDays && daysUntil >= -7) { // Show overdue up to 7 days
            urgentAlerts.push({
              type: 'home',
              title: item.title || 'Home Maintenance',
              subtitle: `${item.metadata?.location || 'Home'} • ${daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : daysUntil === 0 ? 'Due today' : `Due in ${daysUntil} days`}`,
              daysLeft: daysUntil,
              priority: daysUntil < 0 ? 'high' : daysUntil <= 3 ? 'high' : 'medium',
              id: `home-${item.id}`,
              icon: Home,
              link: '/domains/home'
            })
          }
        }
      }
      
      // Warranty expiration alerts
      if (item.metadata?.itemType === 'Asset/Warranty' && item.metadata?.warrantyExpires) {
        const expires = new Date(item.metadata.warrantyExpires)
        const daysUntil = differenceInDays(expires, today)
        
        if (daysUntil >= 0 && daysUntil <= 90) {
          urgentAlerts.push({
            type: 'home',
            title: `${item.title || 'Asset'} Warranty Expiring`,
            subtitle: `Expires: ${format(expires, 'MMM dd, yyyy')} • ${daysUntil} days left`,
            daysLeft: daysUntil,
            priority: daysUntil <= 30 ? 'high' : 'medium',
            id: `warranty-${item.id}`,
            icon: Shield,
            link: '/domains/home'
          })
        }
      }
      
      // Project deadline alerts
      if (item.metadata?.itemType === 'Project' && item.metadata?.targetDate) {
        const status = item.metadata?.projectStatus
        if (status === 'In Progress' || status === 'Planning') {
          const targetDate = new Date(item.metadata.targetDate)
          const daysUntil = differenceInDays(targetDate, today)
          
          if (daysUntil >= -7 && daysUntil <= 14) {
            urgentAlerts.push({
              type: 'home',
              title: `Project: ${item.title}`,
              subtitle: `Target: ${format(targetDate, 'MMM dd, yyyy')} • ${daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days remaining`}`,
              daysLeft: daysUntil,
              priority: daysUntil < 0 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
              id: `project-${item.id}`,
              icon: TrendingUp,
              link: '/domains/home'
            })
          }
        }
      }
    })

    // Add asset maintenance alerts
    trackedAssets.forEach((asset: any) => {
      if (!asset.purchaseDate) return
      
      const purchase = new Date(asset.purchaseDate)
      const today = new Date()
      const ageInDays = differenceInDays(today, purchase)
      
      // Check maintenance
      const lastMaintenance = asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : purchase
      const daysSinceLastMaintenance = differenceInDays(today, lastMaintenance)
      const maintenanceIntervalDays = asset.maintenanceInterval * 30
      const maintenanceDue = daysSinceLastMaintenance >= maintenanceIntervalDays
      
      if (maintenanceDue || daysSinceLastMaintenance >= maintenanceIntervalDays - 30) {
        urgentAlerts.push({
          type: 'maintenance',
          title: `${asset.name} maintenance ${maintenanceDue ? 'overdue' : 'due soon'}`,
          subtitle: maintenanceDue 
            ? `Overdue by ${Math.floor((daysSinceLastMaintenance - maintenanceIntervalDays) / 30)} months`
            : `Due in ${Math.ceil((maintenanceIntervalDays - daysSinceLastMaintenance) / 30)} days`,
          daysLeft: maintenanceIntervalDays - daysSinceLastMaintenance,
          priority: maintenanceDue ? 'high' : 'medium',
          id: `maint-${asset.id}`,
          icon: FileText,
          link: '/domains/appliances'
        })
      }

      // Check replacement prediction
      const expectedLifespanDays = asset.expectedLifespan * 30
      const lifespanProgress = (ageInDays / expectedLifespanDays) * 100
      
      if (lifespanProgress >= 80 && lifespanProgress <= 95) {
        const daysRemaining = expectedLifespanDays - ageInDays
        urgentAlerts.push({
          type: 'replacement',
          title: `${asset.name} in optimal replacement window`,
          subtitle: `${lifespanProgress.toFixed(0)}% of lifespan used • Best time to replace`,
          daysLeft: daysRemaining,
          priority: 'medium',
          id: `replace-${asset.id}`,
          icon: TrendingUp,
          link: '/domains/appliances'
        })
      } else if (lifespanProgress >= 95) {
        const daysRemaining = expectedLifespanDays - ageInDays
        urgentAlerts.push({
          type: 'replacement',
          title: `${asset.name} needs replacement urgently`,
          subtitle: `${lifespanProgress.toFixed(0)}% of lifespan used • Replace soon to avoid emergency`,
          daysLeft: daysRemaining,
          priority: 'high',
          id: `replace-critical-${asset.id}`,
          icon: AlertTriangle,
          link: '/domains/appliances'
        })
      }
    })
    
    return urgentAlerts.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5)
  }, [activeBills, data.health, data.insurance, expirationAlerts, trackedAssets])

  // Calculate domain scores
  const domainScores = useMemo(() => {
    const financial = data.financial || []
    const health = data.health || []
    const career = data.career || []
    
    const calcScore = (items: any[]) => {
      if (items.length === 0) return 0
      return Math.min(100, 30 + (items.length * 7))
    }
    
    return {
      financial: calcScore(financial),
      health: calcScore(health),
      career: calcScore(career),
    }
  }, [data])

  // Get domain stats
  const domainStats = useMemo(() => {
    const financial = data.financial || []
    const health = data.health || []
    const home = data.home || []
    const vehicles = data.vehicles || []
    
    // Read health data from DataProvider
    const healthData = {
      metrics: health.filter(item => 
        item.metadata?.type === 'vitals' || 
        item.metadata?.type === 'metric' ||
        item.metadata?.type === 'weight' ||
        item.metadata?.logType === 'weight'
      ),
      medications: health.filter(item => item.metadata?.type === 'medication'),
      appointments: health.filter(item => item.metadata?.type === 'appointment'),
      workouts: health.filter(item => item.metadata?.type === 'workout'),
      symptoms: health.filter(item => item.metadata?.type === 'symptom'),
      conditions: health.filter(item => item.metadata?.type === 'condition')
    }
    
    // Financial stats
    const expenses = financial.filter(item => 
      item.metadata?.type === 'expense' || 
      item.metadata?.logType === 'expense' ||
      (typeof item.metadata?.category === 'string' && item.metadata?.category?.includes('expense'))
    )
    const totalExpenses = expenses.reduce((sum, item) => {
      const amount = item.metadata?.amount || item.metadata?.value || '0'
      return sum + (parseFloat(typeof amount === 'string' || typeof amount === 'number' ? String(amount) : '0'))
    }, 0)
    
    const income = financial.filter(item => 
      item.metadata?.type === 'income' || 
      item.metadata?.logType === 'income'
    )
    const totalIncome = income.reduce((sum, item) => {
      const amount = item.metadata?.amount || item.metadata?.value || '0'
      return sum + (parseFloat(typeof amount === 'string' || typeof amount === 'number' ? String(amount) : '0'))
    }, 0)
    
    // Health stats - Read from NEW health system
    const metrics = healthData.metrics || []
    const medications = healthData.medications || []
    const appointments = healthData.appointments || []
    const workouts = healthData.workouts || []
    const symptoms = healthData.symptoms || []
    const conditions = healthData.conditions || []
    
    // Get latest health metrics
    const sortedMetrics: any[] = metrics
      .map((m: any) => ({
        ...m,
        date: m.metadata?.date || m.createdAt || m.date,
        weight: m.metadata?.weight ?? m.metadata?.value ?? m.weight
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Find latest weight (look for both old and new structure)
    const latestWeight: any = sortedMetrics.find((m: any) => m.weight && m.weight > 0)
    
    // If no weight found with metricType, get the latest entry with weight > 0
    const latestWeightEntry = latestWeight || sortedMetrics.find((m: any) => m.weight && m.weight > 0)
    
    const latestSteps: any = sortedMetrics.find((m: any) => 
      m.metricType === 'steps' || (m.steps && m.steps > 0)
    )
    const latestBloodPressure: any = sortedMetrics.find((m: any) => 
      m.metricType === 'blood-pressure' || (m.bloodPressureSystolic && m.bloodPressureDiastolic)
    )
    const latestHeartRate: any = sortedMetrics.find((m: any) => 
      m.metricType === 'heart-rate' || (m.heartRate && m.heartRate > 0)
    )
    const latestBloodGlucose: any = sortedMetrics.find((m: any) => 
      m.metricType === 'blood-glucose' || (m.bloodGlucose && m.bloodGlucose > 0)
    )
    
    console.log('💊 Health Data:', {
      totalMetrics: metrics.length,
      latestWeight: latestWeightEntry,
      latestSteps: latestSteps,
      weightValue: latestWeightEntry?.weight || latestWeightEntry?.value,
      allMetrics: metrics
    })
    
    // Health data now comes from DataProvider
    console.log('🏥 Health data from DataProvider:', healthData)
    
    // Calculate active medications
    const activeMedications = medications.filter((m: any) => m.status === 'active' || !m.status).length
    
    // Calculate upcoming appointments (next 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const upcomingAppointments = appointments.filter((a: any) => {
      const apptDate = new Date(a.appointmentDate)
      return apptDate >= today && apptDate <= thirtyDaysFromNow
    }).length
    
    // Calculate workouts this week
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const workoutsThisWeek = workouts.filter((w: any) => {
      const workoutDate = new Date(w.date)
      return workoutDate >= weekStart && workoutDate <= today
    }).length
    
    // Active health conditions
    const activeConditions = conditions.filter((c: any) => c.status !== 'resolved').length
    
    // Use unified net worth calculator for consistency across the app
    const unifiedNetWorth = calculateUnifiedNetWorth(data, {
      assets: financeNetWorth.assets,
      liabilities: financeNetWorth.liabilities + totalLoans,
      income: financeNetWorth.income || totalIncome,
      expenses: financeNetWorth.expenses || totalExpenses
    })
    
    const displayIncome = financeNetWorth.income || totalIncome
    const displayExpenses = financeNetWorth.expenses || totalExpenses
    const netWorth = unifiedNetWorth.netWorth
    const assets = unifiedNetWorth.totalAssets
    const liabilities = unifiedNetWorth.totalLiabilities
    const homeValue = unifiedNetWorth.breakdown.homeValue
    const carValue = unifiedNetWorth.breakdown.vehicleValue
    const collectiblesValue = unifiedNetWorth.breakdown.collectiblesValue
    const miscValue = unifiedNetWorth.breakdown.miscValue
    
    return {
      balance: displayIncome - displayExpenses,
      income: displayIncome,
      expenses: displayExpenses,
      savings: displayIncome - displayExpenses,
      assets: assets,
      liabilities: liabilities,
      netWorth: netWorth,
      // NEW: Use new health format (value instead of nested metadata)
      weight: latestWeightEntry?.weight || latestWeightEntry?.value || 0,
      steps: parseFloat(latestSteps?.steps || latestSteps?.value || 0),
      bloodPressure: latestBloodPressure ? 
        `${latestBloodPressure.bloodPressureSystolic || latestBloodPressure.systolic}/${latestBloodPressure.bloodPressureDiastolic || latestBloodPressure.diastolic}` : 
        null,
      heartRate: parseFloat(latestHeartRate?.heartRate || latestHeartRate?.value || 0),
      bloodGlucose: parseFloat(latestBloodGlucose?.bloodGlucose || latestBloodGlucose?.value || 0),
      activeMedications,
      upcomingAppointments,
      workoutsThisWeek,
      activeConditions,
      homeValue,
      carValue,
      collectiblesValue,
      miscValue,
      totalAssets: assets,
      totalLiabilities: liabilities,
    }
  }, [data, refreshTrigger, totalLoans, financeNetWorth])

  // Handle add task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    
    addTask({
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || undefined,
    })
    
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
    setAddTaskOpen(false)
  }

  // Handle add habit
  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    
    addHabit({
      name: newHabitName,
      completed: false,
      streak: 0,
      icon: newHabitIcon,
      frequency: newHabitFrequency,
    })
    
    setNewHabitName('')
    setNewHabitIcon('⭐')
    setNewHabitFrequency('daily')
    setAddHabitOpen(false)
  }

  // Handle add appointment
  const handleAddAppointment = () => {
    if (!appointmentTitle.trim() || !appointmentDate) return
    
    addEvent({
      title: appointmentTitle,
      date: appointmentDate,
      type: appointmentTime,
      description: `${appointmentLocation ? `Location: ${appointmentLocation}\n` : ''}${appointmentNotes}`,
      reminder: true,
    })
    
    // Also save to schedule domain
    addData('schedule' as any, {
      title: appointmentTitle,
      metadata: {
        eventName: appointmentTitle,
        date: appointmentDate,
        time: appointmentTime,
        location: appointmentLocation,
        notes: appointmentNotes,
      }
    })
    
    setAppointmentTitle('')
    setAppointmentDate('')
    setAppointmentTime('')
    setAppointmentLocation('')
    setAppointmentNotes('')
    setAddAppointmentOpen(false)
  }

  // Handle direct mood logging (NO POPUP)
  const handleQuickMoodLog = (moodValue: number) => {
    const moodOptions = [
      { value: 1, label: '😢 Very Bad', emoji: '😢' },
      { value: 2, label: '😕 Bad', emoji: '😕' },
      { value: 3, label: '😐 Okay', emoji: '😐' },
      { value: 4, label: '😊 Good', emoji: '😊' },
      { value: 5, label: '😄 Great', emoji: '😄' }
    ]
    
    const mood = moodOptions.find(m => m.value === moodValue)
    
    // Save mood to health domain
    const moodData = {
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Mood Check - ${mood?.label}`,
      description: `Mood logged: ${mood?.emoji} ${mood?.label}`,
      type: 'mood',
      logType: 'mood',
      value: moodValue,
      label: mood?.label || `Mood ${moodValue}`,
      emoji: mood?.emoji,
      timestamp: new Date().toISOString(),
      date: format(new Date(), 'yyyy-MM-dd'),
      metadata: {
        mood: moodValue,
        emoji: mood?.emoji,
        label: mood?.label,
        logType: 'mood',
        value: moodValue,
        date: format(new Date(), 'yyyy-MM-dd')
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addData('health' as any, moodData)
    
    // Trigger update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('health-data-updated', {
        detail: { domain: 'health', entry: moodData }
      }))
    }

    console.log('✅ Mood logged directly:', moodData)
    
    // Show success feedback
    setMoodJustLogged(true)
    setTimeout(() => {
      setMoodJustLogged(false)
      setShowMoodSelector(false)
    }, 1500)
  }

  // Handle journal entry with AI
  const handleSaveJournal = async (withAI: boolean = false) => {
    if (!journalEntry.trim()) return
    
    if (withAI) {
      setAiAnalyzing(true)
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate AI insight based on mood and entry
      const moodOption = MOOD_OPTIONS.find(m => m.value === journalMood)
      const positiveWords = ['happy', 'grateful', 'excited', 'good', 'great', 'wonderful', 'amazing', 'love', 'joy']
      const negativeWords = ['sad', 'anxious', 'worried', 'stress', 'difficult', 'hard', 'tired', 'bad']
      
      const entryLower = journalEntry.toLowerCase()
      const hasPositive = positiveWords.some(word => entryLower.includes(word))
      const hasNegative = negativeWords.some(word => entryLower.includes(word))
      
      let insight = `Your journal entry reflects a ${moodOption?.label.toLowerCase()} mood. `
      
      if (hasPositive && !hasNegative) {
        insight += "I notice positive themes in your writing - that's wonderful! Keep nurturing these positive feelings. "
      } else if (hasNegative && !hasPositive) {
        insight += "I sense some challenging emotions. Remember, it's okay to feel this way. Consider what small step might help you feel better. "
      } else {
        insight += "Your entry shows a mix of emotions, which is perfectly normal. Acknowledging all your feelings is an important part of self-awareness. "
      }
      
      if (journalGratitude.trim()) {
        insight += "Your gratitude practice is valuable - research shows it improves wellbeing over time. "
      }
      
      insight += `\n\n💡 Suggestion: ${
        journalMood <= 5 
          ? "Try a short meditation or reach out to someone you trust." 
          : "Keep up the positive momentum! Consider what made today good and how to recreate it."
      }`
      
      setAiInsight(insight)
      setAiAnalyzing(false)
    }
    
    // Save to mindfulness domain
    addData('mindfulness' as any, {
      title: journalTitle || `Journal Entry - ${format(new Date(), 'MMM d, yyyy')}`,
      description: journalEntry,
      metadata: {
        logType: 'journal',
        mood: journalMood,
        moodValue: journalMood,
        moodLabel: MOOD_OPTIONS.find(m => m.value === journalMood)?.label,
        energy: journalEnergy,
        gratitude: journalGratitude,
        date: format(new Date(), 'yyyy-MM-dd'),
        aiInsight: aiInsight || undefined,
      }
    })
    
    if (!withAI || aiInsight) {
      // Close and reset
      setJournalTitle('')
      setJournalEntry('')
      setJournalMood(7)
      setJournalEnergy('Medium')
      setJournalGratitude('')
      setAiInsight('')
      setJournalOpen(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Your complete life management hub</p>
        </div>
        <div className="flex items-center space-x-2">
          <SupabaseSyncButton />
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {stats.activeDomains} domains active
          </Badge>
          <Button onClick={() => setAddDataOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </div>
      </div>

      {/* Top Row - Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Alerts Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAlertsDialogOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alerts
              </div>
              <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No urgent alerts! 🎉</p>
              ) : (
                <>
                  {alerts.slice(0, 2).map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs truncate max-w-[120px]">{alert.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs text-red-600">
                        {alert.daysLeft}d
                      </Badge>
                    </div>
                  ))}
                  {alerts.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{alerts.length - 2} more (click to see all)
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tasks
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('✅ Add Task button clicked!')
                    setAddTaskOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => updateTask(task.id, { completed: !task.completed })}
                    />
                    <span className={cn("text-xs flex-1 truncate", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Habits Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Habits
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {habits.filter(h => h.completed).length}/{habits.length}
                </Badge>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('✅ Add Habit button clicked!')
                    setAddHabitOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits yet</p>
              ) : (
                habits.slice(0, 3).map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full cursor-pointer transition-colors",
                        habit.completed ? "bg-green-500" : "bg-gray-300"
                      )}
                      onClick={() => toggleHabit(habit.id)}
                    ></div>
                    <span className="text-xs flex-1 truncate">{habit.name}</span>
                    {habit.streak > 0 && (
                      <Badge variant="outline" className="text-xs">
                        🔥 {habit.streak}
                      </Badge>
                    )}
                  </div>
                ))
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setAddHabitOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Habit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule/Appointments Card - NEW! */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Upcoming Events
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{events.length}</Badge>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('✅ Add Event button clicked!')
                    setAddAppointmentOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {todaysAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments</p>
              ) : (
                todaysAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-xs flex-1 truncate">{appointment.title}</span>
                  </div>
                ))
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setAddAppointmentOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
                <Link href="/appointments" className="w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    View Calendar
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Card - With Graph */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setJournalOpen(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-pink-500" />
              Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Last 7 days</div>
              
              {/* Simple Line Graph */}
              <div className="h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 280 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="280" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
                  <line x1="0" y1="50" x2="280" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
                  <line x1="0" y1="80" x2="280" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
                  
                  {/* Mood line */}
                  {(() => {
                    const mindfulnessData = data.mindfulness || []
                    const moodLogs = mindfulnessData
                      .filter(item => item.metadata?.logType === 'mood' || item.metadata?.mood)
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    
                    const last7Days = []
                    for (let i = 6; i >= 0; i--) {
                      const targetDate = format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
                      const dayMood = moodLogs.find(log => {
                        const createdAt = log.createdAt
                        if (!createdAt || (typeof createdAt !== 'string' && typeof createdAt !== 'number')) return false
                        return format(new Date(createdAt), 'yyyy-MM-dd') === targetDate
                      })
                      const moodValue = dayMood?.metadata?.value || dayMood?.metadata?.mood || dayMood?.metadata?.moodValue
                      const parsedMood = moodValue && (typeof moodValue === 'string' || typeof moodValue === 'number') ? parseInt(String(moodValue)) : null
                      last7Days.push(parsedMood)
                    }
                    
                    const points = last7Days.map((mood, idx) => {
                      const x = (idx * 40) + 20
                      const y = mood ? (100 - (mood / 5) * 80) : null
                      return { x, y, mood }
                    }).filter(p => p.y !== null)
                    
                    if (points.length === 0) {
                      return (
                        <text x="140" y="50" textAnchor="middle" fill="currentColor" opacity="0.3" fontSize="12">
                          No mood data yet
                        </text>
                      )
                    }
                    
                    const pathData = points.map((p, i) => 
                      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                    ).join(' ')
                    
                    return (
                      <>
                        <path d={pathData} fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y!} r="4" fill="#ec4899" />
                        ))}
                      </>
                    )
                  })()}
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground">
                  <span>😄 5</span>
                  <span>😐 3</span>
                  <span>😢 1</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setJournalOpen(true)
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Log Mood
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Health Card */}
        <Link href="/health">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Health
                </div>
                <div className="text-right">
                  <div className={cn("text-2xl font-bold", domainScores.health > 0 ? "text-green-600" : "text-gray-400")}>
                    {domainScores.health}%
                  </div>
                  <div className="text-xs text-muted-foreground">{(data.health || []).length} items</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Steps Today</span>
                  <div className="text-base font-bold text-blue-600">
                    {domainStats.steps > 0 ? `${(domainStats.steps / 1000).toFixed(1)}K` : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Weight</span>
                  <div className="text-base font-bold text-purple-600">
                    {domainStats.weight > 0 ? `${domainStats.weight} lbs` : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Heart Rate</span>
                  <div className="text-base font-bold text-red-600">
                    {domainStats.heartRate > 0 ? `${domainStats.heartRate} bpm` : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Blood Pressure</span>
                  <div className="text-base font-bold text-orange-600">
                    {domainStats.bloodPressure || '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Glucose</span>
                  <div className="text-base font-bold text-amber-600">
                    {domainStats.bloodGlucose > 0 ? `${domainStats.bloodGlucose} mg/dL` : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Active Meds</span>
                  <div className="text-base font-bold text-teal-600">
                    {domainStats.activeMedications || 0}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                <span>{domainStats.workoutsThisWeek || 0} workouts this week</span>
                <span>{domainStats.upcomingAppointments || 0} appointments</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* CONSOLIDATED FINANCE CARD - Like Health Card */}
        <Link href="/finance">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Finance
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${domainStats.netWorth > 0 ? (domainStats.netWorth / 1000).toFixed(1) + 'K' : '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Net Worth</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Total Assets</span>
                  <div className="text-base font-bold text-green-600">
                    ${domainStats.assets > 0 ? (domainStats.assets / 1000).toFixed(1) + 'K' : '0'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Liabilities</span>
                  <div className="text-base font-bold text-red-600">
                    ${domainStats.liabilities > 0 ? (domainStats.liabilities / 1000).toFixed(1) + 'K' : '0'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Income</span>
                  <div className="text-base font-bold text-emerald-600">
                    ${domainStats.income > 0 ? (domainStats.income / 1000).toFixed(1) + 'K' : '0'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Expenses</span>
                  <div className="text-base font-bold text-orange-600">
                    ${domainStats.expenses > 0 ? (domainStats.expenses / 1000).toFixed(1) + 'K' : '0'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Savings Rate</span>
                  <div className="text-base font-bold text-blue-600">
                    {domainStats.income > 0 ? Math.round(((domainStats.income - domainStats.expenses) / domainStats.income) * 100) : 0}%
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Cash Flow</span>
                  <div className={cn("text-base font-bold", domainStats.balance >= 0 ? "text-green-600" : "text-red-600")}>
                    ${Math.abs(domainStats.balance).toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Bills Card */}
        <Link href="/domains/financial">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  Bills This Month
                </div>
                <div className="text-right">
                  <div className={cn("text-2xl font-bold", activeBills.filter(b => b.status !== 'paid').length > 0 ? "text-orange-600" : "text-green-600")}>
                    {activeBills.filter(b => b.status !== 'paid').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${activeBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.amount || 0), 0).toFixed(0)} due
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Total Bills</span>
                  <div className="text-lg font-bold">{activeBills.length}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Amount Due</span>
                  <div className="text-lg font-bold text-red-600">
                    ${activeBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.amount || 0), 0).toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Net Worth Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Net Worth
              </div>
              <div className="text-right">
                <div className={cn("text-2xl font-bold", domainStats.netWorth >= 0 ? "text-green-600" : "text-red-600")}>
                  ${Math.abs(domainStats.netWorth).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {domainStats.netWorth >= 0 ? 'positive' : 'negative'}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium">Assets</span>
                <div className="text-lg font-bold text-green-600">
                  ${domainStats.totalAssets.toFixed(0)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Liabilities</span>
                <div className="text-lg font-bold text-red-600">
                  ${domainStats.totalLiabilities.toFixed(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Budget Card */}
        <Link href="/goals">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Monthly Budget
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    ${monthlyBudget.amount ? monthlyBudget.amount.toFixed(0) : monthlyBudget.totalExpenses.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    monthly budget
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthlyBudget.totalIncome > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Income</span>
                    <div className="text-lg font-bold text-green-600">
                      ${monthlyBudget.totalIncome.toFixed(0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Expenses</span>
                    <div className="text-lg font-bold text-red-600">
                      ${monthlyBudget.totalExpenses.toFixed(0)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Set your monthly budget in Goals
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* House Value Card */}
        <Link href="/domains/home">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Home Value
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${domainStats.homeValue > 0 ? (domainStats.homeValue / 1000).toFixed(0) + 'K' : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const homeItems = (data.home || []) as any[]
                      return homeItems.filter(i => i.metadata?.itemType === 'Property').length
                    })()} properties
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {domainStats.homeValue > 0 ? (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Track property value</span>
                  </div>
                ) : (
                  'Add your home value'
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Car Value Card */}
        <Link href="/domains/vehicles">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-cyan-500" />
                  Vehicle Value
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-600">
                    ${domainStats.carValue > 0 ? (domainStats.carValue / 1000).toFixed(0) + 'K' : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const vehicles = (data.vehicles || []) as any[]
                      return vehicles.length
                    })()} vehicles
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {domainStats.carValue > 0 ? (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-cyan-500" />
                    <span>Total fleet value</span>
                  </div>
                ) : (
                  'Add your vehicles'
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Collectibles Value Card */}
        <Link href="/domains/collectibles">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-pink-500" />
                  Collectibles
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pink-600">
                    ${domainStats.collectiblesValue > 0 ? (domainStats.collectiblesValue / 1000).toFixed(0) + 'K' : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(data.collectibles || []).length} items
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {domainStats.collectiblesValue > 0 ? (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-pink-500" />
                    <span>Total collection value</span>
                  </div>
                ) : (
                  'Track your collectibles'
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Miscellaneous Assets Card */}
        <Link href="/domains/miscellaneous">
          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-500" />
                  Other Assets
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-violet-600">
                    ${domainStats.miscValue > 0 ? (domainStats.miscValue / 1000).toFixed(0) + 'K' : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(data.miscellaneous || []).length} items
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {domainStats.miscValue > 0 ? (
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-500" />
                    <span>Boats, jewelry, etc.</span>
                  </div>
                ) : (
                  'Track other valuable assets'
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Fast access to common tasks and data entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Direct Mood Logging - NO POPUP */}
            <Button 
              onClick={() => setMealLoggerOpen(true)}
              variant="outline" 
              className="w-full h-12"
            >
              <Utensils className="h-4 w-4 mr-2 text-orange-500" />
              Log Meal
            </Button>
            
            {showMoodSelector && !moodJustLogged && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">How are you feeling? (1-5)</p>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: 1, emoji: '😢' },
                    { value: 2, emoji: '😕' },
                    { value: 3, emoji: '😐' },
                    { value: 4, emoji: '😊' },
                    { value: 5, emoji: '😄' }
                  ].map((mood) => (
                    <Button
                      key={mood.value}
                      variant="outline"
                      size="sm"
                      className="h-12 text-2xl hover:scale-110 transition-transform"
                      onClick={() => handleQuickMoodLog(mood.value)}
                    >
                      {mood.emoji}
                    </Button>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowMoodSelector(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {moodJustLogged && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
                <span className="text-sm font-medium text-green-700 dark:text-green-200">
                  Mood logged! 🎉
                </span>
              </div>
            )}
            
            <Button 
              onClick={() => setJournalOpen(true)}
              variant="outline" 
              className="w-full h-12"
            >
              <Book className="h-4 w-4 mr-2 text-purple-500" />
              Write Journal Entry
            </Button>
            
            <Button 
              onClick={() => setAddTaskOpen(true)}
              variant="outline" 
              className="w-full h-12"
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Add Task
            </Button>
            
            <Button 
              onClick={() => setAddDataOpen(true)}
              variant="outline" 
              className="w-full h-12"
            >
              <Plus className="h-4 w-4 mr-2 text-blue-500" />
              Add Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Dialogs - Only Essential Ones */}
      <AddDataDialog open={addDataOpen} onClose={() => setAddDataOpen(false)} />
      <CategorizedAlertsDialog open={alertsDialogOpen} onClose={() => setAlertsDialogOpen(false)} />
      <JournalEntryDialog open={journalOpen} onClose={() => setJournalOpen(false)} />
      <MealLogger open={mealLoggerOpen} onClose={() => setMealLoggerOpen(false)} />
      
      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="What do you need to do?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTask} className="flex-1" disabled={!newTaskTitle.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Habit Dialog */}
      <Dialog open={addHabitOpen} onOpenChange={setAddHabitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
            <DialogDescription>Create a new habit to track daily</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Habit Name *</Label>
              <Input
                id="habit-name"
                placeholder="e.g., Morning workout, Read 30 min"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-icon">Icon (emoji)</Label>
              <Input
                id="habit-icon"
                placeholder="⭐"
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-frequency">Frequency</Label>
              <select
                id="habit-frequency"
                value={newHabitFrequency}
                onChange={(e) => setNewHabitFrequency(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHabit} className="flex-1" disabled={!newHabitName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
              <Button variant="outline" onClick={() => setAddHabitOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog - NEW! */}
      <Dialog open={addAppointmentOpen} onOpenChange={setAddAppointmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Appointment</DialogTitle>
            <DialogDescription>Schedule a new appointment or event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-title">Title *</Label>
              <Input
                id="appointment-title"
                placeholder="e.g., Doctor appointment, Team meeting"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-date">Date *</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Time</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-location">Location</Label>
              <Input
                id="appointment-location"
                placeholder="Where is this happening?"
                value={appointmentLocation}
                onChange={(e) => setAppointmentLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Notes</Label>
              <Textarea
                id="appointment-notes"
                placeholder="Additional details..."
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddAppointment} className="flex-1" disabled={!appointmentTitle.trim() || !appointmentDate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Appointment
              </Button>
              <Button variant="outline" onClick={() => setAddAppointmentOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal Entry Dialog with AI */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Journal Entry
            </DialogTitle>
            <DialogDescription>
              Write your thoughts and let AI help you understand them
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="journal-title">Title (optional)</Label>
              <Input
                id="journal-title"
                placeholder="Give your entry a title..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-entry">Journal Entry *</Label>
              <Textarea
                id="journal-entry"
                placeholder="Write about your day, feelings, or thoughts..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal-mood">How are you feeling?</Label>
                <select
                  id="journal-mood"
                  value={journalMood}
                  onChange={(e) => setJournalMood(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md"
                >
                  {MOOD_OPTIONS.map((mood) => (
                    <option key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="journal-energy">Energy Level</Label>
                <select
                  id="journal-energy"
                  value={journalEnergy}
                  onChange={(e) => setJournalEnergy(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-gratitude">What are you grateful for today?</Label>
              <Textarea
                id="journal-gratitude"
                placeholder="List things you're grateful for..."
                value={journalGratitude}
                onChange={(e) => setJournalGratitude(e.target.value)}
                rows={2}
              />
            </div>
            
            {aiInsight && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400">AI Insights</h4>
                </div>
                <p className="text-sm whitespace-pre-line">{aiInsight}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleSaveJournal(true)}
                disabled={!journalEntry.trim() || aiAnalyzing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {aiAnalyzing ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : aiInsight ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Insights & Save
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSaveJournal(false)}
                disabled={!journalEntry.trim() || aiAnalyzing}
              >
                Save Without AI
              </Button>
              <Button variant="outline" onClick={() => setJournalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
