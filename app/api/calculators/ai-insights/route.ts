/**
 * AI Calculator Insights API
 * Generates AI-powered insights for calculator results using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server'
import { requestAI } from '@/lib/services/ai-service'

export const runtime = 'nodejs'
export const maxDuration = 30

interface CalculatorAIRequest {
  calculatorType: string
  inputData: Record<string, any>
  result: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculatorAIRequest = await request.json()
    const { calculatorType, inputData, result } = body

    if (!calculatorType || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: calculatorType and result' },
        { status: 400 }
      )
    }

    console.log(`🧮 Generating AI insights for ${calculatorType} calculator`)

    // Generate prompt based on calculator type
    const prompt = generateCalculatorPrompt(calculatorType, inputData, result)

    // Call AI service (uses Gemini primary, OpenAI fallback)
    const aiResponse = await requestAI({
      prompt,
      systemPrompt: `You are an expert financial, health, and lifestyle advisor. Analyze calculator results and provide practical, actionable insights. Format your response as JSON with the following structure:
{
  "summary": "Brief 1-2 sentence overview",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "warnings": ["warning 1", "warning 2"] (optional),
  "comparisons": [{"label": "comparison name", "value": "value", "interpretation": "what it means"}] (optional),
  "nextSteps": ["step 1", "step 2"] (optional)
}

Be specific, practical, and actionable. Use real numbers from the calculations.`,
      temperature: 0.7,
      maxTokens: 1500
    })

    // Parse AI response
    let insights
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        insights = JSON.parse(aiResponse.content)
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, creating fallback structure')
      insights = {
        summary: aiResponse.content.substring(0, 200),
        insights: [aiResponse.content],
        recommendations: [],
        warnings: []
      }
    }

    console.log(`✅ AI insights generated successfully (source: ${aiResponse.source})`)

    return NextResponse.json({
      success: true,
      insights,
      source: aiResponse.source,
      calculatorType
    })
  } catch (error: any) {
    console.error('❌ AI Insights Error:', error)
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate AI insights',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Generate calculator-specific prompts
 */
function generateCalculatorPrompt(
  type: string,
  input: Record<string, any>,
  result: Record<string, any>
): string {
  const allData = { ...input, ...result }

  // Calculator-specific prompts
  const prompts: Record<string, string> = {
    bmi: `
Analyze this BMI calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Health interpretation of BMI category
- Personalized fitness insights
- Nutrition recommendations
- Realistic health goals
- Important health considerations
    `,

    mortgage: `
Analyze this mortgage calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Affordability assessment
- Long-term financial impact
- Money-saving strategies
- Comparison to recommended debt-to-income ratios
- Refinancing opportunities
    `,

    retirement: `
Analyze this retirement calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Retirement readiness assessment
- Savings trajectory analysis
- Investment optimization strategies
- Risk factors and mitigation
- Alternative retirement scenarios
    `,

    calorie: `
Analyze this calorie calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Nutritional assessment
- Realistic weight goals
- Balanced diet recommendations
- Exercise integration
- Sustainable lifestyle changes
    `,

    debt: `
Analyze this debt payoff calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Debt management assessment
- Accelerated payoff strategies
- Interest-saving opportunities
- Budget optimization
- Debt consolidation considerations
    `,

    compound: `
Analyze this compound interest calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Investment growth trajectory
- Power of compounding insights
- Portfolio optimization strategies
- Risk vs. return considerations
- Alternative investment vehicles
    `,

    budget: `
Analyze this budget:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Budget health assessment
- Spending pattern insights
- Optimization opportunities
- Savings rate recommendations
- Financial priority alignment
    `,

    loan: `
Analyze this loan calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Loan affordability assessment
- Total cost analysis
- Payment optimization strategies
- Early payoff benefits
- Alternative loan structures
    `,

    savings: `
Analyze this savings goal calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Goal achievement timeline
- Savings strategy optimization
- Investment vehicle recommendations
- Budget adjustment suggestions
- Milestone tracking
    `,

    investment: `
Analyze this investment calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Investment performance analysis
- Risk-adjusted returns
- Portfolio diversification
- Time horizon considerations
- Market condition factors
    `,

    tax: `
Analyze this tax calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Tax liability assessment
- Deduction opportunities
- Tax optimization strategies
- Withholding adjustments
- Year-end tax planning
    `,

    health: `
Analyze these health metrics:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Health status interpretation
- Personalized health insights
- Lifestyle recommendations
- Goal setting strategies
- Important health considerations
    `,

    fitness: `
Analyze these fitness calculations:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Fitness level assessment
- Training optimization
- Performance improvements
- Injury prevention
- Progressive goal setting
    `,

    property: `
Analyze this property calculation:
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Focus on:
- Project cost assessment
- Material optimization
- Budget considerations
- DIY vs. professional hiring
- Timeline and planning
    `
  }

  // Return calculator-specific prompt or generic fallback
  if (prompts[type]) {
    return prompts[type]
  }

  // Generic fallback for unlisted calculators
  return `
Analyze this calculator result:
Calculator Type: ${type}
Input: ${JSON.stringify(input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Provide:
1. Clear interpretation of the results
2. 3-5 actionable insights
3. Practical recommendations
4. Important considerations
5. Next steps or follow-up actions
  `
}

