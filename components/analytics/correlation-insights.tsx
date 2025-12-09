'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Link2, AlertCircle } from 'lucide-react'

export interface CorrelationInsight {
  id: string
  domainA: string
  domainB: string
  correlation: number // -1 to 1
  strength: 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative'
  insight: string
  confidence: number
  sampleSize: number
}

interface CorrelationInsightsProps {
  correlations: CorrelationInsight[]
}

export function CorrelationInsights({ correlations }: CorrelationInsightsProps) {
  const sortedCorrelations = [...correlations].sort((a, b) => 
    Math.abs(b.correlation) - Math.abs(a.correlation)
  )

  const getStrengthColor = (strength: CorrelationInsight['strength']) => {
    switch (strength) {
      case 'strong': return 'text-green-600'
      case 'moderate': return 'text-blue-600'
      case 'weak': return 'text-gray-600'
    }
  }

  const getStrengthBadge = (strength: CorrelationInsight['strength']) => {
    switch (strength) {
      case 'strong': return 'default'
      case 'moderate': return 'secondary'
      case 'weak': return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          Domain Correlations
        </CardTitle>
        <CardDescription>
          Discover relationships between different life domains
        </CardDescription>
      </CardHeader>
      <CardContent>
        {correlations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Not enough data to detect correlations yet</p>
            <p className="text-sm">Keep tracking to unlock insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCorrelations.map(corr => (
              <div
                key={corr.id}
                className="p-4 rounded-lg border hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    p-3 rounded-lg flex-shrink-0
                    ${corr.direction === 'positive' 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                    }
                  `}>
                    {corr.direction === 'positive' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">
                          {corr.domainA}
                        </Badge>
                        <span className="text-muted-foreground">↔</span>
                        <Badge variant="outline" className="capitalize">
                          {corr.domainB}
                        </Badge>
                      </div>
                      <Badge variant={getStrengthBadge(corr.strength)}>
                        {corr.strength}
                      </Badge>
                    </div>

                    {/* Insight */}
                    <p className="text-sm">{corr.insight}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Correlation:</span>
                        <span className={`font-semibold ${getStrengthColor(corr.strength)}`}>
                          {(corr.correlation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Confidence:</span>
                        <span className="font-semibold">
                          {(corr.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Sample size:</span>
                        <span className="font-semibold">{corr.sampleSize}</span>
                      </div>
                    </div>

                    {/* Visual Correlation Bar */}
                    <div className="mt-2">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            corr.direction === 'positive' 
                              ? 'bg-green-600' 
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Understanding Correlations
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Positive correlation:</strong> Both domains tend to increase/decrease together</li>
            <li>• <strong>Negative correlation:</strong> When one increases, the other tends to decrease</li>
            <li>• <strong>Strong:</strong> &gt;70% correlation, <strong>Moderate:</strong> 40-70%, <strong>Weak:</strong> &lt;40%</li>
            <li>• Correlation does not imply causation - these are patterns in your data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}




