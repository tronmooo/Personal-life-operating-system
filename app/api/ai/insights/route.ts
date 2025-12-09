import { createServerClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, data } = await request.json()

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('Gemini API key not configured, using fallback insights')
      return NextResponse.json({
        success: true,
        insights: getFallbackInsights(data),
        source: 'fallback',
      })
    }

    // Generate insights using Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          success: true,
          insights,
          source: 'ai',
        })
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    // Fallback if parsing fails
    return NextResponse.json({
      success: true,
      insights: getFallbackInsights(data),
      source: 'fallback',
    })
  } catch (error: any) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

function getFallbackInsights(data: any) {
  const insights: any[] = []

  if (data.financialHealth >= 80) {
    insights.push({
      type: 'celebration',
      title: 'Excellent Financial Health',
      message: `Your financial health score of ${data.financialHealth} is outstanding!`,
      priority: 'low',
      actionable: false,
    })
  } else if (data.financialHealth < 60) {
    insights.push({
      type: 'warning',
      title: 'Financial Health Needs Attention',
      message: 'Consider reviewing unpaid bills and setting up automated payments.',
      priority: 'high',
      actionable: true,
      actionLabel: 'View Bills',
    })
  }

  if (data.lifeBalance < 50) {
    insights.push({
      type: 'recommendation',
      title: 'Expand Your Life Balance',
      message: 'Try exploring more domains to get a complete picture of your life.',
      priority: 'medium',
      actionable: true,
      actionLabel: 'Explore Domains',
    })
  }

  if (data.productivity > 80) {
    insights.push({
      type: 'celebration',
      title: 'Productivity Champion',
      message: 'Amazing! Your task completion rate shows you\'re crushing your goals.',
      priority: 'low',
      actionable: false,
    })
  }

  return insights
}
