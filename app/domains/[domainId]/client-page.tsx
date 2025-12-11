'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { DateInput } from '@/components/ui/date-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { DOMAIN_CONFIGS, Domain } from '@/types/domains'
import { Plus, Edit, Trash2, ChevronLeft, BarChart3, FileText, Zap, Home as HomeIcon, Car as CarIcon, Layers, Settings, Brain, BookOpen, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { DomainVisualizations } from '@/components/domains/domain-visualizations'
import { DomainDocumentsTab } from '@/components/domain-documents-tab'
import { DomainQuickLog } from '@/components/domain-quick-log'
import { DomainQuickLogWithPets } from '@/components/domain-quick-log-with-pets'
import { MindfulnessLogWrapper } from '@/components/mindfulness-log-wrapper'
import { DOMAIN_LOGGING_CONFIGS } from '@/lib/domain-logging-configs'
import { PropertyManager } from '@/components/domain-profiles/property-manager'
import { VehicleTrackerAutoTrack } from '@/components/domain-profiles/vehicle-tracker-autotrack'
import { BillsManager } from '@/components/domain-profiles/bills-manager'
import { LoansManager } from '@/components/domain-profiles/loans-manager'
import { ApplianceTrackerAutoTrack } from '@/components/domain-profiles/appliance-tracker-autotrack'
import { MindfulnessAppFull } from '@/components/mindfulness/mindfulness-app-full'
import { RelationshipsManager } from '@/components/relationships/relationships-manager'
import { HomePageWrapper } from '@/components/home/home-page-wrapper'
import { FitnessTrackerFull } from '@/components/fitness/fitness-tracker-full'
import { toast } from 'sonner'
import { QuickShareButton } from '@/components/share/quick-share-button'

export function DomainDetailPageClient({ domainId }: { domainId: Domain }) {
  const domain = DOMAIN_CONFIGS[domainId]
  const router = useRouter()
  const searchParams = useSearchParams()
  const policyId = searchParams.get('policyId') // Get policyId from URL for filtering documents
  const { getData, addData, updateData, deleteData } = useData()
  
  // ✅ Use proper hook for CRUD operations
  const { entries, isLoading, createEntry, updateEntry, deleteEntry: removeEntry, fetchEntries } = useDomainEntries(domainId)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // ✅ ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS
  // Prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ CRITICAL FIX: Reload items when data changes
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1)
      console.log('🔄 Domain view refreshed:', domainId)
    }
    
    window.addEventListener('financial-data-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener(`${domainId}-data-updated`, handleUpdate as any)
    
    return () => {
      window.removeEventListener('financial-data-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener(`${domainId}-data-updated`, handleUpdate as any)
    }
  }, [domainId])

  // NOW SAFE TO HAVE CONDITIONAL RETURNS
  
  // Special case for Pets - redirect to new pets page
  useEffect(() => {
    if (domainId === 'pets') {
      router.push('/pets')
    }
  }, [domainId, router])

  // Special case for Nutrition - redirect to new nutrition page
  useEffect(() => {
    if (domainId === 'nutrition') {
      router.push('/nutrition')
    }
  }, [domainId, router])

  // Special case for Digital Life - redirect to new digital page
  useEffect(() => {
    if (domainId === 'digital') {
      router.push('/digital')
    }
  }, [domainId, router])

  // Special case for Health - redirect to new health page
  useEffect(() => {
    if (domainId === 'health') {
      router.push('/health')
    }
  }, [domainId, router])

  // Special case for Insurance - redirect to new insurance page
  useEffect(() => {
    if (domainId === 'insurance') {
      router.push('/insurance')
    }
  }, [domainId, router])

  // Legal domain removed - now part of Document Manager (insurance domain)

  // Removed: Special case for Planning/Goals domain (domain has been deleted)
  
  // Domains that redirect to dedicated pages
  if (domainId === 'pets' || domainId === 'nutrition' || domainId === 'digital' || domainId === 'health' || domainId === 'insurance') {
    return <div className="container mx-auto p-6"><p>Redirecting...</p></div>
  }
  
  if (!domain) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4"><BackButton /></div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Domain not found</h1>
          <Button className="mt-4" onClick={() => router.push('/domains')}>
            Back to Domains
          </Button>
        </div>
      </div>
    )
  }

  // Safety check for domain fields
  if (!domain.fields || !Array.isArray(domain.fields) || domain.fields.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4"><BackButton /></div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Domain Configuration Error</h1>
          <p className="mt-2 text-muted-foreground">This domain is not properly configured.</p>
          <Button className="mt-4" onClick={() => router.push('/domains')}>
            Back to Domains
          </Button>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return null
  }

  // ✅ Use entries from useDomainEntries hook
  const items = entries || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const textareaField = domain.fields.find(f => f.type === 'textarea')
      await createEntry({
        domain: domainId,
        title: formData[domain.fields[0].name] || 'Untitled',
        description: textareaField ? formData[textareaField.name] : undefined,
        metadata: formData,
      })

      setFormData({})
      setIsAddDialogOpen(false)
      toast.success(`${domain.name} item created successfully!`)
    } catch (error) {
      console.error('Failed to create entry:', error)
      toast.error('Failed to create item. Please try again.')
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData(item.metadata)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const textareaField = domain.fields.find(f => f.type === 'textarea')
      await updateEntry({
        id: editingItem.id,
        title: formData[domain.fields[0].name] || 'Untitled',
        description: textareaField ? formData[textareaField.name] : undefined,
        metadata: formData,
      })

      setFormData({})
      setEditingItem(null)
      setIsEditDialogOpen(false)
      toast.success(`${domain.name} item updated successfully!`)
    } catch (error) {
      console.error('Failed to update entry:', error)
      toast.error('Failed to update item. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await removeEntry(id)
      toast.success(`${domain.name} item deleted successfully!`)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      toast.error('Failed to delete item. Please try again.')
      // Rollback on error
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Special case for Mindfulness - render full app
  if (domainId === 'mindfulness') {
    return <MindfulnessAppFull />
  }

  // Special case for Relationships - render full manager
  if (domainId === 'relationships') {
    return <RelationshipsManager />
  }

  // Special case for Home - render property manager
  if (domainId === 'home') {
    return <HomePageWrapper />
  }

  // Special case for Fitness - render fitness tracker
  if (domainId === 'fitness') {
    return <FitnessTrackerFull />
  }

  // Special case for Appliances - render tracker
  if (domainId === 'appliances') {
    return (
      <div className="container mx-auto py-8 px-4">
        <ApplianceTrackerAutoTrack />
      </div>
    )
  }


  // Special case for Vehicles - render AutoTrack Pro
  if (domainId === 'vehicles') {
    return <VehicleTrackerAutoTrack />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/domains" className="hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4" />
          Domains
        </Link>
        <span>/</span>
        <span className="text-foreground">{domain.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-16 w-16 rounded-xl ${domain.color} flex items-center justify-center text-white text-2xl font-bold`}>
            {items.length}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{domain.name}</h1>
            <p className="text-muted-foreground">{domain.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {domainId === 'financial' && (
            <Button variant="outline" asChild>
              <Link href="/finance">
                Enhanced View
              </Link>
            </Button>
          )}
          
          {/* ✨ Share Button - Share all entries from this domain */}
          {items.length > 0 && (
            <QuickShareButton
              data={items}
              domain={domainId}
              size="md"
              variant="outline"
            />
          )}
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Tabs for Items, Documents, Log, Analytics, and Profiles */}
      <Tabs defaultValue={
        domainId === 'financial' ? 'profiles' : 'items'
      } className="w-full">
        <TabsList className={`grid w-full max-w-4xl ${
          domainId === 'financial'
            ? (DOMAIN_LOGGING_CONFIGS[domainId]?.enabled ? 'grid-cols-5' : 'grid-cols-4')
            : (DOMAIN_LOGGING_CONFIGS[domainId]?.enabled ? 'grid-cols-4' : 'grid-cols-3')
        }`}>
          {domainId === 'financial' && (
            <TabsTrigger value="profiles">
              <Layers className="h-4 w-4 mr-2" />
              Bills
            </TabsTrigger>
          )}
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          {DOMAIN_LOGGING_CONFIGS[domainId]?.enabled && (
            <TabsTrigger value="log">
              <Zap className="h-4 w-4 mr-2" />
              Quick Log
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Mindfulness tabs removed - mindfulness has early return and never reaches here */}

        {/* Profiles Tab - Only Financial reaches here (home/vehicles/appliances have early returns) */}
        {domainId === 'financial' && (
          <TabsContent value="profiles" className="mt-6">
            {domainId === 'financial' && (
              <Tabs defaultValue="loans" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="loans">Loans</TabsTrigger>
                  <TabsTrigger value="bills">Bills</TabsTrigger>
                </TabsList>
                <TabsContent value="loans" className="mt-6">
                  <LoansManager />
                </TabsContent>
                <TabsContent value="bills" className="mt-6">
                  <BillsManager />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        )}

        <TabsContent value="items" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Loading {domain.name.toLowerCase()} items...</p>
              </CardContent>
            </Card>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingIds.has(item.id)}
                        >
                          {deletingIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {Object.entries(item.metadata).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Updated {formatDate(item.updatedAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className={`h-16 w-16 rounded-xl ${domain.color} opacity-20 mb-4`} />
                <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first {domain.name.toLowerCase()} item
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DomainDocumentsTab domainId={domainId} policyId={policyId || undefined} />
        </TabsContent>

        {DOMAIN_LOGGING_CONFIGS[domainId]?.enabled && (
          <TabsContent value="log" className="mt-6">
            <DomainQuickLog domainId={domainId} />
          </TabsContent>
        )}

        <TabsContent value="analytics" className="mt-6">
          {items.length > 0 ? (
            <DomainVisualizations items={items} domainName={domain.name} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add some items to see analytics and insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {domain.name} Item</DialogTitle>
            <DialogDescription>
              Fill in the details for your new {domain.name.toLowerCase()} entry
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {domain.fields && Array.isArray(domain.fields) && domain.fields.map((field) => {
                if (!field || !field.name || !field.label) return null
                
                return (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options && Array.isArray(field.options) && field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <DateInput
                      required={false}
                      value={formData[field.name] || '2025-10-06'}
                      onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                    />
                  ) : field.type === 'time' ? (
                    <input
                      type="time"
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      autoComplete="off"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {domain.name} Item</DialogTitle>
            <DialogDescription>
              Update the details for this {domain.name.toLowerCase()} entry
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {domain.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <DateInput
                      required={false}
                      value={formData[field.name] || '2025-10-06'}
                      onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                    />
                  ) : field.type === 'time' ? (
                    <input
                      type="time"
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      autoComplete="off"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}





















