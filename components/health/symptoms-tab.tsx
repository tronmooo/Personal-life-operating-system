/**
 * Symptoms Tab
 * Track symptoms and identify triggers
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { AlertCircle, Activity, Trash2, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface SymptomsTabProps {
  onLogSymptom: () => void
}

export function SymptomsTab({ onLogSymptom }: SymptomsTabProps) {
  const { items: healthEntries, remove } = useDomainCRUD('health')

  // Filter symptom entries
  const symptomEntries = useMemo(() => {
    return healthEntries
      .filter(e => e.metadata?.logType === 'symptom')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [healthEntries])

  // Analyze common triggers
  const triggerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    symptomEntries.forEach(entry => {
      const triggers = entry.metadata?.triggers || []
      if (Array.isArray(triggers)) {
        triggers.forEach((trigger: string) => {
          counts[trigger] = (counts[trigger] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
  }, [symptomEntries])

  // Get severity color
  function getSeverityColor(severity: number) {
    if (severity >= 8) return 'bg-red-100 text-red-800 border-red-300'
    if (severity >= 6) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (severity >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  // Get mood color
  function getMoodColor(mood: string) {
    if (mood === 'Great') return 'bg-green-100 text-green-800'
    if (mood === 'Good') return 'bg-blue-100 text-blue-800'
    if (mood === 'Fair') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100">Symptom Journal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track patterns and identify triggers</p>
        </div>
        <Button onClick={onLogSymptom} className="bg-orange-600 hover:bg-orange-700">
          + Log Symptom
        </Button>
      </div>

      {/* Common Triggers */}
      <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <AlertCircle className="w-5 h-5" />
            Common Triggers
          </CardTitle>
          <CardDescription>Based on your recent entries</CardDescription>
        </CardHeader>
        <CardContent>
          {triggerCounts.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No triggers identified yet</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {triggerCounts.map(([trigger, count]) => (
                <Badge 
                  key={trigger} 
                  variant="outline"
                  className={`text-base py-2 px-4 ${
                    count >= 3 ? 'bg-red-100 text-red-800 border-red-300' :
                    count >= 2 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}
                >
                  {trigger} ({count} occurrence{count > 1 ? 's' : ''})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Symptom Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Symptom History
          </CardTitle>
          <CardDescription>Your logged symptoms and patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {symptomEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No symptoms logged yet</p>
              <p className="text-sm text-gray-400">Start tracking symptoms to identify patterns and triggers</p>
            </div>
          ) : (
            symptomEntries.map(entry => (
              <div key={entry.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getSeverityColor(entry.metadata?.severity || 5)
                    }`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{entry.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getSeverityColor(entry.metadata?.severity || 5)}>
                          Severity: {entry.metadata?.severity || 5}/10
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.created_at), 'MM/dd/yyyy')} at {format(new Date(entry.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => remove(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Duration</p>
                    <p className="text-sm">{entry.metadata?.duration || '2 hours'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Mood</p>
                    <Badge className={getMoodColor(entry.metadata?.mood || 'Fair')}>
                      {entry.metadata?.mood || 'Fair'}
                    </Badge>
                  </div>
                </div>

                {entry.metadata?.triggers && Array.isArray(entry.metadata.triggers) && entry.metadata.triggers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Possible Triggers:</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.metadata.triggers.map((trigger: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {entry.metadata?.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      {entry.metadata.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

