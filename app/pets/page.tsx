'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Camera, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AddPetDialog } from '@/components/pets/add-pet-dialog'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  age?: string
  weight?: string
  color?: string
  microchipId?: string
  vaccinations: number
  documents: number
  totalCosts: number
}

export default function PetsPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { getData, reloadDomain } = useData()

  // Load pets from dedicated pets table
  const loadPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (!response.ok) throw new Error('Failed to load pets')
      
      const { pets: petsData } = await response.json()
      
      // Load counts for vaccinations, documents, costs for each pet
      const petsWithCounts = await Promise.all(
        (petsData || []).map(async (pet: any) => {
          try {
            const [vaccsRes, costsRes] = await Promise.all([
              fetch(`/api/pets/vaccinations?petId=${pet.id}`),
              fetch(`/api/pets/costs?petId=${pet.id}`)
            ])
            
            const vaccs = vaccsRes.ok ? (await vaccsRes.json()).vaccinations : []
            const costs = costsRes.ok ? (await costsRes.json()).costs : []

            // Fallbacks: include items saved via client components that use DataProvider/localStorage
            let vaccinationCount = vaccs.length
            try {
              const petsDomain = getData('pets') || []
              const extra = petsDomain.filter((i: any) => i.metadata?.itemType === 'vaccination' && i.metadata?.petId === pet.id)
              vaccinationCount = Math.max(vaccinationCount, extra.length)
            } catch (_) {}
            
            // Documents: count from domains table via DataProvider fallback
            let documentsCount = 0
            try {
              const petsDomain = getData('pets') || []
              const docs = petsDomain.filter((i: any) => i.metadata?.itemType === 'document' && i.metadata?.petId === pet.id)
              documentsCount = docs.length
            } catch (_) {}

            return {
              id: pet.id,
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              age: pet.birth_date ? calculateAge(pet.birth_date) : undefined,
              weight: pet.weight?.toString(),
              color: pet.color,
              microchipId: pet.microchip_number,
              vaccinations: vaccinationCount,
              documents: documentsCount,
              totalCosts: costs.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
            }
          } catch (err) {
            console.error('Error loading pet details:', err)
            return {
              id: pet.id,
              name: pet.name,
              species: pet.species,
              vaccinations: 0,
              documents: 0,
              totalCosts: 0
            }
          }
        })
      )
      
      setPets(petsWithCounts)
    } catch (error) {
      console.error('Error loading pets:', error)
      setPets([])
    }
  }
  
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const years = today.getFullYear() - birth.getFullYear()
    const months = today.getMonth() - birth.getMonth()
    if (years > 0) return `${years}y`
    return `${months}mo`
  }

  useEffect(() => {
    loadPets()
  }, [])

  useEffect(() => {
    const handler = () => loadPets()
    window.addEventListener('data-updated', handler)
    window.addEventListener('pets-data-updated', handler)
    return () => {
      window.removeEventListener('data-updated', handler)
      window.removeEventListener('pets-data-updated', handler)
    }
  }, [])

  const handlePetAdded = async (_pet: Pet) => {
    // After add dialog saves to DB, reload
    loadPets()
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  return (
    <>
      <AddPetDialog open={showAddDialog} onOpenChange={setShowAddDialog} onPetAdded={handlePetAdded} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <button
            onClick={() => router.push('/domains')}
            className="mb-2 sm:mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">My Pets</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your pet family</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full sm:w-auto"
              onClick={() => setShowAddDialog(true)}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Pet
            </Button>
          </div>

          {/* Empty State */}
          {pets.length === 0 ? (
            <Card className="p-16 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Camera className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">No Pets Added Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Manage all your pets' information in one place
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to add your first pet
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  onClick={() => setShowAddDialog(true)}
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Pet
                </Button>
              </div>
            </Card>
          ) : (
            /* Pets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <Card 
                  key={pet.id}
                  className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
                  onClick={() => router.push(`/pets/${pet.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {getInitial(pet.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold truncate">{pet.name}</h3>
                      <p className="text-muted-foreground text-sm">{pet.species}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vaccinations:</span>
                      <span className="font-semibold">{pet.vaccinations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Documents:</span>
                      <span className="font-semibold">{pet.documents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Costs:</span>
                      <span className="font-semibold">${(pet.totalCosts || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

