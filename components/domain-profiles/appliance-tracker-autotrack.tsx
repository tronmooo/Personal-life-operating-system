'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DomainBackButton } from '@/components/ui/domain-back-button'
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
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { calculateApplianceCurrentValue } from '@/lib/utils/unified-financial-calculator'
import {
  Refrigerator,
  Plus,
  AlertCircle,
  DollarSign,
  Calendar,
  Wrench,
  Shield,
  FileText,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
  X,
  TrendingDown,
  Clock,
  Receipt
} from 'lucide-react'

interface Appliance {
  id: string
  user_id: string
  name: string
  category: string
  brand?: string
  model_number?: string
  serial_number?: string
  purchase_date: string
  purchase_price?: number
  location?: string
  expected_lifespan?: number
  notes?: string
  created_at: string
  updated_at: string
}

interface Maintenance {
  id: string
  appliance_id: string
  service_type: string
  date: string
  provider?: string
  cost: number
  notes?: string
  created_at: string
}

interface Warranty {
  id: string
  appliance_id: string
  warranty_name: string
  provider: string
  expiry_date: string
  coverage_details?: string
  created_at: string
  document_url?: string | null
}

interface Cost {
  id: string
  appliance_id: string
  cost_type: string
  amount: number
  date: string
  description?: string
  created_at: string
}

// Map UI categories to database-allowed categories
const mapCategoryToDatabase = (uiCategory: string): string => {
  const categoryMap: Record<string, string> = {
    'Electronics': 'Entertainment',
    'Furniture': 'Other',
    'Jewelry & Watches': 'Other',
    'Art & Collectibles': 'Other',
    'Tools & Equipment': 'Other',
    'Musical Instruments': 'Entertainment',
    'Sports Equipment': 'Other',
    'Home Appliances': 'Kitchen - Major',
    'Vehicle Accessories': 'Other',
    'Office Equipment': 'Entertainment',
    'Other': 'Other'
  }
  return categoryMap[uiCategory] || 'Other'
}

