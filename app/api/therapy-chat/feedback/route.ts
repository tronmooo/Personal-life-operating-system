import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function updateUserPreferences(
  supabase: any,
  userId: string,
  messageContent: string,
  feedback: string,
  feedbackNote?: string
) {
  // Simple sentiment analysis and preference extraction
  const isHelpful = feedback === 'helpful'
  
  // Extract patterns from helpful/unhelpful responses
  if (feedbackNote) {
    const preferenceType = isHelpful ? 'helpful_patterns' : 'unhelpful_patterns'
    
    const { data: existing } = await supabase
      .from('therapy_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_type', preferenceType)
      .single()

    const patterns = existing?.preference_value?.patterns || []
    patterns.push({
      content: messageContent,
      note: feedbackNote,
      timestamp: new Date().toISOString()
    })

    await supabase
      .from('therapy_preferences')
      .upsert({
        user_id: userId,
        preference_type: preferenceType,
        preference_value: { patterns: patterns.slice(-20) }, // Keep last 20
        confidence_score: 0.7,
        updated_at: new Date().toISOString()
      })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, feedback, note } = body

    if (!messageId || !feedback) {
      return NextResponse.json(
        { error: 'messageId and feedback are required' },
        { status: 400 }
      )
    }

    // Update message feedback
    const { data: message, error: updateError } = await supabase
      .from('therapy_messages')
      .update({
        feedback,
        feedback_note: note || null
      })
      .eq('id', messageId)
      .select('content')
      .single()

    if (updateError) throw updateError

    // Update user preferences based on feedback
    await updateUserPreferences(supabase, user.id, message.content, feedback, note)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

























