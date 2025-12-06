'use client'

/**
 * Universal AI Insights Component for Calculators
 * Displays AI-generated insights for any calculator
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, TrendingUp, AlertTriangle, Target, Sparkles, RefreshCw } from 'lucide-react'
import { CalculatorAIInsights } from '@/lib/hooks/use-calculator-ai'
import { cn } from '@/lib/utils'

interface CalculatorAIInsightsProps {
  insights: CalculatorAIInsights | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}

export function CalculatorAIInsightsComponent({
  insights,
  loading,
  error,
  onRefresh,
  className
}: CalculatorAIInsightsProps) {
  if (loading) {
    return (
      <Card className={cn('bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            <p className="text-purple-700 font-medium">AI is analyzing your results...</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-purple-200 rounded animate-pulse" />
            <div className="h-4 bg-purple-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-purple-200 rounded animate-pulse w-4/6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <Card className={cn('bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200', className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-purple-900">
          <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
          AI-Powered Insights
          <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
            OpenAI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {insights.summary && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
          </div>
        )}

        {/* Key Insights */}
        {insights.insights && insights.insights.length > 0 && (
          <div>
            <h4 className="flex items-center text-sm font-semibold text-purple-900 mb-3">
              <Lightbulb className="w-4 h-4 mr-2" />
              Key Insights
            </h4>
            <div className="space-y-2">
              {insights.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start bg-white rounded-lg p-3 shadow-sm"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold mr-3">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h4 className="flex items-center text-sm font-semibold text-green-900 mb-3">
              <Target className="w-4 h-4 mr-2" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {insights.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start bg-green-50 rounded-lg p-3 border border-green-200"
                >
                  <div className="flex-shrink-0 text-green-600 mr-2">✓</div>
                  <p className="text-sm text-gray-700 flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {insights.warnings && insights.warnings.length > 0 && (
          <div>
            <h4 className="flex items-center text-sm font-semibold text-orange-900 mb-3">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Important Considerations
            </h4>
            <div className="space-y-2">
              {insights.warnings.map((warning, index) => (
                <Alert key={index} className="bg-orange-50 border-orange-200">
                  <AlertDescription className="text-sm text-gray-700">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Comparisons */}
        {insights.comparisons && insights.comparisons.length > 0 && (
          <div>
            <h4 className="flex items-center text-sm font-semibold text-blue-900 mb-3">
              <TrendingUp className="w-4 h-4 mr-2" />
              Comparisons
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.comparisons.map((comp, index) => (
                <div
                  key={index}
                  className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                >
                  <p className="text-xs text-blue-700 font-medium mb-1">{comp.label}</p>
                  <p className="text-lg font-semibold text-blue-900 mb-1">{comp.value}</p>
                  <p className="text-xs text-gray-600">{comp.interpretation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {insights.nextSteps && insights.nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-3">
              Next Steps
            </h4>
            <ol className="space-y-2">
              {insights.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold mr-3">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 flex-1 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <div className="pt-2 border-t border-purple-200">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

