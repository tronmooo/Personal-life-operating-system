import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


/**
 * POST /api/ai/create-calendar-event
 * Create a calendar event using natural language
 */
export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    console.log('🗓️ AI Calendar Event Creation:', message)
    
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = session.provider_token
    if (!token) {
      return NextResponse.json({
        error: 'Calendar not connected',
        requiresAuth: true
      }, { status: 403 })
    }
    
    // Use OpenAI to parse the natural language into structured event data
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    
    // Get current date/time for accurate parsing
    const now = new Date()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
    
    // Call OpenAI to extract event details
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a calendar event extraction assistant. Extract event details from natural language and return ONLY a JSON object.

CURRENT DATE: ${currentDate}
CURRENT TIME: ${currentTime}
TIMEZONE: ${timezone}

Return this exact JSON structure:
{
  "summary": "event title",
  "start": "ISO 8601 datetime with timezone (YYYY-MM-DDTHH:MM:SS)",
  "end": "ISO 8601 datetime with timezone (YYYY-MM-DDTHH:MM:SS)",
  "description": "optional description",
  "location": "optional location"
}

CRITICAL RULES:
- ALWAYS use the current date provided above as your reference
- "tomorrow" = add 1 day to current date
- "next Tuesday" = find the next occurrence of Tuesday from current date
- If no time specified, use 09:00 (9am)
- Default duration is 1 hour if not specified
- Use 24-hour format (15:00 for 3pm)
- VERIFY your date calculation is correct before responding
- Return ONLY the JSON object, no other text`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    })
    
    if (!extractionResponse.ok) {
      throw new Error('Failed to parse event from message')
    }
    
    const extractionData = await extractionResponse.json()
    const extractedText = extractionData.choices[0]?.message?.content || '{}'
    
    console.log('📅 Current date reference:', currentDate)
    console.log('📝 Extracted event data:', extractedText)
    
    // Parse the JSON
    let eventData
    try {
      eventData = JSON.parse(extractedText)
    } catch (e) {
      // Try to extract JSON from the text
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        eventData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse event details from message')
      }
    }
    
    // Validate required fields
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json({
        error: 'Could not extract event details. Please provide more information (title, date/time)',
        suggestion: 'Try: "Create a meeting with John tomorrow at 3pm for 1 hour"'
      }, { status: 400 })
    }
    
    // Create the calendar event
    const calendarEvent = {
      summary: eventData.summary,
      description: eventData.description || `Created via AI: "${message}"`,
      location: eventData.location,
      start: {
        dateTime: eventData.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventData.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }
    
    console.log('📅 Creating calendar event:', calendarEvent)
    
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      }
    )
    
    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json()
      console.error('❌ Calendar API error:', errorData)
      throw new Error(errorData.error?.message || 'Failed to create calendar event')
    }
    
    const createdEvent = await calendarResponse.json()
    
    console.log('✅ Calendar event created:', createdEvent.id)
    
    return NextResponse.json({
      success: true,
      event: {
        id: createdEvent.id,
        summary: createdEvent.summary,
        start: createdEvent.start.dateTime || createdEvent.start.date,
        end: createdEvent.end.dateTime || createdEvent.end.date,
        htmlLink: createdEvent.htmlLink,
        description: createdEvent.description
      },
      message: `✅ Created: "${createdEvent.summary}" on ${new Date(createdEvent.start.dateTime || createdEvent.start.date).toLocaleString()}`
    })
    
  } catch (error: any) {
    console.error('❌ AI Calendar Event Creation Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create calendar event',
        details: 'Try rephrasing with clearer date/time information'
      },
      { status: 500 }
    )
  }
}

