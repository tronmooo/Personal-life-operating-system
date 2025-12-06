import { NextRequest, NextResponse } from 'next/server'
import { ParsedCommand } from '@/lib/voice/command-parser'

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      // Return error - will fall back to local parsing
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a voice command parser for a life management app with 21 life domains. Parse natural language commands into structured JSON and intelligently categorize them.

SUPPORTED ACTIONS:
- log: Record data (health metrics, meals, activities, mood, workouts)
- add: Add new items (tasks, events, bills, goals, properties, vehicles, appliances)
- update: Update existing items (status, values, notes)
- query: Fetch information (net worth, expenses, appointments, habits)
- schedule: Schedule events (appointments, maintenance, reminders)
- navigate: Navigate to pages (dashboard, settings, domains)

ALL 21 SUPPORTED DOMAINS:
1. health: steps, weight, water, blood pressure, meals, appointments, medications, symptoms, mood, sleep
2. fitness: workouts, exercises, reps, sets, duration, calories burned, strength training
3. nutrition: meals, calories, macros, meal plans, recipes, dietary restrictions
4. financial: accounts, expenses, income, budgets, net worth, investments, savings
5. vehicles: cars, maintenance, service, mileage, repairs, insurance, registrations
6. property: homes, apartments, mortgages, valuations, repairs, renovations
7. tasks: to-dos, reminders, checklists, projects
8. habits: daily habits, streaks, tracking, routines
9. goals: personal goals, targets, progress, milestones
10. education: courses, certifications, learning, study sessions
11. career: jobs, interviews, skills, networking, promotions
12. relationships: contacts, interactions, events, anniversaries
13. pets: pet care, vet appointments, feeding, medications
14. travel: trips, destinations, bookings, itineraries
15. hobbies: activities, collections, projects
16. mindfulness: meditation, breathing, relaxation, stress
17. insurance: policies, claims, coverage, premiums
18. legal: documents, contracts, deadlines, compliance
19. appliances: household appliances, warranties, maintenance, manuals
20. digital-life: passwords, subscriptions, accounts, backups
21. app: navigation, settings, preferences

RESPONSE FORMAT (JSON):
{
  "action": "log|add|update|query|schedule|navigate",
  "domain": "health|fitness|nutrition|financial|vehicles|property|tasks|habits|goals|education|career|relationships|pets|travel|hobbies|mindfulness|insurance|legal|appliances|digital-life|app",
  "parameters": { /* action-specific parameters */ },
  "summary": "Human-readable summary",
  "confidence": 0.0-1.0
}

SMART CATEGORIZATION EXAMPLES:

Health Domain:
- "My weight is 175 pounds" → {"action":"log","domain":"health","parameters":{"type":"weight","value":175,"unit":"lbs"},"summary":"Log weight: 175 lbs","confidence":0.95}
- "Log 10000 steps" → {"action":"log","domain":"health","parameters":{"type":"steps","value":10000},"summary":"Log 10,000 steps","confidence":0.95}
- "Add 16 ounces of water" → {"action":"log","domain":"health","parameters":{"type":"water","value":16,"unit":"ounces"},"summary":"Add 16 oz of water","confidence":0.95}
- "Blood pressure 120 over 80" → {"action":"log","domain":"health","parameters":{"type":"blood_pressure","systolic":120,"diastolic":80},"summary":"Log blood pressure 120/80","confidence":0.95}

Fitness Domain:
- "Did 30 minutes of cardio" → {"action":"log","domain":"fitness","parameters":{"type":"workout","duration":30,"exercise_type":"cardio"},"summary":"Log 30 min cardio workout","confidence":0.9}
- "Bench press 3 sets of 10 reps" → {"action":"log","domain":"fitness","parameters":{"type":"strength","exercise":"bench press","sets":3,"reps":10},"summary":"Log bench press 3x10","confidence":0.9}

Nutrition Domain:
- "Ate chicken salad 450 calories" → {"action":"log","domain":"nutrition","parameters":{"type":"meal","description":"chicken salad","calories":450},"summary":"Log meal: chicken salad (450 cal)","confidence":0.9}

