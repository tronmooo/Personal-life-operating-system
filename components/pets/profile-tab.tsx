'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Edit, Save, X, DollarSign } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface ProfileTabProps {
  pet: any
}

export function ProfileTab({ pet }: ProfileTabProps) {
  const [photoUrl, setPhotoUrl] = useState(pet.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [totalCosts, setTotalCosts] = useState(0)
  const [loadingCosts, setLoadingCosts] = useState(true)
  const [recentVisits, setRecentVisits] = useState<any[]>([])
  const [editForm, setEditForm] = useState({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    weight: pet.weight,
    color: pet.color,
    microchip_number: pet.microchip_number
  })

  // Load total costs and recent visits
  useEffect(() => {
    loadTotalCosts()
    
    const handleUpdate = () => loadTotalCosts()
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => window.removeEventListener('pets-data-updated', handleUpdate)
  }, [pet.id])

  const loadTotalCosts = async () => {
    try {
      setLoadingCosts(true)
      const response = await fetch(`/api/pets/costs?petId=${pet.id}`)
      if (response.ok) {
        const { costs } = await response.json()
        const total = costs.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
        setTotalCosts(total)
        
        // Get recent vet visits (last 3)
        const vetVisits = costs
          .filter((c: any) => c.cost_type === 'vet')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
        setRecentVisits(vetVisits)
      }
    } catch (error) {
      console.error('Error loading costs:', error)
    } finally {
      setLoadingCosts(false)
    }
  }

  const handlePhotoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' as any
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        setUploading(true)
        try {
          // Upload to storage
          const formData = new FormData()
          formData.append('file', file)
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (!uploadRes.ok) throw new Error('Upload failed')
          
          const { url } = await uploadRes.json()
          setPhotoUrl(url)
          
          // Update pet record
          await fetch('/api/pets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: pet.id,
              photo_url: url
            })
          })
          
          console.log('✅ Pet photo uploaded')
        } catch (error) {
          console.error('Error uploading photo:', error)
          alert('Failed to upload photo')
        } finally {
          setUploading(false)
        }
      }
    }
    
    input.click()
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/pets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pet.id,
          ...editForm
        })
      })

      if (!response.ok) throw new Error('Failed to update pet')

      // Update local state
      Object.assign(pet, editForm)
      setIsEditing(false)
      
      // Trigger event for other components
      window.dispatchEvent(new Event('pets-data-updated'))
    } catch (error) {
      console.error('Error updating pet:', error)
      alert('Failed to update pet')
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight,
      color: pet.color,
      microchip_number: pet.microchip_number
    })
    setIsEditing(false)
  }

  const fields = [
    { label: 'Species', value: pet.species },
    { label: 'Breed', value: pet.breed },
    { label: 'Weight', value: pet.weight ? `${pet.weight} lbs` : null },
    { label: 'Color', value: pet.color },
    { label: 'Microchip', value: pet.microchip_number },
  ]

  return (
    <div className="space-y-6">
      {/* Total Costs Card */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Costs
            </p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {loadingCosts ? '...' : `$${totalCosts.toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime spending on {pet.name}
            </p>
          </div>
          <div className="text-right">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Switch to costs tab (parent component handles this)
                const costsTab = document.querySelector('[data-tab="costs"]') as HTMLElement
                costsTab?.click()
              }}
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Vet Visits */}
      {recentVisits.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏥</span> Recent Vet Visits
          </h3>
          <div className="space-y-3">
            {recentVisits.map((visit, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <p className="font-medium">{visit.description || 'Vet Visit'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(visit.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ${Number(visit.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          {recentVisits.length < 3 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              {recentVisits.length === 1 ? '1 visit recorded' : `${recentVisits.length} visits recorded`}
            </p>
          )}
        </Card>
      )}

      {/* Edit/Save Buttons */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleCancelEdit} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Photo Upload */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold mb-4">Pet Photo</h3>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt={pet.name} className="w-32 h-32 rounded-lg object-cover" />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
              {(editForm.name || pet.name).charAt(0).toUpperCase()}
            </div>
          )}
          <Button onClick={handlePhotoUpload} className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={uploading}>
            <Camera className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
        </div>
      </Card>

      {/* Info Fields */}
      {isEditing ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Name</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="mt-2"
            />
          </Card>
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Species</Label>
            <Input
              value={editForm.species}
              onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
              className="mt-2"
            />
          </Card>
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Breed</Label>
            <Input
              value={editForm.breed || ''}
              onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
              className="mt-2"
            />
          </Card>
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Weight (lbs)</Label>
            <Input
              type="number"
              value={editForm.weight || ''}
              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
              className="mt-2"
            />
          </Card>
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Color</Label>
            <Input
              value={editForm.color || ''}
              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
              className="mt-2"
            />
          </Card>
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <Label className="text-sm text-muted-foreground">Microchip</Label>
            <Input
              value={editForm.microchip_number || ''}
              onChange={(e) => setEditForm({ ...editForm, microchip_number: e.target.value })}
              className="mt-2"
            />
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <Card key={field.label} className="p-6 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-sm text-muted-foreground mb-2">{field.label}</p>
              <p className="text-2xl font-bold">
                {field.value || 'Not specified'}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

