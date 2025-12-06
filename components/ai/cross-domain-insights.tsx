'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, 
  Brain, Activity, Zap, Target 
} from 'lucide-react'
import { analyzeCorrelations, type Correlation } from '@/lib/ai/correlation-engine'
import { generatePredictions, type Prediction } from '@/lib/ai/predictive-analytics'
import { detectAnomalies, type Anomaly } from '@/lib/ai/anomaly-detector'
import { generateRecommendations, type Recommendation } from '@/lib/ai/recommendation-engine'

interface CrossDomainInsightsProps {
  allLogs: Record<string, any[]>
}

export function CrossDomainInsights({ allLogs }: CrossDomainInsightsProps) {
  const { correlations, predictions, anomalies, recommendations } = useMemo(() => {
    return {
      correlations: analyzeCorrelations(allLogs),
      predictions: generatePredictions(allLogs),
      anomalies: detectAnomalies(allLogs),
      recommendations: generateRecommendations(allLogs)
    }
  }, [allLogs])

  const totalInsights = correlations.length + predictions.length + anomalies.length + recommendations.length

  if (totalInsights === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Cross-domain intelligence analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground text-center">
            Keep logging data across domains to unlock AI insights!
          </p>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Need at least 10+ logs per domain for pattern detection
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            {totalInsights} insights discovered across your life domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="correlations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="correlations">
                Patterns ({correlations.length})
              </TabsTrigger>
              <TabsTrigger value="predictions">
                Forecasts ({predictions.length})
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                Alerts ({anomalies.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                Actions ({recommendations.length})
              </TabsTrigger>
            </TabsList>

            {/* Correlations Tab */}
            <TabsContent value="correlations" className="space-y-4 mt-4">
              {correlations.length > 0 ? (
                correlations.map((corr, idx) => (
                  <CorrelationCard key={idx} correlation={corr} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No correlations detected yet. Keep logging!
                </p>
              )}
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-4 mt-4">
              {predictions.length > 0 ? (
                predictions.map((pred, idx) => (
                  <PredictionCard key={idx} prediction={pred} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No predictions available yet
                </p>
              )}
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomalies" className="space-y-4 mt-4">
              {anomalies.length > 0 ? (
                anomalies.map((anom, idx) => (
                  <AnomalyCard key={idx} anomaly={anom} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  ✅ No anomalies detected - everything looks normal!
                </p>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4 mt-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <RecommendationCard key={idx} recommendation={rec} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recommendations at this time
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const isPositive = correlation.correlation > 0
  const strength = Math.abs(correlation.correlation)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-orange-500" />
            )}
            <div>
              <CardTitle className="text-base">
                {correlation.metric1} ↔ {correlation.metric2}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {correlation.domain1} • {correlation.domain2}
              </CardDescription>
            </div>
          </div>
          <Badge variant={strength > 0.7 ? 'default' : 'secondary'}>
            {Math.round(strength * 100)}% {isPositive ? '+' : '-'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{correlation.insight}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            Confidence: {Math.round(correlation.confidence * 100)}%
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {correlation.sampleSize} data points
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const trendIcon = prediction.trend === 'increasing' ? '📈' : 
                     prediction.trend === 'decreasing' ? '📉' : '➡️'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {trendIcon} {prediction.metric}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {prediction.domain}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {Math.round(prediction.confidence * 100)}% confident
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{prediction.predicted_value}</span>
            <span className="text-sm text-muted-foreground">
              (avg: {prediction.historical_average})
            </span>
          </div>
          <p className="text-sm">{prediction.reasoning}</p>
          <p className="text-xs text-muted-foreground">
            Forecast for {prediction.date.toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary'
  } as const

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle className="text-base">{anomaly.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {anomaly.type} anomaly
              </CardDescription>
            </div>
          </div>
          <Badge variant={severityColors[anomaly.severity]}>
            {anomaly.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{anomaly.description}</p>
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium">💡 Recommendation:</p>
          <p className="text-sm text-muted-foreground">{anomaly.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary'
  } as const

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle className="text-base">{recommendation.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {recommendation.category}
              </CardDescription>
            </div>
          </div>
          <Badge variant={priorityColors[recommendation.priority]}>
            {recommendation.priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{recommendation.description}</p>
        
        <div className="bg-muted p-3 rounded-md space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Action:</p>
            <p className="text-sm">{recommendation.action}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Impact:</p>
            <p className="text-sm">{recommendation.impact}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{recommendation.reasoning}</p>
      </CardContent>
    </Card>
  )
}







