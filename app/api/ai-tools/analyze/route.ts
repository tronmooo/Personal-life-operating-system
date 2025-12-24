import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function callGemini(prompt: string, systemPrompt: string, format?: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null

  try {
    const fullPrompt = systemPrompt + '\n\n' + prompt
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 40
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    }
  } catch (error) {
    console.warn('⚠️ Gemini request failed:', error)
  }
  return null
}

async function callOpenAI(prompt: string, systemPrompt: string, format?: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: format === 'json' ? { type: 'json_object' } : undefined,
        temperature: 0.7,
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }
  } catch (error) {
    console.warn('⚠️ OpenAI request failed:', error)
  }
  return null
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    await supabase.auth.getUser() // Just validate session, allow guest access

    const { type, data, prompt, format } = await request.json()
    
    if (!type && !prompt) {
      return NextResponse.json({ error: 'Analysis type or prompt required' }, { status: 400 })
    }

    const analysisPrompt = prompt || getPromptForAnalysisType(type, data)
    const systemPrompt = "You are a helpful financial and administrative AI assistant. Provide clear, actionable advice and analysis." + (format === 'json' ? " Return your response in valid JSON format." : "")

    // Try Gemini first (free), then OpenAI as fallback
    let analysis = await callGemini(analysisPrompt, systemPrompt, format)
    let source = 'gemini'
    
    if (!analysis) {
      analysis = await callOpenAI(analysisPrompt, systemPrompt, format)
      source = 'openai'
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analysis,
      source,
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































