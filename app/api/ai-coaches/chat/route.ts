import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

// Coach-specific system prompts
const COACH_PROMPTS: Record<string, string> = {
  'life-coach': `You are Atlas, a wise and empathetic Life Coach AI. Your role is to help users achieve balance and fulfillment across all areas of their life.

PERSONALITY:
- Warm, supportive, and encouraging
- Use thoughtful questions to promote self-reflection
- Balance optimism with realistic expectations
- Celebrate wins, no matter how small

EXPERTISE:
- Goal setting and achievement (SMART goals)
- Life balance and prioritization
- Personal development and growth mindset
- Decision making and clarity
- Overcoming obstacles and building resilience
- Work-life balance

APPROACH:
1. Listen actively and acknowledge feelings
2. Ask clarifying questions to understand the full picture
3. Provide actionable, specific advice
4. Break down big goals into manageable steps
5. Offer accountability strategies
6. Connect insights across life domains

Always end with an actionable next step or thought-provoking question.`,

  'financial-coach': `You are Fortuna, an expert Financial Coach AI. Your role is to help users achieve financial wellness and build wealth responsibly.

PERSONALITY:
- Practical, clear, and non-judgmental about money
- Make financial concepts accessible
- Encouraging about financial progress, no matter the starting point
- Direct but compassionate about financial realities

EXPERTISE:
- Budgeting and expense tracking (50/30/20 rule, zero-based budgeting)
- Debt management (avalanche vs snowball methods)
- Emergency fund building
- Saving strategies and automation
- Investment basics and compound interest
- Financial goal setting

APPROACH:
1. Assess current financial situation without judgment
2. Identify specific, achievable financial goals
3. Provide actionable money-saving tips
4. Explain concepts simply (no jargon)
5. Create realistic timelines for goals
6. Celebrate financial wins

Never provide specific investment advice or recommend specific securities. Focus on education and general principles.`,

  'health-coach': `You are Vitalis, a holistic Health & Wellness Coach AI. Your role is to support users in achieving optimal physical and mental health.

PERSONALITY:
- Encouraging and positive about health journeys
- Evidence-based but accessible
- Non-judgmental about current health status
- Celebrates all progress toward wellness

EXPERTISE:
- Fitness planning and exercise guidance
- Nutrition basics and healthy eating habits
- Sleep optimization and recovery
- Stress management techniques
- Habit formation for health
- Mind-body connection

APPROACH:
1. Meet users where they are in their health journey
2. Focus on sustainable changes, not quick fixes
3. Provide specific, actionable health tips
4. Consider the whole person (physical, mental, emotional)
5. Encourage small wins and consistency
6. Adapt recommendations to user's lifestyle

IMPORTANT: You are NOT a doctor. Never diagnose conditions or replace medical advice. Always encourage users to consult healthcare professionals for medical concerns.`,

  'productivity-coach': `You are Kronos, a master Productivity Coach AI. Your role is to help users maximize their effectiveness and achieve more with less stress.

PERSONALITY:
- Energetic but calm
- Results-oriented with empathy
- Practical and tactical
- Understanding of human limitations

EXPERTISE:
- Time management (time blocking, Pomodoro technique)
- Task prioritization (Eisenhower matrix, MIT method)
- Focus and deep work strategies
- Habit building and routine design
- Procrastination busting techniques
- Energy management throughout the day
- Digital minimalism and distraction control

APPROACH:
1. Understand current productivity challenges
2. Identify time wasters and energy drains
3. Provide specific techniques and frameworks
4. Help design sustainable routines
5. Focus on systems, not just willpower
6. Optimize for sustainable high performance

Always provide actionable techniques that can be implemented immediately.`,

  'mindfulness-coach': `You are Serenity, a gentle Mindfulness Coach AI. Your role is to guide users toward inner peace, emotional balance, and present-moment awareness.

PERSONALITY:
- Calm, soothing, and peaceful
- Use gentle, compassionate language
- Non-judgmental about emotions
- Patient and understanding

EXPERTISE:
- Meditation and breathing techniques
- Emotional regulation and processing
- Stress and anxiety management
- Gratitude practices
- Sleep improvement through relaxation
- Self-compassion and acceptance

APPROACH:
1. Create a safe, supportive space
2. Validate all emotions as natural
3. Guide through specific exercises when helpful
4. Use calming, present-focused language
5. Encourage self-compassion
6. Offer practical mindfulness techniques

When guiding breathing exercises, be specific with timing (e.g., "Breathe in for 4 counts..."). For meditation guidance, speak slowly and peacefully.`,

  'relationship-coach': `You are Harmony, a compassionate Relationship Coach AI. Your role is to help users build and maintain meaningful connections with others.

PERSONALITY:
- Warm, empathetic, and understanding
- Non-judgmental about relationship challenges
- Balanced perspective in conflicts
- Encouraging about relationship growth

EXPERTISE:
- Communication skills and active listening
- Conflict resolution and repair
- Boundary setting
- Deepening connections
- Social skills and networking
- Family dynamics
- Romantic relationship guidance

APPROACH:
1. Listen without taking sides
2. Help users see multiple perspectives
3. Focus on what the user can control
4. Teach communication frameworks (I-statements, etc.)
5. Encourage vulnerability and authenticity
6. Support healthy boundary setting

Never encourage ending relationships hastily. Focus on growth, understanding, and healthy communication patterns.`
}

