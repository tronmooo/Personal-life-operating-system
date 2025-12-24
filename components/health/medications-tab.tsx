'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DomainData } from '@/types/domains'
import { toast } from '@/lib/utils/toast'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string[]
  status: 'Active' | 'Inactive'
}

interface MedicationLog {
  medicationId: string
  date: string
  time: string
  taken: boolean
}

// Helper to convert medication frequency to habit frequency
function getHabitFrequency(medFrequency: string): 'daily' | 'weekly' | 'monthly' {
  const freq = medFrequency.toLowerCase()
  if (freq.includes('weekly')) return 'weekly'
  if (freq.includes('monthly')) return 'monthly'
  return 'daily' // Most medications are daily
}

export function MedicationsTab() {
  const { getData, addData, deleteData, updateData, reloadDomain, addHabit } = useData()
  const [medications, setMedications] = useState<Medication[]>([])
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [formData, setFormData] = useState<Partial<Medication>>({
    status: 'Active',
    time: ['8:00 AM']
  })

  // Load medications from DataProvider
  const loadMedications = () => {
    const healthData = getData('health')
    
    // Load medications
    // Accept alternate keys/type names that may be produced by AI or older forms
    const meds = healthData
      .filter(item => {
        const meta = item.metadata as any
        const t = meta?.type || meta?.itemType || (item as any).type
        return t === 'medication' || t === 'medications'
      })
      .map(item => {
        const meta = item.metadata as any
        return {
          id: item.id,
          name: meta?.name || item.title || '',
          dosage: meta?.dosage || '',
          frequency: meta?.frequency || 'Daily',
          time: meta?.time || ['8:00 AM'],
          status: (meta?.status || 'Active') as 'Active' | 'Inactive'
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    
    setMedications(meds)
    
    // Load medication logs
    const logs = healthData
      .filter(item => {
        const meta = item.metadata as any
        const t = meta?.type || meta?.itemType || (item as any).type
        return t === 'medication_log' || t === 'medication-log' || t === 'medicationLog'
      })
      .map(item => {
        const meta = item.metadata as any
        return {
          medicationId: meta?.medicationId || '',
          date: meta?.date || '',
          time: meta?.time || '',
          taken: meta?.taken || false
        }
      }).map(log => ({
        ...log,
      }))
    
    setMedicationLogs(logs)
  }

  useEffect(() => {
    loadMedications()
  }, [])

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => loadMedications()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('health-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('health-data-updated', handleUpdate)
    }
  }, [])

  const handleAdd = async () => {
    if (!formData.name || !formData.dosage) return

    const medName = formData.name
    const medDosage = formData.dosage
    const medFrequency = formData.frequency || 'Daily'
    const medTimes = formData.time || ['8:00 AM']

    await addData('health', {
      title: `${medName} - ${medDosage}`,
      description: `${medFrequency} at ${medTimes.join(', ')}`,
      metadata: {
        type: 'medication',
        name: medName,
        dosage: medDosage,
        frequency: medFrequency,
        time: medTimes,
        status: formData.status || 'Active'
      }
    })
    
    // Automatically create habits for each medication time
    if (medTimes.length > 0) {
      for (const time of medTimes) {
        const habitName = `Take ${medName} (${medDosage}) at ${time}`
        await addHabit({
          name: habitName,
          icon: '💊',
          frequency: getHabitFrequency(medFrequency),
          completed: false,
          streak: 0,
        })
      }
      
      const timesText = medTimes.length === 1 ? medTimes[0] : `${medTimes.length} times daily`
      toast.success('Medication & Habits Created', `Added ${medName} and created habit reminder(s) for ${timesText}`)
    }
    
    setFormData({ status: 'Active', time: ['8:00 AM'] })
    setShowAddForm(false)
    try { 
      await reloadDomain('health' as any) 
    } catch (error) {
      console.error('Failed to reload health domain after adding medication:', error)
      // Data was saved, reload failure is non-critical
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await deleteData('health', id)
    } catch (error) {
      console.error('Failed to delete medication:', error)
      // Rollback on error
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      loadMedications()
    }
  }

  const handleToggleMedication = async (medId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0]
    const healthData = getData('health')
    
    // Find existing log entry
    const existingLogEntry = healthData.find(
      item => item.metadata?.type === 'medication_log' &&
              item.metadata?.medicationId === medId &&
              item.metadata?.date === today &&
              item.metadata?.time === time
    )

    if (existingLogEntry) {
      // Update existing log
      await updateData('health', existingLogEntry.id, {
        metadata: {
          ...existingLogEntry.metadata,
          taken: !existingLogEntry.metadata?.taken
        }
      })
    } else {
      // Create new log
      await addData('health', {
        title: `Medication log`,
        description: `${medId} taken at ${time} on ${today}`,
        metadata: {
          type: 'medication_log',
          medicationId: medId,
          date: today,
          time,
          taken: true
        }
      })
    }
  }

  const isMedicationTaken = (medId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0]
    return medicationLogs.some(
      log => log.medicationId === medId && log.date === today && log.time === time && log.taken
    )
  }

  const activeMedications = medications.filter(m => m.status === 'Active')

  return (
    <div className="space-y-6">
      {/* Debug toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebug(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Data
        </button>
      </div>

      {showDebug && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-2">Raw health entries used by this tab (filtered types: medication, medications, medication_log)</p>
            <pre className="text-xs overflow-auto max-h-60">
{JSON.stringify({ medications, medicationLogs }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Active Medications</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Add Medication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Medication Name *</Label>
                <Input
                  placeholder="Lisinopril"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Dosage *</Label>
                <Input
                  placeholder="10mg"
                  value={formData.dosage || ''}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.frequency || 'Daily'}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <Label>Time(s)</Label>
                <Input
                  placeholder="8:00 AM, 8:00 PM"
                  value={formData.time?.join(', ') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    time: e.target.value.split(',').map(t => t.trim())
                  })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                Add Medication
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications List */}
      {activeMedications.length === 0 ? (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No medications added yet. Add your first medication!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeMedications.map((med) => (
            <Card key={med.id} className="bg-white dark:bg-gray-900 border-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{med.name}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full font-medium">
                        {med.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Dosage: <span className="font-medium text-gray-900 dark:text-gray-100">{med.dosage}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Frequency: <span className="font-medium text-gray-900 dark:text-gray-100">{med.frequency}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Time: <span className="font-medium text-gray-900 dark:text-gray-100">{med.time.join(', ')}</span>
                      </p>
                    </div>

                    {/* Today's doses */}
                    <div className="mt-4 space-y-2">
                      {med.time.map((t) => {
                        const taken = isMedicationTaken(med.id, t)
                        return (
                          <button
                            key={t}
                            onClick={() => handleToggleMedication(med.id, t)}
                            className={`flex items-center gap-2 p-2 rounded-lg w-full text-left transition-colors ${
                              taken
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${
                              taken ? 'bg-green-600' : 'bg-white dark:bg-gray-700 border-2'
                            }`}>
                              {taken && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-sm">
                              {t} - {taken ? 'Taken' : 'Not taken'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(med.id)}
                    disabled={deletingIds.has(med.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingIds.has(med.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

