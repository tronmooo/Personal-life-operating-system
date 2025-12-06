'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft } from 'lucide-react'
import { ProfileTab } from '@/components/pets/profile-tab'
import { VaccinationsTab } from '@/components/pets/vaccinations-tab'
import { DocumentsTab } from '@/components/pets/documents-tab'
import { CostsTab } from '@/components/pets/costs-tab'
import { AIVetTab } from '@/components/pets/ai-vet-tab'

type Tab = 'profile' | 'vaccinations' | 'documents' | 'costs' | 'aivet'

export function PetDetailPageClient({ petId }: { petId: string }) {
  const router = useRouter()
  const [pet, setPet] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  useEffect(() => {
    // Load pet data from API
    const loadPet = async () => {
      try {
        const response = await fetch(`/api/pets?petId=${petId}`)
        if (!response.ok) {
          router.push('/pets')
          return
        }
        const { pet: petData } = await response.json()
        setPet(petData)
      } catch (error) {
        console.error('Error loading pet:', error)
        router.push('/pets')
      }
    }
    loadPet()
  }, [petId, router])

  const handleDeletePet = async () => {
    if (confirm(`Are you sure you want to delete ${pet?.name}?`)) {
      try {
        const response = await fetch(`/api/pets?petId=${petId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          router.push('/pets')
        } else {
          alert('Failed to delete pet')
        }
      } catch (error) {
        console.error('Error deleting pet:', error)
        alert('Failed to delete pet')
      }
    }
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile' },
    { id: 'vaccinations' as Tab, label: 'Vaccinations' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'costs' as Tab, label: 'Costs' },
    { id: 'aivet' as Tab, label: 'AI Vet' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/pets')}
              className="rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">{pet.name}</h1>
              <p className="text-xl text-muted-foreground mt-1">{pet.species} • {pet.breed || 'Mixed'}</p>
            </div>
          </div>
          <Button 
            variant="destructive"
            onClick={handleDeletePet}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Pet
          </Button>
        </div>

        {/* Tabs */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-tab={tab.id}
                  className={`px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab pet={pet} />}
            {activeTab === 'vaccinations' && <VaccinationsTab petId={pet.id} petName={pet.name} />}
            {activeTab === 'documents' && <DocumentsTab petId={pet.id} petName={pet.name} />}
            {activeTab === 'costs' && <CostsTab petId={pet.id} />}
            {activeTab === 'aivet' && <AIVetTab pet={pet} />}
          </div>
        </Card>
      </div>
    </div>
  )
}
















