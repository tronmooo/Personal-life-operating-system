'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Home as HomeIcon, Trash2, Edit } from 'lucide-react'
import { AddHomeDialog } from '@/components/home/add-home-dialog'
import { EditHomeDialog } from '@/components/home/edit-home-dialog'
import { DomainBackButton } from '@/components/ui/domain-back-button'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { Skeleton } from '@/components/ui/skeleton'

interface Home {
  id: string
  name: string
  address: string
  type: string
  purchaseDate: string
  propertyValue: number
  totalMaintenanceTasks: number
  totalAssets: number
  totalProjects: number
  totalDocuments: number
}

export function HomePageWrapper() {
  const router = useRouter()
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useDomainEntries('home')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingHome, setEditingHome] = useState<Home | null>(null)

  // Transform entries to homes with real-time calculated counts
  const homes = entries
    .filter(item => item.metadata?.type === 'property')
    .map(property => {
      // Calculate counts from child entries
      const maintenanceTasks = entries.filter(item => 
        item.metadata?.itemType === 'maintenance-task' && item.metadata?.homeId === property.id
      ).length
      
      const assets = entries.filter(item => 
        item.metadata?.itemType === 'asset' && item.metadata?.homeId === property.id
      ).length
      
      const projects = entries.filter(item => 
        item.metadata?.itemType === 'project' && item.metadata?.homeId === property.id
      ).length
      
      const documents = entries.filter(item => 
        item.metadata?.itemType === 'document' && item.metadata?.homeId === property.id
      ).length

      return {
        id: property.id,
        name: property.title || property.metadata?.name || 'Unnamed Property',
        address: property.metadata?.address || property.description || '',
        type: property.metadata?.propertyType || property.metadata?.type || 'primary',
        purchaseDate: property.metadata?.purchaseDate || '',
        propertyValue: parseFloat(String(property.metadata?.propertyValue || property.metadata?.value || 0)) || 0,
        totalMaintenanceTasks: maintenanceTasks,
        totalAssets: assets,
        totalProjects: projects,
        totalDocuments: documents
      } as Home
    })

  const handleAddHome = async (home: Home) => {
    await createEntry({
      domain: 'home',
      title: home.name || home.address,
      description: home.address,
      metadata: {
        name: home.name,
        address: home.address,
        type: 'property',
        propertyType: home.type,
        purchaseDate: home.purchaseDate,
        propertyValue: home.propertyValue,
        value: home.propertyValue
      }
    })
    setShowAddDialog(false)
  }

  const handleEditHome = async (home: Home) => {
    await updateEntry({
      id: home.id,
      title: home.name || home.address,
      description: home.address,
      metadata: {
        name: home.name,
        address: home.address,
        type: 'property',
        propertyType: home.type,
        purchaseDate: home.purchaseDate,
        propertyValue: home.propertyValue,
        value: home.propertyValue
      }
    })
    setShowEditDialog(false)
    setEditingHome(null)
  }

  const handleDeleteHome = async (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      await deleteEntry(id)
    }
  }

  const openEditDialog = (home: Home) => {
    setEditingHome(home)
    setShowEditDialog(true)
  }

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <DomainBackButton variant="light" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl">
                <HomeIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Property Manager</h1>
                <p className="text-purple-100 text-sm md:text-base">Manage your properties, maintenance, and assets</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6">
            <HomeIcon className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-xl md:text-2xl font-bold">My Properties</h1>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (homes.length === 0) {
    return (
      <>
        <AddHomeDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onAdd={handleAddHome}
        />
        {editingHome && (
          <EditHomeDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            home={editingHome}
            onEdit={handleEditHome}
          />
        )}
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 md:p-6">
          <div className="max-w-md mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <DomainBackButton />
            </div>
            
            <Card className="w-full p-8 md:p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
                  <HomeIcon className="h-12 w-12 md:h-16 md:w-16 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-white">No Homes Added Yet</h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8">
                Get started by adding your first property
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                Add Your First Home
              </Button>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AddHomeDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onAdd={handleAddHome}
      />
      {editingHome && (
        <EditHomeDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          home={editingHome}
          onEdit={handleEditHome}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <DomainBackButton variant="light" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl">
                <HomeIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Property Manager</h1>
                <p className="text-purple-100 text-sm md:text-base">Manage your properties, maintenance, and assets</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-xl md:text-2xl font-bold">My Properties</h1>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {homes.map((home) => (
              <Card 
                key={home.id}
                className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow relative group"
              >
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(home)
                    }}
                    className="h-8 w-8 bg-white dark:bg-slate-800 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteHome(home.id)
                    }}
                    className="h-8 w-8 bg-white dark:bg-slate-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                <div 
                  className="cursor-pointer"
                  onClick={() => router.push(`/home/${home.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <HomeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="text-lg font-bold text-purple-600">${home.propertyValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{home.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{home.address}</p>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Maintenance</p>
                      <p className="text-lg font-semibold">{home.totalMaintenanceTasks || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assets</p>
                      <p className="text-lg font-semibold">{home.totalAssets || 0}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}












