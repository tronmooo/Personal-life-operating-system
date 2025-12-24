'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertCircle, DollarSign, Heart, Shield, Calendar, ArrowRight, 
  Wrench, FileText, Bell, TrendingUp, Home, Car, Zap, PawPrint,
  Pill, Syringe, ClipboardList, RefreshCw
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface CategorizedAlertsDialogProps {
  open: boolean
  onClose: () => void
}

interface Alert {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  daysUntil: number
  actionUrl: string
  icon: any
  color: string
  category: string
}

// Hook to fetch all alerts directly from Supabase
function useAllAlerts() {
  const [alerts, setAlerts] = useState<{
    bills: Alert[]
    events: Alert[]
    health: Alert[]
    insurance: Alert[]
    home: Alert[]
    documents: Alert[]
    maintenance: Alert[]
    replacement: Alert[]
    pets: Alert[]
    vehicles: Alert[]
    tasks: Alert[]
  }>({
    bills: [],
    events: [],
    health: [],
    insurance: [],
    home: [],
    documents: [],
    maintenance: [],
    replacement: [],
    pets: [],
    vehicles: [],
    tasks: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAllAlerts = async () => {
      setLoading(true)
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const today = new Date()
      const newAlerts = {
        bills: [] as Alert[],
        events: [] as Alert[],
        health: [] as Alert[],
        insurance: [] as Alert[],
        home: [] as Alert[],
        documents: [] as Alert[],
        maintenance: [] as Alert[],
        replacement: [] as Alert[],
        pets: [] as Alert[],
        vehicles: [] as Alert[],
        tasks: [] as Alert[],
      }

      try {
        // 1. Load Bills from bills table
        const { data: bills } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'paid')
        
        if (bills) {
          bills.forEach(bill => {
            if (bill.due_date) {
              const dueDate = new Date(bill.due_date)
              const daysUntilDue = differenceInDays(dueDate, today)
              
              if (daysUntilDue <= 7 && daysUntilDue >= -7) {
                newAlerts.bills.push({
                  id: `bill-${bill.id}`,
                  severity: daysUntilDue < 0 ? 'high' : daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low',
                  title: bill.title,
                  description: daysUntilDue < 0 
                    ? `Overdue by ${Math.abs(daysUntilDue)} days • $${bill.amount}`
                    : `Due ${format(dueDate, 'MMM d')} • $${bill.amount}`,
                  daysUntil: daysUntilDue,
                  actionUrl: '/domains/financial',
                  icon: DollarSign,
                  color: 'text-green-600',
                  category: 'bills',
                })
              }
            }
          })
        }

        // 2. Load Events from events table
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .gte('event_date', today.toISOString())
          .order('event_date', { ascending: true })
          .limit(50)
        
        if (events) {
          events.forEach(event => {
            if (event.event_date) {
              const eventDate = new Date(event.event_date)
              const daysUntil = differenceInDays(eventDate, today)
              
              if (daysUntil >= 0 && daysUntil <= 7) {
                newAlerts.events.push({
                  id: `event-${event.id}`,
                  severity: daysUntil === 0 ? 'high' : daysUntil <= 1 ? 'medium' : 'low',
                  title: event.title,
                  description: daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`,
                  daysUntil,
                  actionUrl: '/calendar',
                  icon: Calendar,
                  color: 'text-blue-600',
                  category: 'events',
                })
              }
            }
          })
        }

        // 3. Load Health data from domain_entries
        const { data: healthEntries } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'health')
        
        if (healthEntries) {
          healthEntries.forEach((item: any) => {
            // Check for appointments/checkups
            const nextCheckup = item.metadata?.nextCheckup || item.metadata?.appointmentDate
            if (nextCheckup) {
              const checkupDate = new Date(nextCheckup)
              const daysUntil = differenceInDays(checkupDate, today)
              
              if (daysUntil >= -7 && daysUntil <= 30) {
                newAlerts.health.push({
                  id: `health-checkup-${item.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 7 ? 'high' : 'medium',
                  title: item.title || 'Health Appointment',
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Due ${format(checkupDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/health',
                  icon: Heart,
                  color: 'text-red-600',
                  category: 'health',
                })
              }
            }
            
            // Check for medication refills
            if (item.metadata?.refillDate || item.metadata?.nextRefill) {
              const refillDate = new Date(item.metadata.refillDate || item.metadata.nextRefill)
              const daysUntil = differenceInDays(refillDate, today)
              
              if (daysUntil >= -7 && daysUntil <= 14) {
                newAlerts.health.push({
                  id: `health-refill-${item.id}`,
                  severity: daysUntil <= 3 ? 'high' : 'medium',
                  title: `${item.title} Refill`,
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Refill needed ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`}`,
                  daysUntil,
                  actionUrl: '/domains/health',
                  icon: Pill,
                  color: 'text-pink-600',
                  category: 'health',
                })
              }
            }
          })
        }

        // 4. Load medications from health_medications table
        const { data: medications } = await supabase
          .from('health_medications')
          .select('*')
          .eq('user_id', user.id)
        
        if (medications) {
          medications.forEach(med => {
            if (med.expiration_date) {
              const expiryDate = new Date(med.expiration_date)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 60) {
                newAlerts.health.push({
                  id: `med-expiry-${med.id}`,
                  severity: daysUntil <= 14 ? 'high' : 'medium',
                  title: `${med.medication_name} Expiring`,
                  description: daysUntil < 0 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/health',
                  icon: Pill,
                  color: 'text-red-600',
                  category: 'health',
                })
              }
            }
          })
        }

        // 5. Load Insurance from domain_entries and insurance_policies
        const { data: insuranceEntries } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'insurance')
        
        if (insuranceEntries) {
          insuranceEntries.forEach((item: any) => {
            const renewalDate = item.metadata?.renewalDate || item.metadata?.expirationDate || item.metadata?.expiry_date
            if (renewalDate) {
              const renewal = new Date(renewalDate)
              const daysUntil = differenceInDays(renewal, today)
              
              if (daysUntil >= -7 && daysUntil <= 60) {
                newAlerts.insurance.push({
                  id: `insurance-${item.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 30 ? 'high' : 'medium',
                  title: item.title || 'Insurance Policy',
                  description: daysUntil < 0 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `Renews ${format(renewal, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/insurance',
                  icon: Shield,
                  color: 'text-purple-600',
                  category: 'insurance',
                })
              }
            }
          })
        }

        // Also check insurance_policies table
        const { data: insurancePolicies } = await supabase
          .from('insurance_policies')
          .select('*')
          .eq('user_id', user.id)
        
        if (insurancePolicies) {
          insurancePolicies.forEach(policy => {
            if (policy.expiration_date) {
              const expiryDate = new Date(policy.expiration_date)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= -7 && daysUntil <= 60) {
                newAlerts.insurance.push({
                  id: `policy-${policy.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 30 ? 'high' : 'medium',
                  title: `${policy.type} - ${policy.provider}`,
                  description: daysUntil < 0 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/insurance',
                  icon: Shield,
                  color: 'text-purple-600',
                  category: 'insurance',
                })
              }
            }
          })
        }

        // 6. Load Home maintenance from domain_entries and home_maintenance
        const { data: homeEntries } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'home')
        
        if (homeEntries) {
          homeEntries.forEach((item: any) => {
            // Maintenance tasks
            if (item.metadata?.itemType === 'Maintenance Task' && item.metadata?.dueDate) {
              const status = item.metadata?.status
              if (status !== 'Completed' && status !== 'Cancelled') {
                const dueDate = new Date(item.metadata.dueDate)
                const daysUntil = differenceInDays(dueDate, today)
                
                if (daysUntil >= -14 && daysUntil <= 30) {
                  newAlerts.home.push({
                    id: `home-task-${item.id}`,
                    severity: daysUntil < 0 ? 'high' : daysUntil <= 3 ? 'high' : 'medium',
                    title: item.title,
                    description: daysUntil < 0 
                      ? `Overdue by ${Math.abs(daysUntil)} days`
                      : daysUntil === 0 ? 'Due today' : `Due in ${daysUntil} days`,
                    daysUntil,
                    actionUrl: '/domains/home',
                    icon: Home,
                    color: 'text-orange-600',
                    category: 'home',
                  })
                }
              }
            }
            
            // Warranty expirations
            if (item.metadata?.warrantyExpires) {
              const expiryDate = new Date(item.metadata.warrantyExpires)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= 0 && daysUntil <= 90) {
                newAlerts.home.push({
                  id: `home-warranty-${item.id}`,
                  severity: daysUntil <= 30 ? 'high' : 'medium',
                  title: `${item.title} Warranty`,
                  description: `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/home',
                  icon: Shield,
                  color: 'text-amber-600',
                  category: 'home',
                })
              }
            }
          })
        }

        // Also check home_maintenance table
        const { data: homeMaintenance } = await supabase
          .from('home_maintenance')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'Completed')
        
        if (homeMaintenance) {
          homeMaintenance.forEach(task => {
            if (task.due_date) {
              const dueDate = new Date(task.due_date)
              const daysUntil = differenceInDays(dueDate, today)
              
              if (daysUntil >= -14 && daysUntil <= 30) {
                newAlerts.home.push({
                  id: `home-maint-${task.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
                  title: task.task_name,
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Due ${format(dueDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/home',
                  icon: Wrench,
                  color: 'text-yellow-600',
                  category: 'home',
                })
              }
            }
          })
        }

        // 7. Load Documents with expiration dates
        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .not('expiration_date', 'is', null)
        
        if (documents) {
          documents.forEach(doc => {
            if (doc.expiration_date) {
              const expiryDate = new Date(doc.expiration_date)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 90) {
                newAlerts.documents.push({
                  id: `doc-${doc.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 14 ? 'high' : 'medium',
                  title: doc.document_name || doc.file_name || 'Document',
                  description: daysUntil < 0 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: `/domains/${doc.domain || 'documents'}`,
                  icon: FileText,
                  color: 'text-indigo-600',
                  category: 'documents',
                })
              }
            }
          })
        }

        // Also check expiration_alerts from domain_entries
        const { data: expirationAlerts } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'expiration_alerts')
        
        if (expirationAlerts) {
          expirationAlerts.forEach((alert: any) => {
            if (alert.metadata?.expirationDate && alert.metadata?.isActive !== false) {
              const expiryDate = new Date(alert.metadata.expirationDate)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 90) {
                newAlerts.documents.push({
                  id: `exp-${alert.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 14 ? 'high' : 'medium',
                  title: alert.metadata?.documentName || alert.title,
                  description: daysUntil < 0 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: `/domains/${alert.metadata?.domain || 'documents'}`,
                  icon: FileText,
                  color: 'text-indigo-600',
                  category: 'documents',
                })
              }
            }
          })
        }

        // 8. Load Appliances maintenance from appliances table
        const { data: appliances } = await supabase
          .from('appliances')
          .select('*')
          .eq('user_id', user.id)
        
        if (appliances) {
          appliances.forEach(appliance => {
            // Check maintenance due
            if (appliance.maintenance_due) {
              const maintenanceDate = new Date(appliance.maintenance_due)
              const daysUntil = differenceInDays(maintenanceDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 30) {
                newAlerts.maintenance.push({
                  id: `appliance-maint-${appliance.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
                  title: `${appliance.name} Maintenance`,
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Due ${format(maintenanceDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/appliances',
                  icon: Wrench,
                  color: 'text-yellow-600',
                  category: 'maintenance',
                })
              }
            }
            
            // Check warranty expiry
            if (appliance.warranty_expiry) {
              const expiryDate = new Date(appliance.warranty_expiry)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= 0 && daysUntil <= 90) {
                newAlerts.maintenance.push({
                  id: `appliance-warranty-${appliance.id}`,
                  severity: daysUntil <= 30 ? 'high' : 'medium',
                  title: `${appliance.name} Warranty`,
                  description: `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/appliances',
                  icon: Shield,
                  color: 'text-amber-600',
                  category: 'maintenance',
                })
              }
            }

            // Check lifespan for replacement alerts
            if (appliance.purchase_date && appliance.expected_lifespan) {
              const purchaseDate = new Date(appliance.purchase_date)
              const lifespanMonths = appliance.expected_lifespan * 12 // Convert years to months
              const ageInMonths = Math.floor(differenceInDays(today, purchaseDate) / 30)
              const lifespanProgress = (ageInMonths / lifespanMonths) * 100
              
              if (lifespanProgress >= 80) {
                const endOfLifeDate = new Date(purchaseDate)
                endOfLifeDate.setMonth(endOfLifeDate.getMonth() + lifespanMonths)
                const daysUntilEOL = differenceInDays(endOfLifeDate, today)
                
                newAlerts.replacement.push({
                  id: `appliance-replace-${appliance.id}`,
                  severity: lifespanProgress >= 95 ? 'high' : 'medium',
                  title: appliance.name,
                  description: lifespanProgress >= 95 
                    ? `End of life approaching • ${lifespanProgress.toFixed(0)}% used`
                    : `Consider replacement • ${lifespanProgress.toFixed(0)}% lifespan used`,
                  daysUntil: daysUntilEOL,
                  actionUrl: '/domains/appliances',
                  icon: TrendingUp,
                  color: lifespanProgress >= 95 ? 'text-red-600' : 'text-orange-600',
                  category: 'replacement',
                })
              }
            }
          })
        }

        // 9. Load tracked_assets from domain_entries for more maintenance/replacement alerts
        const { data: trackedAssets } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'tracked_assets')
        
        if (trackedAssets) {
          trackedAssets.forEach((asset: any) => {
            const purchaseDate = asset.metadata?.purchaseDate
            const expectedLifespan = asset.metadata?.expectedLifespan
            const maintenanceInterval = asset.metadata?.maintenanceInterval
            const lastMaintenanceDate = asset.metadata?.lastMaintenanceDate
            
            if (purchaseDate && maintenanceInterval) {
              const purchase = new Date(purchaseDate)
              const lastMaint = lastMaintenanceDate ? new Date(lastMaintenanceDate) : purchase
              const nextMaintenanceDate = new Date(lastMaint)
              nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + maintenanceInterval)
              const daysUntilMaint = differenceInDays(nextMaintenanceDate, today)
              
              if (daysUntilMaint >= -30 && daysUntilMaint <= 30) {
                newAlerts.maintenance.push({
                  id: `asset-maint-${asset.id}`,
                  severity: daysUntilMaint < 0 ? 'high' : daysUntilMaint <= 7 ? 'medium' : 'low',
                  title: `${asset.title} Maintenance`,
                  description: daysUntilMaint < 0 
                    ? `Overdue by ${Math.abs(daysUntilMaint)} days`
                    : `Due ${format(nextMaintenanceDate, 'MMM d')}`,
                  daysUntil: daysUntilMaint,
                  actionUrl: '/domains/appliances',
                  icon: Wrench,
                  color: 'text-yellow-600',
                  category: 'maintenance',
                })
              }
            }
            
            if (purchaseDate && expectedLifespan) {
              const purchase = new Date(purchaseDate)
              const ageInMonths = Math.floor(differenceInDays(today, purchase) / 30)
              const lifespanProgress = (ageInMonths / expectedLifespan) * 100
              
              if (lifespanProgress >= 80) {
                const endOfLifeDate = new Date(purchase)
                endOfLifeDate.setMonth(endOfLifeDate.getMonth() + expectedLifespan)
                const daysUntilEOL = differenceInDays(endOfLifeDate, today)
                
                newAlerts.replacement.push({
                  id: `asset-replace-${asset.id}`,
                  severity: lifespanProgress >= 95 ? 'high' : 'medium',
                  title: asset.title,
                  description: lifespanProgress >= 95 
                    ? `CRITICAL: ${lifespanProgress.toFixed(0)}% lifespan used`
                    : `Optimal replacement window • ${lifespanProgress.toFixed(0)}% used`,
                  daysUntil: daysUntilEOL,
                  actionUrl: '/domains/appliances',
                  icon: lifespanProgress >= 95 ? AlertCircle : TrendingUp,
                  color: lifespanProgress >= 95 ? 'text-red-600' : 'text-orange-600',
                  category: 'replacement',
                })
              }
            }
          })
        }

        // 10. Load Pet vaccinations and health from pets and pet_vaccinations
        const { data: petVaccinations } = await supabase
          .from('pet_vaccinations')
          .select('*, pets!inner(name)')
          .eq('user_id', user.id)
        
        if (petVaccinations) {
          petVaccinations.forEach((vax: any) => {
            if (vax.next_due_date) {
              const dueDate = new Date(vax.next_due_date)
              const daysUntil = differenceInDays(dueDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 60) {
                newAlerts.pets.push({
                  id: `pet-vax-${vax.id}`,
                  severity: daysUntil < 0 ? 'high' : daysUntil <= 14 ? 'high' : 'medium',
                  title: `${vax.pets?.name}: ${vax.vaccine_name}`,
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Due ${format(dueDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/pets',
                  icon: Syringe,
                  color: 'text-cyan-600',
                  category: 'pets',
                })
              }
            }
          })
        }

        // 11. Load Vehicle maintenance from vehicle_maintenance table
        const { data: vehicleMaintenance } = await supabase
          .from('vehicle_maintenance')
          .select('*, vehicles!inner("vehicleName")')
          .eq('userId', user.id)
        
        if (vehicleMaintenance) {
          vehicleMaintenance.forEach((maint: any) => {
            if (maint.nextServiceDate && maint.status !== 'good') {
              const serviceDate = new Date(maint.nextServiceDate)
              const daysUntil = differenceInDays(serviceDate, today)
              
              if (daysUntil >= -30 && daysUntil <= 30) {
                newAlerts.vehicles.push({
                  id: `vehicle-maint-${maint.id}`,
                  severity: daysUntil < 0 ? 'high' : maint.status === 'overdue' ? 'high' : 'medium',
                  title: `${maint.vehicles?.vehicleName}: ${maint.serviceName}`,
                  description: daysUntil < 0 
                    ? `Overdue by ${Math.abs(daysUntil)} days`
                    : `Due ${format(serviceDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/vehicles',
                  icon: Car,
                  color: 'text-blue-600',
                  category: 'vehicles',
                })
              }
            }
          })
        }

        // Also check vehicle warranties
        const { data: vehicleWarranties } = await supabase
          .from('vehicle_warranties')
          .select('*, vehicles!inner("vehicleName")')
          .eq('userId', user.id)
          .eq('status', 'active')
        
        if (vehicleWarranties) {
          vehicleWarranties.forEach((warranty: any) => {
            if (warranty.expiryDate) {
              const expiryDate = new Date(warranty.expiryDate)
              const daysUntil = differenceInDays(expiryDate, today)
              
              if (daysUntil >= 0 && daysUntil <= 90) {
                newAlerts.vehicles.push({
                  id: `vehicle-warranty-${warranty.id}`,
                  severity: daysUntil <= 30 ? 'high' : 'medium',
                  title: `${warranty.vehicles?.vehicleName}: ${warranty.warrantyName}`,
                  description: `Expires ${format(expiryDate, 'MMM d')}`,
                  daysUntil,
                  actionUrl: '/domains/vehicles',
                  icon: Shield,
                  color: 'text-purple-600',
                  category: 'vehicles',
                })
              }
            }
          })
        }

        // 12. Load Subscriptions with upcoming renewals
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
        
        if (subscriptions) {
          subscriptions.forEach(sub => {
            if (sub.next_due_date) {
              const dueDate = new Date(sub.next_due_date)
              const daysUntil = differenceInDays(dueDate, today)
              
              // Only show if renewing within 7 days and reminders are enabled
              if (daysUntil >= 0 && daysUntil <= 7 && sub.reminder_enabled) {
                newAlerts.bills.push({
                  id: `sub-${sub.id}`,
                  severity: daysUntil <= 2 ? 'medium' : 'low',
                  title: `${sub.service_name} Renewal`,
                  description: `Renews ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`} • $${sub.cost}/${sub.frequency}`,
                  daysUntil,
                  actionUrl: '/subscriptions',
                  icon: RefreshCw,
                  color: 'text-teal-600',
                  category: 'bills',
                })
              }
            }
          })
        }

      } catch (error) {
        console.error('Error loading alerts:', error)
      }

      setAlerts(newAlerts)
      setLoading(false)
    }

    loadAllAlerts()
    
    // Refresh when data changes
    const handleRefresh = () => loadAllAlerts()
    window.addEventListener('data-provider-loaded', handleRefresh)
    window.addEventListener('force-data-reload', handleRefresh)
    
    return () => {
      window.removeEventListener('data-provider-loaded', handleRefresh)
      window.removeEventListener('force-data-reload', handleRefresh)
    }
  }, [])

  return { alerts, loading }
}

export function CategorizedAlertsDialog({ open, onClose }: CategorizedAlertsDialogProps) {
  const { alerts, loading } = useAllAlerts()
  const [activeTab, setActiveTab] = useState('all')
  const [checkedAlerts, setCheckedAlerts] = useState<Set<string>>(new Set())

  // Load checked alerts from Supabase (with IndexedDB fallback)
  useEffect(() => {
    const loadCheckedAlerts = async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Load from Supabase
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single()

        if (userSettings?.settings?.dismissedAlerts && Array.isArray(userSettings.settings.dismissedAlerts)) {
          setCheckedAlerts(new Set(userSettings.settings.dismissedAlerts))
        }
      } else {
        // Fallback to IndexedDB
        const stored = await idbGet('checked-alerts')
        if (stored && Array.isArray(stored)) {
          setCheckedAlerts(new Set(stored))
        }
      }
    }
    loadCheckedAlerts()
  }, [])

  // Handle checking/unchecking alerts
  const toggleAlertChecked = async (alertId: string) => {
    setCheckedAlerts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      
      // Persist to Supabase (with IndexedDB fallback)
      const saveCheckedAlerts = async () => {
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Get existing settings first
          const { data: existing } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .single()
          
          const existingSettings = existing?.settings || {}
          
          // Save to Supabase user_settings
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              settings: {
                ...existingSettings,
                dismissedAlerts: Array.from(newSet)
              }
            })
        } else {
          // Fallback to IndexedDB
          idbSet('checked-alerts', Array.from(newSet))
        }
      }
      saveCheckedAlerts()
      
      return newSet
    })
  }

  // Combine all categories for calculation
  const alertsByCategory = useMemo(() => ({
    bills: alerts.bills,
    tasks: alerts.tasks,
    events: alerts.events,
    health: alerts.health,
    insurance: alerts.insurance,
    home: [...alerts.home, ...alerts.pets, ...alerts.vehicles],
    documents: alerts.documents,
    maintenance: alerts.maintenance,
    replacement: alerts.replacement,
  }), [alerts])

  // Calculate totals (excluding checked alerts)
  const totals = useMemo(() => {
    const filterUnchecked = (arr: Alert[]) => arr.filter(a => !checkedAlerts.has(a.id))
    return {
      all: Object.values(alertsByCategory).flat().filter(a => !checkedAlerts.has(a.id)).length,
      bills: filterUnchecked(alertsByCategory.bills).length,
      tasks: filterUnchecked(alertsByCategory.tasks).length,
      events: filterUnchecked(alertsByCategory.events).length,
      health: filterUnchecked(alertsByCategory.health).length,
      insurance: filterUnchecked(alertsByCategory.insurance).length,
      home: filterUnchecked(alertsByCategory.home).length,
      documents: filterUnchecked(alertsByCategory.documents).length,
      maintenance: filterUnchecked(alertsByCategory.maintenance).length,
      replacement: filterUnchecked(alertsByCategory.replacement).length,
    }
  }, [alertsByCategory, checkedAlerts])

  // Get all alerts for "All" tab, sorted by severity and days until
  const allAlerts = useMemo(() => 
    Object.values(alertsByCategory)
      .flat()
      .sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 }
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity]
        }
        return a.daysUntil - b.daysUntil
      }),
    [alertsByCategory]
  )

  const renderAlertsList = (alertsList: Alert[]) => {
    if (loading) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
          <p className="text-sm">Loading alerts...</p>
        </div>
      )
    }

    if (alertsList.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No alerts in this category</p>
          <p className="text-sm">You're all caught up! 🎉</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {alertsList.map((alert) => {
          const Icon = alert.icon
          const isChecked = checkedAlerts.has(alert.id)
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border transition-all hover:shadow-md",
                isChecked && "opacity-50",
                alert.severity === 'high' ? 'bg-red-50 dark:bg-red-950/10 border-red-200' :
                alert.severity === 'medium' ? 'bg-orange-50 dark:bg-orange-950/10 border-orange-200' :
                'bg-blue-50 dark:bg-blue-950/10 border-blue-200'
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleAlertChecked(alert.id)}
                className="mt-1 flex-shrink-0"
              />
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", alert.color, isChecked && "opacity-50")} />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn("font-medium text-sm truncate", isChecked && "line-through")}>{alert.title}</h4>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'default' : 'secondary'
                  } className="shrink-0">
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className={cn("text-sm text-muted-foreground", isChecked && "line-through")}>
                  {alert.description}
                </p>
              </div>
              <Link href={alert.actionUrl} onClick={onClose}>
                <Button size="sm" variant="ghost" className="shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-6 w-6 text-yellow-500" />
            Alerts & Notifications
          </DialogTitle>
          <DialogDescription>
            All your alerts organized by category for easy management
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full gap-1">
            <TabsTrigger value="all" className="text-xs px-2">
              All ({totals.all})
            </TabsTrigger>
            <TabsTrigger value="bills" className="text-xs px-2">
              Bills ({totals.bills})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-2">
              Tasks ({totals.tasks})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs px-2">
              Events ({totals.events})
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs px-2">
              Health ({totals.health})
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs px-2">
              Insurance ({totals.insurance})
            </TabsTrigger>
            <TabsTrigger value="home" className="text-xs px-2">
              Home ({totals.home})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-2">
              Docs ({totals.documents})
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs px-2">
              Maint. ({totals.maintenance})
            </TabsTrigger>
            <TabsTrigger value="replacement" className="text-xs px-2">
              Replace ({totals.replacement})
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[500px] overflow-y-auto pr-2">
            <TabsContent value="all" className="mt-0">
              {renderAlertsList(allAlerts)}
            </TabsContent>

            <TabsContent value="bills" className="mt-0">
              {renderAlertsList(alertsByCategory.bills)}
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              {renderAlertsList(alertsByCategory.tasks)}
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              {renderAlertsList(alertsByCategory.events)}
            </TabsContent>

            <TabsContent value="health" className="mt-0">
              {renderAlertsList(alertsByCategory.health)}
            </TabsContent>

            <TabsContent value="insurance" className="mt-0">
              {renderAlertsList(alertsByCategory.insurance)}
            </TabsContent>

            <TabsContent value="home" className="mt-0">
              {renderAlertsList(alertsByCategory.home)}
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              {renderAlertsList(alertsByCategory.documents)}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0">
              {renderAlertsList(alertsByCategory.maintenance)}
            </TabsContent>

            <TabsContent value="replacement" className="mt-0">
              {renderAlertsList(alertsByCategory.replacement)}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
