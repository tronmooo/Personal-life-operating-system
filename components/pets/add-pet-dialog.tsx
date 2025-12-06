'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface AddPetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPetAdded: (pet: any) => void
}

export function AddPetDialog({ open, onOpenChange, onPetAdded }: AddPetDialogProps) {
  const { addData } = useData()
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    microchipId: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Pet name is required')
      return
    }

    try {
      // Save to dedicated pets table
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          species: formData.species || 'Pet',
          breed: formData.breed,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          color: formData.color,
          microchip_number: formData.microchipId,
          metadata: {
            age: formData.age
          }
        })
      })

      if (!response.ok) throw new Error('Failed to save pet')

      const { pet } = await response.json()
      console.log('✅ Pet profile saved to database')
      
      // Notify parent (will reload from database)
      onPetAdded(pet)
      
      setFormData({
        name: '',
        species: '',
        breed: '',
        age: '',
        weight: '',
        color: '',
        microchipId: ''
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving pet:', error)
      alert('Failed to save pet. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Add New Pet</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription>
            Fill in your pet's information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter pet name"
                required
              />
            </div>

            <div>
              <Label htmlFor="species">Species (Dog, Cat, etc.)</Label>
              <Input
                id="species"
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                placeholder="Dog, Cat, Bird, etc."
              />
            </div>

            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Enter breed"
              />
            </div>

            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 3 years"
              />
            </div>

            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g., 25 lbs"
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Enter color"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="microchipId">Microchip ID</Label>
            <Input
              id="microchipId"
              value={formData.microchipId}
              onChange={(e) => setFormData({ ...formData, microchipId: e.target.value })}
              placeholder="Enter microchip ID"
              className="w-full"
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Pet
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

