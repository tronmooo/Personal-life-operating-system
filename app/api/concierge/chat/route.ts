import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ConversationState {
  intent?: string
  details: Record<string, any>
  readyToCall: boolean
  businessCount?: number
}

/**
 * POST /api/concierge/chat
 * 
 * Handles conversational AI for the AI Concierge
 * - Understands user intent (pizza, plumber, oil change, etc.)
 * - Asks clarifying questions
 * - Coordinates with phone calling system
 */
export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, state } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Get user (optional - AI Concierge can work without auth)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Note: User can be null - AI Concierge works for everyone!

    // Check OpenAI API key
    const openAIKey = process.env.OPENAI_API_KEY
    if (!openAIKey) {
      return NextResponse.json({
        response: "I'm having trouble connecting to my AI services. Please configure the OpenAI API key.",
        state: state || { details: {}, readyToCall: false }
      })
    }

    // Build system prompt for AI Concierge
    const systemPrompt = `You are an intelligent AI Concierge that makes phone calls on behalf of users. Be natural, smart, and efficient.

CORE BEHAVIOR:
- If the user gives you enough info to proceed, DO IT. Don't over-ask questions.
- NEVER ask about budget unless the user mentions it first
- Default to calling 3 businesses usually, BUT favor calling only 1 if the user implies "nearest", "closest", "the one", or "a specific place".
- Be conversational and helpful, not interrogative

SMART PARSING EXAMPLES:
✅ "I want a large cheese pizza" → You have everything! Proceed immediately.
✅ "Order me a pizza" → Ask: "What size and type?" (one question, not separate)
✅ "Get me an oil change" → You have everything! Proceed immediately.
✅ "Find a plumber" → Ask: "What's the issue?" (brief, one question)
✅ "Call the nearest Pizza Hut" → Proceed with count=1.

WHEN TO PROCEED IMMEDIATELY (no questions):
- Complete food orders: "large cheese pizza", "medium pepperoni", "chicken wings"
- Simple services: "oil change", "tire rotation", "haircut", "car wash"
- Clear requests: "plumber for a leak", "electrician for outlet"

WHEN TO ASK (briefly, ONE question max):
- Vague food: "pizza" or "burger" → "What size and type?"
- Vague service: "plumber" → "What do you need fixed?"

NEVER ASK ABOUT:
❌ Budget (unless user mentions price concerns)
❌ Number of businesses to call (unless ambiguous)
❌ Toppings for cheese pizza (it's cheese!)
❌ Obvious details

CONFIRMATION:
After you have enough info (either from initial request or brief clarification), immediately say something like:
"Got it! I'll call the nearest place to get you the best deal. Calling now..." (adjust phrasing based on count)

Then output: READY_TO_CALL|<intent>|<count>|<specificBusiness>|<user_request_summary>

INTENT TYPES:
- Food: pizza, burger, chinese, sushi, wings → use "food"
- Auto: oil change, tire, mechanic → use "auto"
- Home: plumber, electrician, hvac → use "home"
- Personal: dentist, haircut, massage → use "personal"

The <user_request_summary> should be a concise sentence describing exactly what the user wants, to be told to the business.
e.g. "I'd like to order a large pepperoni pizza." or "I need to schedule an oil change for a 2018 Toyota Camry."

EXAMPLES:

User: "I want a large cheese pizza"
You: "Perfect! I'll call 3 nearby pizza places and get you quotes. Calling now...
READY_TO_CALL|food|3||I'd like to order a large cheese pizza."

User: "Get me an oil change"
You: "On it! Calling 3 nearby auto shops to schedule your oil change.
READY_TO_CALL|auto|3||I need to schedule an oil change."

User: "Call the nearest Pizza Hut for a large pepperoni"
You: "On it! Calling the closest Pizza Hut now...
READY_TO_CALL|food|1|Pizza Hut|I'd like to order a large pepperoni pizza."

User: "Order pizza"
You: "What size and type would you like?"
User: "Large pepperoni"
You: "Great! Calling 3 pizza places now...
READY_TO_CALL|food|3||I'd like to order a large pepperoni pizza."

User: "I need a plumber"
You: "What's the issue?"
User: "Leaking sink"
You: "Got it! Calling 3 plumbers about your sink leak...
READY_TO_CALL|home|3||I need a plumber to fix a leaking sink."

BE SMART. BE EFFICIENT. DON'T OVER-ASK.

Current state: ${JSON.stringify(state || {})}`

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10).map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API failed')
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || "I'm here to help! What can I do for you?"

    // Check if AI is ready to make calls
    if (aiResponse.includes('READY_TO_CALL|')) {
      const [_, intent, businessCount, specificBusiness, userRequest] = aiResponse.split('|')
      
      return NextResponse.json({
        response: "Perfect! I'm initiating calls now. Switch to the Tasks tab to see the progress.",
        readyToCall: true,
        intent: intent.trim(),
        businessCount: parseInt(businessCount) || 3,
        specificBusiness: specificBusiness ? specificBusiness.trim() : undefined,
        state: {
          intent: intent.trim(),
          businessCount: parseInt(businessCount) || 3,
          specificBusiness: specificBusiness ? specificBusiness.trim() : undefined,
          details: {
            ...(state?.details || {}),
            userRequest: userRequest ? userRequest.trim() : undefined
          },
          readyToCall: true
        }
      })
    }

    // Extract intent and details from conversation
    const updatedState: ConversationState = {
      ...state,
      details: { ...(state?.details || {}) },
      readyToCall: false
    }

    // Try to detect intent if not already set
    if (!updatedState.intent) {
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('pizza')) updatedState.intent = 'pizza'
      else if (lowerMessage.includes('plumber')) updatedState.intent = 'plumber'
      else if (lowerMessage.includes('oil change') || lowerMessage.includes('mechanic')) updatedState.intent = 'oil_change'
      else if (lowerMessage.includes('electrician')) updatedState.intent = 'electrician'
      else if (lowerMessage.includes('dentist')) updatedState.intent = 'dentist'
    }

    return NextResponse.json({
      response: aiResponse,
      state: updatedState,
      readyToCall: false
    })

  } catch (error: any) {
    console.error('Concierge chat error:', error)
    return NextResponse.json({
      response: "I apologize, but I'm having trouble right now. Please try again.",
      error: error.message
    }, { status: 500 })
  }
}





