'use client'

import { useState, useMemo } from 'react'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DOMAIN_LOGGING_CONFIGS, 
  type LogEntryType,
  type LogEntryField 
} from '@/lib/domain-logging-configs'
import { 
  Plus, Zap, Calendar, Clock, TrendingUp, CheckCircle,
  X, Save, BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import type { DomainData } from '@/types/domains'
import { HealthLogCharts } from '@/components/log-visualizations/health-log-charts'
import { FinancialLogCharts } from '@/components/log-visualizations/financial-log-charts'
import { NutritionLogCharts } from '@/components/log-visualizations/nutrition-log-charts'
import { FitnessLogCharts } from '@/components/log-visualizations/fitness-log-charts'
import { PetLogCharts } from '@/components/log-visualizations/pet-log-charts'
import { VehicleLogCharts } from '@/components/log-visualizations/vehicle-log-charts'
import { GenericLogCharts } from '@/components/log-visualizations/generic-log-charts'

interface DomainQuickLogProps {
  domainId: string
}

export function DomainQuickLog({ domainId }: DomainQuickLogProps) {
  const config = DOMAIN_LOGGING_CONFIGS[domainId]
  // ✅ NEW: Using standardized useDomainCRUD hook
  const { items: domainEntries, create, remove } = useDomainCRUD(domainId as any)
  const [selectedLogType, setSelectedLogType] = useState<LogEntryType | null>(
    config?.logTypes?.[0] || null
  )
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const logHistory = useMemo(() => {
    if (!Array.isArray(domainEntries)) return []

    type LogEntry = {
      id: string
      type: string
      typeName: string
      icon: string
      data: Record<string, any>
      timestamp?: string
      createdAt: string
    }

    return domainEntries
      .map(entry => {
        const meta = (entry.metadata as any) ?? {}
        const payload = meta && typeof meta === 'object' && meta.data && typeof meta.data === 'object'
          ? meta.data
          : meta

        const logTypeId = meta.logType ?? payload.logType ?? payload.type ?? meta.type
        if (!logTypeId) return null

        const logTypeConfig = config?.logTypes?.find(lt => lt.id === logTypeId)
        const timestamp = payload.timestamp ?? payload.date ?? entry.createdAt

        return {
          id: entry.id,
          type: logTypeId,
          typeName: logTypeConfig?.name ?? payload.typeName ?? 'Log Entry',
          icon: logTypeConfig?.icon ?? payload.icon ?? '📝',
          data: payload,
          timestamp,
          createdAt: entry.createdAt,
        } as LogEntry
      })
      .filter((log): log is LogEntry => log !== null)
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.createdAt).getTime()
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.createdAt).getTime()
        return bTime - aTime
      })
  }, [config?.logTypes, domainEntries])

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
    }
  }, [selectedLogType])

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
    if (!selectedLogType) return

    const timestamp = new Date().toISOString()

    // ✅ NEW: Using standardized create method with built-in error handling and toasts
    try {
      await create({
        title: `${selectedLogType.name} - ${formData[Object.keys(formData)[0]] || 'Entry'}`,
        description: formData.notes || '',
        metadata: {
          source: 'domain-quick-log',
          logType: selectedLogType.id,
          typeName: selectedLogType.name,
          icon: selectedLogType.icon,
          timestamp,
          data: { ...formData },
        },
      })
    } catch (error) {
      console.error('Failed to save quick log entry:', error)
      return
    }

    // ✅ CRITICAL FIX: Trigger analytics update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('financial-data-updated', {
        detail: { domain: domainId, entry: { logType: selectedLogType.id, data: formData } }
      }))
      console.log('✅ Quick log saved, analytics will update:', domainId)
    }

    // Reset form
    setFormData({})
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const deleteLog = async (id: string) => {
    // ✅ NEW: Using standardized remove method with built-in confirmation and toasts
    try {
      await remove(id)
    } catch (error) {
      console.error('Failed to delete log entry:', error)
    }
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
              value={value || '2025-10-06'}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
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
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Log Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Log
              </CardTitle>
              <CardDescription>Rapidly track daily activities and metrics</CardDescription>
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

      {/* Data Visualizations - FILTERED BY SELECTED LOG TYPE */}
      {logHistory.length > 0 && selectedLogType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              {selectedLogType.icon} {selectedLogType.name} Progress
            </CardTitle>
            <CardDescription>
              Showing only {selectedLogType.name.toLowerCase()} data over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {domainId === 'health' && <HealthLogCharts logs={logHistory} selectedLogType={selectedLogType.id} />}
            {domainId === 'financial' && <FinancialLogCharts logs={logHistory} selectedLogType={selectedLogType.id} />}
            {domainId === 'nutrition' && <NutritionLogCharts logs={logHistory} selectedLogType={selectedLogType.id} />}
            {domainId === 'hobbies' && <FitnessLogCharts logs={logHistory} selectedLogType={selectedLogType.id} />}
            {domainId === 'pets' && <PetLogCharts logs={logHistory} selectedPet={undefined} selectedLogType={selectedLogType.id} />}
            {domainId === 'vehicles' && <VehicleLogCharts logs={logHistory} selectedLogType={selectedLogType.id} />}
            {/* Generic charts for all other domains */}
            {!['health', 'financial', 'nutrition', 'hobbies', 'pets', 'vehicles'].includes(domainId) && (
              <GenericLogCharts logs={logHistory} domainId={domainId} selectedLogType={selectedLogType.id} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Log History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Logs
          </CardTitle>
          <CardDescription>
            {logHistory.length} entries logged
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
              {logHistory.slice(0, 20).map((log) => {
                // Support log data format
                const logData = log.data || {}
                const logIcon = log.icon || '📊'
                const logTypeName = log.typeName || (logData.logType ? `${logData.logType} log` : 'Log entry')
                const logTimestamp = log.timestamp || log.createdAt || new Date().toISOString()
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{logIcon}</span>
                        <span className="font-semibold">{logTypeName}</span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(logTimestamp), 'MMM d, h:mm a')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(logData).map(([key, value]) => {
                          if (!value || key === 'notes' || key === 'logType' || key === 'displayValue') return null
                          return (
                            <div key={key} className="text-muted-foreground">
                              <span className="font-medium capitalize">{key}: </span>
                              <span>{String(value)}</span>
                            </div>
                          )
                        })}
                      </div>
                      {logData.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {logData.notes}
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
