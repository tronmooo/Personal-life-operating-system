/**
 * AI-Powered Contract Analysis API
 * POST /api/ai-tools/analyze-contract
 * Analyzes service provider contracts for hidden clauses and issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { contractText, serviceType } = await request.json();

    if (!contractText || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: contractText, serviceType' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a legal contract analyzer specializing in service provider agreements. Analyze the following ${serviceType} contract and provide a comprehensive breakdown.

CONTRACT TEXT:
${contractText}

Please provide a detailed analysis in JSON format with the following structure:
{
  "summary": "Brief 2-3 sentence summary of the contract",
  "keyTerms": [
    {
      "term": "Term name",
      "details": "Explanation",
      "concern_level": "low" | "medium" | "high"
    }
  ],
  "hiddenClauses": [
    {
      "clause": "The problematic clause text",
      "issue": "Why this is concerning",
      "impact": "Potential financial or legal impact"
    }
  ],
  "autoRenewal": {
    "hasAutoRenewal": true/false,
    "noticePeriod": "X days",
    "penaltyForCancellation": "Description or amount"
  },
  "priceChanges": {
    "canPriceIncrease": true/false,
    "noticeRequired": "X days",
    "maxIncrease": "Percentage or description"
  },
  "earlyTermination": {
    "allowed": true/false,
    "fee": "Amount or description",
    "conditions": "Under what conditions"
  },
  "dataPrivacy": {
    "sharesData": true/false,
    "thirdParties": "List of third parties or 'unknown'",
    "userRights": "What rights users have"
  },
  "liabilityLimitations": [
    "List of ways provider limits their liability"
  ],
  "redFlags": [
    {
      "flag": "Specific concerning item",
      "severity": "low" | "medium" | "high" | "critical",
      "recommendation": "What to do about it"
    }
  ],
  "consumerFriendliness": {
    "score": 0-100,
    "reason": "Why this score"
  },
  "recommendations": [
    "Specific actionable recommendations"
  ]
}

Be thorough, identify all potential issues, and provide clear recommendations.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Contract analysis error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Contract analysis failed',
      },
      { status: 500 }
    );
  }
}



















