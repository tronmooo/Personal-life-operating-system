/**
 * Enhanced Service Comparator AI API Route
 * POST /api/ai-tools/service-comparator
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServiceComparatorEngine } from '@/lib/ai/service-comparator-engine';
import { EnhancedServiceComparatorEngine } from '@/lib/ai/enhanced-service-comparator';
import type { ComparisonRequest } from '@/types/service-comparator';
import type { EnhancedComparisonFactors } from '@/lib/ai/enhanced-service-comparator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ComparisonRequest & { 
      enhanced_factors?: Partial<EnhancedComparisonFactors> 
    };

    // Validate request
    if (!body.service_type) {
      return NextResponse.json(
        { error: 'Missing required field: service_type' },
        { status: 400 }
      );
    }

    if (!body.user_profile?.zip) {
      return NextResponse.json(
        { error: 'Missing required field: user_profile.zip' },
        { status: 400 }
      );
    }

    // Run comparison - use enhanced engine if enhanced factors provided
    let result;
    if (body.enhanced_factors && Object.keys(body.enhanced_factors).length > 0) {
      console.log('Using Enhanced Service Comparator Engine with comprehensive factors');
      result = await EnhancedServiceComparatorEngine.compareEnhanced(
        body,
        body.enhanced_factors
      );
    } else {
      console.log('Using Standard Service Comparator Engine');
      result = await ServiceComparatorEngine.compare(body);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Service comparator error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Service comparison failed',
      },
      { status: 500 }
    );
  }
}









