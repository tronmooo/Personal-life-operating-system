import { NextResponse } from 'next/server'

// Enhanced Journal Reflection with ChatGPT (OpenAI) - Primary
export async function POST(request: Request) {
  let journalText = ''
  try {
    const body = await request.json()
    journalText = body.text

    // Try OpenAI ChatGPT FIRST (user has API key)
    const openaiKey = process.env.OPENAI_API_KEY
    
    if (openaiKey) {
      console.log('🤖 Using ChatGPT (OpenAI) for journal reflection...')
      
      try {
        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `You are a wise, empathetic mindfulness coach with deep understanding of human emotions. Analyze journal entries and provide memorable insights AND personalized action suggestions.

Your responses should:
- Validate feelings with genuine empathy
- Offer profound insights that shift perspective
- Use vivid language, metaphors, and unexpected connections
- Sound warm and human, not clinical
- Provide specific, achievable actions based on THEIR situation

Format your response EXACTLY like this:

INSIGHT:
[3-4 sentences: validate their feelings, offer ONE profound insight or reframe, end with an actionable suggestion. Use metaphors and vivid language to be memorable.]

ACTIONS:
- 🧘 [Specific action 1 based on their situation - not generic]
- 📝 [Specific action 2 based on their situation - achievable today]
- 🚶 [Specific action 3 based on their situation - concrete and helpful]

Example for "I'm stressed about work deadlines":

INSIGHT:
Your stress is like an overfilled cup - trying to add more only spills over. What if you poured some out by saying 'no' to just one thing today? Even small boundaries create breathing room, and you deserve that space.

ACTIONS:
- 📝 Write down your 3 most urgent tasks and tackle ONLY those today
- ⏰ Set a 5-minute timer and do deep breathing when you feel overwhelmed  
- 📞 Tell one person "I need to focus, can we talk later?" to protect your time`
              },
              { role: 'user', content: `Journal entry:\n\n${journalText}` }
            ],
            max_tokens: 600,
            temperature: 0.8
          }),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        })

        if (completion.ok) {
          const data = await completion.json()
          const fullResponse = data.choices?.[0]?.message?.content
          if (fullResponse) {
            console.log('✅ ChatGPT (OpenAI) response generated')
            console.log('📝 Raw response:', fullResponse.substring(0, 200))
            
            // Parse the AI response
            const parsed = parseAIResponse(fullResponse)
            
            return NextResponse.json({ 
              insight: parsed.insight,
              suggestedActions: parsed.actions,
              source: 'chatgpt'
            })
          }
        } else {
          const errorText = await completion.text()
          console.warn('⚠️ OpenAI API error:', completion.status, errorText)
        }
      } catch (openaiError) {
        console.error('❌ OpenAI request failed:', openaiError)
        // Continue to Gemini fallback
      }
    } else {
      console.log('ℹ️ No OpenAI API key found, trying Gemini...')
    }

    // Fallback to Gemini if OpenAI fails
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (geminiKey) {
      console.log('🧠 Falling back to Gemini AI for journal reflection...')
      
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a wise, empathetic mindfulness coach with deep understanding of human emotions. Analyze this journal entry and provide a memorable insight AND personalized action suggestions.

Journal Entry:
"${journalText}"

PART 1 - INSIGHT (3-4 sentences):
- Start by genuinely validating their feelings with empathy
- Offer ONE profound insight or reframe that shifts perspective
- End with a specific, actionable suggestion that feels achievable
- Be memorable - use vivid language, metaphors, or unexpected connections
- Sound warm and human, not clinical

PART 2 - SUGGESTED ACTIONS (3-4 actions):
Based on THEIR specific situation, suggest 3-4 concrete, doable actions they can take TODAY. Make them:
- Specific to what they wrote (not generic)
- Actually helpful for their situation
- Small and achievable (not overwhelming)
- Include emoji icons for each action

Format your response EXACTLY like this:
INSIGHT:
[Your 3-4 sentence insight here]

ACTIONS:
- 🧘 [Specific action 1 based on their situation]
- 📝 [Specific action 2 based on their situation]
- 🚶 [Specific action 3 based on their situation]

Example for "I'm stressed about work deadlines":

INSIGHT:
Your stress is like an overfilled cup - trying to add more only spills over. What if you poured some out by saying 'no' to just one thing today? Even small boundaries create breathing room.

ACTIONS:
- 📝 Write down your 3 most urgent tasks and tackle ONLY those today
- ⏰ Set a 5-minute timer and do deep breathing when you feel overwhelmed
- 📞 Tell one person "I need to focus, can we talk later?" to protect your time

Now analyze their entry and provide insight + personalized actions:`
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 500,
              topP: 0.95
            }
          })
        }
      )

      if (geminiResponse.ok) {
        const data = await geminiResponse.json()
        const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (fullResponse) {
          console.log('✅ Gemini AI response generated (fallback)')
          console.log('📝 Raw response:', fullResponse.substring(0, 200))
          
          // Parse the AI response to extract insight and actions
          const parsed = parseAIResponse(fullResponse)
          
          return NextResponse.json({ 
            insight: parsed.insight,
            suggestedActions: parsed.actions,
            source: 'gemini'
          })
        }
      } else {
        console.warn('⚠️ Gemini API error:', await geminiResponse.text())
      }
    }

    // Final fallback to enhanced local responses
    console.log('ℹ️ Using enhanced fallback insight (no AI keys available)')
    const insight = generateEnhancedInsight(journalText)
    const actions = generateActionSuggestions(journalText, insight)
    
    return NextResponse.json({
      insight,
      suggestedActions: actions,
      source: 'fallback'
    })

  } catch (error) {
    console.error('❌ Journal Reflection Error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    const insight = generateEnhancedInsight(journalText)
    const actions = generateActionSuggestions(journalText, insight)
    
    return NextResponse.json({
      insight,
      suggestedActions: actions,
      source: 'error'
    })
  }
}

function parseAIResponse(response: string): { insight: string; actions: string[] } {
  console.log('🔍 Parsing AI response...')
  
  // Try to extract INSIGHT and ACTIONS sections
  const insightMatch = response.match(/INSIGHT:?\s*\n?([\s\S]*?)(?=ACTIONS:|$)/i)
  const actionsMatch = response.match(/ACTIONS:?\s*\n([\s\S]*?)$/i)
  
  let insight = ''
  let actions: string[] = []
  
  if (insightMatch && insightMatch[1]) {
    insight = insightMatch[1].trim()
    console.log('✅ Extracted insight:', insight.substring(0, 100))
  } else {
    // Fallback: use first paragraph as insight
    const paragraphs = response.split('\n\n')
    insight = paragraphs[0].trim()
    console.log('⚠️ Using fallback insight extraction')
  }
  
  if (actionsMatch && actionsMatch[1]) {
    // Extract actions (lines starting with - or •)
    const actionLines = actionsMatch[1]
      .split('\n')
      .filter(line => line.trim().match(/^[-•●]\s/))
      .map(line => line.trim().replace(/^[-•●]\s+/, ''))
      .filter(line => line.length > 0)
    
    actions = actionLines
    console.log(`✅ Extracted ${actions.length} AI-generated actions`)
  } else {
    // Fallback: look for any bulleted list in the response
    const bulletPoints = response
      .split('\n')
      .filter(line => line.trim().match(/^[-•●]\s/))
      .map(line => line.trim().replace(/^[-•●]\s+/, ''))
      .filter(line => line.length > 0)
      .slice(0, 4)
    
    if (bulletPoints.length > 0) {
      actions = bulletPoints
      console.log(`⚠️ Using fallback action extraction: ${actions.length} actions`)
    } else {
      // Generate fallback actions based on keywords
      actions = generateActionSuggestions(response, insight)
      console.log('⚠️ Using keyword-based fallback actions')
    }
  }
  
  // Clean up the insight (remove any remaining "INSIGHT:" prefix)
  insight = insight.replace(/^INSIGHT:?\s*/i, '').trim()
  
  // Ensure we have at least 3 actions
  if (actions.length === 0) {
    actions = [
      '🧘 Take a 5-minute break to breathe and center yourself',
      '📝 Write down one thing you can do today to help your situation',
      '💜 Be kind to yourself - you\'re doing your best'
    ]
  }
  
  return { insight, actions }
}

function generateActionSuggestions(journalText: string, insight: string): string[] {
  const lower = journalText.toLowerCase()
  const insightLower = insight.toLowerCase()
  const actions: string[] = []
  
  console.log('🔍 Analyzing for actions:', { 
    journalLength: journalText.length, 
    insightLength: insight.length,
    journalPreview: lower.substring(0, 100)
  })
  
  // Analyze journal + insight for contextual suggestions
  
  // Stress/Overwhelm - MORE KEYWORDS
  if (
    lower.includes('stress') || lower.includes('overwhelm') || lower.includes('pressure') || 
    lower.includes('too much') || lower.includes('can\'t handle') || lower.includes('drowning') ||
    insightLower.includes('stress') || insightLower.includes('overwhelm') || insightLower.includes('pressure')
  ) {
    console.log('✅ Detected: Stress/Overwhelm')
    actions.push('🧘 Take 3 deep breaths - inhale for 4, hold for 4, exhale for 6')
    actions.push('📝 Write down just ONE task to tackle today')
    actions.push('🚶 Step away for a 5-minute walk outside')
  }
  
  // Anxiety/Worry - MORE KEYWORDS
  if (
    lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worry') || 
    lower.includes('worried') || lower.includes('nervous') || lower.includes('panic') ||
    lower.includes('scared') || lower.includes('fear') ||
    insightLower.includes('anxiety') || insightLower.includes('worry')
  ) {
    console.log('✅ Detected: Anxiety/Worry')
    actions.push('🎯 Practice 5-4-3-2-1 grounding: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste')
    actions.push('✍️ Challenge one anxious thought: What evidence contradicts it?')
    actions.push('📱 Set a "worry time" - give yourself 10 minutes later to worry, not now')
  }
  
  // Sadness/Depression - MORE KEYWORDS
  if (
    lower.includes('sad') || lower.includes('depressed') || lower.includes('down') || 
    lower.includes('hopeless') || lower.includes('empty') || lower.includes('numb') ||
    insightLower.includes('sad') || insightLower.includes('depress')
  ) {
    actions.push('☀️ Get 10 minutes of sunlight or bright light')
    actions.push('🤝 Reach out to one person - text, call, or visit')
    actions.push('💜 Do one small thing you used to enjoy, even if you don\'t feel like it')
  }
  
  // Sleep issues - MORE KEYWORDS
  if (
    lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted') || 
    lower.includes('fatigue') || lower.includes('insomnia') || lower.includes('can\'t sleep') ||
    lower.includes('rest') || lower.includes('energy') ||
    insightLower.includes('sleep') || insightLower.includes('tired') || insightLower.includes('rest')
  ) {
    actions.push('😴 Set a bedtime alarm - 30 min before you want to sleep')
    actions.push('📵 Put phone in another room 1 hour before bed')
    actions.push('🛁 Create a wind-down routine: dim lights, calm activity, no screens')
  }
  
  // Anger/Frustration
  if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('mad') || insightLower.includes('anger')) {
    actions.push('💪 Channel the energy: punch a pillow, do 20 jumping jacks, squeeze ice')
    actions.push('📄 Write an angry letter you won\'t send - get it all out')
    actions.push('❓ Ask: What boundary was crossed? What do I actually need?')
  }
  
  // Work stress - MORE KEYWORDS
  if (
    lower.includes('work') || lower.includes('job') || lower.includes('deadline') || 
    lower.includes('boss') || lower.includes('career') || lower.includes('office') ||
    lower.includes('meeting') || lower.includes('project') ||
    insightLower.includes('work') || insightLower.includes('job') || insightLower.includes('career')
  ) {
    actions.push('⏰ Use Pomodoro: 25 min focused work, 5 min break')
    actions.push('🚫 Practice saying no or "let me check my schedule" before committing')
    actions.push('🏃 Take a real lunch break away from your desk')
  }
  
  // Relationship issues
  if (lower.includes('relationship') || lower.includes('partner') || lower.includes('friend') || insightLower.includes('relationship')) {
    actions.push('💬 Use "I feel ___ when ___ because ___" to express your needs')
    actions.push('👂 Practice active listening: repeat back what they said before responding')
    actions.push('⏸️ Take a 20-minute cooling-off break if discussing something heated')
  }
  
  // Loneliness
  if (lower.includes('lonely') || lower.includes('alone') || lower.includes('isolated') || insightLower.includes('lonely')) {
    actions.push('📞 Make one small connection: text someone, comment on a post, smile at a stranger')
    actions.push('🏘️ Join one group activity: class, meetup, volunteer opportunity')
    actions.push('🐾 Consider pet therapy, volunteer with animals, or visit a park')
  }
  
  // Boredom/Lack of purpose
  if (lower.includes('bored') || lower.includes('purpose') || lower.includes('meaning') || insightLower.includes('bored')) {
    actions.push('🎨 Try one new thing this week - hobby, recipe, route, anything')
    actions.push('📚 Revisit something you loved as a kid - what drew you to it?')
    actions.push('🌟 Do one small act of kindness for someone else')
  }
  
  // Positive entry - maintain good feelings - MORE KEYWORDS
  if (
    lower.includes('grateful') || lower.includes('happy') || lower.includes('good') || 
    lower.includes('thankful') || lower.includes('blessed') || lower.includes('joy') ||
    lower.includes('excited') || lower.includes('wonderful') || lower.includes('great') ||
    insightLower.includes('positive') || insightLower.includes('grat') || insightLower.includes('joy')
  ) {
    actions.push('📸 Capture this moment - photo, note, or just mindfully notice it')
    actions.push('🔁 Identify what created this feeling so you can recreate it')
    actions.push('💫 Share your good news with someone who will celebrate with you')
  }
  
  // Default/General wellness
  if (actions.length === 0) {
    console.log('⚠️ No themes detected, using defaults')
    console.log('Journal keywords checked:', {
      hasStress: lower.includes('stress'),
      hasAnxiety: lower.includes('anxious') || lower.includes('anxiety'),
      hasSad: lower.includes('sad'),
      hasTired: lower.includes('tired')
    })
    actions.push('🧘 Try a 5-minute guided meditation or breathing exercise')
    actions.push('📖 Continue journaling - write for 5 more minutes')
    actions.push('🌱 Name one thing you\'re grateful for today, no matter how small')
  } else {
    console.log(`✅ Generated ${actions.length} contextual actions`)
  }
  
  // Limit to 3-4 actions max
  const finalActions = actions.slice(0, Math.min(4, actions.length))
  console.log('📋 Final actions:', finalActions)
  return finalActions
}

function generateEnhancedInsight(text: string): string {
  const lowerText = text.toLowerCase()
  
  // Enhanced insights with more memorable, metaphorical language
  if (lowerText.includes('stress') || lowerText.includes('overwhelm')) {
    const insights = [
      "Your stress is like an overfilled cup - trying to add more only spills over. What if you poured some out by saying 'no' to just one thing today? Even small boundaries create breathing room.",
      "I hear the weight of everything pressing down. Stress thrives when we try to hold it all at once. Pick the ONE thing causing the most pressure and address just that. The rest can wait - truly.",
      "Overwhelm is your system's way of saying 'I need help.' There's no medal for doing it all alone. What would it look like to delegate, postpone, or let go of just one responsibility?"
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }
  
  if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('worry')) {
    const insights = [
      "Anxiety is like a smoke alarm going off when you're just making toast - it's trying to protect you, but it's overreacting. Your body doesn't know the difference between real danger and 'what if.' Try naming three things you can see right now to remind yourself: you're safe in this moment.",
      "I notice your mind spinning scenarios about the future. Anxiety wants you to solve problems that haven't happened yet. What if you gave yourself permission to solve only today's problems today?",
      "Your anxiety feels real because your body believes the story your mind is telling. But feelings aren't facts. What evidence do you have that contradicts the worst-case scenario you're imagining?"
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }
  
  if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('depressed')) {
    const insights = [
      "Sadness isn't a sign you're broken - it's proof you're human and you care deeply. This heaviness will shift; emotions are weather patterns, not permanent climates. For now, can you do one tiny thing that used to bring you comfort?",
      "Depression lies and tells us we're alone, that no one understands, that it will always feel this way. But you've felt different before, and you will again. What helped you last time you felt low, even just a little?",
      "I see you're in a dark place right now. That takes courage to acknowledge. Sometimes the only way out is through - but you don't have to walk through it alone. Who's one person you could reach out to today?"
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }
  
  if (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('happy')) {
    const insights = [
      "This gratitude you're feeling? It's not just nice - it's powerful medicine for your nervous system. Your brain is literally rewiring itself toward positivity with each thankful thought. How can you stretch this good feeling a little longer today?",
      "I love that you're noticing the good. It's easy to let happy moments slip by unacknowledged. This practice of pausing to appreciate creates more moments worth appreciating. What made this possible - what condition or choice created this joy?",
      "Your happiness is data about what matters to you. These positive feelings are pointing you toward your values and needs being met. Notice what ingredients created this feeling - how can you recreate them more often?"
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }

  if (lowerText.includes('anger') || lowerText.includes('angry') || lowerText.includes('frustrated')) {
    const insights = [
      "Anger is a messenger telling you something important was violated - a boundary, a value, a need. Don't shoot the messenger, but don't let it run the show either. What's the unmet need underneath this fire?",
      "Your frustration is legitimate, and it's also costing you energy. Anger can be rocket fuel or poison, depending on how you use it. What would it look like to channel this intensity into one concrete action that could actually change things?",
      "I hear you're upset. That passion could destroy or create - it's neutral energy. Before you act on it, ask: is this anger protecting something worth protecting, or is it protecting an old wound that's asking to heal?"
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }
  
  if (lowerText.includes('lonely') || lowerText.includes('alone') || lowerText.includes('isolated')) {
    const insights = [
      "Loneliness is one of the hardest feelings because we often feel it most intensely when surrounded by people. The ache for real connection is valid. What would it mean to reach out vulnerably to just one person this week?",
      "You're feeling disconnected, and that matters. But here's the paradox: the shame about being lonely keeps us isolated. You're not alone in feeling alone - millions feel this way. What would happen if you risked being honest with someone about this?",
      "Isolation is both a symptom and a trap - the more alone we feel, the harder it is to reach out. But connection starts with one small gesture. Even texting someone 'thinking of you' can crack open the door."
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }
  
  // Default memorable insights
  const defaults = [
    "Thank you for taking time to reflect. Simply putting words to your internal experience is a profound act of self-awareness. You're building the muscle of noticing what you feel - that's the foundation of all emotional growth. What would it feel like to trust yourself even more?",
    "Your willingness to examine your own thoughts shows emotional courage. Most people avoid looking inward. You're here, reflecting, growing. That's not nothing - that's everything. What's one insight from this entry that you want to carry forward?",
    "I notice you're exploring your inner world. That takes bravery. Journaling is a conversation with your deepest self - and the more you show up for these conversations, the wiser you become. What did you learn about yourself in writing this?"
  ]
  
  return defaults[Math.floor(Math.random() * defaults.length)]
}

