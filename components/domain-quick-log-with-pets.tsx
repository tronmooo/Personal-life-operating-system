'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  DOMAIN_LOGGING_CONFIGS, 
  type LogEntryType,
  type LogEntryField 
} from '@/lib/domain-logging-configs'
import { 
  Plus, Zap, Calendar, Clock, TrendingUp, CheckCircle,
  X, Save, PawPrint
} from 'lucide-react'
import { format } from 'date-fns'
import { PetProfileSwitcher } from './pet-profile-switcher'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface DomainQuickLogWithPetsProps {
  domainId: string
}

export function DomainQuickLogWithPets({ domainId }: DomainQuickLogWithPetsProps) {
  const config = DOMAIN_LOGGING_CONFIGS[domainId]
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const { data, addData } = useData()
  const [selectedLogType, setSelectedLogType] = useState<LogEntryType | null>(
    config?.logTypes?.[0] || null
  )
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [logHistory, setLogHistory] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  // Load log history from domain data
  React.useEffect(() => {
    if (!selectedPetId) return
    const logs = (data.pets || []).filter((item: any) => item.metadata?.itemType === 'quick-log' && item.metadata?.petId === selectedPetId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item: any) => ({
        id: item.id,
        type: item.metadata?.typeId,
        typeName: item.metadata?.typeName,
        icon: item.metadata?.icon,
        petId: item.metadata?.petId,
        data: item.metadata?.data || {},
        timestamp: item.createdAt,
      }))
    setLogHistory(logs)
  }, [domainId, selectedPetId, data.pets])

  // Auto-set today's date for date fields
  React.useEffect(() => {
    if (selectedLogType) {
      const dateFields = selectedLogType.fields.filter(f => f.type === 'date' || f.type === 'datetime-local')
      if (dateFields.length > 0) {
        const now = new Date()
        const updates: Record<string, any> = {}
        dateFields.forEach(field => {
          if (field.type === 'date') {
            updates[field.name] = format(now, 'yyyy-MM-dd')
          } else if (field.type === 'datetime-local') {
            updates[field.name] = format(now, "yyyy-MM-dd'T'HH:mm")
          }
        })
        setFormData(prev => ({ ...prev, ...updates }))
      }

      // Auto-set current time for time fields
      const timeFields = selectedLogType.fields.filter(f => f.type === 'time')
      if (timeFields.length > 0) {
        const now = new Date()
        const updates: Record<string, any> = {}
        timeFields.forEach(field => {
          updates[field.name] = format(now, 'HH:mm')
        })
        setFormData(prev => ({ ...prev, ...updates }))
      }

      // Auto-fill pet field if available
      const petField = selectedLogType.fields.find(f => f.name === 'pet')
      if (petField && selectedPetId) {
        const profiles = (data.pets || []).filter((i: any) => i.metadata?.itemType === 'profile')
        const pet = profiles.find((p: any) => p.id === selectedPetId || p.metadata?.petId === selectedPetId)
        if (pet) setFormData(prev => ({ ...prev, pet: pet.metadata?.name || pet.title }))
      }
    }
  }, [selectedLogType, selectedPetId, data.pets])

  if (!config || !config.enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Quick logging not available for this domain</p>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLogType || !selectedPetId) return

    // Persist to domain data via DataProvider
    await addData('pets' as any, {
      title: 'Quick Log',
      metadata: {
        itemType: 'quick-log',
        petId: selectedPetId,
        typeId: selectedLogType.id,
        typeName: selectedLogType.name,
        icon: selectedLogType.icon,
        data: formData,
      }
    })

    // Reset form (but keep pet name auto-filled)
    const petName = formData.pet
    setFormData({ pet: petName })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const deleteLog = (id: string) => {
    // Note: Deleting from persistent domain data should use useData().deleteData,
    // but if items are merged from different shapes, we at least update UI optimistically here.
    setLogHistory(prev => prev.filter(log => log.id !== id))
  }

  const renderField = (field: LogEntryField) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              required={field.required}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              id={field.name}
              required={field.required}
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.unit && <span className="text-muted-foreground ml-2">({field.unit})</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              required={field.required}
              value={value || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              disabled={field.name === 'pet'} // Pet field auto-filled
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              autoComplete="off"
            />
          </div>
        )

      case 'time':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.unit && <span className="text-muted-foreground ml-2">({field.unit})</span>}
            </Label>
            <Input
              id={field.name}
              type="time"
              required={field.required}
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              disabled={field.name === 'pet'} // Pet field auto-filled
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
              autoComplete="off"
            />
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.unit && <span className="text-muted-foreground ml-2">({field.unit})</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              disabled={field.name === 'pet'} // Pet field auto-filled
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Pet Profile Switcher */}
      <PetProfileSwitcher 
        onPetSelected={(pet) => setSelectedPetId(pet?.id || null)}
        selectedPetId={selectedPetId || undefined}
      />

      {selectedPetId ? (
        <>
          {/* Quick Log Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Quick Log
                  </CardTitle>
                  <CardDescription>Rapidly track daily activities for selected pet</CardDescription>
                </div>
                {showSuccess && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Logged!
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Log Type Selector */}
              <div className="flex flex-wrap gap-2">
                {config.logTypes.map((logType) => (
                  <Button
                    key={logType.id}
                    type="button"
                    variant={selectedLogType?.id === logType.id ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedLogType(logType)
                      setFormData({})
                    }}
                    className="flex items-center gap-2"
                  >
                    <span>{logType.icon}</span>
                    <span>{logType.name}</span>
                  </Button>
                ))}
              </div>

              {/* Log Form */}
              {selectedLogType && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLogType.fields.map(renderField)}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Log {selectedLogType.name}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Log History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Logs
              </CardTitle>
              <CardDescription>
                {logHistory.length} entries logged for this pet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs yet. Start tracking above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logHistory.slice(0, 20).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{log.icon}</span>
                          <span className="font-semibold">{log.typeName}</span>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {Object.entries(log.data).map(([key, value]) => {
                            if (!value || key === 'notes') return null
                            return (
                              <div key={key} className="text-muted-foreground">
                                <span className="font-medium capitalize">{key}: </span>
                                <span>{String(value)}</span>
                              </div>
                            )
                          })}
                        </div>
                        {log.data.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {log.data.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLog(log.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PawPrint className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select or add a pet above to start logging!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}






