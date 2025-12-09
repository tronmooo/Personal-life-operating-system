/**
 * Enhanced Service Comparator Engine
 * Comprehensive multi-factor analysis beyond just ZIP code
 */

import { ServiceComparatorEngine } from './service-comparator-engine';
import type {
  ServiceType,
  ComparisonRequest,
  ComparisonResponse,
  ProviderData,
  UserProfile,
  UsageProfile,
} from '@/types/service-comparator';

export interface EnhancedComparisonFactors {
  // Location factors
  location: {
    zipCode: string;
    city?: string;
    state?: string;
    climateZone?: string;
    urbanRural?: 'urban' | 'suburban' | 'rural';
  };

  // Personal factors
  personal: {
    age?: number;
    householdSize?: number;
    income?: number;
    creditScore?: number;
    educationLevel?: string;
    occupation?: string;
    homeOwnership?: 'own' | 'rent';
  };

  // Usage patterns
  usage: {
    historicalUsage?: Array<{ month: string; value: number }>;
    peakUsageTimes?: string[];
    seasonalVariation?: number;
    predictedGrowth?: number;
  };

  // Financial factors
  financial: {
    budgetConstraints?: [number, number];
    paymentPreference?: 'monthly' | 'annual' | 'quarterly';
    autoPayEnabled?: boolean;
    priceFlexibility?: number; // 1-10
  };

  // Risk factors
  risk: {
    claimHistory?: Array<{ date: string; amount: number; type: string }>;
    creditHistory?: 'excellent' | 'good' | 'fair' | 'poor';
    riskTolerance?: number; // 1-10
    securityPreference?: 'high' | 'medium' | 'low';
  };

  // Behavioral factors
  behavior: {
    brandLoyalty?: number; // 1-10
    switchingHistory?: number; // times switched in past
    researchDepth?: 'quick' | 'moderate' | 'thorough';
    priceVsQuality?: 'price-focused' | 'balanced' | 'quality-focused';
  };

  // Market factors
  market: {
    competitionLevel?: number; // 1-10
    marketTrends?: 'declining' | 'stable' | 'growing';
    seasonalPricing?: boolean;
    regulatoryEnvironment?: 'strict' | 'moderate' | 'relaxed';
  };

  // Social factors
  social: {
    customerReviews?: boolean;
    friendRecommendations?: string[];
    socialMediaSentiment?: number; // -100 to 100
    communityRatings?: number;
  };

  // Environmental factors
  environment: {
    greenEnergyPreference?: boolean;
    carbonFootprintConcern?: number; // 1-10
    sustainabilityRating?: boolean;
    localBusinessPreference?: boolean;
  };

  // Technology factors
  technology: {
    appQuality?: boolean;
    onlineManagement?: boolean;
    automationLevel?: 'low' | 'medium' | 'high';
    apiIntegration?: boolean;
  };

  // Service factors
  service: {
    customerServiceHours?: string;
    responseTime?: string;
    multilingual?: boolean;
    accessibilityFeatures?: boolean;
  };
}

export class EnhancedServiceComparatorEngine extends ServiceComparatorEngine {
  /**
   * Enhanced comparison with comprehensive multi-factor analysis
   */
  static async compareEnhanced(
    request: ComparisonRequest,
    enhancedFactors: Partial<EnhancedComparisonFactors>
  ): Promise<ComparisonResponse> {
    // Get base comparison
    const baseComparison = await this.compare(request);

    // Enhance with additional factors
    const enhancedInsights = this.generateEnhancedInsights(
      request,
      enhancedFactors,
      baseComparison
    );

    // Recalculate scores with enhanced factors
    const adjustedProviders = this.adjustScoresWithEnhancedFactors(
      baseComparison.provider_breakdown,
      enhancedFactors
    );

    // Generate comprehensive recommendations
    const comprehensiveRecommendations = this.generateComprehensiveRecommendations(
      adjustedProviders,
      enhancedFactors
    );

    return {
      ...baseComparison,
      personalized_insights: [
        ...baseComparison.personalized_insights,
        ...enhancedInsights,
      ],
      // @ts-ignore - adding enhanced metadata
      enhanced_analysis: {
        factors_considered: this.getFactorsConsidered(enhancedFactors),
        confidence_level: this.calculateConfidenceLevel(enhancedFactors),
        recommendations: comprehensiveRecommendations,
        next_review_date: this.calculateNextReviewDate(enhancedFactors),
      },
    };
  }

