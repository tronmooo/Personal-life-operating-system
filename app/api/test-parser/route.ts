import { NextRequest, NextResponse } from 'next/server'

// DEVELOPMENT ONLY - Test endpoint for command parsing with PRODUCTION domain routing rules
// This uses the same prompt as the main AI assistant for accurate testing

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { command } = await request.json()
    
    if (!command && command !== '') {
      return NextResponse.json({ error: 'Command required' }, { status: 400 })
    }

    const openAIKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (!openAIKey && !geminiKey) {
      return NextResponse.json({ 
        error: 'No AI API keys configured',
        parseResult: { isCommand: false, reason: 'No API keys' }
      }, { status: 500 })
    }

    // Test 1: Empty/whitespace handling
    if (!command || command.trim() === '') {
      return NextResponse.json({
        parseResult: {
          isCommand: false,
          reason: 'Empty or whitespace-only input',
          handled: 'gracefully'
        },
        inputValidation: {
          isEmpty: !command || command.length === 0,
          isWhitespaceOnly: command && command.trim() === '',
          originalLength: command?.length || 0,
          trimmedLength: command?.trim().length || 0
        }
      })
    }

    // Test 2: Input length validation
    const MAX_INPUT_LENGTH = 10000
    if (command.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({
        parseResult: {
          isCommand: false,
          reason: 'Input too long',
          handled: 'rejected',
          maxAllowed: MAX_INPUT_LENGTH,
          received: command.length
        }
      })
    }

    // Test 3: Security sanitization check
    const securityChecks = {
      hasScript: /<script/i.test(command),
      hasSqlInjection: /(['";]|--|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b.*\bSET\b)/i.test(command),
      hasPrototypePollution: /constructor|prototype|__proto__/i.test(command),
      hasEnvVar: /\$\{.*env.*\}/i.test(command),
      hasPathTraversal: /\.\.\/|\.\.\\/.test(command),
      hasJavascriptUrl: /javascript:/i.test(command),
      hasUnicode: /[^\x00-\x7F]/.test(command),
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(command)
    }

    // Sanitize potentially dangerous input
    let sanitizedCommand = command
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
    
    // PRODUCTION DOMAIN ROUTING PROMPT (same as main AI assistant)
    const systemPrompt = `You are an INTELLIGENT ACTION-ORIENTED ASSISTANT for a life management app with 21 domains:
health, fitness, nutrition, financial, tasks, habits, goals, mindfulness, relationships, 
career, education, legal, insurance, travel, vehicles, property, home, appliances, pets, 
hobbies, collectibles, digital-life.

YOUR PRIMARY JOB: DETECT and EXECUTE data-logging commands. Be smart about detecting when users want to LOG DATA vs ASK QUESTIONS.

🎯 THESE ARE COMMANDS (statements/declarations):
- "interview at Amazon tomorrow" → CAREER command (stating a fact)
- "spent $35 on groceries" → FINANCIAL command (stating action)
- "walked 45 minutes" → FITNESS command (stating action)
- "drank 16 ounces water" → NUTRITION command (stating action)
- "weigh 175 pounds" → HEALTH command (stating measurement)
- "add task buy milk" → TASKS command (explicit add)
- "oil change $80" → VEHICLES command (vehicle maintenance)

❌ THESE ARE NOT COMMANDS (questions/requests):
- "how much did I spend?" → Question (starts with how/what/when/why)
- "show me my fitness data" → Request (starts with show/tell/give)

CRITICAL DOMAIN ROUTING RULES:

1. If message is a STATEMENT/DECLARATION → it's a COMMAND
2. If message is a QUESTION (how/what/when/why/show/tell) → NOT a command
3. Extract ALL data fields (company, date, time, amount, duration, etc.)
4. Water ALWAYS goes to "nutrition" domain
5. Interviews/meetings ALWAYS go to "career" domain
6. Tasks go to "tasks" domain
7. Exercises ALWAYS go to "fitness" domain

🐾 PET EXPENSE RULES:
8. Pet expenses (vet visits, grooming, pet supplies, pet food) go to "pets" domain
- "[Pet name] had vet appointment $X" → PETS domain
- "Spent $X on [pet name]'s vet visit" → PETS domain
- "Bought dog food $X" → PETS domain
- "paid vet $X" → PETS domain
- Keywords: vet, pet, dog, cat, puppy, kitten, grooming, pet food, pet supplies

🏠 HOUSING EXPENSE RULES:
9. Housing expenses go to "home" or "property" domain
- "Paid rent $X" → HOME domain
- "Mortgage payment $X" → HOME/PROPERTY domain
- "Electric bill $X" / "Water bill $X" → HOME domain
- "Fixed the sink $X" / "Plumber $X" → HOME domain
- "Property tax $X" / "HOA fee $X" → PROPERTY domain
- Keywords: rent, mortgage, utilities, electric, water, gas (home), plumber, HVAC, property tax, HOA

🚗 VEHICLE EXPENSE RULES:
10. Vehicle-related spending MUST go to "vehicles" domain:
- "oil change $X" → VEHICLES domain
- "car registration $X" → VEHICLES domain
- "filled up gas $X" → VEHICLES domain
- "tire rotation $X" → VEHICLES domain
- "car insurance premium $X" → VEHICLES domain
- Keywords: oil change, car, vehicle, auto, mileage, gas, fuel, tires, brakes, service, maintenance, registration, DMV

📱 DIGITAL/SUBSCRIPTION RULES:
11. Digital subscriptions go to "digital-life" domain:
- "Netflix subscription $X" → DIGITAL-LIFE domain
- "Spotify $X/month" → DIGITAL-LIFE domain
- Keywords: subscription, Netflix, Spotify, streaming, app subscription

🏋️ FITNESS/GYM RULES:
12. Gym/fitness expenses go to "fitness" domain:
- "gym membership $X" → FITNESS domain
- Keywords: gym, fitness center, workout class

🏥 HEALTH EXPENSE RULES:
13. Medical expenses go to "health" domain:
- "therapy session $X" → HEALTH domain
- "doctor visit $X" → HEALTH domain
- Keywords: therapy, doctor, medical, clinic, hospital

🎓 EDUCATION EXPENSE RULES:
14. Education expenses go to "education" domain:
- "tutor $X" → EDUCATION domain
- "course fee $X" → EDUCATION domain
- Keywords: tutor, course, class, education, school, training

⚖️ LEGAL EXPENSE RULES:
15. Legal expenses go to "legal" domain:
- "lawyer consultation $X" → LEGAL domain
- Keywords: lawyer, attorney, legal, consultation

🛡️ INSURANCE EXPENSE RULES:
16. Insurance premiums go to "insurance" domain:
- "health insurance premium $X" → INSURANCE domain
- "life insurance $X" → INSURANCE domain
- Keywords: insurance premium, health insurance, life insurance, home insurance

💰 FINANCIAL DOMAIN (only for general expenses):
17. General expenses without specific domain context go to "financial":
- "spent $X on groceries" → FINANCIAL domain
- "bought furniture $X" → FINANCIAL domain

👨‍👩‍👧 RELATIONSHIP EXPENSES:
18. Relationship-related expenses:
- "bought wedding ring $X" → RELATIONSHIPS domain
- "paid brother back $X" → RELATIONSHIPS domain (personal loan)

RESPONSE FORMAT (JSON):
{
  "isCommand": true/false,
  "domain": "the_domain_name",
  "data": {
    "type": "expense|maintenance|workout|etc",
    "amount": number,
    "description": "string",
    ... other relevant fields
  },
  "confirmationMessage": "✅ What was logged"
}

If NOT a command:
{
  "isCommand": false
}

ONLY respond with valid JSON, nothing else.`

    let aiResponse: string | null = null
    
    // Try OpenAI first
    if (openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: sanitizedCommand }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        })

        if (response.ok) {
          const data = await response.json()
          aiResponse = data.choices?.[0]?.message?.content || null
        }
      } catch (e) {
        console.error('OpenAI error:', e)
      }
    }
    
    // Fallback to Gemini
    if (!aiResponse && geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemPrompt}\n\nUser input: ${sanitizedCommand}` }] }
            ],
            generationConfig: { temperature: 0.1 }
          })
        })

        if (response.ok) {
          const data = await response.json()
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || null
        }
      } catch (e) {
        console.error('Gemini error:', e)
      }
    }

    // Parse AI response
    let parseResult: any = null
    if (aiResponse) {
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, aiResponse]
        const jsonStr = jsonMatch[1] || aiResponse
        parseResult = JSON.parse(jsonStr.trim())
      } catch (e) {
        parseResult = {
          parseError: 'Failed to parse AI response',
          rawResponse: aiResponse?.substring(0, 500)
        }
      }
    }

    return NextResponse.json({
      input: {
        original: command,
        sanitized: sanitizedCommand,
        length: command.length,
        wasSanitized: command !== sanitizedCommand
      },
      securityChecks,
      parseResult,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Parser error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
