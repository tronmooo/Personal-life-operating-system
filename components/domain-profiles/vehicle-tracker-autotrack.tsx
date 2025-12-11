'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Car,
  Plus,
  Droplet,
  AlertCircle,
  DollarSign,
  Calendar,
  Wrench,
  Shield,
  FileText,
  Edit,
  Save,
  X
} from 'lucide-react'
import { LogChartRenderer } from '@/components/log-visualizations/log-chart-renderer'

interface Vehicle {
  id: string
  userId?: string
  vehicleName: string
  make: string
  model: string
  year: number
  vin?: string
  trim?: string
  drivetrain?: string
  condition?: string
  currentMileage: number
  estimatedValue: number
  lifeExpectancy: number
  monthlyInsurance: number
  location?: string
  zipCode?: string
  features?: string
  exteriorColor?: string
  interiorColor?: string
  certifiedPreOwned?: boolean
  status?: 'active' | 'inactive' | 'sold'
  createdAt: string
  updatedAt?: string
}

interface Maintenance {
  id: string
  userId: string
  vehicleId: string
  serviceName: string
  lastServiceMileage?: number
  lastServiceDate?: string
  nextServiceMileage?: number
  nextServiceDate?: string
  cost: number
  status: 'good' | 'due_soon' | 'overdue' | 'upcoming'
  createdAt: string
}

interface Cost {
  id: string
  userId: string
  vehicleId: string
  costType: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'repair' | 'other'
  amount: number
  date: string
  description?: string
  createdAt: string
}

interface Warranty {
  id: string
  userId: string
  vehicleId: string
  warrantyName: string
  provider: string
  expiryDate?: string
  coverageMiles?: number
  status: 'active' | 'expired' | 'cancelled'
  createdAt: string
  pdfUrl?: string
}

