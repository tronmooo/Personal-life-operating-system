import { createServerClient } from '@/lib/supabase/server'

import { NextRequest, NextResponse } from 'next/server'

const VAPI_ASSISTANT_ID = process.env.THERAPY_ASSISTANT_ID || 'asst_9qUg3Px1Hprr0oSgBQfnp19U'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface TherapyContext {
  conversationHistory: Array<{ role: string; content: string }>
  userPreferences: Record<string, any>
  recentFeedback: Array<{ helpful: boolean; content: string; note?: string }>
}

async function getUserPreferences(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('therapy_preferences')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching preferences:', error)
    return {}
  }

  const preferences: Record<string, any> = {}
  data?.forEach((pref: any) => {
    preferences[pref.preference_type] = pref.preference_value
  })

  return preferences
}

async function getRecentFeedback(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('therapy_messages')
    .select('content, feedback, feedback_note')
    .eq('role', 'assistant')
    .not('feedback', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching feedback:', error)
    return []
  }

  return data?.map((msg: any) => ({
    helpful: msg.feedback === 'helpful',
    content: msg.content,
    note: msg.feedback_note
  })) || []
}

async function generateTherapyResponse(message: string, context: TherapyContext) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  // Build context-aware system prompt
  const systemPrompt = `You are a compassionate, professional AI therapist. 

User Preferences:
${JSON.stringify(context.userPreferences, null, 2)}

Recent Feedback:
${context.recentFeedback.map(f => 
  `- ${f.helpful ? '✓' : '✗'} ${f.content}${f.note ? ` (${f.note})` : ''}`
).join('\n')}

Guidelines:
- Use empathetic, validating language
- Ask open-ended questions to deepen understanding
- Reflect back emotions you hear
- If user gave negative feedback on similar responses, adjust your approach
- Keep responses concise (2-4 sentences unless more detail is needed)
- Never diagnose or prescribe medical treatment
- Encourage professional help for serious concerns`

  const conversationContext = [
    { role: 'system', content: systemPrompt },
    ...context.conversationHistory.slice(-10), // Last 10 messages
    { role: 'user', content: message }
  ]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversationContext.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 400,
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, conversationId } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from('therapy_conversations')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (convError) throw convError
      convId = newConv.id
    }

    // Store user message
    const { error: msgError } = await supabase
      .from('therapy_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message
      })

    if (msgError) throw msgError

    // Get conversation history
    const { data: history } = await supabase
      .from('therapy_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    // Build context
    const preferences = await getUserPreferences(supabase, user.id)
    const recentFeedback = await getRecentFeedback(supabase, user.id)

    const context: TherapyContext = {
      conversationHistory: history || [],
      userPreferences: preferences,
      recentFeedback: recentFeedback
    }

    // Generate response
    const response = await generateTherapyResponse(message, context)

    // Store assistant message
    const { data: assistantMsg, error: assistantError } = await supabase
      .from('therapy_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: response
      })
      .select()
      .single()

    if (assistantError) throw assistantError

    return NextResponse.json({
      conversationId: convId,
      message: response,
      messageId: assistantMsg.id
    })

  } catch (error: any) {
    console.error('Therapy chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

























