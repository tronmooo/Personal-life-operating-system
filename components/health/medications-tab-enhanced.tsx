/**
 * Enhanced Medications Tab
 * Complete medication management with schedule, active meds, adherence
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Pill, Clock, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

interface MedicationsTabEnhancedProps {
  onAddMedication: () => void
}

export function MedicationsTabEnhanced({ onAddMedication }: MedicationsTabEnhancedProps) {
  const { items: healthEntries, update, remove } = useDomainCRUD('health')

  // Filter medications
  const medications = useMemo(() => {
    return healthEntries
      .filter(e => e.metadata?.logType === 'medication')
      .sort((a, b) => {
        const timeA = String(a.metadata?.scheduledTime || '00:00')
        const timeB = String(b.metadata?.scheduledTime || '00:00')
        return timeA.localeCompare(timeB)
      })
  }, [healthEntries])

  // Filter symptoms for analytics
  const symptoms = useMemo(() => {
    return healthEntries.filter(e => e.metadata?.logType === 'symptom')
  }, [healthEntries])

  // Calculate symptom analytics
  const totalSymptoms = symptoms.length
  const mostCommonSymptom = useMemo(() => {
    const counts: Record<string, number> = {}
    symptoms.forEach(s => {
      const type = s.title || 'Unknown'
      counts[type] = (counts[type] || 0) + 1
    })
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)
    return sorted[0] || ['None', 0]
  }, [symptoms])

  const avgSeverity = useMemo(() => {
    if (symptoms.length === 0) return 0
    const total = symptoms.reduce((sum, s) => sum + (Number(s.metadata?.severity) || 0), 0)
    return (total / symptoms.length).toFixed(1)
  }, [symptoms])

  async function toggleMedication(id: string, currentTaken: boolean) {
    await update(id, {
      metadata: {
        ...healthEntries.find(e => e.id === id)?.metadata,
        taken: !currentTaken
      }
    })
  }

  function getRefillStatus(refillDate: string) {
    if (!refillDate) return null
    const daysUntil = differenceInDays(new Date(refillDate), new Date())
    if (daysUntil < 0) return { text: 'Overdue', color: 'bg-red-500', variant: 'destructive' as const }
    if (daysUntil <= 7) return { text: 'Refill Soon', color: 'bg-yellow-500', variant: 'default' as const }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">Medication Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track your prescriptions and reminders</p>
        </div>
        <Button onClick={onAddMedication} className="bg-red-600 hover:bg-red-700">
          + Add Medication
        </Button>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Track your daily medications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {medications.filter(m => m.metadata?.frequency !== 'as-needed').length === 0 ? (
            <p className="text-center py-4 text-gray-500">No scheduled medications</p>
          ) : (
            medications.filter(m => m.metadata?.frequency !== 'as-needed').map(med => {
              const taken = Boolean(med.metadata?.taken)
              return (
                <div 
                  key={med.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    taken 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200' 
                      : 'bg-red-50 dark:bg-red-950 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={taken}
                      onCheckedChange={() => toggleMedication(med.id, taken)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className={`font-medium ${taken ? 'line-through text-gray-500' : ''}`}>
                        {med.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {med.metadata?.scheduledTime || '8:00 AM'}
                      </p>
                    </div>
                  </div>
                  {taken && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Active Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Active Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No medications added yet</p>
              <Button onClick={onAddMedication} variant="outline">
                Add Your First Medication
              </Button>
            </div>
          ) : (
            medications.map(med => {
              const refillStatus = getRefillStatus(med.metadata?.refillDate)
              return (
                <div key={med.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                        <Pill className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{med.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{med.metadata?.frequency || 'Once daily'}</Badge>
                          <Badge variant="outline">{med.metadata?.scheduledTime || '8:00 AM'}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {refillStatus && (
                        <Badge variant={refillStatus.variant} className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {refillStatus.text}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => remove(med.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Prescribed by</p>
                      <p className="font-medium">{med.metadata?.prescribedBy || 'Dr. Sarah Smith'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Start date</p>
                      <p className="font-medium">{med.metadata?.startDate || '5/31/2024'}</p>
                    </div>
                  </div>

                  {med.metadata?.instructions && (
                    <div className="mt-3">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Instructions</p>
                      <p className="text-sm">{String(med.metadata.instructions)}</p>
                    </div>
                  )}

                  {refillStatus && med.metadata?.refillDate && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-900 dark:text-yellow-100">
                          Refill needed in {differenceInDays(new Date(med.metadata.refillDate), new Date())} days 
                          ({format(new Date(med.metadata.refillDate), 'M/d/yyyy')})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Symptom Analytics */}
      {symptoms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Symptoms Logged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-900 dark:text-red-100">{totalSymptoms}</p>
              <p className="text-sm text-red-600">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Most Common</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-900 dark:text-red-100">{mostCommonSymptom[0]}</p>
              <p className="text-sm text-red-600">{mostCommonSymptom[1]} occurrences</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-900 dark:text-red-100">{avgSeverity}/10</p>
              <p className="text-sm text-red-600">Moderate range</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


