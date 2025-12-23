'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Anchor, 
  Home, 
  Gem, 
  Trophy, 
  Camera, 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Package,
  TrendingUp,
  Sparkles,
  StickyNote,
  ListChecks
} from 'lucide-react'
import { QuickNotesCard } from '@/components/dashboard/quick-notes-card'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'
import Image from 'next/image'
import { toast } from 'sonner'
import { DomainBackButton } from '@/components/ui/domain-back-button'
import Link from 'next/link'

interface MiscellaneousItem {
  id: string
  name: string
  category: string
  description?: string
  estimatedValue?: number
  purchasePrice?: number
  purchaseDate?: string
  condition?: string
  location?: string
  notes?: string
  notesList?: string[]
  images?: string[]
  createdAt: string
  updatedAt: string
}

const MISC_CATEGORIES = [
  { value: 'boat', label: '🚤 Boat/Watercraft', icon: Anchor, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'jewelry', label: '💎 Jewelry', icon: Gem, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'collectibles', label: '🏆 Collectibles', icon: Trophy, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'electronics', label: '📱 Electronics', icon: Camera, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'art', label: '🎨 Art/Decor', icon: Home, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'other', label: '📦 Other', icon: Package, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300' }
]

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'very-good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

export default function MiscellaneousPage() {
  const router = useRouter()
  const { getData, addData, updateData, deleteData } = useData()
  const [items, setItems] = useState<MiscellaneousItem[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<MiscellaneousItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [notesDialogItem, setNotesDialogItem] = useState<MiscellaneousItem | null>(null)

  // Helper function to normalize domain items
  const normalizeItems = useCallback((domainItems: unknown[]) => {
    if (!Array.isArray(domainItems)) return []
    
    // Filter out general notes entry from display items
    const assetItems = domainItems.filter((it: unknown) => {
      const item = it as Record<string, unknown>
      const metadata = item.metadata as Record<string, unknown> | undefined
      return metadata?.itemType !== 'general-notes'
    })
    
    return assetItems.map((it: unknown) => {
      const item = it as Record<string, unknown>
      const metadata = item.metadata as Record<string, unknown> | undefined
      return {
        id: item.id as string,
        name: (item.name || item.title || metadata?.name || '') as string,
        category: (item.category || metadata?.category || 'other') as string,
        description: (item.description || metadata?.description) as string | undefined,
        estimatedValue: typeof item.estimatedValue === 'number' ? item.estimatedValue : (typeof metadata?.estimatedValue === 'number' ? metadata.estimatedValue : undefined),
        purchasePrice: metadata?.purchasePrice as number | undefined,
        purchaseDate: metadata?.purchaseDate as string | undefined,
        condition: metadata?.condition as string | undefined,
        location: metadata?.location as string | undefined,
        images: metadata?.images as string[] | undefined,
        notes: metadata?.notes as string | undefined,
        notesList: Array.isArray(metadata?.notesList) ? metadata.notesList as string[] : [],
        createdAt: item.createdAt as string,
        updatedAt: item.updatedAt as string,
      }
    })
  }, [])

  // Load items from DataProvider - runs on mount AND when getData changes
  useEffect(() => {
    const domainItems = getData('miscellaneous') as unknown[]
    const normalized = normalizeItems(domainItems)
    setItems(normalized)

  }, [getData, normalizeItems])

  // 🔥 Listen for realtime data updates to refresh the list
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('🔄 Miscellaneous data updated via realtime:', event.detail?.action)
      // Re-fetch from getData after a small delay to ensure state is updated
      setTimeout(() => {
        const domainItems = getData('miscellaneous') as unknown[]
        const normalized = normalizeItems(domainItems)
        setItems(normalized)
      }, 100)
    }

    const handleDataProviderLoaded = () => {
      console.log('🔄 DataProvider loaded, refreshing miscellaneous items')
      const domainItems = getData('miscellaneous') as unknown[]
      const normalized = normalizeItems(domainItems)
      setItems(normalized)
    }

    window.addEventListener('miscellaneous-data-updated', handleDataUpdate as EventListener)
    window.addEventListener('data-provider-loaded', handleDataProviderLoaded)
    
    return () => {
      window.removeEventListener('miscellaneous-data-updated', handleDataUpdate as EventListener)
      window.removeEventListener('data-provider-loaded', handleDataProviderLoaded)
    }
  }, [getData, normalizeItems])

  const saveItems = (newItems: MiscellaneousItem[]) => {
    setItems(newItems)
  }

  const handleAddItem = async (itemData: Omit<MiscellaneousItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newItem: MiscellaneousItem = {
        ...itemData,
        id: crypto.randomUUID(), // ✅ Use proper UUID format
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // ✅ Optimistically update local state immediately for instant feedback
      setItems(prev => [newItem, ...prev])
      setIsAdding(false)

      // Save to DataProvider (this will persist to Supabase)
      await addData('miscellaneous', {
        id: newItem.id,
        title: newItem.name,
        description: newItem.description,
        metadata: {
          itemType: 'misc-asset',
          name: newItem.name,
          category: newItem.category,
          description: newItem.description,
          estimatedValue: newItem.estimatedValue,
          purchasePrice: newItem.purchasePrice,
          purchaseDate: newItem.purchaseDate,
          condition: newItem.condition,
          location: newItem.location,
          images: newItem.images,
          notes: newItem.notes,
          notesList: newItem.notesList || [],
        }
      })

      toast.success('Item added successfully!')
    } catch (error) {
      console.error('Failed to add item:', error)
      // ✅ Rollback on error
      setItems(prev => prev.filter(item => item.id !== itemData.name))
      toast.error('Failed to add item. Please try again.')
    }
  }

  const handleEditItem = async (itemData: MiscellaneousItem | Omit<MiscellaneousItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Type guard - if no id, treat as new item (shouldn't happen in edit, but for type safety)
    if (!('id' in itemData)) {
      await handleAddItem(itemData)
      return
    }
    
    // Store previous state for potential rollback
    const previousItems = [...items]
    
    try {
      const updatedItem = { ...itemData, updatedAt: new Date().toISOString() }
      
      // ✅ Optimistically update local state immediately
      setItems(prev => prev.map(item => 
        item.id === itemData.id ? updatedItem : item
      ))
      setEditingItem(null)

      // ✅ Use updateData for edits (not addData)
      await updateData('miscellaneous', itemData.id, {
        title: itemData.name,
        description: itemData.description,
        metadata: {
          itemType: 'misc-asset',
          name: itemData.name,
          category: itemData.category,
          description: itemData.description,
          estimatedValue: itemData.estimatedValue,
          purchasePrice: itemData.purchasePrice,
          purchaseDate: itemData.purchaseDate,
          condition: itemData.condition,
          location: itemData.location,
          images: itemData.images,
          notes: itemData.notes,
          notesList: itemData.notesList || [],
        }
      })

      toast.success('Item updated successfully!')
    } catch (error) {
      console.error('Failed to update item:', error)
      // ✅ Rollback on error
      setItems(previousItems)
      toast.error('Failed to update item. Please try again.')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    // ✅ Confirm before deleting
    const confirmed = typeof window !== 'undefined' && 
      window.confirm('Are you sure you want to delete this item? This action cannot be undone.')
    
    if (!confirmed) return

    // ✅ Store the item for potential rollback
    const itemToDelete = items.find(item => item.id === itemId)
    
    try {
      // ✅ Optimistically remove from local state immediately
      setItems(prev => prev.filter(item => item.id !== itemId))
      
      // Delete from DataProvider (this will persist to Supabase)
      await deleteData('miscellaneous', itemId)
      toast.success('Item deleted successfully!')
    } catch (error) {
      console.error('Failed to delete item:', error)
      // ✅ Rollback on error
      if (itemToDelete) {
        setItems(prev => [...prev, itemToDelete])
      }
      toast.error('Failed to delete item. Please try again.')
    }
  }

  const handleSaveNotes = async (itemId: string, notesList: string[]) => {
    try {
      const item = items.find(i => i.id === itemId)
      if (!item) return

      const updatedItem = { ...item, notesList, updatedAt: new Date().toISOString() }
      const updatedItems = items.map(i => i.id === itemId ? updatedItem : i)
      saveItems(updatedItems)

      // ✅ Use updateData for edits (not addData)
      await updateData('miscellaneous', item.id, {
        title: item.name,
        description: item.description,
        metadata: {
          itemType: 'misc-asset',
          name: item.name,
          category: item.category,
          description: item.description,
          estimatedValue: item.estimatedValue,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
          condition: item.condition,
          location: item.location,
          images: item.images,
          notes: item.notes,
          notesList: notesList,
        }
      })

      setNotesDialogItem(null)
      toast.success('Notes saved successfully!')
    } catch (error) {
      console.error('Failed to save notes:', error)
      toast.error('Failed to save notes. Please try again.')
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  // Use purchasePrice as fallback if estimatedValue is not set
  const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || item.purchasePrice || 0), 0)
  const categoryCounts = MISC_CATEGORIES.map(cat => ({
    ...cat,
    count: items.filter(item => item.category === cat.value).length
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-500">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back Button */}
        <DomainBackButton variant="light" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
              <Package className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Miscellaneous Assets</h1>
              <p className="text-sm md:text-base text-white/90">
                Track boats, collectibles, jewelry, and more
              </p>
            </div>
          </div>
        </div>

        {/* Quick Notes Section - New Card Component */}
        <QuickNotesCard />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Items</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {items.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Value</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                ${totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Categories</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {categoryCounts.filter(cat => cat.count > 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Avg Value</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                ${items.length > 0 ? Math.round(totalValue / items.length).toLocaleString() : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Item Button */}
        <div className="flex justify-center">
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-lg px-8 py-6 shadow-lg">
                <Plus className="h-6 w-6 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add Miscellaneous Item</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Track valuable items like boats, collectibles, jewelry, etc.
                </DialogDescription>
              </DialogHeader>
              <MiscellaneousItemForm 
                onSubmit={handleAddItem}
                onCancel={() => setIsAdding(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-md' 
              : 'bg-white/80 dark:bg-slate-800/80 text-foreground border-white/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
            }
          >
            All ({items.length})
          </Button>
          {categoryCounts.map(category => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value 
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-md' 
                : 'bg-white/80 dark:bg-slate-800/80 text-foreground border-white/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }
            >
              {category.label} ({category.count})
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const category = MISC_CATEGORIES.find(cat => cat.value === item.category)
              const IconComponent = category?.icon || Package
              const hasNotes = item.notesList && item.notesList.length > 0
              
              return (
                <Card key={item.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>{category?.label}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNotesDialogItem(item)}
                          className="text-violet-600 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/30 relative"
                          title="Manage notes"
                        >
                          <ListChecks className="h-4 w-4" />
                          {hasNotes && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.images && item.images.length > 0 && (
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image 
                          src={item.images[0]} 
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {(item.estimatedValue || item.purchasePrice) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-600 dark:text-green-400 text-xl">
                            ${(item.estimatedValue || item.purchasePrice)?.toLocaleString()}
                          </span>
                          {item.purchasePrice && !item.estimatedValue && (
                            <span className="text-xs text-muted-foreground">Purchase Price</span>
                          )}
                          {item.estimatedValue && (
                            <span className="text-xs text-muted-foreground">Estimated Value</span>
                          )}
                        </div>
                      </div>
                    )}
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {hasNotes && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                            {(item.notesList?.length ?? 0)} {(item.notesList?.length ?? 0) === 1 ? 'Note' : 'Notes'}
                          </span>
                        </div>
                        <ul className="text-xs text-violet-600 dark:text-violet-400 space-y-1 list-disc list-inside">
                          {item.notesList?.slice(0, 2).map((note, idx) => (
                            <li key={idx} className="truncate">{note}</li>
                          ))}
                          {(item.notesList?.length ?? 0) > 2 && (
                            <li className="text-violet-500 dark:text-violet-500 italic">
                              +{(item.notesList?.length ?? 0) - 2} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {item.condition && (
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                          {item.condition}
                        </Badge>
                      )}
                      {item.purchaseDate && (
                        <Badge variant="outline">
                          {format(new Date(item.purchaseDate), 'MMM yyyy')}
                        </Badge>
                      )}
                    </div>
                    {item.location && (
                      <p className="text-xs text-muted-foreground">
                        📍 {item.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-white/30 dark:border-slate-700 text-center py-12 shadow-lg">
            <CardContent>
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your valuable miscellaneous items
              </p>
              <Button 
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Item</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update the details for this miscellaneous item
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <MiscellaneousItemForm 
                item={editingItem}
                onSubmit={handleEditItem}
                onCancel={() => setEditingItem(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Notes Dialog */}
        <Dialog open={!!notesDialogItem} onOpenChange={() => setNotesDialogItem(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-violet-600" />
                Notes & Lists for {notesDialogItem?.name}
              </DialogTitle>
              <DialogDescription>
                Add notes, reminders, or lists for this item
              </DialogDescription>
            </DialogHeader>
            {notesDialogItem && (
              <NotesManager 
                item={notesDialogItem}
                onSave={(notesList) => handleSaveNotes(notesDialogItem.id, notesList)}
                onCancel={() => setNotesDialogItem(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

interface MiscellaneousItemFormProps {
  item?: MiscellaneousItem
  onSubmit: (data: MiscellaneousItem | Omit<MiscellaneousItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void
  onCancel: () => void
}

function MiscellaneousItemForm({ item, onSubmit, onCancel }: MiscellaneousItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'other',
    description: item?.description || '',
    estimatedValue: item?.estimatedValue?.toString() || '',
    purchasePrice: item?.purchasePrice?.toString() || '',
    purchaseDate: item?.purchaseDate || '',
    condition: item?.condition || 'good',
    location: item?.location || '',
    notes: item?.notes || ''
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>(item?.images || [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      images: uploadedImages
    }

    if (item) {
      onSubmit({ ...item, ...submitData })
    } else {
      onSubmit(submitData)
    }
  }

  const handleEstimate = async () => {
    setEstimating(true)
    try {
      // Upload images first if any
      const urls: string[] = [...uploadedImages]
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData()
          fd.append('file', files[i])
          fd.append('path', `misc/${Date.now()}-${i}-${files[i].name}`)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          const json = await res.json().catch(() => null)
          if (json?.url) urls.push(json.url)
        }
        setUploadedImages(urls)
      }

      const resp = await fetch('/api/estimate/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          purchaseDate: formData.purchaseDate || undefined,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          imageUrls: urls,
        })
      })
      const data = await resp.json()
      if (data?.estimatedValue) {
        setFormData(prev => ({ ...prev, estimatedValue: String(Math.round(data.estimatedValue)) }))
      }
    } finally {
      setEstimating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 2020 Sea Ray Boat"
            required
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category" className="text-white">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {MISC_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-white">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the item, its age, brand, unique features..."
          rows={4}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition" className="text-white">Condition *</Label>
        <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {CONDITION_OPTIONS.map((condition) => (
              <SelectItem key={condition.value} value={condition.value} className="text-white">
                {condition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchaseDate" className="text-white">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchasePrice" className="text-white">Purchase Price ($)</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            placeholder="0"
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Upload Images</Label>
        <Input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={(e) => setFiles(e.target.files)} 
          className="bg-slate-800 border-slate-600 text-white"
        />
        {uploadedImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {uploadedImages.map((url, idx) => (
              <div key={idx} className="relative h-20 w-20 rounded overflow-hidden">
                <Image src={url} alt={`preview-${idx}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="estimatedValue" className="text-white text-lg">AI Estimated Value ($)</Label>
          <Button 
            type="button" 
            onClick={handleEstimate} 
            disabled={estimating}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {estimating ? 'Estimating…' : 'Estimate Value'}
          </Button>
        </div>
        <Input
          id="estimatedValue"
          type="number"
          value={formData.estimatedValue}
          onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
          placeholder="0"
          className="bg-slate-800 border-slate-600 text-white text-2xl h-14"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-white">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Garage, Storage Unit"
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-white">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={2}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-white hover:bg-slate-800">
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}

interface NotesManagerProps {
  item: MiscellaneousItem
  onSave: (notesList: string[]) => void
  onCancel: () => void
}

function NotesManager({ item, onSave, onCancel }: NotesManagerProps) {
  const [notesList, setNotesList] = useState<string[]>(item.notesList || [])
  const [newNote, setNewNote] = useState('')

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotesList([...notesList, newNote.trim()])
      setNewNote('')
    }
  }

  const handleRemoveNote = (index: number) => {
    setNotesList(notesList.filter((_, i) => i !== index))
  }

  const handleEditNote = (index: number, newText: string) => {
    const updated = [...notesList]
    updated[index] = newText
    setNotesList(updated)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  return (
    <div className="space-y-4">
      {/* Add new note */}
      <div className="space-y-2">
        <Label>Add a new note</Label>
        <div className="flex gap-2">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a note or list item..."
            className="flex-1"
          />
          <Button 
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>Notes ({notesList.length})</span>
          {notesList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotesList([])}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </Label>
        
        {notesList.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
            {notesList.map((note, index) => (
              <div key={index} className="flex items-start gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm group">
                <div className="flex-1">
                  <Textarea
                    value={note}
                    onChange={(e) => handleEditNote(index, e.target.value)}
                    className="min-h-[60px] resize-none border-transparent hover:border-gray-300 focus:border-violet-500 transition-colors"
                    rows={2}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveNote(index)}
                  className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground">Add notes, reminders, or list items above</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSave(notesList)}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
        >
          <StickyNote className="h-4 w-4 mr-2" />
          Save Notes
        </Button>
      </div>
    </div>
  )
}

