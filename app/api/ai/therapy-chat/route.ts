import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI Assistant Configuration
const THERAPIST_ASSISTANT_ID = 'asst_9qUg3Px1Hprr0oSgBQfnp19U'

// Enhanced conversation history with metadata
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sentiment?: 'positive' | 'negative' | 'neutral' | 'confused'
}

interface ConversationContext {
  messages: ConversationMessage[]
  topics: string[]
  emotionalState: string
  sessionPhase: 'opening' | 'exploring' | 'deepening' | 'reflecting'
  keyThemes: string[]
  startedAt: number
  openaiThreadId?: string // OpenAI Assistants API thread ID
}

const conversationHistory = new Map<string, ConversationContext>()

// Clean up old conversations (older than 2 hours)
setInterval(() => {
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000)
  for (const [threadId, context] of conversationHistory.entries()) {
    if (context.startedAt < twoHoursAgo) {
      conversationHistory.delete(threadId)
    }
  }
}, 30 * 60 * 1000) // Run every 30 minutes

export async function POST(request: Request) {
  try {
    console.log('🧠 Therapy chat API called')
    
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({
        response: "I'm here with you. Can you tell me what's on your mind?",
        threadId: null,
        error: 'Invalid request format'
      }, { status: 400 })
    }
    
    const { message, threadId: clientThreadId } = body
    
    if (!message || typeof message !== 'string') {
      console.error('❌ Invalid message:', message)
      return NextResponse.json({
        response: "I'm listening. What would you like to share?",
        threadId: null,
        error: 'Message is required'
      }, { status: 400 })
    }
    
    // Generate or use existing thread ID
    const threadId = clientThreadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Get or initialize conversation context
    let context = conversationHistory.get(threadId)
    if (!context) {
      context = {
        messages: [],
        topics: [],
        emotionalState: 'exploring',
        sessionPhase: 'opening',
        keyThemes: [],
        startedAt: Date.now()
      }
      conversationHistory.set(threadId, context)
    }
    
    // Analyze user message for sentiment and themes
    const sentiment = analyzeSentiment(message)
    const themes = extractThemes(message, context)
    
    // Update context
    context.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
      sentiment
    })
    
    // Update session phase based on message count
    if (context.messages.length <= 2) {
      context.sessionPhase = 'opening'
    } else if (context.messages.length <= 6) {
      context.sessionPhase = 'exploring'
    } else if (context.messages.length <= 12) {
      context.sessionPhase = 'deepening'
    } else {
      context.sessionPhase = 'reflecting'
    }
    
    // Add new themes
    themes.forEach(theme => {
      if (!context.keyThemes.includes(theme)) {
        context.keyThemes.push(theme)
      }
    })
    
    // Try OpenAI Assistants API first (Primary method)
    const openaiKey = process.env.OPENAI_API_KEY
    
    if (openaiKey) {
      try {
        console.log('🧠 Using OpenAI Assistants API for therapy chat...')
        console.log('🔑 Assistant ID:', THERAPIST_ASSISTANT_ID)
        
        const openai = new OpenAI({ apiKey: openaiKey })
        
        // Create or retrieve thread
        let openaiThreadId = context.openaiThreadId
        
        if (!openaiThreadId) {
          console.log('🆕 Creating new OpenAI thread...')
          const thread = await openai.beta.threads.create()
          openaiThreadId = thread.id
          context.openaiThreadId = openaiThreadId
          console.log('✅ Thread created:', openaiThreadId)
        } else {
          console.log('♻️ Using existing thread:', openaiThreadId)
        }
        
        // Add user message to thread
        console.log('📝 Adding message to thread...')
        await openai.beta.threads.messages.create(openaiThreadId, {
          role: 'user',
          content: message
        })
        
        // Run the assistant
        console.log('🏃 Running assistant...')
        console.log('🔍 Thread ID:', openaiThreadId)
        const run = await openai.beta.threads.runs.create(openaiThreadId, {
          assistant_id: THERAPIST_ASSISTANT_ID
        })
        console.log('🔍 Run ID:', run.id)
        
        // Poll for completion (with timeout)
        console.log('⏳ Waiting for response...')
        let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
          thread_id: openaiThreadId
        })
        let attempts = 0
        const maxAttempts = 60 // 60 seconds max (increased for better reliability)
        
        console.log(`📊 Initial run status: ${runStatus.status}`)
        
        while (runStatus.status !== 'completed' && attempts < maxAttempts) {
          if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
            console.error(`❌ Run ${runStatus.status}:`, runStatus.last_error)
            throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`)
          }
          
          if (runStatus.status === 'requires_action') {
            console.log('⚠️ Run requires action (tool calls), but not handling them yet')
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          runStatus = await openai.beta.threads.runs.retrieve(run.id, {
            thread_id: openaiThreadId
          })
          attempts++
          
          if (attempts % 5 === 0) {
            console.log(`⏳ Still waiting... (${attempts}s, status: ${runStatus.status})`)
          }
        }
        
        if (runStatus.status !== 'completed') {
          console.error(`❌ Assistant timeout after ${attempts}s, status: ${runStatus.status}`)
          throw new Error(`Assistant response timeout (${runStatus.status})`)
        }
        
        console.log(`✅ Run completed after ${attempts}s`)
        
        // Retrieve messages
        console.log('📨 Retrieving messages...')
        const messages = await openai.beta.threads.messages.list(openaiThreadId, {
          order: 'desc',
          limit: 1
        })
        
        const lastMessage = messages.data[0]
        
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content[0]) {
          const content = lastMessage.content[0]
          const response = content.type === 'text' ? content.text.value : ''
          
          if (response) {
            context.messages.push({
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            })
            
            // Keep last 24 messages (12 exchanges)
            if (context.messages.length > 24) {
              context.messages = context.messages.slice(-24)
            }
            
            conversationHistory.set(threadId, context)
            
            console.log('✅ OpenAI Assistants response generated')
            return NextResponse.json({ 
              response: response.trim(),
              threadId,
              source: 'openai-assistant'
            })
          }
        }
        
        throw new Error('No response from assistant')
        
      } catch (openaiError) {
        console.warn('⚠️ OpenAI Assistants API failed:', openaiError)
        console.warn('⚠️ Error details:', openaiError instanceof Error ? openaiError.message : 'Unknown')
        // Continue to Gemini fallback
      }
    } else {
      console.log('ℹ️ No OpenAI API key found, skipping to fallback')
    }
    
    // Try Gemini as fallback
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (geminiKey) {
      try {
        console.log('🧠 Using Gemini AI for therapy chat...')
        
        const therapeuticPrompt = buildTherapeuticPrompt(message, context)
        
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: therapeuticPrompt }]
              }],
              generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 500,
                topP: 0.95,
                topK: 40
              }
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        )

        if (geminiResponse.ok) {
          const data = await geminiResponse.json()
          const response = data.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (response) {
            context.messages.push({
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            })
            
            // Keep last 24 messages (12 exchanges)
            if (context.messages.length > 24) {
              context.messages = context.messages.slice(-24)
            }
            
            conversationHistory.set(threadId, context)
            
            console.log('✅ Gemini therapy response generated')
            return NextResponse.json({ 
              response: response.trim(),
              threadId,
              source: 'gemini'
            })
          }
        } else {
          const errorText = await geminiResponse.text()
          console.warn('⚠️ Gemini API error:', geminiResponse.status, errorText)
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini request failed:', geminiError)
        // Continue to OpenAI fallback
      }
    } else {
      console.log('ℹ️ No Gemini API key found, skipping to OpenAI')
    }

    // OpenAI Chat Completions fallback (if Assistants API fails)
    if (openaiKey) {
      try {
        console.log('🧠 Trying OpenAI Chat Completions as secondary fallback...')
        
        const openai = new OpenAI({ apiKey: openaiKey })
        
        const messages = [
          { 
            role: 'system' as const,
            content: buildSystemPrompt(context)
          },
          ...context.messages.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }))
        ]
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.9
        })

        const response = completion.choices?.[0]?.message?.content
        
        if (response) {
          context.messages.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          })
          
          if (context.messages.length > 24) {
            context.messages = context.messages.slice(-24)
          }
          
          conversationHistory.set(threadId, context)
          
          console.log('✅ OpenAI Chat Completions response generated')
          return NextResponse.json({ 
            response,
            threadId,
            source: 'openai-chat'
          })
        }
      } catch (openaiError) {
        console.warn('⚠️ OpenAI Chat Completions failed:', openaiError)
        // Continue to intelligent fallback
      }
    } else {
      console.log('ℹ️ No OpenAI API key found, using intelligent fallback')
    }

    // Enhanced intelligent fallback
    console.log('ℹ️ Using intelligent fallback therapy response (no AI keys configured)')
    const response = generateIntelligentResponse(message, context)
    
    context.messages.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    })
    
    if (context.messages.length > 24) {
      context.messages = context.messages.slice(-24)
    }
    
    conversationHistory.set(threadId, context)
    
    return NextResponse.json({ 
      response,
      threadId,
      source: 'fallback'
    })

  } catch (error) {
    console.error('❌ Therapy Chat Error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      response: "I'm here with you. Sometimes technical things get in the way, but what you're sharing matters. Can you tell me more about what's on your mind?",
      threadId: null,
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }) // Return 200 with error info instead of 500
  }
}

function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' | 'confused' {
  const lower = message.toLowerCase()
  
  // Check for confusion signals
  if (
    lower.includes('what do you mean') ||
    lower.includes('i don\'t understand') ||
    lower.includes('confused') ||
    lower.includes('huh') ||
    lower === 'what' ||
    lower === '?'
  ) {
    return 'confused'
  }
  
  const negativeWords = ['stress', 'anxious', 'sad', 'depressed', 'overwhelm', 'tired', 'exhausted', 'angry', 'frustrated', 'worried', 'scared', 'lonely', 'hurt', 'pain', 'difficult', 'hard', 'struggling', 'can\'t', 'bored']
  const positiveWords = ['good', 'happy', 'grateful', 'better', 'great', 'love', 'excited', 'hopeful', 'peaceful', 'calm', 'thankful']
  
  const negCount = negativeWords.filter(w => lower.includes(w)).length
  const posCount = positiveWords.filter(w => lower.includes(w)).length
  
  if (negCount > posCount) return 'negative'
  if (posCount > negCount) return 'positive'
  return 'neutral'
}

function extractThemes(message: string, context: ConversationContext): string[] {
  const lower = message.toLowerCase()
  const themes: string[] = []
  
  const themeMap: Record<string, string[]> = {
    'work_stress': ['work', 'job', 'boss', 'deadline', 'career', 'colleague', 'office'],
    'anxiety': ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panic'],
    'depression': ['sad', 'depressed', 'down', 'hopeless', 'empty'],
    'relationships': ['relationship', 'partner', 'spouse', 'friend', 'family', 'boyfriend', 'girlfriend', 'marriage'],
    'sleep': ['sleep', 'tired', 'exhausted', 'insomnia', 'rest'],
    'boredom': ['bored', 'boring', 'nothing to do', 'restless'],
    'identity': ['who am i', 'purpose', 'meaning', 'identity', 'myself'],
    'change': ['change', 'transition', 'different', 'new'],
    'loss': ['loss', 'grief', 'died', 'death', 'lost'],
    'health': ['sick', 'illness', 'health', 'pain', 'hurt', 'body']
  }
  
  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      themes.push(theme)
    }
  }
  
  return themes
}

function buildTherapeuticPrompt(currentMessage: string, context: ConversationContext): string {
  const recentMessages = context.messages.slice(-10).map(m => 
    `${m.role === 'user' ? 'Client' : 'Therapist'}: ${m.content}`
  ).join('\n')
  
  const sessionInfo = `
Session Phase: ${context.sessionPhase}
Key Themes: ${context.keyThemes.join(', ') || 'Initial exploration'}
Message Count: ${context.messages.length / 2}
  `.trim()
  
  return `You are an experienced, warm, and highly skilled psychotherapist conducting a therapy session. You use techniques from CBT, DBT, person-centered therapy, and motivational interviewing.

${sessionInfo}

CRITICAL THERAPEUTIC PRINCIPLES:
1. **Listen deeply first** - Reflect back what you hear before offering perspectives
2. **Validate emotions** - Name and validate feelings explicitly
3. **Ask ONE thoughtful question** - Questions that help them explore, not interrogate
4. **Be genuinely curious** - Show interest in their unique experience
5. **Notice patterns** - Gently point out patterns you're seeing across the conversation
6. **Use their language** - Mirror their words and metaphors
7. **Respond to confusion** - If they say "what do you mean?", clarify simply and warmly
8. **Track themes** - Connect current message to earlier themes when relevant
9. **Never be generic** - Every response should be specific to what THEY said
10. **Be human** - Warm, real, present - not robotic or clinical

SESSION PHASES:
- Opening (messages 1-2): Build rapport, understand why they're here
- Exploring (messages 3-6): Understand the situation, feelings, patterns  
- Deepening (messages 7-12): Go deeper, explore underlying needs/beliefs
- Reflecting (messages 12+): Help them integrate insights, find next steps

CONVERSATION SO FAR:
${recentMessages}

Client's CURRENT message: "${currentMessage}"

Respond as a skilled therapist would - with empathy, curiosity, and ONE specific question or reflection that moves the conversation forward. Keep response to 3-5 sentences. Be conversational and warm.

If they seem confused by your last response, clarify it simply. If they're giving short answers ("I don't know", "bored"), get curious about THAT - "Tell me about that boredom" or "That 'I don't know' feeling - what's that like?"

Remember: You're having a REAL conversation with a REAL person. Respond to EXACTLY what they just said.`
}