export function VehicleTrackerAutoTrack() {
  const router = useRouter()
  const { 
    items: domainEntries, 
    create: createEntry, 
    update: updateEntry, 
    remove: removeEntry, 
    loading: domainLoading,
    refresh: refreshDomain,
    isAuthenticated
  } = useDomainCRUD('vehicles')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [mileageLogs, setMileageLogs] = useState<Array<{ id: string, date: string, odometer: number }>>([])
  const [fuelFillups, setFuelFillups] = useState<Array<{ id: string, date: string, gallons: number, cost: number, mileage: number }>>([])
  const [recalls, setRecalls] = useState<Array<{ id: string; description: string; severity?: string; date?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false)
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false)
  const [isAddCostOpen, setIsAddCostOpen] = useState(false)
  const [isAddWarrantyOpen, setIsAddWarrantyOpen] = useState(false)
  const [isAddMilesOpen, setIsAddMilesOpen] = useState(false)

  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    trim: '',
    drivetrain: '',
    condition: 'Good',
    currentMileage: 0,
    estimatedValue: 0,
    lifeExpectancy: 10,
    monthlyInsurance: 0,
    location: '',
    zipCode: '',
    features: '',
    exteriorColor: '',
    interiorColor: '',
    certifiedPreOwned: false
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    serviceName: '',
    lastServiceMileage: 0,
    lastServiceDate: '',
    nextServiceMileage: 0,
    cost: 0
  })

  // Auto-calculate next service mileage based on service type
  const getMaintenanceInterval = (serviceName: string): number => {
    const name = serviceName.toLowerCase()
    if (name.includes('oil')) return 5000
    if (name.includes('tire') && name.includes('rotation')) return 10000
    if (name.includes('air filter')) return 15000
    if (name.includes('brake')) return 20000
    if (name.includes('transmission')) return 30000
    if (name.includes('coolant')) return 30000
    return 5000 // default
  }

  // Update maintenance form with auto-calculated next service
  const updateMaintenanceForm = (field: string, value: any) => {
    const updated = { ...maintenanceForm, [field]: value }
    
    // Auto-calculate next service mileage when last service mileage or service name changes
    if (field === 'lastServiceMileage' || field === 'serviceName') {
      const lastMileage = field === 'lastServiceMileage' ? value : updated.lastServiceMileage
      const serviceName = field === 'serviceName' ? value : updated.serviceName
      
      if (lastMileage > 0 && serviceName) {
        const interval = getMaintenanceInterval(serviceName)
        updated.nextServiceMileage = lastMileage + interval
      }
    }
    
    setMaintenanceForm(updated)
  }

  const [costForm, setCostForm] = useState({
    costType: 'fuel' as Cost['costType'],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const [warrantyForm, setWarrantyForm] = useState({
    warrantyName: '',
    provider: '',
    expiryDate: '',
    coverageMiles: 0
  })
  const [warrantyDocFile, setWarrantyDocFile] = useState<File | null>(null)
  const [warrantyDocBase64, setWarrantyDocBase64] = useState<string | null>(null)
  const [warrantyOcrLoading, setWarrantyOcrLoading] = useState(false)
  const [warrantyPdfUrl, setWarrantyPdfUrl] = useState<string | null>(null)
  const [milesForm, setMilesForm] = useState<{ date: string, odometer: number }>({
    date: new Date().toISOString().split('T')[0],
    odometer: 0
  })

  const [isFetchingValue, setIsFetchingValue] = useState(false)
  const [aiValuation, setAiValuation] = useState<any>(null)

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({})

  // Listen for real-time vehicle data updates - trigger refresh
  useEffect(() => {
    const handleUpdate = () => {
      console.log('🚗 Vehicle data updated, refreshing...')
      refreshDomain()
    }
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('vehicles-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('vehicles-data-updated', handleUpdate)
    }
  }, [refreshDomain])

  useEffect(() => {
    if (selectedVehicle) {
      loadVehicleData(selectedVehicle.id)
      // Load recalls from DataProvider-backed Supabase mirror when VIN exists
      void (async () => {
        try {
          const vin = (selectedVehicle as any).vin
          if (!vin) { setRecalls([]); return }
          // Recalls are stored in domain_entries with type 'vehicle_recall'
          const items: any[] = domainEntries || []
          const recs = items
            .filter((i: any) => i?.metadata?.type === 'vehicle_recall' && i?.metadata?.vehicleId === selectedVehicle.id)
            .map((i: any) => ({ id: i.id, description: i.metadata?.description || 'Recall', severity: i.metadata?.severity, date: i.metadata?.date_issued }))
          setRecalls(recs)
        } catch { setRecalls([]) }
      })()
    }
  }, [selectedVehicle])

  // Process vehicle data when domainEntries changes
  useEffect(() => {
    if (domainLoading) return
    
    try {
      setLoading(true)
      
      console.log('🚗 Processing vehicles from useDomainCRUD')
      console.log('🔍 domainLoading:', domainLoading, 'entries:', domainEntries?.length)
      
      // Load from useDomainCRUD hook - data is already fetched and managed
      const vehicleData = domainEntries || []
      console.log(`📦 Raw vehicle data from useDomainCRUD:`, vehicleData)
      console.log(`✅ Loaded ${vehicleData.length} vehicles from useDomainCRUD`)

      // Log first item to see structure
      if (vehicleData.length > 0) {
        console.log(`🔍 First item structure:`, vehicleData[0])
        console.log(`🔍 First item type:`, (vehicleData[0] as any)?.type)
        console.log(`🔍 First item make:`, (vehicleData[0] as any)?.make)
        console.log(`🔍 First item metadata:`, vehicleData[0]?.metadata)
      }

      // Transform DomainData entries → Vehicle[] (DataProvider stores data under metadata)
      const mappedVehicles: Vehicle[] = vehicleData
        .map((item: any) => {
          let d = item?.metadata ? item.metadata : item

          // FIX: Handle double-nesting bug (some old entries have metadata.metadata)
          if (d?.metadata && typeof d.metadata === 'object' && Object.keys(d).length === 1) {
            d = d.metadata
          }

          // Heuristic: treat entries with either explicit type=vehicle OR having make/model/year as vehicles
          const isVehicle = d?.type === 'vehicle' || d?.make || d?.model || d?.vehicleName
          if (!isVehicle) return null

          const yearNum = d?.year ? (typeof d.year === 'string' ? parseInt(d.year, 10) : d.year) : new Date().getFullYear()

          const createdAt = item?.createdAt || d?.createdAt || d?.timestamp || new Date().toISOString()

          const vehicle: Vehicle = {
            id: item?.id || d?.id || `veh_${yearNum}_${Math.random().toString(36).slice(2, 8)}`,
            vehicleName: d?.vehicleName || [yearNum, d?.make, d?.model].filter(Boolean).join(' ').trim(),
            make: d?.make || '',
            model: d?.model || '',
            year: yearNum,
            vin: d?.vin || '',
            trim: d?.trim || '',
            drivetrain: d?.drivetrain || '',
            condition: d?.condition || 'Good',
            currentMileage: d?.currentMileage ? Number(d.currentMileage) : (d?.mileage ? Number(d.mileage) : 0),
            estimatedValue: d?.estimatedValue ? Number(d.estimatedValue) : 0,
            lifeExpectancy: d?.lifeExpectancy ? Number(d.lifeExpectancy) : 10,
            monthlyInsurance: d?.monthlyInsurance ? Number(d.monthlyInsurance) : 0,
            location: d?.location || '',
            zipCode: d?.zipCode || '',
            features: d?.features || '',
            exteriorColor: d?.exteriorColor || '',
            interiorColor: d?.interiorColor || '',
            certifiedPreOwned: !!d?.certifiedPreOwned,
            createdAt,
          }

          return vehicle
        })
        .filter(Boolean) as Vehicle[]

      console.log(`🚗 Filtered ${mappedVehicles.length} actual vehicles`)

      setVehicles(mappedVehicles)
      if (mappedVehicles.length > 0) {
        setSelectedVehicle(prev => prev ?? mappedVehicles[0])
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainEntries, domainLoading])

  const loadVehicleData = async (vehicleId: string) => {
    try {
      const domainItems: any[] = domainEntries || []

      const maint = domainItems
        .filter((i: any) => {
          const t = (i?.metadata?.type || '').toLowerCase()
          const isMaint = t === 'maintenance' || t === 'service' || t === 'oil_change'
          const belongs = i?.metadata?.vehicleId === vehicleId || (!i?.metadata?.vehicleId && vehicles.length <= 1)
          return isMaint && belongs
        })
        .sort((a: any, b: any) => (a?.metadata?.nextServiceMileage || 0) - (b?.metadata?.nextServiceMileage || 0))
        .map((i: any) => ({
          id: i.id,
          userId: '',
          vehicleId,
          serviceName: i.metadata?.serviceName || i.metadata?.description || 'Service',
          lastServiceMileage: Number(i.metadata?.lastServiceMileage) || 0,
          lastServiceDate: i.metadata?.lastServiceDate || (i.metadata?.date ? i.metadata.date : undefined),
          nextServiceMileage: Number(i.metadata?.nextServiceMileage) || 0,
          nextServiceDate: i.metadata?.nextServiceDate || undefined,
          cost: Number(i.metadata?.cost) || Number(i.metadata?.amount) || 0,
          status: (i.metadata?.status as Maintenance['status']) || 'good',
          createdAt: i.createdAt || new Date().toISOString(),
        }))

      const vehCosts = domainItems
        .filter((i: any) => {
          const t = (i?.metadata?.type || '').toLowerCase()
          const belongs = i?.metadata?.vehicleId === vehicleId || (!i?.metadata?.vehicleId && vehicles.length <= 1)
          const isCost = t === 'cost' || t === 'expense' || t === 'fuel'
          return isCost && belongs
        })
        .sort((a: any, b: any) => (b?.metadata?.date || '').localeCompare(a?.metadata?.date || ''))
        .map((i: any) => ({
          id: i.id,
          userId: '',
          vehicleId,
          costType: (i.metadata?.costType as Cost['costType']) || ((i?.metadata?.type || '').toLowerCase() === 'expense' ? 'maintenance' : ((i?.metadata?.type || '').toLowerCase() === 'fuel' ? 'fuel' : 'other')),
          amount: Number(i.metadata?.amount) || Number(i.metadata?.cost) || 0,
          date: i.metadata?.date || (i.metadata?.timestamp ? new Date(i.metadata.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          description: i.metadata?.description || i.metadata?.serviceName || '',
          createdAt: i.createdAt || new Date().toISOString(),
        }))
      // Fuel fill-ups (gallons)
      const fuel = domainItems
        .filter((i: any) => {
          const t = (i?.metadata?.type || i?.metadata?.logType || '').toLowerCase()
          const belongs = i?.metadata?.vehicleId === vehicleId || (!i?.metadata?.vehicleId && vehicles.length <= 1)
          return (t === 'fuel' || t === 'gas') && belongs
        })
        .map((i: any) => ({
          id: i.id,
          date: i.metadata?.date || (i.metadata?.timestamp ? new Date(i.metadata.timestamp).toISOString().split('T')[0] : undefined),
          gallons: Number(i.metadata?.gallons || i.metadata?.amount_gallons) || 0,
          cost: Number(i.metadata?.cost || i.metadata?.amount) || 0,
          mileage: Number(i.metadata?.mileage || i.metadata?.odometer) || 0,
        }))
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))

      setFuelFillups(fuel)

      const warr = domainItems
        .filter((i: any) => i?.metadata?.type === 'warranty' && i?.metadata?.vehicleId === vehicleId)
        .map((i: any) => ({
          id: i.id,
          userId: '',
          vehicleId,
          warrantyName: i.metadata?.warrantyName || 'Warranty',
          provider: i.metadata?.provider || '',
          expiryDate: i.metadata?.expiryDate || undefined,
          coverageMiles: Number(i.metadata?.coverageMiles) || 0,
          status: (i.metadata?.status as Warranty['status']) || 'active',
          createdAt: i.createdAt || new Date().toISOString(),
          pdfUrl: i.metadata?.pdfUrl || undefined,
        }))

      setMaintenanceRecords(maint)
      setCosts(vehCosts)
      setWarranties(warr)

      // Mileage logs (support both manual logs and voice AI updates)
      const miles = domainItems
        .filter((i: any) => {
          const t = (i?.metadata?.type || '').toLowerCase()
          const belongs = i?.metadata?.vehicleId === vehicleId || (!i?.metadata?.vehicleId && vehicles.length <= 1)
          return (t === 'mileage_log' || t === 'mileage_update') && belongs
        })
        .map((i: any) => ({
          id: i.id,
          date: i.metadata?.date || (i.metadata?.timestamp ? new Date(i.metadata.timestamp).toISOString().split('T')[0] : undefined),
          odometer: Number((i.metadata as any)?.odometer ?? (i.metadata as any)?.currentMileage) || 0
        }))
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))
      setMileageLogs(miles)
    } catch (error) {
      console.error('Error loading vehicle data:', error)
    }
  }

  const handleFetchAIValue = async () => {
    if (!vehicleForm.year || !vehicleForm.make || !vehicleForm.model) {
      alert('Please enter Year, Make, and Model first')
      return
    }

    setIsFetchingValue(true)
    setAiValuation(null)

    try {
      console.log('🚗 Fetching value with all factors:', vehicleForm)
      
      const response = await fetch('/api/vehicles/fetch-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: vehicleForm.year.toString(),
          make: vehicleForm.make,
          model: vehicleForm.model,
          trim: vehicleForm.trim || undefined,
          drivetrain: vehicleForm.drivetrain || undefined,
          mileage: vehicleForm.currentMileage.toString(),
          condition: vehicleForm.condition || 'Good',
          location: vehicleForm.location || undefined,
          zipCode: vehicleForm.zipCode || undefined,
          features: vehicleForm.features || undefined,
          exteriorColor: vehicleForm.exteriorColor || undefined,
          interiorColor: vehicleForm.interiorColor || undefined,
          certifiedPreOwned: vehicleForm.certifiedPreOwned || false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please refresh the page or sign in again.')
        }
        throw new Error(data.error || 'Failed to fetch value')
      }

      setAiValuation(data.valuation)
      setVehicleForm({
        ...vehicleForm,
        estimatedValue: data.valuation.estimatedValue
      })
      
      alert(`AI Estimated Value: $${data.valuation.estimatedValue.toLocaleString()}\n\n${data.valuation.analysis}`)
    } catch (error: any) {
      console.error('Error fetching AI value:', error)
      alert(error.message || 'Failed to fetch AI value. Please try again.')
    } finally {
      setIsFetchingValue(false)
    }
  }

  const handleAddVehicle = async () => {
    try {
      console.log('💾 handleAddVehicle - saving via useDomainCRUD')
      console.log('💾 Vehicle form data:', vehicleForm)

      // Save via useDomainCRUD (proper error handling and persistence)
      const result = await createEntry({
        id: `veh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: vehicleForm.vehicleName,
        metadata: {
          type: 'vehicle',
          ...vehicleForm
        }
      })

      // Only proceed if creation was successful
      if (result) {
        console.log('✅ Vehicle saved successfully:', result.id)
        
        setIsAddVehicleOpen(false)
        setVehicleForm({
          vehicleName: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          vin: '',
          trim: '',
          drivetrain: '',
          condition: 'Good',
          currentMileage: 0,
          estimatedValue: 0,
          lifeExpectancy: 10,
          monthlyInsurance: 0,
          location: '',
          zipCode: '',
          features: '',
          exteriorColor: '',
          interiorColor: '',
          certifiedPreOwned: false
        })
        setAiValuation(null)
        // Toast is shown by useDomainCRUD, no need for alert
      }
    } catch (error) {
      console.error('Error adding vehicle:', error)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleUpdateVehicle = async () => {
    if (!selectedVehicle) return
    try {
      const result = await updateEntry(selectedVehicle.id, {
        title: vehicleForm.vehicleName,
        metadata: {
          type: 'vehicle',
          ...vehicleForm
        }
      })
      if (result) {
        setIsEditVehicleOpen(false)
        // Toast is shown by useDomainCRUD
      }
    } catch (e) {
      console.error('Failed to update vehicle', e)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleAddMaintenance = async () => {
    if (!selectedVehicle) return

    try {
      let status: Maintenance['status'] = 'good'
      if (maintenanceForm.nextServiceMileage) {
        const milesTillService = maintenanceForm.nextServiceMileage - (selectedVehicle.currentMileage || 0)
        if (milesTillService <= 0) status = 'overdue'
        else if (milesTillService <= 1000) status = 'due_soon'
        else if (milesTillService <= 2000) status = 'upcoming'
      }

      const result = await createEntry({
        title: maintenanceForm.serviceName,
        metadata: {
          type: 'maintenance',
          vehicleId: selectedVehicle.id,
          ...maintenanceForm,
          nextServiceDate: (maintenanceForm as any).nextServiceDate || undefined,
          status,
        }
      })

      if (result) {
        await loadVehicleData(selectedVehicle.id)
        setIsAddMaintenanceOpen(false)
        setMaintenanceForm({
          serviceName: '',
          lastServiceMileage: 0,
          lastServiceDate: '',
          nextServiceMileage: 0,
          cost: 0
        })
        // Toast is shown by useDomainCRUD
      }
    } catch (error) {
      console.error('Error adding maintenance:', error)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleAddCost = async () => {
    if (!selectedVehicle) return

    try {
      const result = await createEntry({
        title: `Expense - ${costForm.costType}`,
        metadata: {
          type: 'cost',
          vehicleId: selectedVehicle.id,
          ...costForm,
        }
      })
      if (result) {
        await loadVehicleData(selectedVehicle.id)
        setIsAddCostOpen(false)
        setCostForm({
          costType: 'fuel',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: ''
        })
        // Toast is shown by useDomainCRUD
      }
    } catch (error) {
      console.error('Error adding cost:', error)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleAddWarranty = async () => {
    if (!selectedVehicle) return

    try {
      let pdfUrl = ''
      
      // Upload PDF to Supabase if provided
      if (warrantyDocFile) {
        try {
          const formData = new FormData()
          formData.append('file', warrantyDocFile)
          formData.append('path', `warranties/${Date.now()}-${warrantyDocFile.name}`)
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          const uploadData = await uploadRes.json()
          if (uploadData.url) {
            pdfUrl = uploadData.url
          }
        } catch (uploadError) {
          console.error('Error uploading warranty PDF:', uploadError)
        }
      }

      const result = await createEntry({
        title: warrantyForm.warrantyName,
        metadata: {
          type: 'warranty',
          vehicleId: selectedVehicle.id,
          ...warrantyForm,
          status: 'active',
          pdfUrl: pdfUrl || undefined
        }
      })
      
      if (result) {
        await loadVehicleData(selectedVehicle.id)
        
        setIsAddWarrantyOpen(false)
        setWarrantyForm({
          warrantyName: '',
          provider: '',
          expiryDate: '',
          coverageMiles: 0
        })
        setWarrantyDocFile(null)
        setWarrantyDocBase64(null)
        setWarrantyPdfUrl(null)
        // Toast is shown by useDomainCRUD
      }
    } catch (error) {
      console.error('Error adding warranty:', error)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleAddMiles = async () => {
    if (!selectedVehicle) return
    try {
      // Save mileage log entry
      const logResult = await createEntry({
        title: `Mileage - ${milesForm.odometer.toLocaleString()} mi`,
        metadata: {
          type: 'mileage_log',
          vehicleId: selectedVehicle.id,
          date: milesForm.date,
          odometer: milesForm.odometer
        }
      })

      if (logResult) {
        // Update vehicle currentMileage if increased
        const newMileage = Math.max(selectedVehicle.currentMileage || 0, milesForm.odometer || 0)
        const updated = {
          vehicleName: selectedVehicle.vehicleName,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          vin: selectedVehicle.vin || '',
          trim: (selectedVehicle as any).trim || '',
          drivetrain: (selectedVehicle as any).drivetrain || '',
          condition: (selectedVehicle as any).condition || 'Good',
          currentMileage: newMileage,
          estimatedValue: selectedVehicle.estimatedValue,
          lifeExpectancy: selectedVehicle.lifeExpectancy,
          monthlyInsurance: selectedVehicle.monthlyInsurance,
          location: (selectedVehicle as any).location || '',
          zipCode: (selectedVehicle as any).zipCode || '',
          features: (selectedVehicle as any).features || '',
          exteriorColor: (selectedVehicle as any).exteriorColor || '',
          interiorColor: (selectedVehicle as any).interiorColor || '',
          certifiedPreOwned: !!(selectedVehicle as any).certifiedPreOwned,
        }
        await updateEntry(selectedVehicle.id, {
          title: updated.vehicleName,
          metadata: {
            type: 'vehicle',
            ...updated
          }
        })

        setIsAddMilesOpen(false)
        setMilesForm({ date: new Date().toISOString().split('T')[0], odometer: 0 })
        // Toast is shown by useDomainCRUD
      }
    } catch (e) {
      console.error('Failed to add mileage', e)
      // Error toast is shown by useDomainCRUD
    }
  }

  // Edit handlers
  const handleEditVehicle = () => {
    if (!selectedVehicle) return
    setEditForm({
      vehicleName: selectedVehicle.vehicleName,
      make: selectedVehicle.make,
      model: selectedVehicle.model,
      year: selectedVehicle.year,
      vin: selectedVehicle.vin,
      currentMileage: selectedVehicle.currentMileage,
      estimatedValue: selectedVehicle.estimatedValue,
      lifeExpectancy: selectedVehicle.lifeExpectancy,
      monthlyInsurance: selectedVehicle.monthlyInsurance,
      location: (selectedVehicle as any).location,
      exteriorColor: (selectedVehicle as any).exteriorColor,
      interiorColor: (selectedVehicle as any).interiorColor
    })
    setIsEditMode(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedVehicle) return
    try {
      const updated = {
        vehicleName: editForm.vehicleName || selectedVehicle.vehicleName,
        make: editForm.make || selectedVehicle.make,
        model: editForm.model || selectedVehicle.model,
        year: editForm.year || selectedVehicle.year,
        vin: editForm.vin || selectedVehicle.vin || '',
        trim: (selectedVehicle as any).trim || '',
        drivetrain: (selectedVehicle as any).drivetrain || '',
        condition: (selectedVehicle as any).condition || 'Good',
        currentMileage: editForm.currentMileage || selectedVehicle.currentMileage,
        estimatedValue: editForm.estimatedValue || selectedVehicle.estimatedValue,
        lifeExpectancy: editForm.lifeExpectancy || selectedVehicle.lifeExpectancy,
        monthlyInsurance: editForm.monthlyInsurance || selectedVehicle.monthlyInsurance,
        location: editForm.location || (selectedVehicle as any).location || '',
        zipCode: (selectedVehicle as any).zipCode || '',
        features: (selectedVehicle as any).features || '',
        exteriorColor: editForm.exteriorColor || (selectedVehicle as any).exteriorColor || '',
        interiorColor: editForm.interiorColor || (selectedVehicle as any).interiorColor || '',
        certifiedPreOwned: !!(selectedVehicle as any).certifiedPreOwned,
      }
      
      const result = await updateEntry(selectedVehicle.id, {
        title: updated.vehicleName,
        metadata: {
          type: 'vehicle',
          ...updated
        }
      })

      if (result) {
        setIsEditMode(false)
        setEditForm({})
        // Toast is shown by useDomainCRUD
      }
    } catch (e) {
      console.error('Failed to update vehicle', e)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditForm({})
  }

  // Delete helpers
  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return
    try {
      const deleted = await removeEntry(selectedVehicle.id)
      if (deleted) {
        setSelectedVehicle(null)
        // Toast is shown by useDomainCRUD
      }
    } catch (e) {
      console.error('Failed to delete vehicle', e)
      // Error toast is shown by useDomainCRUD
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    try {
      const deleted = await removeEntry(id)
      if (deleted && selectedVehicle) {
        await loadVehicleData(selectedVehicle.id)
      }
    } catch (e) {
      console.error('Failed to delete maintenance', e)
    }
  }

  const handleDeleteCost = async (id: string) => {
    try {
      const deleted = await removeEntry(id)
      if (deleted && selectedVehicle) {
        await loadVehicleData(selectedVehicle.id)
      }
    } catch (e) {
      console.error('Failed to delete cost', e)
    }
  }

  const handleDeleteWarranty = async (id: string) => {
    try {
      const deleted = await removeEntry(id)
      if (deleted && selectedVehicle) {
        await loadVehicleData(selectedVehicle.id)
      }
    } catch (e) {
      console.error('Failed to delete warranty', e)
    }
  }

  // Calculate stats
  const calculateStats = () => {
    if (!selectedVehicle) return null

    // Average daily miles from logs
    let avgDailyMiles = 30 // fallback default
    if (mileageLogs.length >= 2) {
      const first = mileageLogs[0]
      const last = mileageLogs[mileageLogs.length - 1]
      const days = Math.max(1, Math.ceil((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)))
      const miles = Math.max(0, last.odometer - first.odometer)
      avgDailyMiles = miles / days
    }

    // Oil change prediction
    const recommendedOilInterval = 5000
    const oilRecords = maintenanceRecords
      .filter(m => (m.serviceName || '').toLowerCase().includes('oil'))
      .sort((a, b) => (b.lastServiceMileage || 0) - (a.lastServiceMileage || 0))
    const lastOil = oilRecords[0]
    const basisMileage = lastOil?.lastServiceMileage || selectedVehicle.currentMileage
    const nextOilMileage = lastOil?.nextServiceMileage || (basisMileage + recommendedOilInterval)
    const milesToNextOil = Math.max(0, nextOilMileage - (selectedVehicle.currentMileage || 0))
    const daysToNextOil = avgDailyMiles > 0 ? Math.ceil(milesToNextOil / avgDailyMiles) : null
    const predictedNextOilDate = daysToNextOil !== null ? new Date(Date.now() + daysToNextOil * 86400000) : null

    const upcomingMaintenance = maintenanceRecords
      .filter(m => m.nextServiceMileage && m.nextServiceMileage > selectedVehicle.currentMileage)
      .sort((a, b) => (a.nextServiceMileage || 0) - (b.nextServiceMileage || 0))

    const nextService = upcomingMaintenance[0]
    const nextServiceIn = nextService?.nextServiceMileage 
      ? nextService.nextServiceMileage - selectedVehicle.currentMileage 
      : null

    const pendingAlerts = maintenanceRecords.filter(
      m => m.status === 'overdue' || m.status === 'due_soon'
    ).length

    const thisYear = new Date().getFullYear()
    const yearStart = new Date(thisYear, 0, 1).toISOString()
    const yearCosts = costs.filter(c => c.date >= yearStart)
    const totalYearCost = yearCosts.reduce((sum, c) => sum + c.amount, 0)
    const monthlyAvg = totalYearCost / (new Date().getMonth() + 1)

    let nextServiceDays = null
    if (nextService?.nextServiceDate) {
      const nextDate = new Date(nextService.nextServiceDate)
      const today = new Date()
      nextServiceDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    const fuelCosts = yearCosts.filter(c => c.costType === 'fuel').reduce((sum, c) => sum + c.amount, 0)
    const maintenanceCosts = yearCosts.filter(c => c.costType === 'maintenance').reduce((sum, c) => sum + c.amount, 0)
    const insuranceCosts = yearCosts.filter(c => c.costType === 'insurance').reduce((sum, c) => sum + c.amount, 0)
    const registrationCosts = yearCosts.filter(c => c.costType === 'registration').reduce((sum, c) => sum + c.amount, 0)
    
    // Compute miles driven THIS YEAR from mileage logs (more accurate than total odometer)
    let milesDrivenThisYear = 0
    if (mileageLogs && mileageLogs.length > 0) {
      const logsYTD = mileageLogs
        .filter(m => (m.date || '') >= yearStart)
        .filter(m => Number.isFinite(m.odometer))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      if (logsYTD.length >= 2) {
        milesDrivenThisYear = Math.max(0, (logsYTD[logsYTD.length - 1].odometer || 0) - (logsYTD[0].odometer || 0))
      }
    }
    // Fallback to deltas vs last 12 months of logs, or 0 if unknown
    if (milesDrivenThisYear === 0 && mileageLogs && mileageLogs.length >= 2) {
      const sorted = [...mileageLogs].filter(m => Number.isFinite(m.odometer)).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      milesDrivenThisYear = Math.max(0, (sorted[sorted.length - 1].odometer || 0) - (sorted[0].odometer || 0))
    }
    const costPerMile = milesDrivenThisYear > 0 ? (totalYearCost / milesDrivenThisYear) : 0

    const maxCost = Math.max(fuelCosts, maintenanceCosts, insuranceCosts, registrationCosts, 1)

    // Salvage recommendation (simple heuristic)
    const last12Start = new Date()
    last12Start.setFullYear(last12Start.getFullYear() - 1)
    const last12Iso = last12Start.toISOString()
    const maintRepair = costs
      .filter(c => (c.date >= last12Iso) && (c.costType === 'maintenance' || c.costType === 'repair'))
      .reduce((s, c) => s + c.amount, 0)
    const value = selectedVehicle.estimatedValue || 0
    const burdenRatio = value > 0 ? maintRepair / value : 0
    const salvageValue = Math.max(500, Math.round(value * 0.2))
    const recommendation = burdenRatio > 0.4 ? 'Replace' : (burdenRatio > 0.25 ? 'Consider Selling' : 'Keep')

    return {
      nextServiceIn,
      pendingAlerts,
      monthlyAvg,
      nextServiceDays,
      totalYTD: totalYearCost,
      costPerMile,
      avgDailyMiles,
      oil: {
        milesToNextOil,
        daysToNextOil,
        nextOilMileage,
        predictedNextOilDate: predictedNextOilDate ? predictedNextOilDate.toISOString() : null,
        recommendedOilInterval
      },
      salvage: {
        maintRepair12m: maintRepair,
        burdenRatio,
        salvageValue,
        recommendation
      },
      breakdown: {
        fuel: { amount: fuelCosts, percentage: (fuelCosts / maxCost) * 100 },
        maintenance: { amount: maintenanceCosts, percentage: (maintenanceCosts / maxCost) * 100 },
        insurance: { amount: insuranceCosts, percentage: (insuranceCosts / maxCost) * 100 },
        registration: { amount: registrationCosts, percentage: (registrationCosts / maxCost) * 100 }
      }
    }
  }

  const stats = selectedVehicle ? calculateStats() : null

  // ===== Charts Data (Costs + Mileage per month) =====
  const monthlyCostData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const c of costs) {
      const month = (c.date || '').slice(0, 7) || new Date().toISOString().slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + (Number(c.amount) || 0)
    }
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [costs])

  const monthlyFuelCostData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const c of costs.filter(c => c.costType === 'fuel')) {
      const month = (c.date || '').slice(0, 7) || new Date().toISOString().slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + (Number(c.amount) || 0)
    }
    return Object.entries(byMonth)
      .map(([month, fuel]) => ({ month, fuel }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [costs])

  const monthlyFuelGallonsData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const f of fuelFillups) {
      const month = (f.date || '').slice(0, 7) || new Date().toISOString().slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + (Number(f.gallons) || 0)
    }
    return Object.entries(byMonth)
      .map(([month, gallons]) => ({ month, gallons }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [fuelFillups])

  const milesPerMonthData = useMemo(() => {
    if (!mileageLogs || mileageLogs.length === 0) return [] as Array<{ month: string; miles: number }>
    const byMonth: Record<string, { min: number; max: number }> = {}
    const sorted = [...mileageLogs].filter(m => m.date && Number.isFinite(m.odometer)).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    for (const m of sorted) {
      const month = (m.date || '').slice(0, 7)
      if (!month) continue
      if (!byMonth[month]) byMonth[month] = { min: m.odometer, max: m.odometer }
      byMonth[month].min = Math.min(byMonth[month].min, m.odometer)
      byMonth[month].max = Math.max(byMonth[month].max, m.odometer)
    }
    return Object.entries(byMonth)
      .map(([month, { min, max }]) => ({ month, miles: Math.max(0, (max || 0) - (min || 0)) }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [mileageLogs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-6">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center p-4 bg-blue-900/20 rounded-full mb-4">
            <Car className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Yet</h3>
          <p className="text-gray-400 mb-4">
            Start tracking your vehicles by adding your first one
          </p>
          <Button onClick={() => setIsAddVehicleOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Vehicle
          </Button>
        </div>

        {/* Add Vehicle Dialog */}
        <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a202c] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Vehicle</DialogTitle>
              <DialogDescription className="text-gray-400">Add a new vehicle to track</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label className="text-gray-300">Vehicle Name *</Label>
                <Input
                  value={vehicleForm.vehicleName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                  placeholder="2022 Tesla Model 3"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Make *</Label>
                <Input
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  placeholder="Tesla"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Model *</Label>
                <Input
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Model 3"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Year *</Label>
                <Input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">VIN</Label>
                <Input
                  value={vehicleForm.vin}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                  placeholder="5YJ3E1EA3NF123456"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Trim Level</Label>
                <Input
                  value={vehicleForm.trim}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })}
                  placeholder="e.g., LX, EX-L, Touring"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Drivetrain</Label>
                <select
                  value={vehicleForm.drivetrain}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, drivetrain: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-[#0f1419] border border-gray-700 text-white"
                >
                  <option value="">Select</option>
                  <option value="FWD">FWD (Front-Wheel Drive)</option>
                  <option value="RWD">RWD (Rear-Wheel Drive)</option>
                  <option value="AWD">AWD (All-Wheel Drive)</option>
                  <option value="4WD">4WD (Four-Wheel Drive)</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Condition</Label>
                <select
                  value={vehicleForm.condition}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, condition: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-[#0f1419] border border-gray-700 text-white"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Current Mileage</Label>
                <Input
                  type="number"
                  value={vehicleForm.currentMileage}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, currentMileage: parseInt(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Location (City, State)</Label>
                <Input
                  value={vehicleForm.location}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, location: e.target.value })}
                  placeholder="e.g., Los Angeles, CA"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">ZIP Code</Label>
                <Input
                  value={vehicleForm.zipCode}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, zipCode: e.target.value })}
                  placeholder="90210"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-300">Features (Optional)</Label>
                <Input
                  value={vehicleForm.features}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, features: e.target.value })}
                  placeholder="e.g., Navigation, Sunroof, Leather Seats"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Exterior Color</Label>
                <Input
                  value={vehicleForm.exteriorColor}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, exteriorColor: e.target.value })}
                  placeholder="e.g., White"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Interior Color</Label>
                <Input
                  value={vehicleForm.interiorColor}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, interiorColor: e.target.value })}
                  placeholder="e.g., Black"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emptyStateCPO"
                  checked={vehicleForm.certifiedPreOwned}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, certifiedPreOwned: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-700"
                />
                <Label htmlFor="emptyStateCPO" className="text-gray-300 cursor-pointer">
                  Certified Pre-Owned (CPO) - Adds 5-10% value
                </Label>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-300">Estimated Value ($)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={vehicleForm.estimatedValue}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, estimatedValue: parseFloat(e.target.value) })}
                    className="bg-[#0f1419] border-gray-700 text-white flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleFetchAIValue}
                    disabled={!vehicleForm.year || !vehicleForm.make || !vehicleForm.model || isFetchingValue}
                    className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                  >
                    {isFetchingValue ? 'Fetching...' : '✨ AI Fetch Value'}
                  </Button>
                </div>
                {aiValuation && (
                  <p className="text-xs text-gray-400 mt-1">
                    Range: ${aiValuation.valueLow?.toLocaleString()} - ${aiValuation.valueHigh?.toLocaleString()} • {aiValuation.confidence} confidence
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)} className="border-gray-700 text-gray-300">
                Cancel
              </Button>
              <Button onClick={handleAddVehicle} disabled={!vehicleForm.vehicleName || !vehicleForm.make || !vehicleForm.model} className="bg-blue-600 hover:bg-blue-700">
                Add Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Header */}
      <div className="bg-[#1a202c] border-b border-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AutoTrack Pro</h1>
                <p className="text-sm text-gray-400">Complete Vehicle Management</p>
              </div>
            </div>
            <Button onClick={() => setIsAddVehicleOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-6 rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Add Vehicle
            </Button>
          </div>

          {/* Vehicle Cards - Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all flex-shrink-0 min-w-[300px] ${
                  selectedVehicle?.id === vehicle.id
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-[#0f1419] border-gray-700 hover:border-gray-600'
                }`}
              >
                <Car className="w-8 h-8 text-gray-400" />
                <div className="text-left">
                  <div className="font-semibold text-white">{vehicle.vehicleName}</div>
                  <div className="text-sm text-gray-400">{vehicle.currentMileage?.toLocaleString() || 0} miles</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-8 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Car className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'costs'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Costs
            </button>
            <button
              onClick={() => setActiveTab('warranties')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'warranties'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              Warranties
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && selectedVehicle && (
          <div className="space-y-6">
            {/* Main Vehicle Card */}
            <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedVehicle.vehicleName}</h2>
                    {selectedVehicle.vin && (
                      <p className="text-gray-400">VIN: {selectedVehicle.vin}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setVehicleForm({
                          vehicleName: selectedVehicle.vehicleName,
                          make: selectedVehicle.make,
                          model: selectedVehicle.model,
                          year: selectedVehicle.year,
                          vin: selectedVehicle.vin || '',
                          trim: (selectedVehicle as any).trim || '',
                          drivetrain: (selectedVehicle as any).drivetrain || '',
                          condition: (selectedVehicle as any).condition || 'Good',
                          currentMileage: selectedVehicle.currentMileage,
                          estimatedValue: selectedVehicle.estimatedValue,
                          lifeExpectancy: selectedVehicle.lifeExpectancy,
                          monthlyInsurance: selectedVehicle.monthlyInsurance,
                          location: (selectedVehicle as any).location || '',
                          zipCode: (selectedVehicle as any).zipCode || '',
                          features: (selectedVehicle as any).features || '',
                          exteriorColor: (selectedVehicle as any).exteriorColor || '',
                          interiorColor: (selectedVehicle as any).interiorColor || '',
                          certifiedPreOwned: !!(selectedVehicle as any).certifiedPreOwned,
                        })
                        setIsEditVehicleOpen(true)
                      }}
                      className="border-gray-700 text-gray-300"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteVehicle}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Edit / Save Buttons */}
                <div className="flex justify-end gap-2 mb-4">
                  {isEditMode ? (
                    <>
                      <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline">
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditVehicle} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Edit className="h-4 w-4 mr-2" /> Edit Vehicle
                    </Button>
                  )}
                </div>

                {/* Stats Grid */}
                {isEditMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400 text-sm">Vehicle Name</Label>
                      <Input
                        value={editForm.vehicleName || ''}
                        onChange={(e) => setEditForm({ ...editForm, vehicleName: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Make</Label>
                      <Input
                        value={editForm.make || ''}
                        onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Model</Label>
                      <Input
                        value={editForm.model || ''}
                        onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Year</Label>
                      <Input
                        type="number"
                        value={editForm.year || ''}
                        onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">VIN</Label>
                      <Input
                        value={editForm.vin || ''}
                        onChange={(e) => setEditForm({ ...editForm, vin: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Current Mileage</Label>
                      <Input
                        type="number"
                        value={editForm.currentMileage || ''}
                        onChange={(e) => setEditForm({ ...editForm, currentMileage: parseInt(e.target.value) })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Estimated Value ($)</Label>
                      <Input
                        type="number"
                        value={editForm.estimatedValue || ''}
                        onChange={(e) => setEditForm({ ...editForm, estimatedValue: parseInt(e.target.value) })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Life Expectancy (years)</Label>
                      <Input
                        type="number"
                        value={editForm.lifeExpectancy || ''}
                        onChange={(e) => setEditForm({ ...editForm, lifeExpectancy: parseInt(e.target.value) })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Monthly Insurance ($)</Label>
                      <Input
                        type="number"
                        value={editForm.monthlyInsurance || ''}
                        onChange={(e) => setEditForm({ ...editForm, monthlyInsurance: parseInt(e.target.value) })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Location</Label>
                      <Input
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Exterior Color</Label>
                      <Input
                        value={editForm.exteriorColor || ''}
                        onChange={(e) => setEditForm({ ...editForm, exteriorColor: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Interior Color</Label>
                      <Input
                        value={editForm.interiorColor || ''}
                        onChange={(e) => setEditForm({ ...editForm, interiorColor: e.target.value })}
                        className="bg-[#0f1419] border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0f1419] rounded-2xl p-6">
                      <div className="text-gray-400 text-sm mb-2">Current Mileage</div>
                      <div className="text-4xl font-bold text-white">
                        {selectedVehicle.currentMileage.toLocaleString()}
                      </div>
                      <div className="text-xl text-gray-400 mt-1">mi</div>
                    </div>
                    <div className="bg-[#0f1419] rounded-2xl p-6">
                      <div className="text-gray-400 text-sm mb-2">Estimated Value</div>
                      <div className="text-4xl font-bold text-white">
                        ${selectedVehicle.estimatedValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#0f1419] rounded-2xl p-6">
                      <div className="text-gray-400 text-sm mb-2">Life Expectancy</div>
                      <div className="text-4xl font-bold text-white">{selectedVehicle.lifeExpectancy}</div>
                      <div className="text-xl text-gray-400 mt-1">years</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-4 gap-4">
              {/* Next Oil Change */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Droplet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-white/90">Next Oil</div>
                      <div className="text-sm text-white/90">Change</div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white">
                    {stats?.oil?.milesToNextOil ? stats.oil.milesToNextOil.toLocaleString() : '-'}
                  </div>
                  {stats?.oil?.milesToNextOil && <div className="text-xl text-white/90 mt-1">mi</div>}
                  <div className="text-white/90 mt-3 text-sm">
                    {stats?.oil?.predictedNextOilDate ? `~ ${new Date(stats.oil.predictedNextOilDate).toLocaleDateString()} (${stats.oil.daysToNextOil} days)` : 'Add mileage logs to predict date'}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-white/20 hover:bg-white/30"
                      onClick={() => {
                        if (!selectedVehicle) return
                        const current = selectedVehicle.currentMileage || 0
                        const interval = stats?.oil?.recommendedOilInterval || 5000
                        
                        // Find the last oil change record to pre-populate the form
                        const lastOilChange = maintenanceRecords
                          .filter(m => (m.serviceName || '').toLowerCase().includes('oil'))
                          .sort((a, b) => (b.lastServiceMileage || 0) - (a.lastServiceMileage || 0))[0]
                        
                        // If there's a previous oil change, use its next service mileage as the basis
                        // Otherwise, use current mileage
                        const lastServiceMileage = lastOilChange?.nextServiceMileage || current
                        
                        setMaintenanceForm({
                          serviceName: 'Oil Change',
                          lastServiceMileage: lastServiceMileage,
                          lastServiceDate: new Date().toISOString().split('T')[0],
                          nextServiceMileage: lastServiceMileage + interval,
                          cost: 0
                        } as any)
                        setIsAddMaintenanceOpen(true)
                      }}
                    >
                      Log Oil Change
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/30 text-white/90" onClick={() => setIsAddMilesOpen(true)}>Log Miles</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Alerts */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-white/90">Pending</div>
                      <div className="text-sm text-white/90">Alerts</div>
                    </div>
                  </div>
                  <div className="text-6xl font-bold text-white">{stats?.pendingAlerts || 0}</div>
                </CardContent>
              </Card>

              {/* Monthly Cost Avg */}
              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-white/90">Monthly Cost</div>
                      <div className="text-sm text-white/90">Avg</div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white">
                    ${Math.round(stats?.monthlyAvg || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Next Service */}
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-white/90">Next</div>
                      <div className="text-sm text-white/90">Service</div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-white">
                    {stats?.nextServiceDays !== null ? stats?.nextServiceDays : (stats?.oil?.daysToNextOil ?? '-')}
                  </div>
                  {stats?.nextServiceDays !== null && <div className="text-xl text-white/90 mt-1">days</div>}
                </CardContent>
              </Card>
            </div>

            {/* Active Alerts & Recent Maintenance */}
            <div className="grid grid-cols-2 gap-6">
              {/* Recall Alerts */}
              <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-red-500" />
                    <h3 className="text-xl font-bold text-white">Recall Alerts ({recalls.length})</h3>
                  </div>
                  <div className="space-y-4">
                    {recalls.slice(0, 3).map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl bg-red-900/20 border border-red-700">
                        <div className="font-semibold text-white mb-1">{r.severity || 'Recall'}</div>
                        <div className="text-sm text-gray-300">{r.description}</div>
                        {r.date && <div className="text-xs text-gray-400 mt-1">Issued: {new Date(r.date).toLocaleDateString()}</div>}
                      </div>
                    ))}
                    {recalls.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No recalls found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-white">Active Alerts ({stats?.pendingAlerts || 0})</h3>
                  </div>
                  <div className="space-y-4">
                    {maintenanceRecords
                      .filter(m => m.status === 'due_soon' || m.status === 'overdue')
                      .map((record) => (
                        <div
                          key={record.id}
                          className={`p-4 rounded-2xl ${
                            record.status === 'due_soon'
                              ? 'bg-yellow-900/20 border border-yellow-700'
                              : 'bg-blue-900/20 border border-blue-700'
                          }`}
                        >
                          <div className="font-semibold text-white mb-2">{record.serviceName}</div>
                          <div className="text-sm text-gray-400">
                            {record.nextServiceMileage && selectedVehicle && 
                              `Due in ${(record.nextServiceMileage - selectedVehicle.currentMileage).toLocaleString()} miles`
                            }
                          </div>
                        </div>
                      ))
                    }
                    {(!maintenanceRecords || maintenanceRecords.filter(m => m.status === 'due_soon' || m.status === 'overdue').length === 0) && (
                      <p className="text-center text-gray-500 py-8">No active alerts</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Maintenance */}
              <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Wrench className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-white">Recent Maintenance</h3>
                  </div>
                  <div className="space-y-4">
                    {maintenanceRecords.slice(0, 3).map((record) => (
                      <div key={record.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{record.serviceName}</div>
                          <div className="text-sm text-gray-400">
                            {record.lastServiceDate ? new Date(record.lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </div>
                        </div>
                        <div className="text-green-400 font-semibold">
                          ${record.cost}
                        </div>
                      </div>
                    ))}
                    {maintenanceRecords.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No maintenance records yet</p>
                    )}
                    {/* Salvage Recommendation */}
                    <div className="mt-6 p-4 rounded-2xl bg-[#0f1419] border border-gray-800">
                      <div className="text-sm text-gray-400 mb-1">Ownership Insight</div>
                      <div className="text-white font-semibold">
                        {stats?.salvage?.recommendation} • Salvage est. ${stats?.salvage?.salvageValue?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">12m maint/repairs: ${Math.round(stats?.salvage?.maintRepair12m || 0).toLocaleString()} ({Math.round((stats?.salvage?.burdenRatio || 0) * 100)}% of value)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && selectedVehicle && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Maintenance - {selectedVehicle.vehicleName}</h2>
              <Button onClick={() => setIsAddMaintenanceOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-6 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add Maintenance
              </Button>
            </div>

            <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Maintenance Schedule</h3>
              <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-6 rounded-2xl bg-[#0f1419] hover:bg-[#131a21] transition-colors">
                      <div>
                        <h4 className="font-semibold text-lg text-white mb-2">{record.serviceName}</h4>
                        <p className="text-sm text-gray-400">
                          Last: {record.lastServiceMileage?.toLocaleString() || 'N/A'} mi
                          {record.nextServiceMileage && ` • Next: ${record.nextServiceMileage.toLocaleString()} mi`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                        className={`px-4 py-2 ${
                          record.status === 'good' ? 'bg-green-600/20 text-green-400 border-green-600' :
                          record.status === 'upcoming' ? 'bg-blue-600/20 text-blue-400 border-blue-600' :
                          record.status === 'due_soon' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600' :
                          'bg-red-600/20 text-red-400 border-red-600'
                        }`}
                      >
                        {record.status === 'good' ? 'Good' :
                         record.status === 'upcoming' ? 'Upcoming' :
                         record.status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                        </Badge>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteMaintenance(record.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {maintenanceRecords.length === 0 && (
                    <p className="text-center text-gray-500 py-12">
                      No maintenance records yet. Click "Add Maintenance" to start tracking!
                    </p>
                  )}
              </div>
              {/* Simple calendar grid (next 30 days) */}
              <div className="mt-8">
                <h4 className="text-xl font-semibold text-white mb-4">Next 30 Days</h4>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const date = new Date()
                    date.setDate(date.getDate() + idx)
                    const iso = date.toISOString().split('T')[0]
                    const dayEvents = maintenanceRecords.filter(m => m.nextServiceDate === iso)
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => {
                          setMaintenanceForm({
                            serviceName: '',
                            lastServiceMileage: selectedVehicle?.currentMileage || 0,
                            lastServiceDate: new Date().toISOString().split('T')[0],
                            nextServiceMileage: (selectedVehicle?.currentMileage || 0) + (stats?.oil?.recommendedOilInterval || 5000),
                            cost: 0,
                            nextServiceDate: iso
                          } as any)
                          setIsAddMaintenanceOpen(true)
                        }}
                        className={`text-left p-3 rounded-xl bg-[#0f1419] border ${dayEvents.length ? 'border-blue-700' : 'border-gray-800'}`}
                      >
                        <div className="text-xs text-gray-500">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        {dayEvents.map(ev => (
                          <div key={ev.id} className="mt-1 text-xs text-blue-300 truncate">{ev.serviceName}</div>
                        ))}
                      </button>
                    )
                  })}
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && selectedVehicle && stats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Costs - {selectedVehicle.vehicleName}</h2>
              <Button onClick={() => setIsAddCostOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-6 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add Expense
              </Button>
            </div>

            {/* Cost Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-8">
                  <div className="text-sm text-white/90 mb-2">Total Spent (YTD)</div>
                  <div className="text-5xl font-bold text-white">
                    ${Math.round(stats.totalYTD).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-8">
                  <div className="text-sm text-white/90 mb-2">Monthly Average</div>
                  <div className="text-5xl font-bold text-white">
                    ${Math.round(stats.monthlyAvg)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 rounded-3xl shadow-xl">
                <CardContent className="p-8">
                  <div className="text-sm text-white/90 mb-2">Cost per Mile</div>
                  <div className="text-5xl font-bold text-white">
                    ${stats.costPerMile.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown */}
            <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Cost Breakdown</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Fuel</span>
                      <span className="text-white font-bold text-xl">
                        ${Math.round(stats.breakdown.fuel.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${stats.breakdown.fuel.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Maintenance</span>
                      <span className="text-white font-bold text-xl">
                        ${Math.round(stats.breakdown.maintenance.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${stats.breakdown.maintenance.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Insurance</span>
                      <span className="text-white font-bold text-xl">
                        ${Math.round(stats.breakdown.insurance.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${stats.breakdown.insurance.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Registration</span>
                      <span className="text-white font-bold text-xl">
                        ${Math.round(stats.breakdown.registration.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${stats.breakdown.registration.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <h4 className="text-xl font-semibold text-white mb-4">Recent Expenses</h4>
                  <div className="space-y-3">
                    {costs.slice(0, 6).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f1419]">
                        <div className="text-gray-300 text-sm">
                          <div className="font-medium text-white">{c.costType}</div>
                          <div>{new Date(c.date).toLocaleDateString()} {c.description ? `• ${c.description}` : ''}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-green-400 font-semibold">${c.amount.toLocaleString()}</div>
                          <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteCost(c.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                    {costs.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No expenses yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Charts */}
            <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Monthly Trends</h3>
                {monthlyCostData.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No cost data yet</p>
                )}
                {monthlyCostData.length > 0 && (
                  <div className="space-y-8">
                    <LogChartRenderer
                      data={monthlyCostData}
                      chartType="bar"
                      xKey="month"
                      yKey="total"
                      title="Total Cost per Month"
                      description="All vehicle expenses grouped by month"
                      valuePrefix="$"
                    />
                    {monthlyFuelCostData.length > 0 && (
                      <LogChartRenderer
                        data={monthlyFuelCostData}
                        chartType="line"
                        xKey="month"
                        yKey="fuel"
                        title="Fuel Cost per Month"
                        description="Gas spending over time"
                        valuePrefix="$"
                      />
                    )}
                    {monthlyFuelGallonsData.length > 0 && (
                      <LogChartRenderer
                        data={monthlyFuelGallonsData}
                        chartType="bar"
                        xKey="month"
                        yKey="gallons"
                        title="Fuel Gallons per Month"
                        description="Total gallons filled each month"
                        valueSuffix=" gal"
                      />
                    )}
                    {milesPerMonthData.length > 0 && (
                      <LogChartRenderer
                        data={milesPerMonthData}
                        chartType="bar"
                        xKey="month"
                        yKey="miles"
                        title="Miles Driven per Month"
                        description="Miles added to the odometer each month"
                        valueSuffix=" mi"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warranties Tab */}
        {activeTab === 'warranties' && selectedVehicle && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Warranties - {selectedVehicle.vehicleName}</h2>
              <Button onClick={() => setIsAddWarrantyOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-6 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add Warranty
              </Button>
            </div>

            <Card className="bg-[#1a202c] border-gray-800 rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Active Warranties</h3>
                <div className="space-y-4">
                  {warranties.map((warranty) => {
                    const isExpired = warranty.expiryDate && new Date(warranty.expiryDate) < new Date()
                    return (
                      <Card key={warranty.id} className="bg-[#0f1419] border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-lg text-white">{warranty.warrantyName}</h4>
                              <p className="text-sm text-gray-400">{warranty.provider}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {warranty.pdfUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300"
                                  onClick={() => window.open(warranty.pdfUrl, '_blank')}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View PDF
                                </Button>
                              )}
                              <Badge className={
                                isExpired
                                  ? 'bg-red-600/20 text-red-400 border-red-600'
                                  : 'bg-green-600/20 text-green-400 border-green-600'
                              }>
                                {isExpired ? 'Expired' : 'Active'}
                              </Badge>
                              <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteWarranty(warranty.id)}>Delete</Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Expires</div>
                              <div className="font-medium text-white">
                                {warranty.expiryDate 
                                  ? new Date(warranty.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  : 'N/A'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Coverage</div>
                              <div className="font-medium text-white">
                                {warranty.coverageMiles 
                                  ? `${warranty.coverageMiles.toLocaleString()} miles`
                                  : 'N/A'
                                }
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {warranties.length === 0 && (
                    <p className="text-center text-gray-500 py-12">
                      No warranties added yet. Click "Add Warranty" to start tracking!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="max-w-2xl bg-[#1a202c] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Vehicle</DialogTitle>
            <DialogDescription className="text-gray-400">Add a new vehicle to track</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label className="text-gray-300">Vehicle Name *</Label>
              <Input
                value={vehicleForm.vehicleName}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                placeholder="2022 Tesla Model 3"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Make *</Label>
              <Input
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                placeholder="Tesla"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Model *</Label>
              <Input
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                placeholder="Model 3"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Year *</Label>
              <Input
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">VIN (Optional)</Label>
              <Input
                value={vehicleForm.vin}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                placeholder="5YJ3E1EA3NF123456"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Trim Level (Optional)</Label>
              <Input
                value={vehicleForm.trim}
                onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })}
                placeholder="e.g., LX, EX-L, Touring"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Drivetrain (Optional)</Label>
              <select
                value={vehicleForm.drivetrain}
                onChange={(e) => setVehicleForm({ ...vehicleForm, drivetrain: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#0f1419] border border-gray-700 text-white"
              >
                <option value="">Select</option>
                <option value="FWD">FWD (Front-Wheel Drive)</option>
                <option value="RWD">RWD (Rear-Wheel Drive)</option>
                <option value="AWD">AWD (All-Wheel Drive)</option>
                <option value="4WD">4WD (Four-Wheel Drive)</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-300">Condition (Optional)</Label>
              <select
                value={vehicleForm.condition}
                onChange={(e) => setVehicleForm({ ...vehicleForm, condition: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#0f1419] border border-gray-700 text-white"
              >
                <option value="Excellent">Excellent</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-300">Current Mileage (Optional)</Label>
              <Input
                type="number"
                value={vehicleForm.currentMileage}
                onChange={(e) => setVehicleForm({ ...vehicleForm, currentMileage: parseInt(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Location (Optional)</Label>
              <Input
                value={vehicleForm.location}
                onChange={(e) => setVehicleForm({ ...vehicleForm, location: e.target.value })}
                placeholder="e.g., Los Angeles, CA"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">ZIP Code (Optional)</Label>
              <Input
                value={vehicleForm.zipCode}
                onChange={(e) => setVehicleForm({ ...vehicleForm, zipCode: e.target.value })}
                placeholder="90210"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Features (Optional)</Label>
              <Input
                value={vehicleForm.features}
                onChange={(e) => setVehicleForm({ ...vehicleForm, features: e.target.value })}
                placeholder="e.g., Navigation, Sunroof, Leather Seats"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Exterior Color (Optional)</Label>
              <Input
                value={vehicleForm.exteriorColor}
                onChange={(e) => setVehicleForm({ ...vehicleForm, exteriorColor: e.target.value })}
                placeholder="e.g., White"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Interior Color (Optional)</Label>
              <Input
                value={vehicleForm.interiorColor}
                onChange={(e) => setVehicleForm({ ...vehicleForm, interiorColor: e.target.value })}
                placeholder="e.g., Black"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="certifiedPreOwned"
                checked={vehicleForm.certifiedPreOwned}
                onChange={(e) => setVehicleForm({ ...vehicleForm, certifiedPreOwned: e.target.checked })}
                className="h-4 w-4 rounded border-gray-700"
              />
              <Label htmlFor="certifiedPreOwned" className="text-gray-300 cursor-pointer">
                Certified Pre-Owned (CPO) - Adds 5-10% value
              </Label>
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Estimated Value ($)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={vehicleForm.estimatedValue}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, estimatedValue: parseFloat(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white flex-1"
                />
                <Button
                  type="button"
                  onClick={handleFetchAIValue}
                  disabled={!vehicleForm.year || !vehicleForm.make || !vehicleForm.model || isFetchingValue}
                  className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                >
                  {isFetchingValue ? 'Fetching...' : '✨ AI Fetch Value'}
                </Button>
              </div>
              {aiValuation && (
                <p className="text-xs text-gray-400 mt-1">
                  Range: ${aiValuation.valueLow?.toLocaleString()} - ${aiValuation.valueHigh?.toLocaleString()} • {aiValuation.confidence} confidence
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} disabled={!vehicleForm.vehicleName || !vehicleForm.make || !vehicleForm.model} className="bg-blue-600 hover:bg-blue-700">
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
        <DialogContent className="max-w-lg bg-[#1a202c] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Maintenance Record</DialogTitle>
            <DialogDescription className="text-gray-400">Track maintenance for {selectedVehicle?.vehicleName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-300">Service Name *</Label>
              <Input
                value={maintenanceForm.serviceName}
                onChange={(e) => updateMaintenanceForm('serviceName', e.target.value)}
                placeholder="Oil Change"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Last Service (mi)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.lastServiceMileage}
                  onChange={(e) => updateMaintenanceForm('lastServiceMileage', parseInt(e.target.value) || 0)}
                  placeholder={selectedVehicle?.currentMileage?.toString() || '0'}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {selectedVehicle?.currentMileage || 0} mi</p>
              </div>
              <div>
                <Label className="text-gray-300">Next Service (mi)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.nextServiceMileage}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextServiceMileage: parseInt(e.target.value) || 0 })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
                {maintenanceForm.nextServiceMileage > 0 && selectedVehicle && (
                  <p className="text-xs text-gray-500 mt-1">
                    {maintenanceForm.nextServiceMileage - (selectedVehicle.currentMileage || 0)} miles from now
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Cost ($)</Label>
              <Input
                type="number"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Next Service Date (Optional)</Label>
              <Input
                type="date"
                value={(maintenanceForm as any).nextServiceDate || ''}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextServiceDate: (e.target as any).value } as any)}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaintenanceOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddMaintenance} disabled={!maintenanceForm.serviceName} className="bg-blue-600 hover:bg-blue-700">
              Add Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={isAddCostOpen} onOpenChange={setIsAddCostOpen}>
        <DialogContent className="max-w-lg bg-[#1a202c] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Expense</DialogTitle>
            <DialogDescription className="text-gray-400">Track costs for {selectedVehicle?.vehicleName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-300">Cost Type *</Label>
              <Select value={costForm.costType} onValueChange={(value) => setCostForm({ ...costForm, costType: value as Cost['costType'] })}>
                <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a202c] border-gray-700">
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Amount ($) *</Label>
                <Input
                  type="number"
                  value={costForm.amount}
                  onChange={(e) => setCostForm({ ...costForm, amount: parseFloat(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Date *</Label>
                <Input
                  type="date"
                  value={costForm.date}
                  onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Input
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                placeholder="Shell Gas Station"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCostOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddCost} disabled={!costForm.amount} className="bg-blue-600 hover:bg-blue-700">
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Warranty Dialog */}
      <Dialog open={isAddWarrantyOpen} onOpenChange={setIsAddWarrantyOpen}>
        <DialogContent className="max-w-lg bg-[#1a202c] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Warranty</DialogTitle>
            <DialogDescription className="text-gray-400">Add warranty coverage for {selectedVehicle?.vehicleName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-gray-300">Warranty Name *</Label>
              <Input
                value={warrantyForm.warrantyName}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, warrantyName: e.target.value })}
                placeholder="Powertrain Warranty"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Provider *</Label>
              <Input
                value={warrantyForm.provider}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, provider: e.target.value })}
                placeholder="Ford Motor Company"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Warranty Document (PDF/Image)</Label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  setWarrantyDocFile(file)
                  setWarrantyOcrLoading(true)
                  
                  const reader = new FileReader()
                  reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1]
                    setWarrantyDocBase64(base64)
                    
                    // Extract text using OCR
                    try {
                      const extractRes = await fetch('/api/extract-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          fileBase64: base64,
                          fileType: file.type 
                        })
                      })
                      
                      const extractData = await extractRes.json()
                      const text = extractData.text || ''
                      
                      console.log('📄 Extracted warranty text:', text)
                      
                      // Auto-fill warranty fields using AI
                      const parseRes = await fetch('/api/parse-warranty', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                      })
                      
                      const parseData = await parseRes.json()
                      
                      if (parseData.success) {
                        setWarrantyForm(prev => ({
                          ...prev,
                          warrantyName: parseData.warrantyName || prev.warrantyName,
                          provider: parseData.provider || prev.provider,
                          expiryDate: parseData.expiryDate || prev.expiryDate,
                          coverageMiles: parseData.coverageMiles || prev.coverageMiles
                        }))
                        
                        alert('✅ Warranty details extracted and auto-filled!')
                      }
                    } catch (error) {
                      console.error('Error extracting warranty text:', error)
                      alert('Could not extract text from document. Please fill fields manually.')
                    } finally {
                      setWarrantyOcrLoading(false)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
                className="block w-full text-sm text-gray-300 file:bg-[#0f1419] file:border-gray-700 file:text-gray-300 file:rounded-lg file:px-4 file:py-2 file:hover:bg-[#1a202c] file:cursor-pointer"
              />
              {warrantyOcrLoading && (
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Extracting warranty details...
                </p>
              )}
              {warrantyDocBase64 && !warrantyOcrLoading && (
                <p className="text-xs text-green-400 mt-2">
                  ✅ Document attached ({Math.round(warrantyDocBase64.length/1024)} KB)
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Expiry Date</Label>
                <Input
                  type="date"
                  value={warrantyForm.expiryDate}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, expiryDate: e.target.value })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Coverage (miles)</Label>
                <Input
                  type="number"
                  value={warrantyForm.coverageMiles}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, coverageMiles: parseInt(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWarrantyOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddWarranty} disabled={!warrantyForm.warrantyName || !warrantyForm.provider} className="bg-blue-600 hover:bg-blue-700">
              Add Warranty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Mileage Dialog */}
      <Dialog open={isAddMilesOpen} onOpenChange={setIsAddMilesOpen}>
        <DialogContent className="max-w-sm bg-[#1a202c] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Log Miles</DialogTitle>
            <DialogDescription className="text-gray-400">Update odometer for {selectedVehicle?.vehicleName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-gray-300">Date</Label>
              <Input
                type="date"
                value={milesForm.date}
                onChange={(e) => setMilesForm({ ...milesForm, date: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Odometer (mi)</Label>
              <Input
                type="number"
                value={milesForm.odometer}
                onChange={(e) => setMilesForm({ ...milesForm, odometer: parseInt(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMilesOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddMiles} disabled={!milesForm.odometer} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

