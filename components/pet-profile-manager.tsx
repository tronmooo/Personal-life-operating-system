'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Edit, Trash2, PawPrint, Calendar, Weight, 
  Activity, Heart, Info, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'

interface PetProfile {
  id: string
  name: string
  type: string // Dog, Cat, Bird, etc.
  breed?: string
  birthDate?: string
  adoptionDate?: string
  weight?: number
  color?: string
  microchipId?: string
  photo?: string // Base64 or URL
  notes?: string
  createdAt: string
}

interface PetProfileManagerProps {
  onSelectPet: (petId: string | null) => void
  selectedPetId: string | null
}

export function PetProfileManager({ onSelectPet, selectedPetId }: PetProfileManagerProps) {
  const [pets, setPets] = useState<PetProfile[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null)
  const [formData, setFormData] = useState<Partial<PetProfile>>({})

  // Load pets from Supabase
  useEffect(() => {
    const loadPets = async () => {
      try {
        
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Fallback to IndexedDB for unauthenticated users
          const { idbGet } = await import('@/lib/utils/idb-cache')
          const stored = await idbGet<PetProfile[]>('lifehub-pet-profiles')
          if (stored) {
            setPets(stored)
          }
          return
        }

        // Load from Supabase
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading pets:', error)
          return
        }

        // Transform to expected format
        const transformedPets: PetProfile[] = data.map((pet: any) => ({
          id: pet.id,
          name: pet.name,
          type: pet.species,
          breed: pet.breed,
          birthDate: pet.birth_date,
          adoptionDate: pet.metadata?.adoptionDate,
          weight: pet.weight,
          color: pet.metadata?.color,
          microchipId: pet.microchip_number,
          notes: pet.metadata?.notes,
          createdAt: pet.created_at
        }))

        setPets(transformedPets)
      } catch (e) {
        console.error('Failed to load pet profiles:', e)
      }
    }
    loadPets()
  }, [])

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const newPet: PetProfile = {
        id: `pet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name || 'Unnamed Pet',
        type: formData.type || 'Other',
        breed: formData.breed,
        birthDate: formData.birthDate,
        adoptionDate: formData.adoptionDate,
        weight: formData.weight,
        color: formData.color,
        microchipId: formData.microchipId,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      }
      
      if (user) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('pets')
          .insert({
            user_id: user.id,
            name: newPet.name,
            species: newPet.type,
            breed: newPet.breed,
            birth_date: newPet.birthDate,
            weight: newPet.weight,
            microchip_number: newPet.microchipId,
            metadata: {
              adoptionDate: newPet.adoptionDate,
              color: newPet.color,
              notes: newPet.notes
            }
          })
          .select()
          .single()

        if (error) {
          console.error('Error adding pet:', error)
          alert('Failed to add pet. Please try again.')
          return
        }

        // Use the Supabase-generated ID
        newPet.id = data.id
      } else {
        // Fallback to IndexedDB
        const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<PetProfile[]>('lifehub-pet-profiles') || []
        stored.push(newPet)
        await idbSet('lifehub-pet-profiles', stored)
      }
      
      setPets([...pets, newPet])
      setFormData({})
      setIsAddDialogOpen(false)
      
      // Auto-select the new pet
      onSelectPet(newPet.id)
    } catch (error) {
      console.error('Failed to add pet:', error)
      alert('Failed to add pet. Please try again.')
    }
  }

  const handleEditPet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPet) return

    try {
      
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from('pets')
          .update({
            name: formData.name ?? editingPet.name,
            species: formData.type ?? editingPet.type,
            breed: formData.breed ?? editingPet.breed,
            birth_date: formData.birthDate ?? editingPet.birthDate,
            weight: formData.weight ?? editingPet.weight,
            microchip_number: formData.microchipId ?? editingPet.microchipId,
            metadata: {
              adoptionDate: formData.adoptionDate ?? editingPet.adoptionDate,
              color: formData.color ?? editingPet.color,
              notes: formData.notes ?? editingPet.notes
            }
          })
          .eq('id', editingPet.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating pet:', error)
          alert('Failed to update pet. Please try again.')
          return
        }
      } else {
        // Fallback to IndexedDB
        const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<PetProfile[]>('lifehub-pet-profiles') || []
        const updated = stored.map(pet => 
          pet.id === editingPet.id ? { ...pet, ...formData } : pet
        )
        await idbSet('lifehub-pet-profiles', updated)
      }

      const updatedPets = pets.map(pet => 
        pet.id === editingPet.id 
          ? { ...pet, ...formData }
          : pet
      )
      setPets(updatedPets)
      setFormData({})
      setEditingPet(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Failed to update pet:', error)
      alert('Failed to update pet. Please try again.')
    }
  }

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet profile?')) return

    try {
      
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Delete from Supabase
        const { error } = await supabase
          .from('pets')
          .delete()
          .eq('id', petId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error deleting pet:', error)
          alert('Failed to delete pet. Please try again.')
          return
        }
      } else {
        // Fallback to IndexedDB
        const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<PetProfile[]>('lifehub-pet-profiles') || []
        const filtered = stored.filter(p => p.id !== petId)
        await idbSet('lifehub-pet-profiles', filtered)
      }

      setPets(pets.filter(p => p.id !== petId))
      if (selectedPetId === petId) {
        onSelectPet(null)
      }
    } catch (error) {
      console.error('Failed to delete pet:', error)
      alert('Failed to delete pet. Please try again.')
    }
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    
    if (years === 0) {
      return `${months + (months <= 0 ? 12 : 0)} months`
    }
    if (months < 0) {
      return `${years - 1} years, ${12 + months} months`
    }
    return years === 1 ? '1 year' : `${years} years`
  }

  const selectedPet = pets.find(p => p.id === selectedPetId)

  return (
    <div className="space-y-6">
      {/* Pet Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Pet Profiles
              </CardTitle>
              <CardDescription>
                Select a pet to view their specific logs and information
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pets yet. Add your first furry friend!</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Pet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <Card 
                  key={pet.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPetId === pet.id 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : ''
                  }`}
                  onClick={() => onSelectPet(pet.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {pet.type === 'Dog' && '🐕'}
                          {pet.type === 'Cat' && '🐈'}
                          {pet.type === 'Bird' && '🦜'}
                          {pet.type === 'Fish' && '🐠'}
                          {pet.type === 'Rabbit' && '🐰'}
                          {!['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit'].includes(pet.type) && '🐾'}
                          {pet.name}
                        </CardTitle>
                        <CardDescription>
                          {pet.breed || pet.type}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPet(pet)
                            setFormData(pet)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeletePet(pet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {pet.birthDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Age: {calculateAge(pet.birthDate)}</span>
                      </div>
                    )}
                    {pet.weight && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Weight className="h-4 w-4" />
                        <span>Weight: {pet.weight} lbs</span>
                      </div>
                    )}
                    {selectedPetId === pet.id && (
                      <Badge className="mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Pet Details */}
      {selectedPet && (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              {selectedPet.name}'s Profile
            </CardTitle>
            <CardDescription>Viewing logs and information for this pet</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">
                  <Info className="h-4 w-4 mr-2" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <Activity className="h-4 w-4 mr-2" />
                  Quick Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium">{selectedPet.type}</p>
                  </div>
                  {selectedPet.breed && (
                    <div>
                      <Label className="text-muted-foreground">Breed</Label>
                      <p className="font-medium">{selectedPet.breed}</p>
                    </div>
                  )}
                  {selectedPet.birthDate && (
                    <div>
                      <Label className="text-muted-foreground">Birth Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedPet.birthDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedPet.adoptionDate && (
                    <div>
                      <Label className="text-muted-foreground">Adoption Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedPet.adoptionDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedPet.weight && (
                    <div>
                      <Label className="text-muted-foreground">Current Weight</Label>
                      <p className="font-medium">{selectedPet.weight} lbs</p>
                    </div>
                  )}
                  {selectedPet.color && (
                    <div>
                      <Label className="text-muted-foreground">Color</Label>
                      <p className="font-medium">{selectedPet.color}</p>
                    </div>
                  )}
                  {selectedPet.microchipId && (
                    <div>
                      <Label className="text-muted-foreground">Microchip ID</Label>
                      <p className="font-medium font-mono text-xs">{selectedPet.microchipId}</p>
                    </div>
                  )}
                </div>
                {selectedPet.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm">{selectedPet.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Log activities below to see stats here!</p>
                  <p className="text-sm mt-2">Feeding schedule, weight trends, vet visits, etc.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Add Pet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Pet Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPet}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Pet Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g., Max"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
                  <select
                    id="type"
                    required
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Hamster">Hamster</option>
                    <option value="Guinea Pig">Guinea Pig</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  placeholder="e.g., Golden Retriever"
                  value={formData.breed || ''}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adoptionDate">Adoption Date</Label>
                  <Input
                    id="adoptionDate"
                    type="date"
                    value={formData.adoptionDate || ''}
                    onChange={(e) => setFormData({ ...formData, adoptionDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="e.g., 25"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Golden"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchipId">Microchip ID</Label>
                <Input
                  id="microchipId"
                  placeholder="e.g., 123456789012345"
                  value={formData.microchipId || ''}
                  onChange={(e) => setFormData({ ...formData, microchipId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Pet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pet Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPet}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Pet Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type <span className="text-destructive">*</span></Label>
                  <select
                    id="edit-type"
                    required
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Hamster">Hamster</option>
                    <option value="Guinea Pig">Guinea Pig</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-breed">Breed</Label>
                <Input
                  id="edit-breed"
                  value={formData.breed || ''}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-birthDate">Birth Date</Label>
                  <Input
                    id="edit-birthDate"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Weight (lbs)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                />
              </div>
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







