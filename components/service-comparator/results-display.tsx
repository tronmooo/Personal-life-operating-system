'use client';

/**
 * Service Comparator Results Display
 * Comprehensive results visualization
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Shield, DollarSign, Star, AlertTriangle, CheckCircle2, XCircle, Save, ExternalLink } from 'lucide-react';
import type { ComparisonResponse, ServiceType } from '@/types/service-comparator';
import { SERVICE_TYPE_LABELS } from '@/types/service-comparator';

interface ServiceComparatorResultsProps {
  results: ComparisonResponse;
  serviceType: ServiceType;
  onSaveProvider: (providerName: string, monthlyCost: number) => void;
}

export function ServiceComparatorResults({
  results,
  serviceType,
  onSaveProvider,
}: ServiceComparatorResultsProps) {
  return (
    <div className="space-y-6">
      {/* Potential Savings */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <TrendingDown className="h-12 w-12 text-green-500" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Potential Annual Savings</p>
              <p className="text-4xl font-bold text-green-600">
                ${results.potential_savings.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{results.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analysis Badge (if available) */}
      {(results as any).enhanced_analysis && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Comprehensive Analysis</h3>
                <Badge variant="secondary">
                  {(results as any).enhanced_analysis.confidence_level}% Confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Factors considered: {(results as any).enhanced_analysis.factors_considered.join(', ')}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Next Review Date:</span>{' '}
                {new Date((results as any).enhanced_analysis.next_review_date).toLocaleDateString()}
              </p>
              {(results as any).enhanced_analysis.recommendations.map((rec: string, i: number) => (
                <p key={i} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                  {rec}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Top Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.ranking.map((ranked) => (
            <Card
              key={ranked.rank}
              className={ranked.label === 'Best Value' ? 'border-primary shadow-lg' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{ranked.provider}</CardTitle>
                    <CardDescription>{ranked.label}</CardDescription>
                  </div>
                  {ranked.label === 'Best Value' && (
                    <Badge variant="default">Best Value</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-3xl font-bold">${ranked.monthly_cost}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(ranked.value_score / 20)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {ranked.value_score}/100
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{ranked.reason}</p>

                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Annual: ${ranked.annual_cost.toLocaleString()}
                  </div>
                  <Button
                    onClick={() => onSaveProvider(ranked.provider, ranked.monthly_cost)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Save className="mr-2 h-3 w-3" />
                    Save as Current
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Provider Breakdowns */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed Provider Analysis</h3>
        <div className="space-y-4">
          {results.provider_breakdown.map((provider) => (
            <Card key={provider.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{provider.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${provider.cost_analysis.monthly_cost}/mo
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score: {provider.value_score}/100
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cost Analysis */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Annual Cost</div>
                      <div className="font-semibold">
                        ${provider.cost_analysis.annual_cost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Hidden Fees</div>
                      <div className="font-semibold">
                        ${provider.cost_analysis.hidden_fees.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">First Year Total</div>
                      <div className="font-semibold">
                        ${provider.cost_analysis.total_first_year.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">3-Year Projection</div>
                      <div className="font-semibold">
                        ${provider.cost_analysis.projected_3_year.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Risk Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Price Volatility</div>
                      <div className="font-semibold">
                        {provider.risk_analysis.price_volatility}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Provider Stability</div>
                      <div className="font-semibold">
                        {provider.risk_analysis.provider_stability}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Denial Risk</div>
                      <div className="font-semibold">
                        {provider.risk_analysis.claim_denial_likelihood}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Strengths
                    </h4>
                    <ul className="text-sm space-y-1">
                      {provider.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-orange-600">
                      <XCircle className="h-4 w-4" />
                      Weaknesses
                    </h4>
                    <ul className="text-sm space-y-1">
                      {provider.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hidden Fees */}
                {provider.hidden_fees.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Hidden Fees
                    </h4>
                    <div className="space-y-1">
                      {provider.hidden_fees.map((fee, i) => (
                        <div
                          key={i}
                          className="text-sm flex items-center justify-between bg-red-50 dark:bg-red-950/20 p-2 rounded"
                        >
                          <span>{fee.name}</span>
                          <span className="font-semibold">
                            ${fee.amount} ({fee.frequency})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {provider.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-900">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      Important Warnings
                    </h4>
                    <ul className="text-sm space-y-1">
                      {provider.warnings.map((warning, i) => (
                        <li key={i} className="text-yellow-800 dark:text-yellow-300">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => onSaveProvider(provider.name, provider.cost_analysis.monthly_cost)}
                    size="sm"
                    variant="default"
                  >
                    <Save className="mr-2 h-3 w-3" />
                    Save Provider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(provider.name + ' ' + SERVICE_TYPE_LABELS[serviceType])}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Research
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personalized Insights */}
      {results.personalized_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Insights</CardTitle>
            <CardDescription>
              AI-powered recommendations based on your comprehensive profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.personalized_insights.map((insight, i) => (
                <div
                  key={i}
                  className={`border-l-4 pl-4 py-2 ${
                    insight.actionable ? 'border-primary' : 'border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{insight.category}</h4>
                    <div className="flex items-center gap-2">
                      {insight.actionable && <Badge variant="outline">Actionable</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




















