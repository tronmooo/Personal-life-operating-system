/**
 * Universal AI Calculator Enhancement Hook
 * Adds AI-powered insights to any calculator
 */

import { useState } from 'react'

export interface CalculatorAIRequest {
  calculatorType: string
  inputData: Record<string, any>
  result: Record<string, any>
}

export interface CalculatorAIInsights {
  summary: string
  insights: string[]
  recommendations: string[]
  warnings?: string[]
  comparisons?: {
    label: string
    value: string
    interpretation: string
  }[]
  nextSteps?: string[]
}

export function useCalculatorAI() {
  const [insights, setInsights] = useState<CalculatorAIInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsights = async (request: CalculatorAIRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calculators/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate insights')
      }

      const data = await response.json()
      setInsights(data.insights)
      return data.insights
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate AI insights'
      setError(errorMessage)
      console.error('AI Insights Error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const clearInsights = () => {
    setInsights(null)
    setError(null)
  }

  return {
    insights,
    loading,
    error,
    generateInsights,
    clearInsights
  }
}

/**
 * Calculator-specific AI prompt generators
 */
export const CALCULATOR_PROMPTS = {
  bmi: (data: any) => `
Analyze this BMI calculation:
- Height: ${data.height} ${data.heightUnit}
- Weight: ${data.weight} ${data.weightUnit}
- BMI: ${data.bmi}
- Category: ${data.category}

Provide:
1. Health interpretation
2. 3-5 personalized insights
3. Actionable recommendations
4. Any health warnings if applicable
5. Comparison to healthy ranges
  `,

  mortgage: (data: any) => `
Analyze this mortgage calculation:
- Home Price: $${data.homePrice}
- Down Payment: $${data.downPayment} (${data.downPaymentPercent}%)
- Interest Rate: ${data.interestRate}%
- Loan Term: ${data.loanTerm} years
- Monthly Payment: $${data.monthlyPayment}
- Total Interest: $${data.totalInterest}

Provide:
1. Affordability analysis
2. Financial insights
3. Money-saving recommendations
4. Comparison to market averages
5. Refinancing suggestions if applicable
  `,

  retirement: (data: any) => `
Analyze this retirement calculation:
- Current Age: ${data.currentAge}
- Retirement Age: ${data.retirementAge}
- Current Savings: $${data.currentSavings}
- Monthly Contribution: $${data.monthlyContribution}
- Annual Return: ${data.annualReturn}%
- Projected Balance: $${data.projectedBalance}

Provide:
1. Retirement readiness assessment
2. Key insights about savings trajectory
3. Optimization recommendations
4. Risk factors to consider
5. Alternative scenarios to consider
  `,

  calorie: (data: any) => `
Analyze this calorie calculation:
- Age: ${data.age}
- Gender: ${data.gender}
- Height: ${data.height} ${data.heightUnit}
- Weight: ${data.weight} ${data.weightUnit}
- Activity Level: ${data.activityLevel}
- Goal: ${data.goal}
- Daily Calories: ${data.dailyCalories}

Provide:
1. Nutritional assessment
2. Health insights
3. Diet recommendations
4. Realistic goal timeline
5. Important nutrition tips
  `,

  debt: (data: any) => `
Analyze this debt payoff calculation:
- Total Debt: $${data.totalDebt}
- Interest Rate: ${data.interestRate}%
- Monthly Payment: $${data.monthlyPayment}
- Payoff Time: ${data.payoffMonths} months
- Total Interest: $${data.totalInterest}

Provide:
1. Debt management assessment
2. Financial insights
3. Accelerated payoff strategies
4. Interest-saving recommendations
5. Debt consolidation considerations
  `,

  compound: (data: any) => `
Analyze this compound interest calculation:
- Initial Investment: $${data.principal}
- Monthly Contribution: $${data.monthlyContribution}
- Annual Return: ${data.annualReturn}%
- Time Period: ${data.years} years
- Final Value: $${data.finalValue}
- Total Earnings: $${data.totalEarnings}

Provide:
1. Investment growth analysis
2. Compounding insights
3. Optimization recommendations
4. Risk considerations
5. Alternative investment strategies
  `,

  budget: (data: any) => `
Analyze this budget:
- Total Income: $${data.totalIncome}
- Total Expenses: $${data.totalExpenses}
- Net: $${data.net}
- Savings Rate: ${data.savingsRate}%
- Expense Categories: ${JSON.stringify(data.categories)}

Provide:
1. Budget health assessment
2. Spending insights
3. Optimization recommendations
4. Savings strategies
5. Financial priorities to consider
  `,

  // Generic fallback for any calculator
  generic: (data: any) => `
Analyze these calculation results:
${JSON.stringify(data, null, 2)}

Provide:
1. Summary interpretation
2. 3-5 key insights
3. Actionable recommendations
4. Important considerations
5. Related factors to consider
  `
}

