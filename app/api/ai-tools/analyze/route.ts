import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai/client'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Allow guest access to try AI tools with a limit
    const isGuest = !user

    const { type, data, prompt, format } = await request.json()
    
    if (!type) {
      return NextResponse.json({ error: 'Analysis type required' }, { status: 400 })
    }

    const analysisPrompt = prompt || getPromptForAnalysisType(type, data)

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful financial and administrative AI assistant. Provide clear, actionable advice and analysis." + (format === 'json' ? " Return your response in valid JSON format." : "")
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: format === 'json' ? { type: "json_object" } : undefined,
      temperature: 0.7,
      max_tokens: 1500,
    })

    const analysis = response.choices[0]?.message?.content || ''

    return NextResponse.json({
      analysis,
      success: true
    })
  } catch (error: any) {
    console.error('❌ Exception in POST /api/ai-tools/analyze:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze data' },
      { status: 500 }
    )
  }
}

function getPromptForAnalysisType(type: string, data: any): string {
  const prompts: Record<string, (data: any) => string> = {
    budget: (data) => `Analyze this budget data and provide recommendations:
Income: $${data.income || 0}/month
Expenses: $${data.expenses || 0}/month
Categories: ${JSON.stringify(data.categories || {})}

Provide:
1. Overall financial health assessment
2. Areas where they're overspending
3. Opportunities to save
4. Recommended budget adjustments
5. Emergency fund status`,

    expenses: (data) => `Analyze these expense patterns:
${JSON.stringify(data.expenses || [])}

Provide:
1. Spending pattern analysis
2. Category breakdown insights
3. Unusual or concerning transactions
4. Money-saving opportunities
5. Budget recommendations`,

    tax: (data) => `Analyze this tax situation:
Income: $${data.income || 0}
Deductions: $${data.deductions || 0}
Withholdings: $${data.withholdings || 0}

Provide:
1. Estimated tax liability
2. Refund or amount owed estimate
3. Deduction optimization tips
4. Tax planning suggestions for next year`,

    contract: (data) => `Review this contract:
${data.text || ''}

Provide:
1. Summary of key terms
2. Potential risks or red flags
3. Important dates and deadlines
4. Obligations and commitments
5. Recommendations or concerns`,

    document: (data) => `Summarize this document:
${data.text || ''}

Provide:
1. Brief summary (2-3 sentences)
2. Key points (bullet list)
3. Important dates mentioned
4. Action items or next steps
5. Overall significance`,

    invoice: (data) => `Review this invoice:
Client: ${data.client_name || 'N/A'}
Amount: $${data.total || 0}
Items: ${JSON.stringify(data.items || [])}

Provide:
1. Completeness check
2. Professional presentation tips
3. Payment terms recommendations
4. Missing information alerts`,

    financial_health: (data) => `Analyze overall financial health:
Net Worth: $${data.netWorth || 0}
Monthly Income: $${data.income || 0}
Monthly Expenses: $${data.expenses || 0}
Savings Rate: ${data.savingsRate || 0}%
Debt: $${data.debt || 0}

Provide:
1. Financial health score (1-10)
2. Strengths in their financial situation
3. Areas needing improvement
4. Short-term action items (next 30 days)
5. Long-term financial goals to consider`
  }

  const promptGenerator = prompts[type]
  if (promptGenerator) {
    return promptGenerator(data)
  }

  return `Analyze the following data and provide insights: ${JSON.stringify(data)}`
}