export function ApplianceTrackerAutoTrack() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [appliances, setAppliances] = useState<Appliance[]>([])
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false)
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false)
  const [isAddCostOpen, setIsAddCostOpen] = useState(false)
  const [isAddWarrantyOpen, setIsAddWarrantyOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const [applianceForm, setApplianceForm] = useState({
    name: '',
    category: 'Electronics',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    location: '',
    condition: 'Good',
    estimatedLifespan: 10,
    warrantyExpiry: '',  // NEW FIELD
    maintenanceDue: '',  // NEW FIELD
    notes: '',
    photoUrl: ''  // NEW FIELD for photo
  })

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [maintenanceForm, setMaintenanceForm] = useState({
    serviceType: '',
    date: new Date().toISOString().split('T')[0],
    provider: '',
    cost: 0,
    notes: ''
  })

  const [costForm, setCostForm] = useState({
    costType: 'repair',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const [warrantyForm, setWarrantyForm] = useState({
    warrantyName: '',
    provider: '',
    expiryDate: '',
    coverageDetails: ''
  })
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null)
  const [warrantyFileName, setWarrantyFileName] = useState<string>('')
  const [warrantyUploadError, setWarrantyUploadError] = useState<string | null>(null)

  const [isFetchingValue, setIsFetchingValue] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aiValueEstimate, setAiValueEstimate] = useState<any>(null)
  const [fetchingAiValue, setFetchingAiValue] = useState(false)

  useEffect(() => {
    loadAppliances()
  }, [])

  // Manual AI value estimation function
  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload photo to Supabase storage
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null

    try {
      setUploadingPhoto(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${user.id}/assets/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, photoFile, {
          contentType: photoFile.type,
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('Failed to upload photo. Continuing without photo.')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleEstimateValue = async () => {
    // Need at least name OR (brand + category)
    if (!applianceForm.name && !applianceForm.brand && !applianceForm.category) {
      alert('Please enter at least an Asset Name, Brand, or Category to estimate value')
      return
    }

    setFetchingAiValue(true)
    setAiValueEstimate(null)
    
    try {
      // Build description from available fields
      const description = [
        applianceForm.brand,
        applianceForm.model,
        applianceForm.category
      ].filter(Boolean).join(' ')

      const response = await fetch('/api/estimate/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: applianceForm.name || description,
          category: applianceForm.category,
          description: description || applianceForm.name,
          condition: applianceForm.condition,
          purchaseDate: applianceForm.purchaseDate,
          purchasePrice: applianceForm.purchasePrice || undefined,
          // Send the inline base64 preview to the API so GPT-4o Vision can use it
          imageUrls: photoPreview ? [photoPreview] : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI estimate')
      }

      const data = await response.json()
      setAiValueEstimate(data)
      
      // Auto-fill the purchase price with AI estimate
      setApplianceForm(prev => ({ 
        ...prev, 
        purchasePrice: data.estimatedValue || 0 
      }))
      
      alert(`AI Estimated Value: $${data.estimatedValue}\n\nRange: $${data.valueLow} - $${data.valueHigh}\n\n${data.reasoning || 'Based on market analysis'}`)
    } catch (error) {
      console.error('Failed to fetch AI value estimate:', error)
      alert('Failed to get AI estimate. Please try again.')
    } finally {
      setFetchingAiValue(false)
    }
  }

  const loadAppliances = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.log('No active session - user not logged in')
        setLoading(false)
        return
      }
      
      console.log('✅ Session found for appliances:', session.user.email)

      // ✅ Load from domain_entries (universal table) instead of legacy appliances table
      const { data: domainEntriesData, error: domainEntriesError } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('domain', 'appliances')
        .order('created_at', { ascending: false })

      if (domainEntriesError) {
        console.error('Error loading appliances from domain_entries:', domainEntriesError)
        throw domainEntriesError
      }

      console.log(`✅ Loaded ${domainEntriesData?.length || 0} appliances from domain_entries`)
      
      // Transform domain_entries data to Appliance format
      if (domainEntriesData && domainEntriesData.length > 0) {
        const appliancesWithPhotos = domainEntriesData.map(entry => {
          const meta = entry.metadata || {}
          return {
            id: entry.id,
            user_id: entry.user_id,
            name: entry.title || meta.name || 'Unnamed Appliance',
            category: meta.category || 'Other',
            brand: meta.brand || '',
            model_number: meta.model || meta.modelNumber || '',
            serial_number: meta.serialNumber || '',
            purchase_date: meta.purchaseDate || entry.created_at,
            purchase_price: parseFloat(meta.purchasePrice || meta.value || '0'),
            location: meta.location || '',
            expected_lifespan: parseInt(meta.estimatedLifespan || '10'),
            notes: entry.description || meta.notes || '',
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            photoUrl: meta.photoUrl || null
          } as Appliance
        })
        
        setAppliances(appliancesWithPhotos)
        setSelectedAppliance(appliancesWithPhotos[0])
        await loadApplianceData(appliancesWithPhotos[0].id)
      } else {
        setAppliances([])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading appliances:', error)
      setLoading(false)
    }
  }

  const loadApplianceData = async (applianceId: string) => {
    try {
      if (!supabase) return
      const [maintenanceRes, costsRes, warrantiesRes] = await Promise.all([
        supabase.from('appliance_maintenance').select('*').eq('appliance_id', applianceId),
        supabase.from('appliance_costs').select('*').eq('appliance_id', applianceId),
        supabase.from('appliance_warranties').select('*').eq('appliance_id', applianceId)
      ])

      if (maintenanceRes.data) setMaintenanceRecords(maintenanceRes.data)
      if (costsRes.data) setCosts(costsRes.data)
      if (warrantiesRes.data) setWarranties(warrantiesRes.data)
    } catch (error) {
      console.error('Error loading appliance data:', error)
    }
  }

  const handleFetchAIRecommendation = async () => {
    if (!selectedAppliance) return

    setIsFetchingValue(true)
    setAiRecommendation(null)

    try {
      const response = await fetch('/api/appliances/fetch-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedAppliance.name,
          category: (selectedAppliance as any).category,
          brand: (selectedAppliance as any).brand,
          model: (selectedAppliance as any).model,
          purchaseDate: (selectedAppliance as any).purchase_date,
          condition: (selectedAppliance as any).condition,
          maintenanceCount: maintenanceRecords.length,
          totalCosts: costs.reduce((sum, c) => sum + c.amount, 0)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendation')
      }

      setAiRecommendation(data.recommendation)
      alert(`AI Recommendation: ${data.recommendation.action}\n\n${data.recommendation.reasoning}`)
    } catch (error: any) {
      console.error('Error fetching AI recommendation:', error)
      alert(error.message || 'Failed to fetch AI recommendation. Please try again.')
    } finally {
      setIsFetchingValue(false)
    }
  }

  const handleAddAppliance = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('Your session has expired. Please sign in again.')
        router.push('/auth/signin')
        return
      }
      
      console.log('✅ Adding appliance for user:', user.email)

      // Upload photo if present
      let photoUrl: string | null = null
      if (photoFile) {
        photoUrl = await uploadPhoto()
        console.log('📸 Photo uploaded:', photoUrl)
      }

      // Generate a new UUID for the entry
      const entryId = crypto.randomUUID()

      // ✅ PRIMARY: Insert directly to domain_entries (the data source for this component)
      const { data: inserted, error: insertError } = await supabase
        .from('domain_entries')
        .insert({
          id: entryId,
          user_id: user.id,
          domain: 'appliances',
          title: applianceForm.name,
          description: applianceForm.brand ? `${applianceForm.brand} ${applianceForm.model || ''}`.trim() : null,
          metadata: {
            name: applianceForm.name,
            brand: applianceForm.brand,
            model: applianceForm.model,
            serialNumber: applianceForm.serialNumber || null,
            purchaseDate: applianceForm.purchaseDate,
            purchasePrice: Number(applianceForm.purchasePrice) || 0,
            value: Number(applianceForm.purchasePrice) || 0,
            warrantyExpiry: applianceForm.warrantyExpiry || null,
            maintenanceDue: applianceForm.maintenanceDue || null,
            location: applianceForm.location || null,
            condition: applianceForm.condition || 'Good',
            estimatedLifespan: applianceForm.estimatedLifespan || 10,
            notes: applianceForm.notes || null,
            photoUrl: photoUrl || null,
            category: applianceForm.category,
          }
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to add asset to domain_entries:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
        alert(`Failed to add asset: ${insertError.message}`)
        return
      }

      console.log('✅ Asset added to domain_entries:', inserted?.id)

      // Optional: Also sync to legacy appliances table for backward compatibility
      const dbCategory = mapCategoryToDatabase(applianceForm.category)
      const { error: legacyError } = await supabase
        .from('appliances')
        .insert({
          id: entryId,  // Use same ID for consistency
          user_id: user.id,
          name: applianceForm.name,
          category: dbCategory,
          brand: applianceForm.brand,
          model_number: applianceForm.model,
          serial_number: applianceForm.serialNumber || null,
          purchase_date: applianceForm.purchaseDate,
          purchase_price: Number(applianceForm.purchasePrice),
          expected_lifespan: applianceForm.estimatedLifespan,
          location: applianceForm.location || null,
          notes: applianceForm.notes || null
        })
      if (legacyError) {
        // Ignore legacy table errors - domain_entries is the source of truth
        console.warn('⚠️ Legacy appliances table sync skipped:', legacyError.message)
      }

      await loadAppliances()
      setIsAddApplianceOpen(false)
      setApplianceForm({
        name: '',
        category: 'Electronics',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        location: '',
        condition: 'Good',
        estimatedLifespan: 10,
        warrantyExpiry: '',
        maintenanceDue: '',
        notes: '',
        photoUrl: ''
      })
      setPhotoFile(null)
      setPhotoPreview(null)
      setAiValueEstimate(null)
      alert('Asset added successfully!')
    } catch (error: any) {
      console.error('❌ Error adding appliance:', error)
      alert(`Failed to add appliance: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleAddMaintenance = async () => {
    if (!selectedAppliance || !supabase) return

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const newRecord: Maintenance = {
      id: tempId,
      appliance_id: selectedAppliance.id,
      service_type: maintenanceForm.serviceType,
      date: maintenanceForm.date,
      provider: maintenanceForm.provider || undefined,
      cost: maintenanceForm.cost,
      notes: maintenanceForm.notes || undefined,
      created_at: new Date().toISOString()
    }

    // Optimistic update: add immediately to UI
    setMaintenanceRecords(prev => [...prev, newRecord])
    setIsAddMaintenanceOpen(false)
    setMaintenanceForm({
      serviceType: '',
      date: new Date().toISOString().split('T')[0],
      provider: '',
      cost: 0,
      notes: ''
    })

    try {
      const { data, error } = await supabase
        .from('appliance_maintenance')
        .insert({
          appliance_id: selectedAppliance.id,
          service_type: maintenanceForm.serviceType,
          date: maintenanceForm.date,
          provider: maintenanceForm.provider,
          cost: maintenanceForm.cost,
          notes: maintenanceForm.notes
        })
        .select()
        .single()

      if (error) throw error

      // Replace temp record with real one from database
      if (data) {
        setMaintenanceRecords(prev => prev.map(r => r.id === tempId ? data as Maintenance : r))
      }
    } catch (error) {
      console.error('Error adding maintenance:', error)
      alert('Failed to add maintenance record')
      // Remove optimistic addition on error
      setMaintenanceRecords(prev => prev.filter(r => r.id !== tempId))
    }
  }

  const handleAddCost = async () => {
    if (!selectedAppliance || !supabase) return

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    const newCost: Cost = {
      id: tempId,
      appliance_id: selectedAppliance.id,
      cost_type: costForm.costType,
      amount: costForm.amount,
      date: costForm.date,
      description: costForm.description || undefined,
      created_at: new Date().toISOString()
    }

    // Optimistic update: add immediately to UI
    setCosts(prev => [...prev, newCost])
    setIsAddCostOpen(false)
    setCostForm({
      costType: 'repair',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    })

    try {
      const { data, error } = await supabase
        .from('appliance_costs')
        .insert({
          appliance_id: selectedAppliance.id,
          cost_type: costForm.costType,
          amount: costForm.amount,
          date: costForm.date,
          description: costForm.description
        })
        .select()
        .single()

      if (error) throw error

      // Replace temp record with real one from database
      if (data) {
        setCosts(prev => prev.map(c => c.id === tempId ? data as Cost : c))
      }
    } catch (error) {
      console.error('Error adding cost:', error)
      alert('Failed to add cost')
      // Remove optimistic addition on error
      setCosts(prev => prev.filter(c => c.id !== tempId))
    }
  }

  const handleAddWarranty = async () => {
    if (!selectedAppliance || !supabase) return

    if (!warrantyForm.warrantyName || !warrantyForm.provider) {
      alert('Please complete the warranty name and provider fields.')
      return
    }

    if (!warrantyForm.expiryDate) {
      alert('Please provide an expiry date for the warranty.')
      return
    }

    try {
      let documentUrl: string | null = null

      if (warrantyFile) {
        // Clear any previous error
        setWarrantyUploadError(null)
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error('Authentication error:', authError)
          setWarrantyUploadError('You must be signed in to upload documents.')
          alert('You must be signed in to upload warranty documents.')
          return
        }

        console.log('Uploading file:', warrantyFile.name, 'Type:', warrantyFile.type, 'Size:', warrantyFile.size)
        
        const safeName = warrantyFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const storagePath = `${user.id}/appliance-warranties/${Date.now()}-${safeName}`
        
        console.log('Storage path:', storagePath)

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('documents')
          .upload(storagePath, warrantyFile, {
            contentType: warrantyFile.type || 'application/octet-stream',
            upsert: false,
          })

        if (uploadError) {
          console.error('Failed to upload warranty document:', uploadError)
          setWarrantyUploadError(`Upload failed: ${uploadError.message}`)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log('Document uploaded successfully:', uploadData)

        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath)

        documentUrl = publicUrlData.publicUrl
        console.log('Public URL:', documentUrl)
      }

      // Build initial payload including document_url when available
      const basePayload: any = {
        appliance_id: selectedAppliance.id,
        warranty_name: warrantyForm.warrantyName,
        provider: warrantyForm.provider,
        expiry_date: warrantyForm.expiryDate,
        coverage_details: warrantyForm.coverageDetails,
      }

      if (documentUrl) {
        basePayload.document_url = documentUrl
      }

      // Prefer Supabase MCP to perform the insert (server-side using the user's session)
      const doInsertViaMcp = async (payload: any) => {
        const resp = await fetch('/api/mcp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId: 'supabase-database',
            capability: 'insert_data',
            parameters: { table: 'appliance_warranties', values: payload }
          })
        })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          throw new Error(err?.error || `MCP insert failed (${resp.status})`)
        }
        return resp.json()
      }

      let insertSucceeded = false
      try {
        await doInsertViaMcp([basePayload])
        insertSucceeded = true
      } catch (e: any) {
        const msg = String(e?.message || '')
        if (msg.includes('document_url')) {
          console.warn('document_url column missing (MCP). Retrying without it...')
          const fallbackPayload: any = { ...basePayload }
          delete fallbackPayload.document_url
          if (documentUrl) {
            const details = warrantyForm.coverageDetails || ''
            fallbackPayload.coverage_details = details
              ? `${details}\nDocument: ${documentUrl}`
              : `Document: ${documentUrl}`
          }
          await doInsertViaMcp([fallbackPayload])
          insertSucceeded = true
        } else {
          // As last resort, try direct client insert (in case MCP route is unavailable)
          const { error: directError } = await supabase
            .from('appliance_warranties')
            .insert(basePayload)
          if (directError && String(directError.message || '').includes('document_url')) {
            const fallbackPayload: any = { ...basePayload }
            delete fallbackPayload.document_url
            if (documentUrl) {
              const details = warrantyForm.coverageDetails || ''
              fallbackPayload.coverage_details = details
                ? `${details}\nDocument: ${documentUrl}`
                : `Document: ${documentUrl}`
            }
            const { error: fallbackDirectError } = await supabase
              .from('appliance_warranties')
              .insert(fallbackPayload)
            if (fallbackDirectError) throw fallbackDirectError
            insertSucceeded = true
          } else if (directError) {
            throw directError
          } else {
            insertSucceeded = true
          }
        }
      }

      if (!insertSucceeded) {
        throw new Error('Insert did not complete')
      }

      await loadApplianceData(selectedAppliance.id)
      setIsAddWarrantyOpen(false)
      setWarrantyForm({
        warrantyName: '',
        provider: '',
        expiryDate: '',
        coverageDetails: ''
      })
      setWarrantyFile(null)
      setWarrantyFileName('')
      setWarrantyUploadError(null)
      alert('Warranty added successfully!')
    } catch (error: any) {
      console.error('Error adding warranty:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      setWarrantyUploadError(`Failed to add warranty: ${errorMessage}`)
      alert(`Failed to add warranty: ${errorMessage}`)
    }
  }

  const handleDeleteAppliance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    if (!supabase) return

    try {
      // Get current user for safety
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('You must be signed in to delete assets.')
        return
      }

      console.log('🗑️ Deleting asset:', { id, userId: user.id })

      // Delete from domain_entries (the actual data source)
      const { error: domainError, count } = await supabase
        .from('domain_entries')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', user.id)

      console.log('🗑️ Delete result:', { domainError, count })

      if (domainError) {
        console.error('❌ Error deleting from domain_entries:', domainError)
        alert(`Failed to delete asset: ${domainError.message}`)
        return
      }

      if (count === 0) {
        console.warn('⚠️ No entries deleted - entry may not exist or user mismatch')
      }

      // Also try to delete from legacy appliances table (in case it exists there too)
      const { error: legacyDeleteError } = await supabase
        .from('appliances')
        .delete()
        .eq('id', id)
      if (legacyDeleteError) {
        console.warn('⚠️ Legacy table delete skipped:', legacyDeleteError.message)
      }

      // Clear selection if we deleted the selected appliance
      if (selectedAppliance?.id === id) {
        setSelectedAppliance(null)
      }

      await loadAppliances()
      alert('Asset deleted successfully!')
    } catch (error: any) {
      console.error('❌ Error deleting appliance:', error)
      alert(`Failed to delete asset: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    if (!supabase) return

    // Optimistic update: remove immediately from UI
    setMaintenanceRecords(prev => prev.filter(record => record.id !== id))

    try {
      const { error } = await supabase.from('appliance_maintenance').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting maintenance:', error)
      alert('Failed to delete maintenance record')
      // Reload to restore correct state if delete failed
      if (selectedAppliance) {
        loadApplianceData(selectedAppliance.id)
      }
    }
  }

  const handleDeleteCost = async (id: string) => {
    if (!supabase) return

    // Optimistic update: remove immediately from UI
    setCosts(prev => prev.filter(cost => cost.id !== id))

    try {
      const { error } = await supabase.from('appliance_costs').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting cost:', error)
      alert('Failed to delete cost record')
      // Reload to restore correct state if delete failed
      if (selectedAppliance) {
        loadApplianceData(selectedAppliance.id)
      }
    }
  }

  const handleDeleteWarranty = async (id: string) => {
    if (!supabase) return

    // Optimistic update: remove immediately from UI
    setWarranties(prev => prev.filter(warranty => warranty.id !== id))

    try {
      const { error } = await supabase.from('appliance_warranties').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting warranty:', error)
      alert('Failed to delete warranty')
      // Reload to restore correct state if delete failed
      if (selectedAppliance) {
        loadApplianceData(selectedAppliance.id)
      }
    }
  }

  const handleEditAppliance = () => {
    if (!selectedAppliance) return
    setEditForm({
      name: selectedAppliance.name,
      brand: (selectedAppliance as any).brand || '',
      model: (selectedAppliance as any).model_number || '',
      serialNumber: selectedAppliance.serial_number || '',
      purchaseDate: selectedAppliance.purchase_date || new Date().toISOString().split('T')[0],
      purchasePrice: selectedAppliance.purchase_price || 0,
      location: (selectedAppliance as any).location || '',
      estimatedLifespan: (selectedAppliance as any).expected_lifespan || 10,
      notes: (selectedAppliance as any).notes || ''
    })
    setIsEditMode(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedAppliance || !supabase) return

    try {
      // Get current user for safety
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert('You must be signed in to update assets.')
        return
      }

      // ✅ PRIMARY: Update domain_entries (the data source for this component)
      const { error: updateError } = await supabase
        .from('domain_entries')
        .update({
          title: editForm.name || selectedAppliance.name,
          description: (editForm.brand || (selectedAppliance as any).brand)
            ? `${editForm.brand || (selectedAppliance as any).brand} ${(editForm.model || (selectedAppliance as any).model_number) || ''}`.trim()
            : null,
          metadata: {
            name: editForm.name || selectedAppliance.name,
            brand: editForm.brand || (selectedAppliance as any).brand,
            model: editForm.model || (selectedAppliance as any).model_number,
            serialNumber: editForm.serialNumber || selectedAppliance.serial_number,
            purchaseDate: editForm.purchaseDate || selectedAppliance.purchase_date,
            purchasePrice: Number(editForm.purchasePrice ?? selectedAppliance.purchase_price) || 0,
            value: Number(editForm.purchasePrice ?? selectedAppliance.purchase_price) || 0,
            warrantyExpiry: undefined,
            maintenanceDue: undefined,
            location: editForm.location || (selectedAppliance as any).location,
            condition: (selectedAppliance as any).condition || 'Good',
            estimatedLifespan: editForm.estimatedLifespan || (selectedAppliance as any).expected_lifespan,
            notes: editForm.notes || undefined,
          }
        })
        .eq('id', selectedAppliance.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('❌ Failed to update asset:', updateError)
        throw updateError
      }

      console.log('✅ Asset updated in domain_entries')

      // Optional: Also sync to legacy appliances table
      const { error: legacyUpdateError } = await supabase
        .from('appliances')
        .update({
          name: editForm.name,
          brand: editForm.brand,
          model_number: editForm.model,
          serial_number: editForm.serialNumber || null,
          purchase_date: editForm.purchaseDate,
          purchase_price: Number(editForm.purchasePrice),
          location: editForm.location || null,
          expected_lifespan: editForm.estimatedLifespan,
          notes: editForm.notes || null
        })
        .eq('id', selectedAppliance.id)
      if (legacyUpdateError) {
        // Ignore legacy table errors
        console.warn('⚠️ Legacy appliances table sync skipped:', legacyUpdateError.message)
      }

      await loadAppliances()
      await loadApplianceData(selectedAppliance.id)
      setIsEditMode(false)
      alert('Asset updated successfully!')
    } catch (error) {
      console.error('Error updating appliance:', error)
      alert('Failed to update appliance')
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditForm({})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appliances...</p>
        </div>
      </div>
    )
  }

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-4 md:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <DomainBackButton variant="dark" />
        </div>
        
        <Card className="bg-[#1a202c] border-gray-800">
          <CardContent className="p-8 md:p-12 text-center">
            <Refrigerator className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Assets Added</h3>
            <p className="text-sm md:text-base text-gray-400 mb-6">Start tracking your valuable assets by adding your first one.</p>
            <Button onClick={() => setIsAddApplianceOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Asset
            </Button>
          </CardContent>
        </Card>

        {/* Add Asset Dialog */}
        <Dialog open={isAddApplianceOpen} onOpenChange={setIsAddApplianceOpen}>
          <DialogContent className="bg-[#1a202c] border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Asset</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your asset details and AI will estimate its value
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Asset Name</Label>
                <Input
                  value={applianceForm.name}
                  onChange={(e) => setApplianceForm({ ...applianceForm, name: e.target.value })}
                  placeholder="e.g., Kitchen Refrigerator"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Category</Label>
                <Select value={applianceForm.category} onValueChange={(value) => setApplianceForm({ ...applianceForm, category: value })}>
                  <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a202c] border-gray-700 text-white">
                    <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                    <SelectItem value="Washing Machine">Washer</SelectItem>
                    <SelectItem value="Dryer">Dryer</SelectItem>
                    <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                    <SelectItem value="Oven">Oven/Range</SelectItem>
                    <SelectItem value="Microwave">Microwave</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Television">Television</SelectItem>
                    <SelectItem value="Freezer">Freezer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Brand</Label>
                <Input
                  value={applianceForm.brand}
                  onChange={(e) => setApplianceForm({ ...applianceForm, brand: e.target.value })}
                  placeholder="e.g., Samsung"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Model</Label>
                <Input
                  value={applianceForm.model}
                  onChange={(e) => setApplianceForm({ ...applianceForm, model: e.target.value })}
                  placeholder="e.g., RF28R7351SR"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Serial Number</Label>
                <Input
                  value={applianceForm.serialNumber}
                  onChange={(e) => setApplianceForm({ ...applianceForm, serialNumber: e.target.value })}
                  placeholder="Optional"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Purchase Date</Label>
                <Input
                  type="date"
                  value={applianceForm.purchaseDate}
                  onChange={(e) => setApplianceForm({ ...applianceForm, purchaseDate: e.target.value })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-300">
                  Purchase Price ($)
                  {aiValueEstimate && !fetchingAiValue && (
                    <span className="ml-2 text-xs text-green-400">✨ AI: ${aiValueEstimate.estimatedValue}</span>
                  )}
                </Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="number"
                    value={applianceForm.purchasePrice}
                    onChange={(e) => setApplianceForm({ ...applianceForm, purchasePrice: parseFloat(e.target.value) })}
                    className="bg-[#0f1419] border-gray-700 text-white min-w-[150px] w-full max-w-[300px]"
                    placeholder="Enter price"
                  />
                  <Button
                    type="button"
                    onClick={handleEstimateValue}
                    disabled={fetchingAiValue || (!applianceForm.name && !applianceForm.brand && !applianceForm.category)}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                  >
                    {fetchingAiValue ? '🤖 Estimating...' : '✨ AI Estimate'}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Location</Label>
                <Input
                  value={applianceForm.location}
                  onChange={(e) => setApplianceForm({ ...applianceForm, location: e.target.value })}
                  placeholder="e.g., Kitchen"
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Condition</Label>
                <Select value={applianceForm.condition} onValueChange={(value) => setApplianceForm({ ...applianceForm, condition: value })}>
                  <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a202c] border-gray-700 text-white">
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Estimated Lifespan (years)</Label>
                <Input
                  type="number"
                  value={applianceForm.estimatedLifespan}
                  onChange={(e) => setApplianceForm({ ...applianceForm, estimatedLifespan: parseInt(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-300">Notes</Label>
                <Textarea
                  value={applianceForm.notes}
                  onChange={(e) => setApplianceForm({ ...applianceForm, notes: e.target.value })}
                  placeholder="Any additional information..."
                  className="bg-[#0f1419] border-gray-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddApplianceOpen(false)} className="border-gray-700 text-gray-300">
                Cancel
              </Button>
              <Button onClick={handleAddAppliance} disabled={!applianceForm.name || !applianceForm.brand} className="bg-blue-600 hover:bg-blue-700">
                Add Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const totalValue = appliances.reduce((sum, a) => sum + (a.purchase_price || 0), 0)
  const totalMaintenance = maintenanceRecords.length
  // Total costs includes purchase prices + all maintenance/repair costs
  const totalCosts = totalValue + costs.reduce((sum, c) => sum + (c.amount || 0), 0)
  const activeWarranties = warranties.filter(w => new Date(w.expiry_date) > new Date()).length

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Header */}
      <div className="bg-[#1a202c] border-b border-gray-800">
        <div className="px-4 md:px-6 py-4">
          {/* Back Button */}
          <div className="mb-4">
            <DomainBackButton variant="dark" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <Refrigerator className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">Asset Tracker Pro</h1>
                <p className="text-xs md:text-sm text-gray-400">Track Valuable Assets & Warranties</p>
              </div>
            </div>
            <Button onClick={() => setIsAddApplianceOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          {/* Appliance Selector */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {appliances.map((appliance) => (
              <button
                key={appliance.id}
                onClick={() => {
                  setSelectedAppliance(appliance)
                  loadApplianceData(appliance.id)
                }}
                className={`flex-shrink-0 rounded-lg border-2 transition-all overflow-hidden ${
                  selectedAppliance?.id === appliance.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#0f1419] border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                {(appliance as any).photoUrl && (
                  <div className="w-full h-24 overflow-hidden">
                    <img 
                      src={(appliance as any).photoUrl} 
                      alt={appliance.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="px-4 py-3">
                  <div className="text-sm font-medium">{appliance.name}</div>
                  <div className="text-xs opacity-75">{(appliance as any).brand} {(appliance as any).model}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a202c] border-b border-gray-800 relative">
        {/* Fade indicator for more content on right */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1a202c] to-transparent pointer-events-none sm:hidden z-10" />
        <div className="px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-hide touch-pan-x">
          {['dashboard', 'maintenance', 'costs', 'warranties'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-3 font-medium transition-all whitespace-nowrap flex-shrink-0 min-w-fit text-sm sm:text-base ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Per-Asset Dashboard (when asset selected) or Global Overview */}
            {selectedAppliance ? (
              <>
                {/* ITEM-SPECIFIC STATS */}
                {(() => {
                  // Calculate item-specific stats
                  const itemCosts = costs.filter(c => c.appliance_id === selectedAppliance.id)
                  const itemMaintenance = maintenanceRecords.filter(m => m.appliance_id === selectedAppliance.id)
                  const itemWarranties = warranties.filter(w => w.appliance_id === selectedAppliance.id)
                  const itemActiveWarranties = itemWarranties.filter(w => new Date(w.expiry_date) > new Date())
                  const itemTotalCosts = (selectedAppliance.purchase_price || 0) + itemCosts.reduce((sum, c) => sum + (c.amount || 0), 0)
                  
                  // Calculate depreciation & lifespan
                  const purchaseDate = selectedAppliance.purchase_date ? new Date(selectedAppliance.purchase_date) : null
                  const lifespan = (selectedAppliance as any).expected_lifespan || 10
                  const ageInYears = purchaseDate ? (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365) : 0
                  const lifespanProgress = Math.min(100, (ageInYears / lifespan) * 100)
                  const estimatedCurrentValue = Math.max(0, (selectedAppliance.purchase_price || 0) * (1 - (ageInYears / lifespan)))
                  const nextMaintenance = itemMaintenance.find(m => new Date((m as any).scheduled_date || m.date) > new Date())
                  
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* Asset Value Card */}
                      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-0">
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <DollarSign className="w-5 h-5 sm:w-8 sm:h-8 text-white opacity-80" />
                            <Badge className="bg-white/20 text-white border-0 text-xs">Value</Badge>
                          </div>
                          <div className="text-lg sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">${(selectedAppliance.purchase_price || 0).toLocaleString()}</div>
                          <div className="text-xs sm:text-sm text-emerald-100">Purchase Price</div>
                          <div className="mt-1 sm:mt-2 text-xs text-emerald-200">
                            Est. Current: ${estimatedCurrentValue.toFixed(0)}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Lifespan Progress Card */}
                      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <Clock className="w-5 h-5 sm:w-8 sm:h-8 text-white opacity-80" />
                            <Badge className="bg-white/20 text-white border-0 text-xs">Age</Badge>
                          </div>
                          <div className="text-lg sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{ageInYears.toFixed(1)} yrs</div>
                          <div className="text-xs sm:text-sm text-blue-100">of {lifespan} yr lifespan</div>
                          <div className="mt-1 sm:mt-2 w-full bg-white/20 rounded-full h-1.5 sm:h-2">
                            <div 
                              className={`h-1.5 sm:h-2 rounded-full ${lifespanProgress > 80 ? 'bg-red-400' : lifespanProgress > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                              style={{ width: `${lifespanProgress}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Item Total Costs Card */}
                      <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0">
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <Receipt className="w-5 h-5 sm:w-8 sm:h-8 text-white opacity-80" />
                            <Badge className="bg-white/20 text-white border-0 text-xs">Spent</Badge>
                          </div>
                          <div className="text-lg sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">${itemTotalCosts.toLocaleString()}</div>
                          <div className="text-xs sm:text-sm text-orange-100">Total Investment</div>
                          <div className="mt-1 sm:mt-2 text-xs text-orange-200 truncate">
                            {itemMaintenance.length} service • {itemCosts.length} expenses
                          </div>
                        </CardContent>
                      </Card>

                      {/* Warranty Status Card */}
                      <Card className={`bg-gradient-to-br ${itemActiveWarranties.length > 0 ? 'from-purple-600 to-purple-700' : 'from-gray-600 to-gray-700'} border-0`}>
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-white opacity-80" />
                            <Badge className={`${itemActiveWarranties.length > 0 ? 'bg-white/20' : 'bg-red-500/50'} text-white border-0 text-xs`}>
                              {itemActiveWarranties.length > 0 ? 'Active' : 'None'}
                            </Badge>
                          </div>
                          <div className="text-lg sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                            {itemActiveWarranties.length}/{itemWarranties.length}
                          </div>
                          <div className="text-xs sm:text-sm text-purple-100">Active Warranties</div>
                          {itemActiveWarranties[0] && (
                            <div className="mt-1 sm:mt-2 text-xs text-purple-200 truncate">
                              Exp: {new Date(itemActiveWarranties[0].expiry_date).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </>
            ) : (
              /* GLOBAL OVERVIEW STATS (when no asset selected) */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Refrigerator className="w-8 h-8 text-white opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Active</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{appliances.length}</div>
                    <div className="text-sm text-blue-100">Total Assets</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 text-white opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Scheduled</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{totalMaintenance}</div>
                    <div className="text-sm text-orange-100">Service Records</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 text-white opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">YTD</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${totalCosts.toFixed(0)}</div>
                    <div className="text-sm text-green-100">Total Costs</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Shield className="w-8 h-8 text-white opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Protected</Badge>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{activeWarranties}/{warranties.length}</div>
                    <div className="text-sm text-purple-100">Active Warranties</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appliance Details */}
            {selectedAppliance && (
              <Card className="bg-[#1a202c] border-gray-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                      {(selectedAppliance as any).photoUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={(selectedAppliance as any).photoUrl} 
                            alt={selectedAppliance.name}
                            className="w-full sm:w-32 md:w-48 h-32 sm:h-32 md:h-48 object-cover rounded-lg border-2 border-gray-700"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{selectedAppliance.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <span className="truncate">{(selectedAppliance as any).brand} {(selectedAppliance as any).model}</span>
                          {(selectedAppliance as any).location && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">Location: {(selectedAppliance as any).location}</span>
                            </>
                          )}
                          <Badge variant="outline" className="text-gray-300 border-gray-700 text-xs">
                            {(selectedAppliance as any).condition}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFetchAIRecommendation}
                        disabled={isFetchingValue}
                        className="border-purple-600 text-purple-400 hover:bg-purple-600/10 text-xs sm:text-sm"
                      >
                        {isFetchingValue ? 'Analyzing...' : '✨ AI'}
                      </Button>
                      {isEditMode ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveEdit}
                            className="border-green-600 text-green-400 hover:bg-green-600/10"
                          >
                            <Save className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Save</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditAppliance}
                            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppliance(selectedAppliance.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Name</Label>
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Brand</Label>
                        <Input
                          value={editForm.brand || ''}
                          onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Model</Label>
                        <Input
                          value={editForm.model || ''}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Serial Number</Label>
                        <Input
                          value={editForm.serialNumber || ''}
                          onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Purchase Date</Label>
                        <Input
                          type="date"
                          value={editForm.purchaseDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Purchase Price ($)</Label>
                        <Input
                          type="number"
                          value={editForm.purchasePrice || 0}
                          onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Location</Label>
                        <Input
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Est. Lifespan (years)</Label>
                        <Input
                          type="number"
                          value={editForm.estimatedLifespan || 10}
                          onChange={(e) => setEditForm({ ...editForm, estimatedLifespan: parseInt(e.target.value) })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-gray-400 text-sm">Notes</Label>
                        <Textarea
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="bg-[#0f1419] border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400 mb-1">Purchase Date</div>
                          <div className="text-white font-medium text-sm sm:text-base">
                            {new Date(selectedAppliance.purchase_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400 mb-1">Purchase Price</div>
                          <div className="text-white font-medium text-sm sm:text-base">${(selectedAppliance.purchase_price || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            <span className="hidden sm:inline">Est. Current Value</span>
                            <span className="sm:hidden">Current</span>
                          </div>
                          <div className="text-emerald-400 font-bold text-sm sm:text-lg">
                            ${calculateApplianceCurrentValue({
                              purchasePrice: selectedAppliance.purchase_price,
                              purchaseDate: selectedAppliance.purchase_date,
                              estimatedLifespan: (selectedAppliance as any).expected_lifespan
                            }).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const purchasePrice = selectedAppliance.purchase_price || 0
                              const currentValue = calculateApplianceCurrentValue({
                                purchasePrice: selectedAppliance.purchase_price,
                                purchaseDate: selectedAppliance.purchase_date,
                                estimatedLifespan: (selectedAppliance as any).expected_lifespan
                              })
                              const depreciation = purchasePrice - currentValue
                              const depPercent = purchasePrice > 0 ? ((depreciation / purchasePrice) * 100).toFixed(0) : 0
                              return depreciation > 0 ? `${depPercent}% dep.` : 'New'
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm text-gray-400 mb-1">Lifespan</div>
                          <div className="text-white font-medium text-sm sm:text-base">{(selectedAppliance as any).expected_lifespan || 0} yrs</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs sm:text-sm text-gray-400 mb-1">Serial #</div>
                          <div className="text-white font-medium text-sm sm:text-base truncate">{selectedAppliance.serial_number || 'N/A'}</div>
                        </div>
                      </div>

                      {selectedAppliance.notes && (
                        <div className="mt-4 p-3 bg-[#0f1419] rounded-lg border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">Notes</div>
                          <div className="text-white text-sm">{selectedAppliance.notes}</div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Maintenance Schedule</h3>
              <Button onClick={() => setIsAddMaintenanceOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Maintenance
              </Button>
            </div>

            {maintenanceRecords.length === 0 ? (
              <Card className="bg-[#1a202c] border-gray-800">
                <CardContent className="p-12 text-center">
                  <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No maintenance records yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {maintenanceRecords.map((record) => (
                  <Card key={record.id} className="bg-[#1a202c] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h4 className="font-semibold text-white">{record.service_type}</h4>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Date: {new Date(record.date).toLocaleDateString()}</div>
                            {record.provider && <div>Provider: {record.provider}</div>}
                            {record.notes && <div>Notes: {record.notes}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">${record.cost.toFixed(2)}</div>
                            <div className="text-xs text-gray-400">Cost</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMaintenance(record.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Cost Tracking</h3>
              <Button onClick={() => setIsAddCostOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Cost
              </Button>
            </div>

            {costs.length === 0 ? (
              <Card className="bg-[#1a202c] border-gray-800">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No costs recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {costs.map((cost) => (
                  <Card key={cost.id} className="bg-[#1a202c] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-gray-300 border-gray-700">
                              {cost.cost_type}
                            </Badge>
                            <span className="text-sm text-gray-400">{new Date(cost.date).toLocaleDateString()}</span>
                          </div>
                          {cost.description && (
                            <div className="text-sm text-gray-300">{cost.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold text-white">${cost.amount.toFixed(2)}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCost(cost.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'warranties' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Warranty Coverage</h3>
              <Button onClick={() => setIsAddWarrantyOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Warranty
              </Button>
            </div>

            {warranties.length === 0 ? (
              <Card className="bg-[#1a202c] border-gray-800">
                <CardContent className="p-12 text-center">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No warranties registered yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {warranties.map((warranty) => {
                  const isActive = new Date(warranty.expiry_date) > new Date()
                  // Prefer explicit document_url; otherwise, try to parse a URL embedded in coverage_details
                  const embeddedUrl = typeof warranty.coverage_details === 'string'
                    ? (warranty.coverage_details.match(/https?:\/\/\S+/)?.[0] || null)
                    : null
                  const docUrl = warranty.document_url || embeddedUrl
                  return (
                    <Card key={warranty.id} className="bg-[#1a202c] border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{warranty.warranty_name}</h4>
                            <div className="text-sm text-gray-400">Provider: {warranty.provider}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {docUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                onClick={() => setPreviewUrl(docUrl)}
                              >
                                <FileText className="mr-1 h-3 w-3" />
                                View Document
                              </Button>
                            )}
                            <Badge
                              variant={isActive ? 'default' : 'outline'}
                              className={isActive ? 'bg-green-600 text-white' : 'text-gray-400 border-gray-700'}
                            >
                              {isActive ? 'Active' : 'Expired'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteWarranty(warranty.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          Expires: {new Date(warranty.expiry_date).toLocaleDateString()}
                        </div>
                        {warranty.coverage_details && (
                          <div className="text-sm text-gray-300 p-2 bg-[#0f1419] rounded border border-gray-800">
                            {warranty.coverage_details}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Asset Dialog */}
      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null) }}>
        <DialogContent className="bg-[#1a202c] border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Document Preview</DialogTitle>
            <DialogDescription className="text-gray-400">
              Preview of the uploaded document. Use the Open button to view or download in a new tab.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[75vh] bg-[#0f1419] border border-gray-800 rounded">
            {previewUrl?.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                {/* Show image formats inline; otherwise provide a link */}
                {previewUrl && (/\.(png|jpg|jpeg|gif|webp)$/i.test(previewUrl)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Document" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center text-gray-300">
                    <p className="mb-3">Preview not available. Open in a new tab:</p>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => window.open(previewUrl!, '_blank')}>
                      Open Document
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => window.open(previewUrl!, '_blank')}>
              Open in New Tab
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setPreviewUrl(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddApplianceOpen} onOpenChange={setIsAddApplianceOpen}>
        <DialogContent className="bg-[#1a202c] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Asset</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your asset details and AI will estimate its value
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Asset Name</Label>
              <Input
                value={applianceForm.name}
                onChange={(e) => setApplianceForm({ ...applianceForm, name: e.target.value })}
                placeholder="e.g., Kitchen Refrigerator"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select value={applianceForm.category} onValueChange={(value) => setApplianceForm({ ...applianceForm, category: value })}>
                <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a202c] border-gray-700 text-white">
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Jewelry & Watches">Jewelry & Watches</SelectItem>
                  <SelectItem value="Art & Collectibles">Art & Collectibles</SelectItem>
                  <SelectItem value="Tools & Equipment">Tools & Equipment</SelectItem>
                  <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                  <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                  <SelectItem value="Home Appliances">Home Appliances</SelectItem>
                  <SelectItem value="Vehicle Accessories">Vehicle Accessories</SelectItem>
                  <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Brand</Label>
              <Input
                value={applianceForm.brand}
                onChange={(e) => setApplianceForm({ ...applianceForm, brand: e.target.value })}
                placeholder="e.g., Samsung"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Model</Label>
              <Input
                value={applianceForm.model}
                onChange={(e) => setApplianceForm({ ...applianceForm, model: e.target.value })}
                placeholder="e.g., RF28R7351SR"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Serial Number</Label>
              <Input
                value={applianceForm.serialNumber}
                onChange={(e) => setApplianceForm({ ...applianceForm, serialNumber: e.target.value })}
                placeholder="Optional"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Purchase Date</Label>
              <Input
                type="date"
                value={applianceForm.purchaseDate}
                onChange={(e) => setApplianceForm({ ...applianceForm, purchaseDate: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">
                Purchase Price ($)
                {aiValueEstimate && !fetchingAiValue && (
                  <span className="ml-2 text-xs text-green-400">✨ AI: ${aiValueEstimate.estimatedValue}</span>
                )}
              </Label>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  value={applianceForm.purchasePrice}
                  onChange={(e) => setApplianceForm({ ...applianceForm, purchasePrice: parseFloat(e.target.value) })}
                  className="bg-[#0f1419] border-gray-700 text-white min-w-[150px] w-full max-w-[300px]"
                  placeholder="Enter price"
                />
                <Button
                  type="button"
                  onClick={handleEstimateValue}
                  disabled={fetchingAiValue || (!applianceForm.name && !applianceForm.brand && !applianceForm.category)}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  {fetchingAiValue ? '🤖 Estimating...' : '✨ AI Estimate'}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Location</Label>
              <Input
                value={applianceForm.location}
                onChange={(e) => setApplianceForm({ ...applianceForm, location: e.target.value })}
                placeholder="e.g., Kitchen"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Condition</Label>
              <Select value={applianceForm.condition} onValueChange={(value) => setApplianceForm({ ...applianceForm, condition: value })}>
                <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a202c] border-gray-700 text-white">
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Estimated Lifespan (years)</Label>
              <Input
                type="number"
                value={applianceForm.estimatedLifespan}
                onChange={(e) => setApplianceForm({ ...applianceForm, estimatedLifespan: parseInt(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Warranty Expiry Date</Label>
              <Input
                type="date"
                value={applianceForm.warrantyExpiry}
                onChange={(e) => setApplianceForm({ ...applianceForm, warrantyExpiry: e.target.value })}
                placeholder="Optional"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Maintenance Due Date</Label>
              <Input
                type="date"
                value={applianceForm.maintenanceDue}
                onChange={(e) => setApplianceForm({ ...applianceForm, maintenanceDue: e.target.value })}
                placeholder="Optional"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={applianceForm.notes}
                onChange={(e) => setApplianceForm({ ...applianceForm, notes: e.target.value })}
                placeholder="Any additional information..."
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-gray-300">Photo (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="bg-[#0f1419] border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {photoPreview && (
                <div className="mt-3 relative">
                  <img 
                    src={photoPreview} 
                    alt="Asset preview" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 border-0 text-white"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddApplianceOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddAppliance} disabled={!applianceForm.name || !applianceForm.brand} className="bg-blue-600 hover:bg-blue-700">
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
        <DialogContent className="bg-[#1a202c] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Maintenance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Service Type</Label>
              <Input
                value={maintenanceForm.serviceType}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, serviceType: e.target.value })}
                placeholder="e.g., Filter Replacement"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Date</Label>
              <Input
                type="date"
                value={maintenanceForm.date}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Provider (Optional)</Label>
              <Input
                value={maintenanceForm.provider}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, provider: e.target.value })}
                placeholder="Service provider name"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
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
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                placeholder="Additional details..."
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaintenanceOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddMaintenance} disabled={!maintenanceForm.serviceType} className="bg-blue-600 hover:bg-blue-700">
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={isAddCostOpen} onOpenChange={setIsAddCostOpen}>
        <DialogContent className="bg-[#1a202c] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Cost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Cost Type</Label>
              <Select value={costForm.costType} onValueChange={(value) => setCostForm({ ...costForm, costType: value })}>
                <SelectTrigger className="bg-[#0f1419] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a202c] border-gray-700 text-white">
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="parts">Parts</SelectItem>
                  <SelectItem value="service">Service Call</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Amount ($)</Label>
              <Input
                type="number"
                value={costForm.amount}
                onChange={(e) => setCostForm({ ...costForm, amount: parseFloat(e.target.value) })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Date</Label>
              <Input
                type="date"
                value={costForm.date}
                onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={costForm.description}
                onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                placeholder="Details about this cost..."
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCostOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddCost} disabled={!costForm.amount} className="bg-blue-600 hover:bg-blue-700">
              Add Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Warranty Dialog */}
      <Dialog open={isAddWarrantyOpen} onOpenChange={setIsAddWarrantyOpen}>
        <DialogContent className="bg-[#1a202c] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Warranty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Warranty Name</Label>
              <Input
                value={warrantyForm.warrantyName}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, warrantyName: e.target.value })}
                placeholder="e.g., Manufacturer Warranty"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Provider</Label>
              <Input
                value={warrantyForm.provider}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, provider: e.target.value })}
                placeholder="e.g., Samsung"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
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
              <Label className="text-gray-300">Coverage Details</Label>
              <Textarea
                value={warrantyForm.coverageDetails}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, coverageDetails: e.target.value })}
                placeholder="What does this warranty cover?"
                className="bg-[#0f1419] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Warranty Document (optional)</Label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) {
                    setWarrantyFile(null)
                    setWarrantyFileName('')
                    return
                  }
                  setWarrantyUploadError(null)
                  setWarrantyFile(file)
                  setWarrantyFileName(file.name)
                }}
                className="mt-1 block w-full rounded border border-gray-700 bg-[#0f1419] text-sm text-gray-300 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              {warrantyFileName && (
                <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <FileText className="h-3 w-3" />
                  {warrantyFileName}
                </p>
              )}
              {warrantyUploadError && (
                <p className="mt-2 text-xs text-red-400">{warrantyUploadError}</p>
              )}
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
    </div>
  )
}

