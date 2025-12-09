'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, Info, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useState } from 'react'

export interface Anomaly {
  id: string
  type: 'spike' | 'drop' | 'pattern_break' | 'milestone' | 'warning'
  domain: string
  metric: string
  message: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  value?: number
  threshold?: number
  timestamp: string
  actionable?: boolean
  actionLabel?: string
  onAction?: () => void
}

interface AnomalyAlertsProps {
  anomalies: Anomaly[]
  onDismiss?: (id: string) => void
}

export function AnomalyAlerts({ anomalies, onDismiss }: AnomalyAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
    onDismiss?.(id)
  }

  const visibleAnomalies = anomalies.filter(a => !dismissed.has(a.id))

  if (visibleAnomalies.length === 0) {
    return null
  }

  const getSeverityIcon = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4" />
      case 'drop':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Smart Alerts
          <Badge variant="secondary">{visibleAnomalies.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAnomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getSeverityIcon(anomaly.severity)}</div>
              
              <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {anomaly.domain}
                    </Badge>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {getTypeIcon(anomaly.type)}
                      {anomaly.type}
                    </Badge>
                  </div>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDismiss(anomaly.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Message */}
                <p className="text-sm font-medium">{anomaly.message}</p>

                {/* Metric Details */}
                {(anomaly.value !== undefined || anomaly.threshold !== undefined) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {anomaly.value !== undefined && (
                      <div>
                        <span className="opacity-70">Value: </span>
                        <span className="font-semibold">{anomaly.value}</span>
                      </div>
                    )}
                    {anomaly.threshold !== undefined && (
                      <div>
                        <span className="opacity-70">Threshold: </span>
                        <span className="font-semibold">{anomaly.threshold}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {anomaly.actionable && anomaly.actionLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={anomaly.onAction}
                    className="mt-2"
                  >
                    {anomaly.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}




