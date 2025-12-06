'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Syringe, Camera, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Vaccination {
  id: string
  vaccineName: string
  dateGiven: string
  nextDueDate: string
  vetClinic?: string
  notes?: string
  recordPhoto?: string
}

interface VaccinationsTabProps {
  petId: string
  petName: string
}

export function VaccinationsTab({ petId, petName }: VaccinationsTabProps) {
  const { getData, addData, addEvent } = useData()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    vaccineName: '',
    dateGiven: '',
    nextDueDate: '',
    vetClinic: '',
    notes: '',
    recordPhoto: ''
  })

  const handlePhotoCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' as any
    
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFormData({ ...formData, recordPhoto: event.target?.result as string })
        }
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  const loadVaccinations = async () => {
    try {
      const response = await fetch(`/api/pets/vaccinations?petId=${petId}`)
      if (!response.ok) {
        console.error('Failed to load vaccinations')
        setVaccinations([])
        return
      }

      const { vaccinations: apiVaccinations } = await response.json()
      
      const petVaccinations = (apiVaccinations || []).map((vacc: any) => ({
        id: vacc.id,
        vaccineName: String(vacc.vaccine_name || ''),
        dateGiven: String(vacc.administered_date || ''),
        nextDueDate: String(vacc.next_due_date || ''),
        vetClinic: String(vacc.veterinarian || ''),
        notes: String(vacc.notes || ''),
        recordPhoto: String(vacc.photo_url || '')
      }))
      
      setVaccinations(petVaccinations)
      console.log(`✅ Loaded ${petVaccinations.length} vaccinations for pet ${petId}`)
    } catch (error) {
      console.error('Error loading vaccinations:', error)
      setVaccinations([])
    }
  }

  useEffect(() => {
    loadVaccinations()
    
    // Listen for data updates
    const handleUpdate = () => loadVaccinations()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('pets-data-updated', handleUpdate)
    }
  }, [petId, getData])

  const createReminder = (vaccination: Vaccination) => {
    const dueDate = new Date(vaccination.nextDueDate)
    const today = new Date()
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= 30 && daysUntil >= 0) {
      addEvent({
        title: `Vaccination due: ${vaccination.vaccineName}`,
        date: vaccination.nextDueDate,
        type: 'vaccination',
        description: `${vaccination.vaccineName} due for ${petName} in ${daysUntil} days`,
        reminder: true
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.vaccineName || !formData.dateGiven) {
      alert('Please fill in vaccine name and date given')
      return
    }

    try {
      // Save using dedicated API endpoint
      const response = await fetch('/api/pets/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: petId,
          vaccine_name: formData.vaccineName,
          administered_date: formData.dateGiven,
          next_due_date: formData.nextDueDate || null,
          veterinarian: formData.vetClinic || null,
          notes: formData.notes || null,
          photo_url: formData.recordPhoto || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save vaccination')
      }

      console.log('✅ Vaccination saved to database')

      // Create reminder if due date is set
      if (formData.nextDueDate) {
        createReminder({
          id: Date.now().toString(),
          ...formData
        })
      }

      // Immediately refresh UI
      loadVaccinations()
      
      // Notify pets list page to update counters
      window.dispatchEvent(new CustomEvent('pets-data-updated'))

      setFormData({
        vaccineName: '',
        dateGiven: '',
        nextDueDate: '',
        vetClinic: '',
        notes: '',
        recordPhoto: ''
      })
      setShowDialog(false)
    } catch (error: any) {
      console.error('Error saving vaccination:', error)
      alert(`Failed to save vaccination: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vaccination record?')) return

    try {
      const response = await fetch(`/api/pets/vaccinations?vaccinationId=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete vaccination')
      }

      loadVaccinations()
      window.dispatchEvent(new CustomEvent('pets-data-updated'))
    } catch (error: any) {
      console.error('Error deleting vaccination:', error)
      alert(`Failed to delete vaccination: ${error.message}`)
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vaccination</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vaccineName">Vaccine Name *</Label>
              <Input
                id="vaccineName"
                value={formData.vaccineName}
                onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                placeholder="e.g., Rabies, DHPP"
                required
              />
            </div>

            <div>
              <Label htmlFor="dateGiven">Date Given *</Label>
              <Input
                id="dateGiven"
                type="date"
                value={formData.dateGiven}
                onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="nextDueDate">Next Due Date</Label>
              <Input
                id="nextDueDate"
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll get a reminder 30 days before this date
              </p>
            </div>

            <div>
              <Label htmlFor="vetClinic">Vet Clinic</Label>
              <Input
                id="vetClinic"
                value={formData.vetClinic}
                onChange={(e) => setFormData({ ...formData, vetClinic: e.target.value })}
                placeholder="Clinic name"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes"
                rows={3}
              />
            </div>

            <div>
              <Label>Vaccination Record Photo</Label>
              <div className="flex gap-2">
                <Button type="button" onClick={handlePhotoCapture} variant="outline" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  {formData.recordPhoto ? 'Photo Captured' : 'Take Photo of Record'}
                </Button>
                {formData.recordPhoto && (
                  <Button type="button" onClick={() => setFormData({ ...formData, recordPhoto: '' })} variant="ghost">
                    Remove
                  </Button>
                )}
              </div>
              {formData.recordPhoto && (
                <img src={formData.recordPhoto} alt="Vaccination record" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Photo saved as PDF automatically
              </p>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Vaccination
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vaccination
        </Button>

        {vaccinations.length === 0 ? (
          <div className="text-center py-12">
            <Syringe className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No vaccinations recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vaccinations.map((vac) => (
              <Card key={vac.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{vac.vaccineName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Given: {vac.dateGiven ? format(new Date(vac.dateGiven), 'MMM d, yyyy') : 'N/A'}
                    </p>
                    {vac.nextDueDate && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Next due: {format(new Date(vac.nextDueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                    {vac.vetClinic && (
                      <p className="text-sm text-muted-foreground">Clinic: {vac.vetClinic}</p>
                    )}
                    {vac.notes && (
                      <p className="text-sm mt-2">{vac.notes}</p>
                    )}
                    {vac.recordPhoto && (
                      <div className="mt-2">
                        <img src={vac.recordPhoto} alt="Vaccination record" className="w-full h-24 object-cover rounded-lg" />
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Saved as PDF
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(vac.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