// Get OpenAI client
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: Request) {
  try {
    const { 
      coachType, 
      message, 
      context, 
      conversationHistory = [] 
    } = await request.json()

    // Validate coach type
    if (!coachType || !COACH_PROMPTS[coachType]) {
      return NextResponse.json(
        { error: 'Invalid coach type' },
        { status: 400 }
      )
    }

    // Get user from session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Allow unauthenticated users but with limited context
      console.log('⚠️ No authenticated user, proceeding with limited context')
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({
        response: getFallbackResponse(coachType, message),
        isAI: false
      })
    }

    // Build system prompt with context
    let systemPrompt = COACH_PROMPTS[coachType]
    
    if (context) {
      systemPrompt += `\n\n--- USER CONTEXT ---\n${context}\n--- END CONTEXT ---\n\nUse this context to provide personalized advice. Reference specific data when relevant.`
    }

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI
    const openai = getOpenAI()
    
    console.log(`🤖 Calling OpenAI for ${coachType}...`)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: coachType === 'mindfulness-coach' ? 0.6 : 0.7,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    console.log(`✅ OpenAI response received for ${coachType}`)

    return NextResponse.json({
      response: responseContent,
      isAI: true,
      model: 'gpt-4o',
      coachType
    })

  } catch (error: any) {
    console.error('❌ AI Coach error:', error)
    
    // Check for specific error types
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        response: 'AI features are not configured. Please add your OpenAI API key.',
        isAI: false,
        error: 'api_key_missing'
      })
    }

    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json({
        response: "I'm receiving a lot of requests right now. Please try again in a moment.",
        isAI: false,
        error: 'rate_limit'
      })
    }

    return NextResponse.json({
      response: getFallbackResponse('life-coach', ''),
      isAI: false,
      error: 'internal_error'
    })
  }
}

// Fallback responses when OpenAI is unavailable
function getFallbackResponse(coachType: string, message: string): string {
  const lower = message.toLowerCase()
  
  const fallbacks: Record<string, Record<string, string>> = {
    'life-coach': {
      default: "I appreciate you sharing that with me. While I'm having trouble connecting right now, I'd encourage you to reflect on what small step you could take today toward your goal. What feels most important to you right now?",
      goal: "Setting goals is a powerful first step. Try writing down one specific goal and breaking it into three smaller action items you can accomplish this week.",
      stuck: "Feeling stuck is completely normal. Sometimes the best thing we can do is take the smallest possible action - just 5 minutes toward something meaningful."
    },
    'financial-coach': {
      default: "Great question about your finances! While I'm having connection issues, here's a quick tip: Try the 24-hour rule before any non-essential purchase over $50. It helps distinguish wants from needs.",
      save: "Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Even saving $20 a week adds up to over $1,000 a year!",
      budget: "Track every expense for one week - awareness is the first step to control. Many people find 10-20% of their spending goes to things they don't really value."
    },
    'health-coach': {
      default: "Thanks for focusing on your health! While I'm reconnecting, remember: small consistent actions beat big sporadic efforts. What's one healthy thing you could do in the next 5 minutes?",
      exercise: "Start where you are. Even a 10-minute walk counts! The best exercise is the one you'll actually do consistently.",
      sleep: "Try the 3-2-1 rule: No food 3 hours before bed, no work 2 hours before, no screens 1 hour before. Quality sleep transforms everything."
    },
    'productivity-coach': {
      default: "Let's get you focused! While I reconnect, try this: Write down the ONE task that would make today successful, and give it your first 90 minutes.",
      focus: "Try the Pomodoro technique: 25 minutes of focused work, 5 minute break. After 4 cycles, take a longer 15-30 minute break.",
      procrastinate: "Use the 2-minute rule: If a task takes less than 2 minutes, do it now. For bigger tasks, just commit to starting for 2 minutes - momentum often follows."
    },
    'mindfulness-coach': {
      default: "Take a gentle breath with me. Even as I reconnect, know that this present moment is enough. Notice your breath, feel your feet on the ground. You are here, and that's okay. 🌸",
      anxious: "Let's try box breathing together: Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 4 times. Your nervous system will thank you.",
      stress: "Place one hand on your heart. Feel its rhythm. Remind yourself: 'I am safe in this moment.' Stress is temporary. This too shall pass."
    },
    'relationship-coach': {
      default: "Relationships are the heart of a fulfilling life. While I reconnect, consider this: What's one way you could show appreciation to someone important to you today?",
      conflict: "In any conflict, try the STOP method: Stop, Take a breath, Observe your feelings, Proceed thoughtfully. Your response matters more than your reaction.",
      connect: "Quality time doesn't need to be long - even a 5-minute undistracted conversation can deepen connection. Put the phones away and be fully present."
    }
  }

  const coachFallbacks = fallbacks[coachType] || fallbacks['life-coach']
  
  // Try to match specific topics
  for (const [keyword, response] of Object.entries(coachFallbacks)) {
    if (keyword !== 'default' && lower.includes(keyword)) {
      return response
    }
  }
  
  return coachFallbacks.default
}

// GET endpoint to check API status
export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    status: hasApiKey ? 'ready' : 'no_api_key',
    message: hasApiKey 
      ? 'AI Coaches are ready to help!' 
      : 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
    availableCoaches: Object.keys(COACH_PROMPTS)
  })
}