Financial Domain:
- "Spent 50 dollars on groceries" → {"action":"log","domain":"financial","parameters":{"type":"expense","amount":50,"category":"groceries"},"summary":"Log expense: $50 for groceries","confidence":0.95}
- "What's my net worth?" → {"action":"query","domain":"financial","parameters":{"type":"net_worth"},"summary":"Query net worth","confidence":0.95}

Tasks Domain:
- "Add task call dentist" → {"action":"add","domain":"tasks","parameters":{"title":"call dentist"},"summary":"Add task: call dentist","confidence":0.9}
- "Remind me to buy milk" → {"action":"add","domain":"tasks","parameters":{"title":"buy milk"},"summary":"Add reminder: buy milk","confidence":0.9}

Vehicles Domain:
- "Schedule car service next Tuesday" → {"action":"schedule","domain":"vehicles","parameters":{"type":"service","description":"car service"},"summary":"Schedule car service","confidence":0.85}
- "Car oil change at 50000 miles" → {"action":"log","domain":"vehicles","parameters":{"type":"maintenance","service":"oil change","mileage":50000},"summary":"Log oil change at 50k miles","confidence":0.9}

Pets Domain:
- "Feed dog at 6 PM" → {"action":"schedule","domain":"pets","parameters":{"type":"feeding","time":"18:00"},"summary":"Schedule dog feeding at 6 PM","confidence":0.85}
- "Vet appointment for cat next week" → {"action":"schedule","domain":"pets","parameters":{"type":"vet_visit","pet_type":"cat"},"summary":"Schedule vet appointment","confidence":0.85}

Mindfulness Domain:
- "Meditated for 15 minutes" → {"action":"log","domain":"mindfulness","parameters":{"type":"meditation","duration":15},"summary":"Log 15 min meditation","confidence":0.9}
- "Feeling stressed today" → {"action":"log","domain":"mindfulness","parameters":{"type":"mood","mood":"stressed","value":2},"summary":"Log mood: stressed","confidence":0.85}

Habits Domain:
- "Completed morning routine" → {"action":"log","domain":"habits","parameters":{"type":"completion","habit":"morning routine"},"summary":"Complete morning routine","confidence":0.9}

Goals Domain:
- "Set goal to read 50 books this year" → {"action":"add","domain":"goals","parameters":{"title":"read 50 books","target":50,"timeframe":"year"},"summary":"Add goal: read 50 books","confidence":0.9}

Appliances Domain:
- "Add refrigerator warranty expires December" → {"action":"add","domain":"appliances","parameters":{"type":"warranty","appliance":"refrigerator","expiry":"december"},"summary":"Add refrigerator warranty","confidence":0.85}

Property Domain:
- "House value is 500000 dollars" → {"action":"log","domain":"property","parameters":{"type":"valuation","value":500000},"summary":"Log property value: $500k","confidence":0.9}

IMPORTANT RULES:
1. Use context clues to determine the BEST domain for ambiguous commands
2. For health-related metrics (weight, steps, water, BP) → always use "health" domain
3. For workout/exercise → use "fitness" domain
4. For meals/food → use "nutrition" domain
5. For money/spending → use "financial" domain
6. When in doubt, choose the most specific relevant domain
7. Always include a "type" parameter to specify what kind of data within the domain
8. Return ONLY valid JSON, no other text or explanation

Parse the command and return ONLY valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to parse command with AI' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let command: ParsedCommand
    try {
      command = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!command.action || !command.domain || !command.parameters) {
      return NextResponse.json(
        { error: 'Incomplete command parsing' },
        { status: 500 }
      )
    }

    // Add current timestamp if date-related commands
    if (command.parameters.date && command.parameters.date.includes('2024-01-01')) {
      command.parameters.date = new Date().toISOString()
    }

    return NextResponse.json({ command })
  } catch (error) {
    console.error('Command parsing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