  /**
   * Generate insights based on ALL factors, not just ZIP code
   */
  private static generateEnhancedInsights(
    request: ComparisonRequest,
    factors: Partial<EnhancedComparisonFactors>,
    baseComparison: ComparisonResponse
  ): Array<{ category: string; insight: string; confidence: number; actionable: boolean }> {
    const insights: Array<{
      category: string;
      insight: string;
      confidence: number;
      actionable: boolean;
    }> = [];

    // Location-based insights
    if (factors.location) {
      if (factors.location.urbanRural === 'rural') {
        insights.push({
          category: 'Location Analysis',
          insight: 'Rural location may limit provider options. Consider satellite or regional providers with good rural coverage.',
          confidence: 85,
          actionable: true,
        });
      }
      if (factors.location.climateZone) {
        insights.push({
          category: 'Climate Impact',
          insight: `Your ${factors.location.climateZone} climate zone affects insurance rates and utility costs. Providers with climate-specific expertise may offer better value.`,
          confidence: 80,
          actionable: true,
        });
      }
    }

    // Usage pattern insights
    if (factors.usage?.historicalUsage && factors.usage.historicalUsage.length > 0) {
      const avgUsage =
        factors.usage.historicalUsage.reduce((sum, u) => sum + u.value, 0) /
        factors.usage.historicalUsage.length;
      insights.push({
        category: 'Usage Optimization',
        insight: `Your average monthly usage is ${avgUsage.toFixed(0)} units. Consider tiered pricing plans that match your consumption pattern.`,
        confidence: 90,
        actionable: true,
      });
    }

    // Financial insights
    if (factors.financial?.budgetConstraints) {
      const [min, max] = factors.financial.budgetConstraints;
      const avgCost =
        baseComparison.provider_breakdown.reduce(
          (sum, p) => sum + p.cost_analysis.monthly_cost,
          0
        ) / baseComparison.provider_breakdown.length;

      if (avgCost > max) {
        insights.push({
          category: 'Budget Alert',
          insight: `Average provider cost ($${avgCost.toFixed(2)}) exceeds your maximum budget ($${max}). Consider reduced coverage options or alternative providers.`,
          confidence: 95,
          actionable: true,
        });
      }
    }

    // Risk-based insights
    if (factors.risk?.claimHistory && factors.risk.claimHistory.length > 2) {
      insights.push({
        category: 'Risk Assessment',
        insight: `Your claim history (${factors.risk.claimHistory.length} claims) may affect premiums. Providers specializing in high-claim profiles could offer better rates.`,
        confidence: 85,
        actionable: true,
      });
    }

    // Behavioral insights
    if (factors.behavior?.switchingHistory && factors.behavior.switchingHistory > 3) {
      insights.push({
        category: 'Switching Pattern',
        insight: 'Frequent provider switches detected. Focus on providers with flexible contracts and no early termination fees.',
        confidence: 80,
        actionable: true,
      });
    }

    // Environmental insights
    if (factors.environment?.greenEnergyPreference) {
      insights.push({
        category: 'Environmental Impact',
        insight: 'Green energy providers available in your area. These may cost 5-15% more but support renewable energy goals.',
        confidence: 75,
        actionable: true,
      });
    }

    // Technology insights
    if (factors.technology?.appQuality) {
      const providersWithApps = baseComparison.provider_breakdown.filter(
        (p) => p.strengths.some((s) => s.toLowerCase().includes('app'))
      );
      if (providersWithApps.length > 0) {
        insights.push({
          category: 'Technology',
          insight: `${providersWithApps.length} providers offer high-quality mobile apps for easy account management.`,
          confidence: 90,
          actionable: true,
        });
      }
    }

    // Social insights
    if (factors.social?.customerReviews && factors.social.communityRatings) {
      insights.push({
        category: 'Community Feedback',
        insight: `Community ratings show ${factors.social.communityRatings}/5 average satisfaction. Real-world reviews suggest focusing on providers with 4.5+ ratings.`,
        confidence: 85,
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Adjust provider scores based on enhanced factors
   */
  private static adjustScoresWithEnhancedFactors(
    providers: any[],
    factors: Partial<EnhancedComparisonFactors>
  ): any[] {
    return providers.map((provider) => {
      let adjustedScore = provider.value_score;

      // Adjust for brand loyalty
      if (factors.behavior?.brandLoyalty && factors.behavior.brandLoyalty > 7) {
        // Boost score for well-known brands
        if (['State Farm', 'Allstate', 'Geico', 'Progressive', 'Verizon', 'AT&T'].includes(provider.name)) {
          adjustedScore += 5;
        }
      }

      // Adjust for environmental preferences
      if (factors.environment?.greenEnergyPreference) {
        if (provider.name.toLowerCase().includes('green') || provider.name.toLowerCase().includes('renewable')) {
          adjustedScore += 10;
        }
      }

      // Adjust for technology preferences
      if (factors.technology?.appQuality) {
        if (provider.strengths.some((s: string) => s.toLowerCase().includes('app'))) {
          adjustedScore += 5;
        }
      }

      // Adjust for local business preference
      if (factors.environment?.localBusinessPreference) {
        if (!['State Farm', 'Geico', 'Verizon', 'AT&T', 'Xfinity'].includes(provider.name)) {
          adjustedScore += 8;
        }
      }

      // Adjust for customer service importance
      if (factors.service?.customerServiceHours === '24/7') {
        if (provider.strengths.some((s: string) => s.toLowerCase().includes('24/7'))) {
          adjustedScore += 7;
        }
      }

      return {
        ...provider,
        value_score: Math.min(100, Math.max(0, adjustedScore)),
        adjustment_reason: this.getAdjustmentReason(factors),
      };
    });
  }

  /**
   * Generate comprehensive recommendations
   */
  private static generateComprehensiveRecommendations(
    providers: any[],
    factors: Partial<EnhancedComparisonFactors>
  ): string[] {
    const recommendations: string[] = [];

    // Best overall recommendation
    const topProvider = providers.sort((a, b) => b.value_score - a.value_score)[0];
    if (topProvider) {
      recommendations.push(
        `Primary Recommendation: ${topProvider.name} best matches your comprehensive profile with a ${topProvider.value_score}/100 fit score.`
      );
    }

    // Budget recommendation
    if (factors.financial?.budgetConstraints) {
      const [min, max] = factors.financial.budgetConstraints;
      const withinBudget = providers.filter(
        (p) => p.cost_analysis.monthly_cost <= max
      );
      if (withinBudget.length > 0) {
        recommendations.push(
          `${withinBudget.length} providers fit within your $${min}-$${max}/month budget range.`
        );
      }
    }

    // Risk-based recommendation
    if (factors.risk?.riskTolerance && factors.risk.riskTolerance < 4) {
      const safest = providers.filter(
        (p) => p.risk_analysis.provider_stability > 90
      )[0];
      if (safest) {
        recommendations.push(
          `Risk-Conscious Choice: ${safest.name} offers the highest stability rating (${safest.risk_analysis.provider_stability}%) for your low-risk tolerance.`
        );
      }
    }

    // Long-term recommendation
    if (factors.behavior?.switchingHistory && factors.behavior.switchingHistory < 2) {
      const longTerm = providers.filter(
        (p) => p.risk_analysis.price_volatility < 30
      )[0];
      if (longTerm) {
        recommendations.push(
          `Long-Term Stability: ${longTerm.name} shows low price volatility, ideal for your preference for stable, long-term relationships.`
        );
      }
    }

    return recommendations;
  }

  /**
   * Calculate confidence level based on completeness of factors
   */
  private static calculateConfidenceLevel(
    factors: Partial<EnhancedComparisonFactors>
  ): number {
    let factorCount = 0;
    let filledFactors = 0;

    const factorCategories = [
      'location',
      'personal',
      'usage',
      'financial',
      'risk',
      'behavior',
      'market',
      'social',
      'environment',
      'technology',
      'service',
    ];

    factorCategories.forEach((category) => {
      factorCount++;
      if (factors[category as keyof EnhancedComparisonFactors]) {
        filledFactors++;
      }
    });

    return Math.round((filledFactors / factorCount) * 100);
  }

  /**
   * Get list of factors considered
   */
  private static getFactorsConsidered(
    factors: Partial<EnhancedComparisonFactors>
  ): string[] {
    const considered: string[] = ['Location (ZIP Code)']; // Always included

    if (factors.personal) considered.push('Personal Demographics');
    if (factors.usage) considered.push('Historical Usage Patterns');
    if (factors.financial) considered.push('Financial Constraints');
    if (factors.risk) considered.push('Risk Profile & History');
    if (factors.behavior) considered.push('Behavioral Patterns');
    if (factors.market) considered.push('Market Conditions');
    if (factors.social) considered.push('Social & Community Feedback');
    if (factors.environment) considered.push('Environmental Preferences');
    if (factors.technology) considered.push('Technology Requirements');
    if (factors.service) considered.push('Service Quality Expectations');

    return considered;
  }

  /**
   * Calculate next recommended review date
   */
  private static calculateNextReviewDate(
    factors: Partial<EnhancedComparisonFactors>
  ): string {
    // More frequent reviews for volatile markets or high switching behavior
    let monthsUntilReview = 12; // Default: annual review

    if (factors.market?.marketTrends === 'growing') {
      monthsUntilReview = 6; // Semi-annual for growing markets
    }

    if (factors.behavior?.switchingHistory && factors.behavior.switchingHistory > 2) {
      monthsUntilReview = 3; // Quarterly for frequent switchers
    }

    if (factors.market?.seasonalPricing) {
      monthsUntilReview = 6; // Semi-annual for seasonal pricing
    }

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + monthsUntilReview);
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Get adjustment reason text
   */
  private static getAdjustmentReason(
    factors: Partial<EnhancedComparisonFactors>
  ): string {
    const reasons: string[] = [];

    if (factors.behavior?.brandLoyalty && factors.behavior.brandLoyalty > 7) {
      reasons.push('brand reputation');
    }
    if (factors.environment?.greenEnergyPreference) {
      reasons.push('environmental impact');
    }
    if (factors.technology?.appQuality) {
      reasons.push('technology features');
    }
    if (factors.service?.customerServiceHours === '24/7') {
      reasons.push('customer service availability');
    }

    return reasons.length > 0
      ? `Adjusted for: ${reasons.join(', ')}`
      : 'Base score';
  }
}



















