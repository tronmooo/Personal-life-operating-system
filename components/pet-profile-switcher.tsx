'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, Edit, Trash2, PawPrint, Dog, Cat, Bird, Fish, Rabbit,
  Heart, Calendar, Weight, Cake
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export interface PetProfile {
  id: string
  name: string
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'other'
  breed?: string
  birthday?: string
  weight?: number
  color?: string
  microchipId?: string
  adoptionDate?: string
  photoUrl?: string
}

interface PetProfileSwitcherProps {
  onPetSelected?: (pet: PetProfile | null) => void
  selectedPetId?: string
}

const PET_ICONS = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
  rabbit: Rabbit,
  other: PawPrint
}

const PET_COLORS = {
  dog: 'text-amber-600',
  cat: 'text-orange-600',
  bird: 'text-blue-600',
  fish: 'text-cyan-600',
  rabbit: 'text-gray-600',
  other: 'text-purple-600'
}

export function PetProfileSwitcher({ onPetSelected, selectedPetId }: PetProfileSwitcherProps) {
  const [pets, setPets] = useState<PetProfile[]>([])
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null)
  const [isAddingPet, setIsAddingPet] = useState(false)
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({
    type: 'dog'
  })

  // Load pets from Supabase (with IndexedDB fallback)
  useEffect(() => {
    const loadPets = async () => {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Load from Supabase pets table
        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (petData) {
          const profiles: PetProfile[] = petData.map(pet => ({
            id: pet.id,
            name: pet.name,
            type: (pet.species || 'dog') as PetProfile['type'],
            breed: pet.breed || undefined,
            birthday: pet.birth_date || undefined,
            weight: pet.metadata?.weight,
            color: pet.metadata?.color,
            microchipId: pet.microchip_number || undefined,
            adoptionDate: pet.metadata?.adoptionDate
          }))
          
          setPets(profiles)
          
          // Auto-select first pet or the provided selectedPetId
          if (profiles.length > 0) {
            const petToSelect = selectedPetId 
              ? profiles.find((p: PetProfile) => p.id === selectedPetId)
              : profiles[0]
            setSelectedPet(petToSelect || profiles[0])
          }
        }
      } else {
        // Fallback to IndexedDB
        const { idbGet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<PetProfile[]>('lifehub-pet-profiles')
        if (stored) {
          try {
            setPets(stored)
            
            // Auto-select first pet or the provided selectedPetId
            if (stored.length > 0) {
              const petToSelect = selectedPetId 
                ? stored.find((p: PetProfile) => p.id === selectedPetId)
                : stored[0]
              setSelectedPet(petToSelect || stored[0])
            }
          } catch (e) {
            console.error('Failed to load pet profiles:', e)
          }
        }
      }
    }
    loadPets()
  }, [selectedPetId])

  // Notify parent when pet changes
  useEffect(() => {
    if (onPetSelected) {
      onPetSelected(selectedPet)
    }
  }, [selectedPet, onPetSelected])

  // Save pets to Supabase (with IndexedDB fallback)
  const savePets = async (updatedPets: PetProfile[]) => {
    setPets(updatedPets)
    
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Fallback to IndexedDB
      const { idbSet } = await import('@/lib/utils/idb-cache')
      await idbSet('lifehub-pet-profiles', updatedPets)
    }
    // Note: Actual saves to Supabase happen in handleAddPet and handleDeletePet
  }

  // Add new pet
  const handleAddPet = async () => {
    if (!newPet.name) {
      alert('Please enter a pet name')
      return
    }

    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Save to Supabase pets table
      const { data: newPetData } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: newPet.name,
          species: newPet.type || 'dog',
          breed: newPet.breed || null,
          birth_date: newPet.birthday || null,
          microchip_number: newPet.microchipId || null,
          metadata: {
            weight: newPet.weight,
            color: newPet.color,
            adoptionDate: newPet.adoptionDate
          }
        })
        .select()
        .single()

      if (newPetData) {
        const pet: PetProfile = {
          id: newPetData.id,
          name: newPet.name!,
          type: (newPet.type as PetProfile['type']) || 'dog',
          breed: newPet.breed,
          birthday: newPet.birthday,
          weight: newPet.weight,
          color: newPet.color,
          microchipId: newPet.microchipId,
          adoptionDate: newPet.adoptionDate,
        }

        const updatedPets = [...pets, pet]
        setPets(updatedPets)
        setSelectedPet(pet)
      }
    } else {
      // Fallback to IndexedDB
      const pet: PetProfile = {
        id: Date.now().toString(),
        name: newPet.name,
        type: (newPet.type as PetProfile['type']) || 'dog',
        breed: newPet.breed,
        birthday: newPet.birthday,
        weight: newPet.weight,
        color: newPet.color,
        microchipId: newPet.microchipId,
        adoptionDate: newPet.adoptionDate,
      }

      const updatedPets = [...pets, pet]
      savePets(updatedPets)
      setSelectedPet(pet)
    }

    setIsAddingPet(false)
    setNewPet({ type: 'dog' })
  }

  // Delete pet
  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet profile?')) return

    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Delete from Supabase
      await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
        .eq('user_id', user.id)
    } else {
      // Fallback to IndexedDB
      const updatedPets = pets.filter(p => p.id !== petId)
      await savePets(updatedPets)
    }

    const updatedPets = pets.filter(p => p.id !== petId)
    setPets(updatedPets)

    if (selectedPet?.id === petId) {
      setSelectedPet(updatedPets[0] || null)
    }
  }

  // Calculate age
  const calculateAge = (birthday?: string) => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--
    }
    return years
  }

  const PetIcon = selectedPet ? PET_ICONS[selectedPet.type] : PawPrint
  const petColor = selectedPet ? PET_COLORS[selectedPet.type] : 'text-purple-600'

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-purple-600" />
            Pet Profiles
          </div>
          <Dialog open={isAddingPet} onOpenChange={setIsAddingPet}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Pet Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Pet Name *</Label>
                  <Input
                    placeholder="e.g., Max, Luna, Charlie"
                    value={newPet.name || ''}
                    onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Pet Type *</Label>
                  <Select
                    value={newPet.type}
                    onValueChange={(value) => setNewPet({ ...newPet, type: value as PetProfile['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">🐕 Dog</SelectItem>
                      <SelectItem value="cat">🐈 Cat</SelectItem>
                      <SelectItem value="bird">🐦 Bird</SelectItem>
                      <SelectItem value="fish">🐠 Fish</SelectItem>
                      <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                      <SelectItem value="other">🐾 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Breed</Label>
                  <Input
                    placeholder="e.g., Golden Retriever"
                    value={newPet.breed || ''}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Birthday</Label>
                    <Input
                      type="date"
                      value={newPet.birthday || ''}
                      onChange={(e) => setNewPet({ ...newPet, birthday: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Weight (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 50"
                      value={newPet.weight || ''}
                      onChange={(e) => setNewPet({ ...newPet, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Color/Markings</Label>
                  <Input
                    placeholder="e.g., Brown with white spots"
                    value={newPet.color || ''}
                    onChange={(e) => setNewPet({ ...newPet, color: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Microchip ID</Label>
                  <Input
                    placeholder="e.g., 123456789012345"
                    value={newPet.microchipId || ''}
                    onChange={(e) => setNewPet({ ...newPet, microchipId: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Adoption Date</Label>
                  <Input
                    type="date"
                    value={newPet.adoptionDate || ''}
                    onChange={(e) => setNewPet({ ...newPet, adoptionDate: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddPet} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pets yet. Add your first pet!</p>
            <Button 
              onClick={() => setIsAddingPet(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pet Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pet Selector */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Select Pet
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {pets.map((pet) => {
                  const Icon = PET_ICONS[pet.type]
                  const isSelected = selectedPet?.id === pet.id
                  return (
                    <Button
                      key={pet.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`h-auto py-3 flex flex-col items-center gap-2 ${
                        !isSelected && PET_COLORS[pet.type]
                      }`}
                      onClick={() => setSelectedPet(pet)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{pet.name}</span>
                      {pet.breed && (
                        <span className="text-xs opacity-70">{pet.breed}</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Selected Pet Details */}
            {selectedPet && (
              <Card className="bg-white dark:bg-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${petColor}`}>
                        <PetIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedPet.name}</h3>
                        {selectedPet.breed && (
                          <p className="text-sm text-muted-foreground">{selectedPet.breed}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeletePet(selectedPet.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedPet.birthday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cake className="h-4 w-4 text-pink-600" />
                      <span className="font-medium">Age:</span>
                      <span className="text-muted-foreground">
                        {calculateAge(selectedPet.birthday)} years old
                      </span>
                    </div>
                  )}

                  {selectedPet.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Weight className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Weight:</span>
                      <span className="text-muted-foreground">{selectedPet.weight} lbs</span>
                    </div>
                  )}

                  {selectedPet.color && (
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Color:</span>
                      <span className="text-muted-foreground">{selectedPet.color}</span>
                    </div>
                  )}

                  {selectedPet.microchipId && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono text-xs">
                        🆔 {selectedPet.microchipId}
                      </Badge>
                    </div>
                  )}

                  {selectedPet.adoptionDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Adopted:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedPet.adoptionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <Badge className={petColor}>
                    {selectedPet.type.charAt(0).toUpperCase() + selectedPet.type.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