function buildSystemPrompt(context: ConversationContext): string {
  return `You are a skilled psychotherapist in session. Session phase: ${context.sessionPhase}. Key themes emerging: ${context.keyThemes.join(', ') || 'exploring'}. 

Core skills: Deep listening, emotion validation, Socratic questioning, pattern recognition, CBT/DBT techniques. 

Respond authentically to what the client JUST said. If they're confused, clarify. If they're vague ("I don't know", "bored"), explore that feeling. Ask ONE good question that helps them go deeper. 3-5 sentences, warm and human.`
}

function generateIntelligentResponse(message: string, context: ConversationContext): string {
  const lower = message.toLowerCase()
  const sentiment = analyzeSentiment(message)
  const previousMessages = context.messages.slice(-4)
  
  // Handle confusion explicitly
  if (sentiment === 'confused') {
    const lastAssistantMsg = previousMessages.filter(m => m.role === 'assistant').pop()
    
    if (lastAssistantMsg) {
      // They're confused by our last response - clarify
      if (lastAssistantMsg.content.includes('to be heard, to problem-solve')) {
        return "I'm asking what would help you most right now - do you want me to just listen and understand what you're going through? Or would you like to brainstorm solutions together? Or maybe you just need space to feel what you're feeling without trying to fix it?"
      }
      
      // Generic clarification
      return `Let me put that differently. I'm trying to understand your experience better. ${getFollowUpQuestion(lower, context)}`
    }
    
    return "I may not have been clear. What I'm wondering is: what brings you here today? What's weighing on you?"
  }
  
  // Handle very short/vague responses
  if (message.trim().length < 15 || lower === 'i don\'t know' || lower.includes('idk')) {
    const responses = [
      "That 'I don't know' feeling - tell me more about that. What's it like to not know?",
      "It's okay not to have the words yet. Sometimes feelings show up before we can name them. What are you noticing in your body right now?",
      "When you say you don't know, I'm curious - is it more that you're not sure, or that it's hard to put into words?",
      "Let's sit with that uncertainty for a moment. If you *did* know, what might you say?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }
  
  // Handle boredom specifically
  if (lower.includes('bored') || lower.includes('boring')) {
    const isFirstMention = !context.keyThemes.includes('boredom')
    if (isFirstMention) {
      return "Boredom is interesting - it's often a signal that something we need isn't being met. What do you think you're actually craving right now? Connection, stimulation, purpose, something else?"
    } else {
      return "You've mentioned feeling bored. That restlessness - what would make it go away? What used to excite you that doesn't anymore?"
    }
  }
  
  // Handle specific themes with context awareness
  const themes = extractThemes(message, context)
  
  if (themes.includes('work_stress')) {
    if (context.sessionPhase === 'opening') {
      return "Work stress can really take over our whole life. What's the heaviest part of it for you right now? The workload itself, or something about the environment or expectations?"
    } else {
      return "We've been talking about work. I'm noticing it keeps coming up. What do you think work is taking away from you - time, energy, peace of mind, or something deeper?"
    }
  }
  
  if (themes.includes('sleep')) {
    return "Sleep disruption affects everything - mood, thinking, resilience. What's keeping you awake? Is your mind racing, or is something else going on?"
  }
  
  if (themes.includes('anxiety')) {
    if (context.messages.length < 4) {
      return "Anxiety can feel so consuming. What does it feel like in your body? And if it had a voice, what would it be telling you right now?"
    } else {
      return "Your anxiety keeps showing up in our conversation. That makes sense - it's probably showing up a lot in your life too. When did you first notice it getting this strong?"
    }
  }
  
  if (themes.includes('relationships')) {
    return "Relationships are where we're most vulnerable. This person matters to you - what do you need from them that you're not getting? Or what do you need to say that you haven't been able to?"
  }
  
  // Session-phase specific responses
  if (context.sessionPhase === 'opening') {
    return "I hear you. Help me understand - what made you decide to talk about this today, specifically? What's different or harder about it right now?"
  }
  
  if (context.sessionPhase === 'deepening' && context.keyThemes.length > 0) {
    const theme = context.keyThemes[0]
    return `We've been exploring ${theme.replace('_', ' ')}. I'm noticing a pattern in what you're sharing. Does it feel like this theme shows up in other parts of your life too?`
  }
  
  // Thoughtful default responses based on sentiment
  if (sentiment === 'negative') {
    const responses = [
      "That sounds really difficult. I'm hearing the weight of it in your words. What would help right now - even just a little?",
      "I can feel how hard this is for you. You don't have to have it all figured out. What's the one thing that feels most urgent?",
      "It sounds like you're carrying a lot. What does support look like for you? Who or what helps when things feel this heavy?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }
  
  if (sentiment === 'positive') {
    return "I'm glad you're in a better space. What do you think made the difference? Understanding what helps can be really valuable."
  }
  
  // Engaging default
  const engagingDefaults = [
    "Tell me more about that. What's beneath the surface of what you just shared?",
    "I'm listening. What else is there about this that you want me to understand?",
    "That's important. Help me see it from your perspective - what does this mean to you?",
    "I'm curious about something - how long has this been on your mind?"
  ]
  
  return engagingDefaults[Math.floor(Math.random() * engagingDefaults.length)]
}

function getFollowUpQuestion(message: string, context: ConversationContext): string {
  const questions = [
    "What's on your mind today?",
    "What brought you here to talk?",
    "What would be most helpful to explore right now?",
    "If I could understand one thing about what you're going through, what would it be?"
  ]
  return questions[Math.floor(Math.random() * questions.length)]
}
