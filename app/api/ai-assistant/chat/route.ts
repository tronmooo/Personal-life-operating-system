import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

// ============================================
// GOOGLE CALENDAR HELPER
// ============================================
async function createGoogleCalendarEvent(
  supabase: any,
  eventDetails: {
    title: string
    description?: string
    date?: string  // YYYY-MM-DD
    time?: string  // HH:MM format or "2pm" format
    duration?: number  // minutes, default 60
    location?: string
    type?: string // interview, meeting, plan, appointment
  }
): Promise<{ success: boolean; message: string; eventId?: string; htmlLink?: string }> {
  try {
    // Get the user's session to get their OAuth token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        success: false,
        message: '❌ Not signed in. Please sign in to add events to Google Calendar.'
      }
    }

    const token = session.provider_token
    if (!token) {
      return {
        success: false,
        message: '📅 Google Calendar not connected. Please sign out and sign back in with Google to enable calendar access.'
      }
    }

    // Parse the date
    let eventDate = new Date()
    if (eventDetails.date) {
      eventDate = new Date(eventDetails.date)
    }

    // Parse the time
    let hours = 9  // Default 9 AM
    let minutes = 0
    
    if (eventDetails.time) {
      // Handle formats like "2pm", "2:30pm", "14:00", "9:00 am"
      const timeStr = eventDetails.time.toLowerCase().trim()
      const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1])
        minutes = parseInt(timeMatch[2] || '0')
        
        if (timeMatch[3]) {
          if (timeMatch[3].toLowerCase() === 'pm' && hours !== 12) {
            hours += 12
          } else if (timeMatch[3].toLowerCase() === 'am' && hours === 12) {
            hours = 0
          }
        }
      }
    }

    eventDate.setHours(hours, minutes, 0, 0)

    // Calculate end time
    const duration = eventDetails.duration || 60 // Default 60 minutes
    const endDate = new Date(eventDate.getTime() + duration * 60 * 1000)

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Build the calendar event
    const calendarEvent = {
      summary: eventDetails.title,
      description: eventDetails.description || `Created via LifeHub AI Assistant${eventDetails.type ? ` - ${eventDetails.type}` : ''}`,
      location: eventDetails.location,
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: timezone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    }

    console.log('📅 Creating Google Calendar event:', calendarEvent)

    // Create the event using Google Calendar API
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
      console.error('❌ Google Calendar API error:', errorData)
      
      // Check if token expired
      if (calendarResponse.status === 401) {
        return {
          success: false,
          message: '📅 Google Calendar token expired. Please sign out and sign back in to reconnect.'
        }
      }
      
      return {
        success: false,
        message: `❌ Failed to create calendar event: ${errorData.error?.message || 'Unknown error'}`
      }
    }

    const createdEvent = await calendarResponse.json()
    console.log('✅ Google Calendar event created:', createdEvent.id)

    return {
      success: true,
      message: `✅ Added "${eventDetails.title}" to Google Calendar`,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink
    }
  } catch (error: any) {
    console.error('❌ Error creating calendar event:', error)
    return {
      success: false,
      message: `❌ Error creating calendar event: ${error.message}`
    }
  }
}

// ============================================
// MACRO ESTIMATION HELPER
// ============================================
async function estimateMealMacros(mealName: string, calories: number): Promise<{
  protein: number
  carbs: number
  fats: number
  fiber: number
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey || calories <= 0) {
    // Fallback estimation based on calories
    const protein = Math.round(calories * 0.2 / 4)
    const carbs = Math.round(calories * 0.45 / 4)
    const fats = Math.round(calories * 0.35 / 9)
    const fiber = Math.round(carbs * 0.1)
    return { protein, carbs, fats, fiber }
  }

  try {
    console.log(`🥗 [MACRO-AI] Estimating macros for: ${mealName} (${calories} cal)`)
    
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
            content: `You are a nutrition expert. Estimate macronutrients for a meal.
Return ONLY a JSON object: {"protein": <g>, "carbs": <g>, "fats": <g>, "fiber": <g>}
Base on typical nutritional values. Protein/Carbs=4cal/g, Fat=9cal/g.
Return ONLY valid JSON.`
          },
          { role: 'user', content: `Meal: ${mealName}\nCalories: ${calories}` }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })

    if (!response.ok) throw new Error('API failed')

    const data = await response.json()
    const macros = JSON.parse(data.choices[0]?.message?.content?.trim() || '{}')
    console.log(`✅ [MACRO-AI] Estimated:`, macros)
    
    return {
      protein: Math.round(Number(macros.protein) || 0),
      carbs: Math.round(Number(macros.carbs) || 0),
      fats: Math.round(Number(macros.fats) || 0),
      fiber: Math.round(Number(macros.fiber) || 0)
    }
  } catch (error) {
    console.error('❌ [MACRO-AI] Failed:', error)
    const protein = Math.round(calories * 0.2 / 4)
    const carbs = Math.round(calories * 0.45 / 4)
    const fats = Math.round(calories * 0.35 / 9)
    const fiber = Math.round(carbs * 0.1)
    return { protein, carbs, fats, fiber }
  }
}

// ============================================
// SEND HANDLER - Share documents/data via email or SMS
// ============================================
async function intelligentSendHandler(message: string, userId: string, supabase: any) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isSend: false }

  // Quick check for send-related keywords
  const sendKeywords = /\b(send|share|email|text|sms|forward|deliver)\b/i
  if (!sendKeywords.test(message)) {
    return { isSend: false }
  }

  console.log('📤 Checking if message is a SEND command...')

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
          {
            role: 'system',
            content: `You are a SEND/SHARE COMMAND DETECTOR for a life management app.

DETECT if user wants to SEND or SHARE documents, data, or information to someone else.

SEND commands include:
- "Send my medical records to Dr. Smith"
- "Email the car registration to my brother"
- "Text my insurance card to my wife"
- "Share my expense report with my accountant"
- "Forward my vaccination records to the school"
- "Send last month's health data to my doctor"
- "Email a summary of my finances to John"
- "Text my vehicle info to Mike"

If it's a SEND command, respond with JSON:
{
  "isSend": true,
  "recipient_name": "Name of the person (if mentioned)",
  "recipient_type": "Relationship type like doctor, brother, accountant, wife, etc. (if mentioned)",
  "document_type": "What document/data type to send (e.g., 'medical records', 'car registration', 'expenses')",
  "domain": "The domain if clear (health, vehicles, financial, insurance, pets, etc.) or null",
  "send_method": "email or sms or both (based on keywords like 'text', 'email', 'message')",
  "include_charts": true/false (if user mentions charts, graphs, visualizations),
  "generate_summary": true/false (if user wants a summary),
  "date_range": "this_week|last_week|this_month|last_month|this_year|all (if time period mentioned)",
  "custom_message": "Any custom message the user wants to include (or null)"
}

If NOT a send command, respond:
{ "isSend": false }

EXAMPLES:

"Send my medical records to Dr. Smith"
{ "isSend": true, "recipient_name": "Dr. Smith", "recipient_type": "doctor", "document_type": "medical records", "domain": "health", "send_method": "email", "include_charts": false, "generate_summary": false }

"Text my car registration to my brother"
{ "isSend": true, "recipient_name": null, "recipient_type": "brother", "document_type": "car registration", "domain": "vehicles", "send_method": "sms", "include_charts": false, "generate_summary": false }

"Email a summary of my expenses this month to my accountant with charts"
{ "isSend": true, "recipient_name": null, "recipient_type": "accountant", "document_type": "expenses", "domain": "financial", "send_method": "email", "include_charts": true, "generate_summary": true, "date_range": "this_month" }

"Share my pet's vaccination records with the vet"
{ "isSend": true, "recipient_name": null, "recipient_type": "vet", "document_type": "vaccination records", "domain": "pets", "send_method": "email", "include_charts": false, "generate_summary": false }

"Send my weight progress report to my doctor"
{ "isSend": true, "recipient_name": null, "recipient_type": "doctor", "document_type": "weight progress report", "domain": "health", "send_method": "email", "include_charts": true, "generate_summary": true }

"What's my weight?" (this is a QUERY, not a send)
{ "isSend": false }

"Delete my expense" (this is a DELETE action, not send)
{ "isSend": false }

Only respond with valid JSON.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isSend: false }
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    console.log('🤖 Send analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isSend) {
      return { isSend: false }
    }

    console.log('✅ Detected SEND command to:', parsed.recipient_name || parsed.recipient_type)

    // Execute the send via the send API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sendResponse = await fetch(new URL('/api/ai-assistant/send', baseUrl), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${supabase.auth?.currentSession?.access_token || ''}`
      },
      body: JSON.stringify({
        action: 'send',
        recipient_name: parsed.recipient_name,
        recipient_type: parsed.recipient_type,
        document_type: parsed.document_type,
        domain: parsed.domain,
        send_method: parsed.send_method,
        include_charts: parsed.include_charts,
        generate_summary: parsed.generate_summary,
        date_range: parsed.date_range,
        custom_message: parsed.custom_message
      })
    })

    const sendResult = await sendResponse.json()
    console.log('📥 Send result:', sendResult)

    return {
      isSend: true,
      ...sendResult
    }

  } catch (error: any) {
    console.error('❌ Send handler error:', error)
    return { isSend: false }
  }
}

// ============================================
// ACTION HANDLER - Delete, Update, Predict, Export
// ============================================
async function intelligentActionHandler(message: string, userId: string, supabase: any) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isAction: false }

  console.log('🎯 Checking if message is an ACTION (delete/update/predict/export)...')

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
          {
            role: 'system',
            content: `You are an ACTION DETECTOR for a life management app.

DETECT if user wants to perform one of these ACTIONS:
- DELETE: Remove data (e.g., "delete", "remove", "erase", "cancel")
- UPDATE: Modify data (e.g., "change", "update", "edit", "rename", "set", "mark as")
- PREDICT: Forecast/project (e.g., "predict", "forecast", "when will I", "project")
- EXPORT: Download data (e.g., "export", "download", "save as CSV", "get my data")
- ANALYZE: Deep analysis (e.g., "analyze", "find patterns", "find duplicates")
- CORRELATE: Cross-domain patterns (e.g., "correlation", "how does X affect Y", "relationship between")
- CALCULATE: Financial math (e.g., "calculate", "compute", "compound interest", "mortgage payment")
- REPORT: Generate reports (e.g., "generate report", "create summary", "monthly report")
- ARCHIVE: Archive old data (e.g., "archive", "move to archive")
- BULK: Bulk operations (e.g., "delete all", "mark all", "update all")

If it's an ACTION, respond with JSON:
{
  "isAction": true,
  "actionType": "delete|update|predict|export|analyze|correlate|calculate|report|archive|bulk_delete|bulk_update",
  "domain": "domain_name or all",
  "params": {
    "description": "what to find/match",
    "dateRange": "today|yesterday|this_week|last_week|this_month|last_month|this_year|all",
    "match": { field: value },
    "updates": { field: newValue },
    "targetValue": number,
    "metric": "field name",
    "domain1": "first domain for correlation",
    "domain2": "second domain for correlation",
    "calculation": "compound_interest|monthly_payment|savings_goal|bmi|calorie_deficit",
    "inputs": { calculation inputs },
    "format": "csv|json",
    "olderThan": days_number
  }
}

If NOT an action, respond:
{ "isAction": false }

EXAMPLES:

"Delete my expense from yesterday"
{ "isAction": true, "actionType": "delete", "domain": "financial", "params": { "dateRange": "yesterday", "match": { "type": "expense" } } }

"Delete all completed tasks older than 30 days"
{ "isAction": true, "actionType": "bulk_delete", "domain": "tasks", "params": { "match": { "status": "completed" }, "olderThan": 30 } }

"Update my weight to 170 lbs"
{ "isAction": true, "actionType": "update", "domain": "health", "params": { "dateRange": "today", "updates": { "weight": 170, "unit": "lbs" } } }

"Change the grocery expense to $45"
{ "isAction": true, "actionType": "update", "domain": "financial", "params": { "description": "grocery", "updates": { "amount": 45 } } }

"Predict when I'll reach my weight goal of 165"
{ "isAction": true, "actionType": "predict", "domain": "health", "params": { "metric": "weight", "targetValue": 165 } }

"Export my financial data as CSV"
{ "isAction": true, "actionType": "export", "domain": "financial", "params": { "format": "csv" } }

"How does sleep affect my fitness?"
{ "isAction": true, "actionType": "correlate", "domain": "multiple", "params": { "domain1": "health", "metric1": "sleep", "domain2": "fitness", "metric2": "workout" } }

"Calculate compound interest on $10000 at 7% for 10 years"
{ "isAction": true, "actionType": "calculate", "domain": "financial", "params": { "calculation": "compound_interest", "inputs": { "principal": 10000, "rate": 7, "years": 10 } } }

"Generate a monthly financial report"
{ "isAction": true, "actionType": "report", "domain": "financial", "params": { "dateRange": "this_month", "reportType": "monthly" } }

"Archive all expenses from 2023"
{ "isAction": true, "actionType": "archive", "domain": "financial", "params": { "dateRange": "last_year" } }

"Show my expenses" (this is a QUERY, not an action)
{ "isAction": false }

"Spent $50 on groceries" (this is a CREATE command, not an action)
{ "isAction": false }

Only respond with valid JSON.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isAction: false }
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    console.log('🤖 Action analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isAction) {
      return { isAction: false }
    }

    console.log('✅ Detected ACTION:', parsed.actionType, 'for domain:', parsed.domain)

    // Execute the action via the actions API
    const actionResponse = await fetch(new URL('/api/ai-assistant/actions', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: parsed.actionType,
        domain: parsed.domain,
        parameters: parsed.params
      })
    })

    const actionResult = await actionResponse.json()
    console.log('📥 Action result:', actionResult)

    return {
      isAction: true,
      actionType: parsed.actionType,
      ...actionResult
    }

  } catch (error: any) {
    console.error('❌ Action handler error:', error)
    return { isAction: false }
  }
}

// Intelligent AI-powered command parser
async function intelligentCommandParser(message: string, userId: string, supabase: any) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) {
    return { isCommand: false }
  }

  console.log('🧠 Calling GPT-4 to parse command...')
  
  // Call GPT-4 to analyze the message
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
                  content: `You are an INTELLIGENT ACTION-ORIENTED ASSISTANT for a life management app with 21 domains:
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
- "create task to call doctor" → TASKS command
- "remind me to pay bills" → TASKS command
- "make a note about the meeting" → MINDFULNESS/notes command
- "add note that project deadline is next week" → MINDFULNESS/notes command
- "goal to launch product" → GOALS command (stating goal)
- "trip to Paris next month" → TRAVEL command (stating plan)

❌ THESE ARE NOT COMMANDS (questions/requests):
- "how much did I spend?" → Question (starts with how/what/when/why)
- "show me my fitness data" → Request (starts with show/tell/give)
- "what's my weight trend?" → Analysis request (asking for insight)
- "can you help with..." → Question (starts with can/could/would)

🚨 CRITICAL INTERVIEW/APPOINTMENT RULES:
- "interview at [company] [when]" = ALWAYS a command
- "meeting with [person/company]" = ALWAYS a command  
- "appointment at [time/place]" = ALWAYS a command
- Extract company, date, time automatically

🎯 TASK CREATION RULES:
- "add task [description]" → TASKS domain, extract title and priority
- "create task [description]" → TASKS domain
- "remind me to [action]" → TASKS domain, set due date if mentioned
- "todo: [description]" → TASKS domain
- Extract: title (required), description, priority (low/medium/high), due_date (if mentioned)

🏃 HABIT CREATION RULES:
- "add habit [name]" → action: "create_habit"
- "create habit [name]" → action: "create_habit"
- "new habit [name]" → action: "create_habit"
- "track [habit name] daily/weekly" → action: "create_habit"
- Extract: name, icon (emoji if mentioned), frequency (daily/weekly/monthly)

🥗 NUTRITION/MEAL RULES:
- "I ate/eat [food] [calories] cal" → NUTRITION domain with type: "meal"
- "had [food] for [calories] calories" → NUTRITION domain with type: "meal"
- "ate a chicken sandwich 360 cal" → NUTRITION domain with type: "meal"
- MUST include in data: { "type": "meal", "name": "[food name]", "calories": [number], "mealType": "Breakfast|Lunch|Dinner|Snack" }
- Extract: name (the food), calories, protein/carbs/fats if mentioned

💳 BILL CREATION RULES:
- "add bill [name] $[amount]" → action: "create_bill"
- "create bill [name]" → action: "create_bill"
- "new bill [name] due [date]" → action: "create_bill"
- Extract: name, amount, dueDate, recurring (true/false), category

📅 EVENT CREATION RULES:
- "schedule [event] on [date]" → action: "create_event"
- "add event [title]" → action: "create_event"
- "meeting on [date] at [time]" → action: "create_event"
- Extract: title, date, time, location, description

📅 GOOGLE CALENDAR COMMANDS (action: "add_to_google_calendar"):
- "add to google calendar [event]" → add_to_google_calendar
- "add to my calendar [event]" → add_to_google_calendar
- "put [event] on my google calendar" → add_to_google_calendar
- "schedule on google calendar [event]" → add_to_google_calendar
- "create google calendar event [event]" → add_to_google_calendar
- "add [event] to calendar" → add_to_google_calendar
- "put [event] on calendar" → add_to_google_calendar
- "calendar event: [event]" → add_to_google_calendar
- "gcal: [event]" → add_to_google_calendar
- Extract: title/summary, date, time, duration (minutes), location, description, allDay (boolean)
- Use natural language parsing for dates/times: "tomorrow at 3pm", "next Tuesday", "Dec 15 at 2:30pm"
- Default duration is 60 minutes if not specified

🧭 NAVIGATION COMMANDS (action: "navigate"):
- "go to [page/domain]" → navigate
- "open [page/domain]" → navigate
- "show me [page/domain]" → navigate
- "take me to [page/domain]" → navigate

🔧 TOOL COMMANDS (action: "open_tool"):
- "open [tool name]" → open_tool
- "use [tool name] calculator" → open_tool
- "start [tool name]" → open_tool
- Tools: BMI, calorie, mortgage, compound interest, retirement, loan, tip calculator, receipt scanner, document scanner, etc.

📊 CHART/VISUALIZATION COMMANDS (action: "custom_chart"):
- "create a chart of [data]" → custom_chart
- "show me a [chart type] of [domain]" → custom_chart
- "visualize my [domain] data" → custom_chart
- "graph my [metric] over [time period]" → custom_chart
- "plot [metric] for [domain]" → custom_chart
- Chart types: line, bar, pie, area, multi_line, scatter, heatmap, radar
- Extract: domain(s), chartType, dateRange, metric, groupBy

📝 NOTE CREATION RULES:
- "make a note [content]" → MINDFULNESS domain (type: note)
- "add note [content]" → MINDFULNESS domain (type: note)
- "note: [content]" → MINDFULNESS domain (type: note)
- "remember that [content]" → MINDFULNESS domain (type: note)
- Extract: title (first sentence or summary), content (full text)

If it's a COMMAND (default to YES if unsure), respond with JSON:
{
  "isCommand": true,
  "domain": "domain_name",
  "data": { extracted structured data with ALL fields },
  "confirmationMessage": "✅ Logged [what] to [domain]"
}

For ACTION commands (create_habit, create_bill, create_event, add_to_google_calendar, navigate, open_tool, custom_chart):
{
  "isCommand": true,
  "action": "action_type",
  "domain": "domain_name (if applicable)",
  "data": { action-specific parameters },
  "confirmationMessage": "✅ Description of action"
}

Examples of ACTION commands:
- "add habit exercise daily" → { "isCommand": true, "action": "create_habit", "data": { "name": "Exercise", "frequency": "daily", "icon": "💪" }, "confirmationMessage": "✅ Created habit: Exercise 💪 (daily)" }
- "add bill Netflix $15.99 monthly" → { "isCommand": true, "action": "create_bill", "data": { "name": "Netflix", "amount": 15.99, "recurring": true, "recurrencePeriod": "monthly" }, "confirmationMessage": "✅ Created bill: Netflix $15.99/month" }
- "go to health page" → { "isCommand": true, "action": "navigate", "data": { "destination": "health" }, "confirmationMessage": "🧭 Opening Health page" }
- "open BMI calculator" → { "isCommand": true, "action": "open_tool", "data": { "tool": "bmi_calculator" }, "confirmationMessage": "🔧 Opening BMI Calculator" }
- "create a pie chart of my expenses" → { "isCommand": true, "action": "custom_chart", "data": { "domain": "financial", "chartType": "pie", "dateRange": "this_month", "metric": "expenses", "groupBy": "category" }, "confirmationMessage": "📊 Creating pie chart of expenses" }
- "visualize my health data over the past year" → { "isCommand": true, "action": "custom_chart", "data": { "domain": "health", "chartType": "line", "dateRange": "this_year", "groupBy": "date" }, "confirmationMessage": "📊 Creating health data visualization" }
- "add to google calendar meeting with John tomorrow at 3pm" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Meeting with John", "date": "tomorrow", "time": "15:00", "duration": 60 }, "confirmationMessage": "📅 Adding to Google Calendar: Meeting with John" }
- "put dentist appointment Dec 20 at 10am on my calendar" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Dentist appointment", "date": "2024-12-20", "time": "10:00", "duration": 60 }, "confirmationMessage": "📅 Adding to Google Calendar: Dentist appointment" }
- "gcal: team standup Monday at 9:30am for 30 minutes" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Team standup", "date": "Monday", "time": "09:30", "duration": 30 }, "confirmationMessage": "📅 Adding to Google Calendar: Team standup" }
- "add birthday party to calendar on Saturday all day" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Birthday party", "date": "Saturday", "allDay": true }, "confirmationMessage": "📅 Adding to Google Calendar: Birthday party (all day)" }

If it's clearly NOT a command (rare), respond with:
{
  "isCommand": false
}

IMPORTANT RULES:
1. If message is a STATEMENT/DECLARATION → it's a COMMAND
2. If message is a QUESTION (how/what/when/why/show/tell) → NOT a command
3. Extract ALL data fields (company, date, time, amount, duration, etc.)
4. Water ALWAYS goes to "nutrition" domain
5. Interviews/meetings ALWAYS go to "career" domain
6. Tasks go to "tasks" domain - these are NOT mindfulness entries
7. Notes/quick thoughts go to "mindfulness" domain with type="note"
8. Pet expenses (vet visits, grooming, pet supplies, pet food) go to "pets" domain with type="vet_appointment" and include amount
9. Housing expenses (rent, mortgage, utilities, home repairs, HOA fees, property tax) go to "home" or "property" domain with type="expense"
10. Money goes to "financial" domain EXCEPT:
   - Pet expenses → "pets" domain with type="vet_appointment", amount, description
   - Housing expenses → "home" domain with type="expense", amount, description, category (rent/mortgage/utilities/repair/tax)
   - Vehicle expenses → "vehicles" domain
   For pet expenses, emit domain="pets" and structure: { "type": "vet_appointment", "amount": <number>, "date": "YYYY-MM-DD", "description": "vet visit|grooming|supplies" }
   For housing, emit domain="home" and structure: { "type": "expense", "amount": <number>, "date": "YYYY-MM-DD", "category": "rent|mortgage|utilities|repair|tax", "description": "..." }
11. Vehicle-related spending (oil change, maintenance/service, repairs, fuel/gas, registration/DMV fees, insurance premiums) MUST go to the "vehicles" domain. For these, emit domain="vehicles" and structure data accordingly:
   - maintenance/service → { "type": "maintenance", "serviceName": "oil change|brakes|tires|...", "amount": <number>, "cost": <number>, "date": "YYYY-MM-DD" }
   - fuel/gas → { "type": "cost", "costType": "fuel", "amount": <number>, "date": "YYYY-MM-DD", "description": "gas|fuel" }
   - repairs → { "type": "cost", "costType": "repair", "amount": <number>, "date": "YYYY-MM-DD", "description": "..." }
   - registration/DMV → { "type": "cost", "costType": "registration", "amount": <number>, "date": "YYYY-MM-DD" }
   - insurance premiums → { "type": "cost", "costType": "insurance", "amount": <number>, "date": "YYYY-MM-DD" }
   If the text mentions car/vehicle/auto, mileage, oil, gas/fuel, tires, brakes, service, or maintenance → prefer the "vehicles" domain.
12. Exercises ALWAYS go to "fitness" domain

🐾 PET EXPENSE RULES:
- "[Pet name] had vet appointment $X" → PETS domain with type="vet_appointment", amount=X
- "Spent $X on [pet name]'s vet visit" → PETS domain with type="vet_appointment"
- "Bought dog food $X" → PETS domain with type="vet_appointment", description="dog food"
- Extract pet name from message if mentioned
- Include amount and description

🏠 HOUSING EXPENSE RULES:
- "Paid rent $X" → HOME domain with type="expense", category="rent"
- "Mortgage payment $X" → HOME/PROPERTY domain with type="expense", category="mortgage"
- "Electric bill $X" / "Water bill $X" → HOME domain with type="expense", category="utilities"
- "Fixed the sink $X" / "Plumber $X" → HOME domain with type="expense", category="repair"
- "Property tax $X" / "HOA fee $X" → PROPERTY domain with type="expense", category="tax"
- If message mentions: rent, mortgage, utilities, electric, water, gas (home), plumber, electrician, HVAC, repair (home), property tax, HOA → use HOME or PROPERTY domain

DECISION LOGIC:
- Starts with "how/what/when/where/why/show/tell/can/could/would"? → NOT a command
- States a fact, measurement, or action? → IS a command
- Contains "interview at/with", "spent $", "walked", "weigh"? → IS a command

Examples:
User: "interview at Amazon tomorrow"
{
  "isCommand": true,
  "domain": "career",
  "data": {
    "type": "interview",
    "company": "Amazon",
    "date": "tomorrow",
    "time": "",
    "interviewType": "scheduled"
  },
  "confirmationMessage": "✅ Logged interview with Amazon scheduled for tomorrow"
}

User: "walked 45 minutes"
{
  "isCommand": true,
  "domain": "fitness",
  "data": {
    "type": "workout",
    "exercise": "walking",
    "duration": 45
  },
  "confirmationMessage": "✅ Logged 45-minute walking workout"
}

User: "spent $35 on groceries"
{
  "isCommand": true,
  "domain": "financial",
  "data": {
    "type": "expense",
    "amount": 35,
    "description": "groceries"
  },
  "confirmationMessage": "✅ Logged expense: $35 for groceries"
}

User: "oil change $120 today"
{
  "isCommand": true,
  "domain": "vehicles",
  "data": {
    "type": "maintenance",
    "serviceName": "oil change",
    "amount": 120,
    "date": "today"
  },
  "confirmationMessage": "✅ Logged oil change ($120) in Vehicles"
}

User: "how much did I walk this week?"
{
  "isCommand": false
}

User: "what's my schedule?"
{
  "isCommand": false
}

User: "tell me about my finances"
{
  "isCommand": false
}

User: "rex had vet appointment $150, need new dog food make a note in my command center in the tasks for this"
OUTPUT 3 SEPARATE COMMANDS:
1. { "isCommand": true, "domain": "pets", "data": { "type": "vet_appointment", "petName": "rex", "amount": 150, "date": "today", "description": "vet appointment" }, "confirmationMessage": "✅ Logged $150 vet visit for Rex" }
2. { "isCommand": true, "domain": "tasks", "data": { "title": "Buy new dog food", "priority": "medium" }, "confirmationMessage": "✅ Task created: Buy new dog food" }

BUT return ONLY THE FIRST ONE. Process one command at a time.

ONLY respond with valid JSON, nothing else.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    console.error('❌ OpenAI API failed:', response.statusText)
    return { isCommand: false }
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content
  
  if (!aiResponse) {
    return { isCommand: false }
  }

  console.log('🤖 GPT-4 response:', aiResponse)

  // Parse the AI response
  try {
    const parsed = JSON.parse(aiResponse)
    
    if (!parsed.isCommand) {
      return { isCommand: false }
    }

    // Check if this is a SPECIAL ACTION (habit, bill, event, google calendar, navigate, tool, chart)
    const actionType = parsed.action
    if (actionType && ['create_habit', 'create_bill', 'create_event', 'add_to_google_calendar', 'navigate', 'open_tool', 'custom_chart'].includes(actionType)) {
      console.log(`🚀 Special ACTION detected: ${actionType}`)
      
      // Route to actions API
      const actionParams = parsed.data || {}
      
      // Handle navigation - return immediately with navigation instructions
      if (actionType === 'navigate') {
        const navMap: Record<string, string> = {
          'dashboard': '/', 'home': '/', 'health': '/domains/health',
          'fitness': '/domains/fitness', 'nutrition': '/domains/nutrition',
          'financial': '/domains/financial', 'finance': '/domains/financial',
          'vehicles': '/domains/vehicles', 'pets': '/domains/pets',
          'insurance': '/domains/insurance', 'travel': '/domains/travel',
          'education': '/domains/education', 'career': '/domains/career',
          'relationships': '/domains/relationships', 'mindfulness': '/domains/mindfulness',
          'tools': '/ai-tools-calculators', 'calculators': '/ai-tools-calculators',
          'ai': '/ai', 'calendar': '/calendar', 'settings': '/settings',
          'domains': '/domains', 'documents': '/documents'
        }
        const dest = actionParams.destination?.toLowerCase() || 'dashboard'
        const path = actionParams.path || navMap[dest] || '/'
        return {
          isCommand: true,
          action: 'navigate',
          message: parsed.confirmationMessage || `🧭 Opening ${dest}`,
          navigate: { path, destination: dest }
        }
      }

      // Handle open_tool
      if (actionType === 'open_tool') {
        const toolMap: Record<string, { path: string; name: string }> = {
          'bmi': { path: '/ai-tools-calculators?tab=calculators&tool=bmi', name: 'BMI Calculator' },
          'calorie': { path: '/ai-tools-calculators?tab=calculators&tool=calorie', name: 'Calorie Calculator' },
          'mortgage': { path: '/ai-tools-calculators?tab=calculators&tool=mortgage', name: 'Mortgage Calculator' },
          'retirement': { path: '/ai-tools-calculators?tab=calculators&tool=retirement', name: 'Retirement Calculator' },
          'loan': { path: '/ai-tools-calculators?tab=calculators&tool=loan', name: 'Loan Calculator' },
          'receipt': { path: '/ai-tools-calculators?tab=ai-tools&tool=receipt', name: 'Receipt Scanner' },
          'document': { path: '/ai-tools-calculators?tab=ai-tools&tool=document', name: 'Document Scanner' },
          'currency': { path: '/ai-tools-calculators?tab=utility&tool=currency', name: 'Currency Converter' }
        }
        const toolKey = (actionParams.tool || '').toLowerCase().replace(/[_\s]+/g, '')
        const toolInfo = Object.entries(toolMap).find(([k]) => toolKey.includes(k))?.[1] || 
                        { path: '/ai-tools-calculators', name: 'Tools' }
        return {
          isCommand: true,
          action: 'open_tool',
          message: parsed.confirmationMessage || `🔧 Opening ${toolInfo.name}`,
          openTool: { path: toolInfo.path, name: toolInfo.name }
        }
      }

      // Handle create_habit
      if (actionType === 'create_habit') {
        const { name, icon = '⭐', frequency = 'daily', description } = actionParams
        if (!name) return { isCommand: false }
        
        const habitId = randomUUID()
        const { error } = await supabase.from('habits').insert({
          id: habitId, user_id: userId, name, icon, frequency,
          streak: 0, completion_history: [],
          metadata: { description, source: 'ai_assistant' },
          created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Habit creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true, action: 'create_habit',
          message: parsed.confirmationMessage || `✅ Habit created: "${name}" ${icon} (${frequency})`
        }
      }

      // Handle create_bill
      if (actionType === 'create_bill') {
        const { name, amount, dueDate, category, recurring = false, recurrencePeriod } = actionParams
        if (!name || amount === undefined) return { isCommand: false }
        
        const billId = randomUUID()
        const { error } = await supabase.from('bills').insert({
          id: billId, user_id: userId, name, amount: parseFloat(amount),
          due_date: dueDate || new Date().toISOString().split('T')[0],
          paid: false, recurring, recurrence_period: recurrencePeriod || null,
          category: category || 'other',
          metadata: { source: 'ai_assistant' }, created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Bill creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true, action: 'create_bill',
          message: parsed.confirmationMessage || `✅ Bill created: "${name}" - $${amount}`
        }
      }

      // Handle create_event
      if (actionType === 'create_event') {
        const { title, date, time, location, description, allDay = false } = actionParams
        if (!title) return { isCommand: false }
        
        const eventId = randomUUID()
        const { error } = await supabase.from('events').insert({
          id: eventId, user_id: userId, title,
          start_date: date || new Date().toISOString().split('T')[0],
          start_time: time || null, location: location || null,
          description: description || null, all_day: allDay,
          metadata: { source: 'ai_assistant' }, created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Event creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true, action: 'create_event',
          message: parsed.confirmationMessage || `✅ Event created: "${title}"${date ? ` on ${date}` : ''}`
        }
      }

      // Handle add_to_google_calendar
      if (actionType === 'add_to_google_calendar') {
        const { title, summary, date, time, duration, location, description, allDay } = actionParams
        const eventTitle = title || summary
        
        if (!eventTitle) {
          return { isCommand: false }
        }
        
        console.log(`📅 Adding to Google Calendar: ${eventTitle}`)
        
        try {
          // Call the actions API to handle Google Calendar creation
          const actionResponse = await fetch(
            new URL('/api/ai-assistant/actions', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_to_google_calendar',
                domain: 'calendar',
                parameters: {
                  title: eventTitle,
                  date: date,
                  time: time,
                  duration: duration || 60,
                  location: location,
                  description: description,
                  allDay: allDay || false
                }
              })
            }
          )
          
          const result = await actionResponse.json()
          
          if (result.success) {
            return {
              isCommand: true,
              action: 'add_to_google_calendar',
              message: result.message || `📅 Added to Google Calendar: "${eventTitle}"`,
              event: result.event,
              triggerReload: true
            }
          } else {
            return {
              isCommand: true,
              action: 'add_to_google_calendar',
              message: result.message || `❌ Failed to add to Google Calendar`,
              requiresAuth: result.requiresAuth
            }
          }
        } catch (error: any) {
          console.error('❌ Google Calendar error:', error)
          return {
            isCommand: true,
            action: 'add_to_google_calendar',
            message: `❌ Failed to add to Google Calendar: ${error.message || 'Unknown error'}`
          }
        }
      }

      // Handle custom_chart - fetch data and build visualization
      if (actionType === 'custom_chart') {
        const { domain = 'all', domains, chartType = 'line', dateRange = 'this_month', 
                metric, groupBy = 'date', aggregation = 'sum', title } = actionParams
        
        // Get date range
        const now = new Date()
        let startDate: Date
        const endDate = now
        
        switch (dateRange) {
          case 'today': startDate = new Date(now.setHours(0,0,0,0)); break
          case 'this_week': startDate = new Date(now.setDate(now.getDate() - now.getDay())); break
          case 'this_month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break
          case 'this_year': startDate = new Date(now.getFullYear(), 0, 1); break
          case 'last_30_days': startDate = new Date(Date.now() - 30*24*60*60*1000); break
          case 'last_90_days': startDate = new Date(Date.now() - 90*24*60*60*1000); break
          default: startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
        
        // Fetch data
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: true })
        
        if (domains && domains.length > 0) {
          query = query.in('domain', domains)
        } else if (domain && domain !== 'all') {
          query = query.eq('domain', domain)
        }
        
        const { data: entries, error: fetchError } = await query
        
        if (fetchError || !entries || entries.length === 0) {
          return {
            isCommand: true, action: 'custom_chart',
            message: '📊 No data found for that time period. Try a different range or domain.'
          }
        }
        
        // Process data for chart
        let chartData: any[] = []
        
        if (groupBy === 'domain') {
          const grouped: Record<string, number> = {}
          entries.forEach((e: any) => {
            grouped[e.domain] = (grouped[e.domain] || 0) + 1
          })
          chartData = Object.entries(grouped).map(([name, value]) => ({ name, domain: name, value }))
        } else if (groupBy === 'date') {
          const byDate: Record<string, number> = {}
          entries.forEach((e: any) => {
            const date = new Date(e.created_at).toLocaleDateString()
            const val = parseFloat(e.metadata?.amount || e.metadata?.value || 1)
            byDate[date] = (byDate[date] || 0) + (aggregation === 'count' ? 1 : val)
          })
          chartData = Object.entries(byDate).map(([date, value]) => ({ date, value, label: date }))
        } else if (groupBy === 'category' || groupBy === 'type') {
          const byType: Record<string, number> = {}
          entries.forEach((e: any) => {
            const cat = e.metadata?.type || e.metadata?.category || e.domain
            byType[cat] = (byType[cat] || 0) + 1
          })
          chartData = Object.entries(byType).map(([name, value]) => ({ name, category: name, value }))
        }
        
        return {
          isCommand: true, action: 'custom_chart',
          message: parsed.confirmationMessage || `📊 Here's your ${domain} data visualization`,
          visualization: {
            type: chartType,
            title: title || `${domain} Data - ${dateRange.replace('_', ' ')}`,
            xAxis: groupBy === 'date' ? 'Date' : 'Category',
            yAxis: metric || 'Value',
            data: chartData,
            config: { height: 400, showGrid: true, showLegend: true }
          }
        }
      }
    }

    // AI detected a command! Now save it to the appropriate domain
    let { domain, data: commandData, confirmationMessage } = parsed

    // Safety routing: if message is vehicle-related but was classified as financial, route to vehicles
    const msgLower = (message || '').toLowerCase()
    const looksVehicle = /(oil change|tire|tires|brake|brakes|alignment|service|maintenance|mileage|odometer|gas|fuel|dmv|registration|car|vehicle|auto)/i.test(msgLower)
    if (domain === 'financial' && looksVehicle) {
      domain = 'vehicles'
      // Normalize structure to vehicles shapes
      const amount = Number(commandData?.amount || commandData?.cost || 0) || 0
      const date = commandData?.date || new Date().toISOString().split('T')[0]
      const desc = (commandData?.description || '').toLowerCase()
      if (/oil/.test(msgLower)) {
        commandData = { type: 'maintenance', serviceName: 'oil change', amount, cost: amount, date }
      } else if (/gas|fuel/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'fuel', amount, date, description: 'fuel' }
      } else if (/dmv|registration/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'registration', amount, date }
      } else if (/insurance/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'insurance', amount, date }
      } else if (/repair|brake|tire|alignment/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'repair', amount, date, description: commandData?.description || 'repair' }
      } else {
        commandData = { type: 'cost', costType: 'maintenance', amount, date, description: commandData?.description || 'vehicle expense' }
      }
      confirmationMessage = confirmationMessage || '✅ Logged vehicle expense'
    }
    
    console.log(`✅ AI detected command for domain: ${domain}`)
    console.log(`📝 Data to save:`, JSON.stringify(commandData, null, 2))

    // Special handling for PET EXPENSES - save to pet_costs table
    if (domain === 'pets' && (commandData.type === 'vet_appointment' || commandData.type === 'expense') && commandData.amount) {
      console.log('🐾 Attempting to save pet expense:', commandData)
      
      // Extract pet name from the message or commandData
      let petName = commandData.petName || commandData.pet_name || null
      
      if (!petName) {
        // Try to extract from message - look for common pet names or any capitalized word
        const namePatterns = [
          /(?:^|\s)([A-Z][a-z]+)(?:\s+had|\s+went|\s+got|\s+vet|\s+grooming|'s)/i,  // "Rex had", "Rex's"
          /(?:for|on)\s+([A-Z][a-z]+)(?:'s|\s+vet|\s+grooming)/i,  // "for Rex's", "on Rex vet"
          /\b([A-Z][a-z]{2,})\b/  // Any capitalized word with 3+ letters
        ]
        
        for (const pattern of namePatterns) {
          const match = message.match(pattern)
          if (match && match[1]) {
            petName = match[1]
            console.log(`🐾 Extracted pet name: ${petName}`)
            break
          }
        }
      }
      
      if (!petName) {
        console.log('⚠️ No pet name found, checking if user has only one pet...')
        // If no name found, check if user has only one pet
        const { data: allPets } = await supabase
          .from('pets')
          .select('id, name')
          .eq('user_id', userId)
        
        if (allPets && allPets.length === 1) {
          petName = allPets[0].name
          console.log(`🐾 Using single pet: ${petName}`)
        }
      }
      
      if (petName) {
        console.log(`🐾 Looking up pet: ${petName}`)
        
        // Find the pet by name (case-insensitive)
        const { data: pets, error: petError } = await supabase
          .from('pets')
          .select('id, name')
          .eq('user_id', userId)
          .ilike('name', `%${petName}%`)
          .limit(1)
        
        console.log(`🐾 Pet query result:`, { pets, petError })
        
        if (!petError && pets && pets.length > 0) {
          const pet = pets[0]
          console.log(`🐾 Found pet: ${pet.name} (${pet.id})`)
          
          // Save to pet_costs table
          const costData = {
            id: randomUUID(),
            user_id: userId,
            pet_id: pet.id,
            cost_type: 'vet',
            amount: commandData.amount,
            date: commandData.date || new Date().toISOString().split('T')[0],
            description: commandData.description || 'Vet appointment',
            vendor: null
          }
          
          console.log(`🐾 Inserting pet cost:`, costData)
          
          const { error: costError } = await supabase
            .from('pet_costs')
            .insert(costData)
          
          if (costError) {
            console.error('❌ Failed to save pet cost:', costError)
          } else {
            console.log(`✅ SUCCESS! Saved $${commandData.amount} vet cost for ${pet.name}`)
            
            return {
              isCommand: true,
              action: 'save_pet_cost',
              message: `✅ Logged $${commandData.amount} vet cost for ${pet.name}`
            }
          }
        } else {
          console.error(`❌ Pet '${petName}' not found in database`)
        }
      } else {
        console.error('❌ Could not extract pet name from message')
      }
    }

    // Special handling for TASKS domain - use dedicated tasks table
    if (domain === 'tasks') {
      const taskTitle = commandData.title || commandData.description || message
      const taskPriority = commandData.priority || 'medium'
      const taskDueDate = commandData.due_date || commandData.dueDate || null
      const taskDescription = commandData.description || null
      
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          id: randomUUID(),
          user_id: userId,
          title: taskTitle,
          description: taskDescription,
          completed: false,
          priority: taskPriority,
          due_date: taskDueDate,
          metadata: { source: 'ai_assistant' },
        })

      if (taskError) {
        console.error('❌ Failed to create task:', taskError)
        throw taskError
      }

      return {
        isCommand: true,
        action: 'create_task',
        message: confirmationMessage || `✅ Task created: "${taskTitle}"`
      }
    }

    // Special handling for NOTES (mindfulness domain with type=note)
    if (domain === 'mindfulness' && commandData.type === 'note') {
      const noteTitle = commandData.title || message.substring(0, 50)
      const noteContent = commandData.content || commandData.description || message
      
      await saveToSupabase(supabase, userId, 'mindfulness', {
        id: randomUUID(),
        title: noteTitle,
        description: noteContent,
        type: 'note',
        logType: 'note',
        fullContent: noteContent,
        timestamp: new Date().toISOString(),
        source: 'ai_assistant'
      })

      return {
        isCommand: true,
        action: 'create_note',
        message: confirmationMessage || `✅ Note saved: "${noteTitle}"`
      }
    }

    // Special handling for NUTRITION MEALS - ensure proper structure for UI
    if (domain === 'nutrition' && (commandData.type === 'meal' || commandData.mealName || commandData.calories)) {
      // Determine meal type based on time of day if not provided
      const hour = new Date().getHours()
      let mealType = commandData.mealType || 'Other'
      if (!commandData.mealType) {
        if (hour >= 5 && hour < 11) mealType = 'Breakfast'
        else if (hour >= 11 && hour < 15) mealType = 'Lunch'
        else if (hour >= 15 && hour < 22) mealType = 'Dinner'
        else mealType = 'Snack'
      }
      
      const mealName = commandData.name || commandData.mealName || commandData.description || commandData.food || 'Meal'
      const calories = Number(commandData.calories) || 0
      
      // Check if macros were provided, if not estimate them
      const hasMacros = (Number(commandData.protein) > 0 || 
                        Number(commandData.carbs) > 0 || 
                        Number(commandData.fats) > 0)
      
      let protein = Number(commandData.protein) || 0
      let carbs = Number(commandData.carbs) || 0
      let fats = Number(commandData.fats) || 0
      let fiber = Number(commandData.fiber) || 0
      
      if (!hasMacros && calories > 0) {
        console.log(`🧠 [CHAT] Estimating macros for ${mealName}...`)
        const estimated = await estimateMealMacros(mealName, calories)
        protein = estimated.protein
        carbs = estimated.carbs
        fats = estimated.fats
        fiber = estimated.fiber
      }
      
      await saveToSupabase(supabase, userId, 'nutrition', {
        id: randomUUID(),
        type: 'meal',
        logType: 'meal',
        name: mealName,
        description: mealName,
        mealType,
        calories,
        protein,
        carbs,
        fats,
        fiber,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        source: 'ai_assistant'
      })

      return {
        isCommand: true,
        action: 'save_meal',
        message: confirmationMessage || `✅ Logged meal: "${mealName}" (${calories} cal, ${protein}g protein, ${carbs}g carbs, ${fats}g fat) in Nutrition domain`
      }
    }

    // Save to Supabase using the existing saveToSupabase function
    await saveToSupabase(supabase, userId, domain, {
      id: randomUUID(),
      ...commandData,
      timestamp: new Date().toISOString(),
      source: 'ai_assistant'
    })

    return {
      isCommand: true,
      action: `save_${commandData.type || 'data'}`,
      message: confirmationMessage || `✅ Data logged to ${domain} domain`
    }

  } catch (parseError) {
    console.error('❌ Failed to parse AI response:', parseError)
    console.error('❌ AI response was:', aiResponse)
    return { isCommand: false }
  }
}

// Fetch recent mindfulness journal entries for AI context
async function fetchMindfulnessContext(supabase: any, userId: string): Promise<{
  hasJournals: boolean
  journalCount: number
  summary: string
}> {
  try {
    // Fetch recent mindfulness journal entries (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: entries, error } = await supabase
      .from('domain_entries')
      .select('title, description, metadata, created_at')
      .eq('user_id', userId)
      .eq('domain', 'mindfulness')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching mindfulness entries:', error)
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    if (!entries || entries.length === 0) {
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    // Filter for journal entries only
    const journalEntries = entries.filter((entry: any) => 
      entry.metadata?.type === 'journal' || 
      entry.metadata?.logType === 'journal-entry' ||
      entry.metadata?.entryType === 'Journal'
    )
    
    if (journalEntries.length === 0) {
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    // Build summary from recent journals
    let summary = `Recent journal entries (last ${journalEntries.length}):\n`
    
    journalEntries.forEach((entry: any, index: number) => {
      const date = new Date(entry.created_at).toLocaleDateString()
      const content = entry.metadata?.fullContent || entry.description || ''
      const aiInsight = entry.metadata?.aiInsight || ''
      
      // Truncate content for context efficiency
      const truncatedContent = content.substring(0, 200)
      
      summary += `\n${index + 1}. [${date}]: "${truncatedContent}${content.length > 200 ? '...' : ''}"`
      
      if (aiInsight) {
        const truncatedInsight = aiInsight.substring(0, 150)
        summary += `\n   AI Insight: "${truncatedInsight}${aiInsight.length > 150 ? '...' : ''}"`
      }
    })
    
    return {
      hasJournals: true,
      journalCount: journalEntries.length,
      summary
    }
  } catch (error) {
    console.error('❌ Error in fetchMindfulnessContext:', error)
    return { hasJournals: false, journalCount: 0, summary: '' }
  }
}

// ============================================
// INTELLIGENT QUERY HANDLER - READ OPERATIONS
// ============================================
async function intelligentQueryHandler(message: string, userId: string, supabase: any) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isQuery: false }

  console.log('🔍 Analyzing if message is a QUERY...')

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
          {
            role: 'system',
            content: `You are a QUERY ANALYZER for a life management app with 21 domains.

**YOUR JOB:** Detect if user wants to RETRIEVE/VIEW/ANALYZE data (not create).

**QUERY PATTERNS:**
- "show me..." / "what is..." / "how much..." / "when did..."
- "list my..." / "find..." / "search..." / "display..."
- "what's my..." / "how many..." / "total..." / "average..."
- "analyze..." / "compare..." / "trend..." / "visualize..."
- "create chart..." / "graph..." / "dashboard..."

**QUERY TYPES:**
1. **list** - Show individual entries
2. **aggregate** - Calculate totals, averages, counts
3. **trend** - Show changes over time
4. **compare** - Compare periods or categories
5. **visualization** - Generate charts/graphs
6. **multi_domain** - Combine data from multiple domains
7. **custom_visualization** - AI creates best chart for the data

**MULTI-DOMAIN SUPPORT:**
- User can request data across ALL domains
- AI intelligently combines relevant data
- Creates composite visualizations

**RESPONSE FORMAT:**
{
  "isQuery": true,
  "domain": "financial|health|fitness|all|multiple",
  "domains": ["financial", "health"],  // For multi-domain queries
  "queryType": "list|aggregate|trend|compare|visualization|multi_domain|custom_visualization",
  "filters": {
    "dateRange": "today|this_week|last_week|this_month|last_month|this_year|all",
    "metricType": "weight|expense|income|workout|etc",
    "category": "specific category if mentioned"
  },
  "visualization": {
    "type": "line|bar|pie|area|multi_line|stacked_bar|combo|scatter",
    "title": "Chart title",
    "xAxis": "Time/Category",
    "yAxis": "Value/Metric",
    "datasets": [
      {
        "name": "Dataset 1",
        "domain": "health",
        "metric": "weight"
      }
    ]
  },
  "customVisualization": {
    "description": "What insight the AI wants to show",
    "chartType": "auto-selected by AI",
    "dataSources": ["domains to combine"]
  }
}

**EXAMPLES:**

"show me my expenses from last month"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "list",
  "filters": { "dateRange": "last_month", "metricType": "expense" }
}

"what's my total spending this week?"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "aggregate",
  "filters": { "dateRange": "this_week", "metricType": "expense" }
}

"show my weight trend this month"
{
  "isQuery": true,
  "domain": "health",
  "queryType": "visualization",
  "filters": { "dateRange": "this_month", "metricType": "weight" },
  "visualization": { "type": "line", "title": "Weight Trend", "xAxis": "Date", "yAxis": "Weight (lbs)" }
}

"how many workouts did I do this week?"
{
  "isQuery": true,
  "domain": "fitness",
  "queryType": "aggregate",
  "filters": { "dateRange": "this_week", "metricType": "workout" }
}

"show all my data from this month"
{
  "isQuery": true,
  "domain": "all",
  "domains": ["financial", "health", "fitness", "nutrition"],
  "queryType": "multi_domain",
  "filters": { "dateRange": "this_month" }
}

"compare my spending vs my income"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "custom_visualization",
  "visualization": {
    "type": "multi_line",
    "title": "Income vs Expenses",
    "datasets": [
      { "name": "Income", "metric": "income" },
      { "name": "Expenses", "metric": "expense" }
    ]
  }
}

"create a dashboard showing my health and fitness progress"
{
  "isQuery": true,
  "domain": "multiple",
  "domains": ["health", "fitness"],
  "queryType": "custom_visualization",
  "visualization": {
    "type": "combo",
    "title": "Health & Fitness Dashboard",
    "datasets": [
      { "name": "Weight", "domain": "health", "metric": "weight" },
      { "name": "Workouts", "domain": "fitness", "metric": "workout" }
    ]
  }
}

"visualize my life data"
{
  "isQuery": true,
  "domain": "all",
  "domains": ["financial", "health", "fitness", "nutrition", "mindfulness"],
  "queryType": "custom_visualization",
  "customVisualization": {
    "description": "Create comprehensive overview of all life domains",
    "chartType": "multiple",
    "dataSources": ["all_active_domains"]
  }
}

If NOT a query (it's a command to CREATE data), respond:
{
  "isQuery": false
}

Only respond with valid JSON, nothing else.`
          },
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isQuery: false }
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log('🤖 Query analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isQuery) {
      console.log('❌ Not a query')
      return { isQuery: false }
    }

    console.log('✅ Detected QUERY:', parsed)

    // Execute the query
    const queryResult = await executeQuery(parsed, userId, supabase)
    
    return {
      isQuery: true,
      data: queryResult.data,
      message: queryResult.message,
      visualization: queryResult.visualization,
      queryType: parsed.queryType
    }
  } catch (error: any) {
    console.error('❌ Query handler error:', error)
    return { isQuery: false }
  }
}

// ============================================
// QUERY EXECUTOR - Fetch and format data
// ============================================
async function executeQuery(querySpec: any, userId: string, supabase: any) {
  const { domain, domains, queryType, filters, visualization, customVisualization } = querySpec
  
  console.log('📊 Executing query:', { domain, domains, queryType, filters })
  
  try {
    // Handle multi-domain queries
    if (queryType === 'multi_domain' || domain === 'all' || domain === 'multiple') {
      return await executeMultiDomainQuery(querySpec, userId, supabase)
    }
    
    // Handle custom visualizations
    if (queryType === 'custom_visualization') {
      return await executeCustomVisualization(querySpec, userId, supabase)
    }
    
    // Build Supabase query for single domain
    let query = supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
    
    // Filter by domain if specified
    if (domain && domain !== 'all') {
      query = query.eq('domain', domain)
    }
    
    // Apply date range filter
    if (filters?.dateRange) {
      const dateFilter = getDateRange(filters.dateRange)
      query = query.gte('created_at', dateFilter.start)
                   .lte('created_at', dateFilter.end)
    }
    
    // Apply metadata filters
    if (filters?.metricType) {
      // Filter by metadata type
      query = query.contains('metadata', { type: filters.metricType })
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Query error:', error)
      throw error
    }
    
    console.log(`📊 Query returned ${data.length} results`)
    
    // Format response based on query type
    if (queryType === 'aggregate') {
      return formatAggregateResponse(data, filters, domain)
    }
    
    if (queryType === 'list') {
      return formatListResponse(data, filters, domain)
    }
    
    if (queryType === 'trend' || queryType === 'visualization') {
      return formatVisualizationResponse(data, filters, domain, visualization)
    }
    
    if (queryType === 'compare') {
      return formatCompareResponse(data, filters, domain)
    }
    
    return { 
      data, 
      message: `Found ${data.length} ${domain} entries`,
      visualization: null
    }
  } catch (error: any) {
    console.error('❌ Execute query error:', error)
    throw error
  }
}

// ============================================
// MULTI-DOMAIN QUERY EXECUTOR
// ============================================
async function executeMultiDomainQuery(querySpec: any, userId: string, supabase: any) {
  const { domains, filters } = querySpec
  
  console.log('🌐 Executing multi-domain query:', domains)
  
  try {
    // Build query for all requested domains or all domains
    let query = supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
    
    // Filter by specific domains if provided
    if (domains && domains.length > 0) {
      query = query.in('domain', domains)
    }
    
    // Apply date range filter
    if (filters?.dateRange) {
      const dateFilter = getDateRange(filters.dateRange)
      query = query.gte('created_at', dateFilter.start)
                   .lte('created_at', dateFilter.end)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log(`🌐 Multi-domain query returned ${data.length} results`)
    
    // Group data by domain
    const groupedByDomain: Record<string, any[]> = {}
    data.forEach((entry: { domain: string; [key: string]: any }) => {
      if (!groupedByDomain[entry.domain]) {
        groupedByDomain[entry.domain] = []
      }
      groupedByDomain[entry.domain].push(entry)
    })
    
    // Create summary
    let message = `📊 **Multi-Domain Overview**\n\n`
    message += `Total entries: ${data.length}\n`
    message += `Active domains: ${Object.keys(groupedByDomain).length}\n\n`
    
    Object.entries(groupedByDomain).forEach(([domain, entries]) => {
      message += `• **${domain.toUpperCase()}**: ${entries.length} entries\n`
    })
    
    // Create multi-domain visualization
    const visualization = {
      type: 'combo',
      title: 'Multi-Domain Activity Overview',
      xAxis: 'Domain',
      yAxis: 'Entry Count',
      data: Object.entries(groupedByDomain).map(([domain, entries]) => ({
        domain: domain.toUpperCase(),
        value: entries.length,
        label: domain
      })),
      config: {
        height: 400,
        showGrid: true,
        showLegend: true,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }
    }
    
    return {
      data: groupedByDomain,
      message,
      visualization
    }
  } catch (error: any) {
    console.error('❌ Multi-domain query error:', error)
    throw error
  }
}

// ============================================
// CUSTOM VISUALIZATION EXECUTOR
// ============================================
async function executeCustomVisualization(querySpec: any, userId: string, supabase: any) {
  const { domains, filters, visualization, customVisualization } = querySpec
  
  console.log('🎨 Creating custom visualization:', visualization)
  
  try {
    // Fetch data for all requested datasets
    const datasets: any[] = []
    
    if (visualization?.datasets) {
      for (const dataset of visualization.datasets) {
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
        
        // Filter by domain if specified
        if (dataset.domain) {
          query = query.eq('domain', dataset.domain)
        }
        
        // Filter by metric type
        if (dataset.metric) {
          query = query.contains('metadata', { type: dataset.metric })
        }
        
        // Apply date range
        if (filters?.dateRange) {
          const dateFilter = getDateRange(filters.dateRange)
          query = query.gte('created_at', dateFilter.start)
                       .lte('created_at', dateFilter.end)
        }
        
        const { data, error } = await query.order('created_at', { ascending: true })
        
        if (!error && data) {
          datasets.push({
            name: dataset.name || dataset.metric,
            domain: dataset.domain,
            data: data.map((entry: { created_at: string; metadata?: any; title: string }) => ({
              date: new Date(entry.created_at).toLocaleDateString(),
              timestamp: entry.created_at,
              value: entry.metadata?.value || entry.metadata?.amount || 0,
              label: entry.title
            }))
          })
        }
      }
    } else if (domains) {
      // Fetch all data from specified domains
      for (const domain of domains) {
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('domain', domain)
        
        if (filters?.dateRange) {
          const dateFilter = getDateRange(filters.dateRange)
          query = query.gte('created_at', dateFilter.start)
                       .lte('created_at', dateFilter.end)
        }
        
        const { data, error } = await query.order('created_at', { ascending: true })
        
        if (!error && data) {
          datasets.push({
            name: domain.toUpperCase(),
            domain,
            data: data.map((entry: { created_at: string; metadata?: any; title: string }) => ({
              date: new Date(entry.created_at).toLocaleDateString(),
              timestamp: entry.created_at,
              value: entry.metadata?.value || entry.metadata?.amount || 1,
              label: entry.title
            }))
          })
        }
      }
    }
    
    console.log(`🎨 Created ${datasets.length} datasets for visualization`)
    
    // Create custom visualization
    const customViz = {
      type: visualization?.type || 'multi_line',
      title: visualization?.title || customVisualization?.description || 'Custom Visualization',
      xAxis: visualization?.xAxis || 'Date',
      yAxis: visualization?.yAxis || 'Value',
      datasets: datasets,
      config: {
        height: 400,
        showGrid: true,
        showLegend: true,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }
    }
    
    let message = `📊 **${customViz.title}**\n\n`
    message += `Datasets: ${datasets.length}\n`
    datasets.forEach(ds => {
      message += `• ${ds.name}: ${ds.data.length} data points\n`
    })
    message += `\n📈 **Interactive chart generated below**`
    
    return {
      data: datasets,
      message,
      visualization: customViz
    }
  } catch (error: any) {
    console.error('❌ Custom visualization error:', error)
    throw error
  }
}

// ============================================
// DATE RANGE HELPER
// ============================================
function getDateRange(range: string) {
  const now = new Date()
  const start = new Date()
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'this_week':
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      break
    case 'last_week':
      start.setDate(now.getDate() - now.getDay() - 7)
      start.setHours(0, 0, 0, 0)
      break
    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'last_month':
      start.setMonth(now.getMonth() - 1)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'this_year':
      start.setMonth(0)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setFullYear(now.getFullYear() - 1)
  }
  
  return { 
    start: start.toISOString(), 
    end: now.toISOString() 
  }
}

// ============================================
// RESPONSE FORMATTERS
// ============================================
function formatAggregateResponse(data: any[], filters: any, domain: string) {
  const metricType = filters?.metricType
  
  // Count entries
  const count = data.length
  
  // Calculate sum for numeric metrics
  let total = 0
  let average = 0
  
  data.forEach(entry => {
    const metadata = entry.metadata || {}
    
    // Sum amounts (expenses, income, etc)
    if (metadata.amount) {
      total += metadata.amount
    }
    
    // Sum values (weight, steps, etc)
    if (metadata.value) {
      total += metadata.value
    }
    
    // Sum costs
    if (metadata.cost) {
      total += metadata.cost
    }
  })
  
  if (count > 0) {
    average = total / count
  }
  
  let message = `📊 **${domain?.toUpperCase() || 'ALL'} Summary**\n\n`
  message += `• Total entries: ${count}\n`
  
  if (total > 0) {
    if (domain === 'financial' || metricType === 'expense' || metricType === 'income') {
      message += `• Total amount: $${total.toFixed(2)}\n`
      message += `• Average: $${average.toFixed(2)}\n`
    } else if (domain === 'health' && metricType === 'weight') {
      message += `• Average weight: ${average.toFixed(1)} lbs\n`
    } else if (domain === 'fitness') {
      message += `• Total value: ${total.toFixed(0)}\n`
    } else {
      message += `• Total: ${total.toFixed(2)}\n`
      message += `• Average: ${average.toFixed(2)}\n`
    }
  }
  
  return {
    data: { count, total, average, entries: data.slice(0, 10) },
    message,
    visualization: null
  }
}

function formatListResponse(data: any[], filters: any, domain: string) {
  const maxDisplay = 10
  const displayData = data.slice(0, maxDisplay)
  
  let message = `📋 **${domain?.toUpperCase() || 'ALL'} Entries** (${data.length} total)\n\n`
  
  displayData.forEach((entry, index) => {
    const metadata = entry.metadata || {}
    message += `${index + 1}. **${entry.title}**\n`
    
    if (metadata.amount) {
      message += `   💰 $${metadata.amount}\n`
    }
    if (metadata.value) {
      message += `   📊 ${metadata.value}\n`
    }
    if (entry.created_at) {
      const date = new Date(entry.created_at)
      message += `   📅 ${date.toLocaleDateString()}\n`
    }
    message += '\n'
  })
  
  if (data.length > maxDisplay) {
    message += `\n_...and ${data.length - maxDisplay} more entries_`
  }
  
  return {
    data: displayData,
    message,
    visualization: null
  }
}

function formatVisualizationResponse(data: any[], filters: any, domain: string, visSpec: any) {
  // Prepare data for chart
  const chartData = data.map(entry => {
    const metadata = entry.metadata || {}
    return {
      date: new Date(entry.created_at).toLocaleDateString(),
      timestamp: entry.created_at,
      value: metadata.value || metadata.amount || metadata.cost || 0,
      label: entry.title
    }
  }).reverse() // Chronological order
  
  const visualization = {
    type: visSpec?.type || 'line',
    title: visSpec?.title || `${domain} Trend`,
    xAxis: visSpec?.xAxis || 'Date',
    yAxis: visSpec?.yAxis || 'Value',
    data: chartData,
    config: {
      height: 300,
      showGrid: true,
      showLegend: true,
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }
  }
  
  let message = `📈 **${visualization.title}**\n\n`
  message += `Found ${data.length} data points\n`
  
  if (chartData.length > 0) {
    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    
    message += `• Min: ${min.toFixed(2)}\n`
    message += `• Max: ${max.toFixed(2)}\n`
    message += `• Avg: ${avg.toFixed(2)}\n`
  }
  
  message += `\n📊 **Chart generated below**`
  
  return {
    data: chartData,
    message,
    visualization
  }
}

function formatCompareResponse(data: any[], filters: any, domain: string) {
  // Split data into two periods for comparison
  const midpoint = Math.floor(data.length / 2)
  const period1 = data.slice(0, midpoint)
  const period2 = data.slice(midpoint)
  
  const sum1 = period1.reduce((sum, e) => sum + (e.metadata?.amount || e.metadata?.value || 0), 0)
  const sum2 = period2.reduce((sum, e) => sum + (e.metadata?.amount || e.metadata?.value || 0), 0)
  
  const change = sum2 - sum1
  const percentChange = sum1 > 0 ? ((change / sum1) * 100) : 0
  
  let message = `📊 **Comparison Results**\n\n`
  message += `Earlier Period: $${sum1.toFixed(2)} (${period1.length} entries)\n`
  message += `Later Period: $${sum2.toFixed(2)} (${period2.length} entries)\n`
  message += `\n`
  message += `Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${percentChange.toFixed(1)}%)\n`
  
  return {
    data: { period1: sum1, period2: sum2, change, percentChange },
    message,
    visualization: null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userData, conversationHistory } = await request.json()

    console.log('🤖 AI Assistant received message:', message)
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // STEP 1: Check if it's a QUERY (read operation)
    console.log('🧠 Step 1: Checking if message is a QUERY...')
    console.log('👤 User ID:', user.id)
    console.log('📧 User email:', user.email)
    
    try {
      const queryResult = await intelligentQueryHandler(message, user.id, supabase)
      
      if (queryResult.isQuery) {
        console.log('✅ AI detected QUERY and executed!')
        return NextResponse.json({
          response: queryResult.message,
          data: queryResult.data,
          visualization: queryResult.visualization,
          action: 'query',
          queryType: queryResult.queryType,
          saved: false
        })
      }
      
      console.log('💬 Not a query, checking if it\'s a SEND command...')
    } catch (queryError: any) {
      console.error('❌ Query handler error:', queryError)
      // Continue to send checking
    }

    // STEP 1.25: Check if it's a SEND command (share documents/data)
    console.log('🧠 Step 1.25: Checking if message is a SEND command...')
    
    try {
      const sendResult = await intelligentSendHandler(message, user.id, supabase)
      
      if (sendResult.isSend) {
        console.log('✅ AI detected SEND command!')
        
        return NextResponse.json({
          response: sendResult.message,
          action: 'send',
          success: sendResult.success,
          details: sendResult.details,
          suggestion: sendResult.suggestion,
          contact: sendResult.contact,
          saved: false,
          triggerReload: false
        })
      }
      
      console.log('💬 Not a send command, checking if it\'s an ACTION...')
    } catch (sendError: any) {
      console.error('❌ Send handler error:', sendError)
      // Continue to action checking
    }

    // STEP 1.5: Check if it's an ACTION (delete, update, predict, export, etc.)
    console.log('🧠 Step 1.5: Checking if message is an ACTION...')
    
    try {
      const actionResult = await intelligentActionHandler(message, user.id, supabase)
      
      if (actionResult.isAction) {
        console.log('✅ AI detected ACTION:', actionResult.actionType)
        
        // If action requires confirmation, return preview
        if (actionResult.requiresConfirmation) {
          return NextResponse.json({
            response: actionResult.message,
            requiresConfirmation: true,
            action: actionResult.actionType,
            confirmationId: actionResult.confirmationId,
            preview: actionResult.preview,
            totalCount: actionResult.totalCount,
            params: actionResult.params
          })
        }
        
        // Return completed action result
        return NextResponse.json({
          response: actionResult.message,
          action: actionResult.actionType,
          data: actionResult.data,
          prediction: actionResult.prediction,
          correlation: actionResult.correlation,
          report: actionResult.report,
          exportData: actionResult.exportData ? {
            data: actionResult.data,
            mimeType: actionResult.mimeType,
            filename: actionResult.filename,
            count: actionResult.count
          } : undefined,
          calculation: actionResult.result ? {
            type: actionResult.actionType,
            result: actionResult.result
          } : undefined,
          analysis: actionResult.analysis,
          duplicates: actionResult.duplicates,
          saved: actionResult.success,
          triggerReload: actionResult.success
        })
      }
      
      console.log('💬 Not an action, checking if it\'s a COMMAND...')
    } catch (actionError: any) {
      console.error('❌ Action handler error:', actionError)
      // Continue to command checking
    }
    
    // STEP 2: Check if it's a COMMAND (create operation)
    console.log('🧠 Step 2: Checking if message is a COMMAND...')
    
    try {
      const commandResult = await intelligentCommandParser(message, user.id, supabase)
      
      if (commandResult.isCommand) {
        console.log('✅ AI detected command and executed:', commandResult.action)
        console.log('✅ Returning success response:', commandResult.message)
        console.log('📊 Visualization data:', commandResult.visualization ? 'present' : 'none')
        return NextResponse.json({
          response: commandResult.message,
          action: commandResult.action,
          visualization: commandResult.visualization,  // Include chart data!
          data: 'data' in commandResult ? commandResult.data : undefined,
          saved: commandResult.action !== 'custom_chart',  // Charts don't save data
          triggerReload: commandResult.action !== 'custom_chart'  // Don't reload for chart views
        })
      }
      
      console.log('💬 AI said not a command, trying regex fallback...')
      // ALWAYS try regex fallback even if AI says it's not a command
      // This ensures commands are NEVER missed
      try {
        const fallbackResult = await handleVoiceCommand(message, user.id, supabase)
        if (fallbackResult.isCommand) {
          console.log('✅ Regex fallback caught command!')
          return NextResponse.json({
            response: fallbackResult.message,
            action: fallbackResult.action,
            saved: true,
            triggerReload: true
          })
        }
      } catch (fallbackError) {
        console.error('❌ Regex fallback also failed:', fallbackError)
      }
      
      console.log('💬 Not a command either, proceeding to conversational AI...')
    } catch (commandError: any) {
      console.error('❌ Error in intelligent command parser:', commandError)
      console.error('❌ Details:', commandError?.message)
      // Try fallback regex parser on error too
      try {
        const fallbackResult = await handleVoiceCommand(message, user.id, supabase)
        if (fallbackResult.isCommand) {
          return NextResponse.json({
            response: fallbackResult.message,
            action: fallbackResult.action,
            saved: true
          })
        }
      } catch (fallbackError) {
        console.error('❌ Fallback parser also failed:', fallbackError)
      }
    }

    // Otherwise, use OpenAI API
    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      // Fallback response without AI
      return NextResponse.json({
        response: generateFallbackResponse(message, userData)
      })
    }

    // Fetch recent mindfulness journal entries for context
    console.log('📖 Fetching recent mindfulness journal entries...')
    const mindfulnessContext = await fetchMindfulnessContext(supabase, user.id)
    console.log(`✅ Found ${mindfulnessContext.journalCount} journal entries`)

    // Build enhanced system prompt with mindfulness context
    let systemPrompt = `You are a helpful, empathetic AI assistant for a life management app. You have access to the user's data across 21 life domains including health, fitness, financial, tasks, mindfulness, and more. 
            
Provide helpful, conversational responses. Be concise but informative. You can reference the user's data to give personalized insights.`

    if (mindfulnessContext.hasJournals) {
      systemPrompt += `\n\n🧠 MINDFULNESS CONTEXT:
The user has been journaling recently. Here's their recent emotional state and reflections:
${mindfulnessContext.summary}

When relevant, you can:
- Reference their emotional state with empathy
- Connect their questions to recent journal insights
- Offer support based on their mindfulness journey
- Be gentle and validating when discussing emotional topics

Don't force mindfulness references, but use this context when it adds value.`
    }

    // Call OpenAI API with function calling for document retrieval
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
            content: systemPrompt + `\n\nDOCUMENT RETRIEVAL:\nYou can search user's documents. When asked about documents (e.g., "show my insurance", "find my license", "pull up my auto insurance"), use the search_documents function.`
          },
          ...conversationHistory.slice(-10).map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: `User question: ${message}\n\nUser data summary: ${JSON.stringify(userData).substring(0, 2000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        functions: [
          {
            name: 'search_documents',
            description: 'Search and retrieve user documents by keywords or category. Use this when user asks to see, find, show, or pull up documents.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search keywords (e.g., "insurance", "license", "auto")'
                },
                category: {
                  type: 'string',
                  enum: ['insurance', 'health', 'vehicles', 'financial', 'legal', 'all'],
                  description: 'Document category to filter by'
                }
              },
              required: []
            }
          },
          {
            name: 'use_concierge',
            description: 'Delegate to the AI Concierge for calling businesses, getting quotes, booking appointments, or making reservations.',
            parameters: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  description: 'The user intent (e.g., "book_table", "get_quote", "order_food")'
                },
                details: {
                  type: 'string',
                  description: 'Summary of what the user wants'
                }
              },
              required: ['intent']
            }
          }
        ],
        function_call: 'auto'
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API failed')
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message
    
    // Check if AI wants to call a function
    if (aiMessage?.function_call) {
      const functionName = aiMessage.function_call.name
      const functionArgs = JSON.parse(aiMessage.function_call.arguments || '{}')
      
      console.log('🔧 AI calling function:', functionName, functionArgs)
      
      if (functionName === 'use_concierge') {
        return NextResponse.json({
          response: `I'll hand you over to the Concierge to help with ${functionArgs.details || 'that'}.`,
          action: 'concierge_handoff',
          conciergeData: {
            intent: functionArgs.intent,
            details: functionArgs.details,
            initialMessage: message
          }
        })
      }

      if (functionName === 'search_documents') {
        // Search documents
        const searchQuery = supabase
          .from('documents')
          .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (functionArgs.category && functionArgs.category !== 'all') {
          searchQuery.eq('domain', functionArgs.category)
        }
        
        const { data: docs, error: docError } = await searchQuery.limit(5)
        
        if (!docError && docs && docs.length > 0) {
          // Filter by text if query provided
          let filteredDocs = docs
          if (functionArgs.query) {
            const queryLower = functionArgs.query.toLowerCase()
            filteredDocs = docs.filter(doc =>
              doc.document_name?.toLowerCase().includes(queryLower) ||
              doc.document_type?.toLowerCase().includes(queryLower) ||
              doc.domain?.toLowerCase().includes(queryLower)
            )
          }
          
          const docList = filteredDocs.map(doc => ({
            id: doc.id,
            name: doc.document_name || 'Untitled',
            type: doc.document_type,
            category: doc.metadata?.category || doc.domain,
            expirationDate: doc.expiration_date,
            url: doc.file_url || doc.file_path
          }))
          
          console.log(`✅ Found ${docList.length} documents`)
          
          return NextResponse.json({
            response: `I found ${docList.length} document(s). Opening them now...`,
            documents: docList,
            openDocuments: true // Signal to frontend to open PDFs
          })
        }
      }
    }
    
    const aiResponse = aiMessage?.content

    return NextResponse.json({
      response: aiResponse || 'I received your message but had trouble generating a response.'
    })

  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Handle voice commands that save data
async function handleVoiceCommand(message: string, userId: string, supabase: any) {
  const lowerMessage = message.toLowerCase()
  
  console.log(`🔍 Checking command: "${lowerMessage}"`)
  
  // ============================================
  // SIMPLE CATCH-ALL PATTERNS (Check these FIRST)
  // ============================================
  
  // ============================================
  // CALENDAR EVENTS - Interview, Plan, Meeting, Appointment
  // These go to Google Calendar instead of domains
  // ============================================
  
  // Interview - catches "interview at [company] [when]"
  if (lowerMessage.includes('interview')) {
    const interviewMatch = lowerMessage.match(/interview\s+(?:at|with|for)\s+([a-z0-9\s&]+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|this|$))/i)
    if (interviewMatch) {
      const company = interviewMatch[1].trim()
      
      // Extract date/time info
      let date = ''
      let time = ''
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('today')) {
        date = new Date().toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      // Extract time if mentioned
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ INTERVIEW → GOOGLE CALENDAR: ${company}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      // Create Google Calendar event
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: `Interview with ${company}`,
        description: `Job interview at ${company}`,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '10:00 am',
        duration: 60,
        type: 'interview'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${date ? (lowerMessage.includes('tomorrow') ? ' for tomorrow' : '') : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      } else {
        // Fallback: Save to career domain if calendar fails
        await saveToSupabase(supabase, userId, 'career', {
          id: randomUUID(),
          type: 'interview',
          company,
          date,
          time,
          interviewType: 'scheduled',
          position: '',
          timestamp: new Date().toISOString(),
          source: 'voice_ai'
        })
        
        return {
          isCommand: true,
          action: 'add_interview',
          message: `${calendarResult.message}\n\n✅ Saved interview to Career domain as backup.`
        }
      }
    }
  }
  
  // Plan - catches "plan [activity] [when]" or "I have a plan for..."
  if (lowerMessage.match(/\b(?:plan|planning|scheduled?)\b/) && !lowerMessage.includes('meal plan')) {
    const planMatch = lowerMessage.match(/(?:plan|planning|scheduled?)\s+(?:to\s+)?(?:a\s+)?(.+?)(?:\s+(?:for|on|at|tomorrow|today|next|this)\s+(.+))?$/i)
    if (planMatch) {
      const activity = planMatch[1]?.trim().replace(/\s+(?:for|on|at)$/, '') || 'planned activity'
      const whenPart = planMatch[2]?.trim() || ''
      
      // Parse date
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      // Extract time
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ PLAN → GOOGLE CALENDAR: ${activity}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: activity.charAt(0).toUpperCase() + activity.slice(1),
        description: `Planned: ${activity}`,
        date,
        time: time || '12:00 pm',
        duration: 60,
        type: 'plan'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Meeting - catches "meeting with [person/company] [when]"
  if (lowerMessage.includes('meeting')) {
    const meetingMatch = lowerMessage.match(/meeting\s+(?:with\s+)?([a-z0-9\s&]+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|this|about|$))/i)
    if (meetingMatch) {
      const withWhom = meetingMatch[1].trim()
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ MEETING → GOOGLE CALENDAR: with ${withWhom}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: `Meeting with ${withWhom}`,
        description: `Meeting scheduled with ${withWhom}`,
        date,
        time: time || '10:00 am',
        duration: 60,
        type: 'meeting'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${lowerMessage.includes('tomorrow') ? ' for tomorrow' : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Appointment - catches "appointment with [person] [when]" or "doctor appointment"
  if (lowerMessage.includes('appointment')) {
    const appointmentMatch = lowerMessage.match(/(?:(\w+)\s+)?appointment(?:\s+with\s+([a-z0-9\s&]+))?(?:\s+(?:tomorrow|today|next\s+week|on|at|this|$))?/i)
    if (appointmentMatch) {
      const appointmentType = appointmentMatch[1]?.trim() || ''
      const withWhom = appointmentMatch[2]?.trim() || ''
      
      let title = 'Appointment'
      if (appointmentType) {
        title = `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} Appointment`
      }
      if (withWhom) {
        title += ` with ${withWhom}`
      }
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ APPOINTMENT → GOOGLE CALENDAR: ${title}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title,
        description: `Scheduled appointment`,
        date,
        time: time || '10:00 am',
        duration: 60,
        type: 'appointment'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${lowerMessage.includes('tomorrow') ? ' for tomorrow' : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Event - catches "event [name] [when]" or "create event"
  if (lowerMessage.match(/\b(?:event|reminder)\b/) && lowerMessage.match(/\b(?:add|create|schedule|set|new)\b/)) {
    const eventMatch = lowerMessage.match(/(?:add|create|schedule|set|new)\s+(?:an?\s+)?(?:event|reminder)\s+(?:for\s+)?(.+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|$))/i)
    if (eventMatch) {
      const eventName = eventMatch[1]?.trim() || 'New Event'
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ EVENT → GOOGLE CALENDAR: ${eventName}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: eventName.charAt(0).toUpperCase() + eventName.slice(1),
        description: `Event: ${eventName}`,
        date,
        time: time || '12:00 pm',
        duration: 60,
        type: 'event'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Simple expense: "spent $X [anything]"
  if (lowerMessage.match(/(?:spent|paid|bought)\s+\$?\d+/)) {
    const simpleExpenseMatch = lowerMessage.match(/(?:spent|paid|bought)\s+\$?(\d+(?:\.\d+)?)\s*(.*)/)
    if (simpleExpenseMatch) {
      const amount = parseFloat(simpleExpenseMatch[1])
      let description = simpleExpenseMatch[2].trim() || 'expense'
      description = description.replace(/^(on|for|at|dollars?|bucks?)\s+/i, '').trim() || 'expense'
      
      console.log(`✅ SIMPLE EXPENSE: $${amount} for ${description}`)
      
      await saveToSupabase(supabase, userId, 'financial', {
        id: randomUUID(),
        type: 'expense',
        amount,
        description,
        timestamp: new Date().toISOString(),
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_expense',
        message: `✅ Logged expense: $${amount} for ${description} in Financial domain`
      }
    }
  }
  
  // Simple workout: "did X minute [exercise]"
  if (lowerMessage.match(/did\s+\d+\s*(?:minute|min|hour|hr)/)) {
    const simpleWorkoutMatch = lowerMessage.match(/did\s+(\d+)\s*(?:minute|min|hour|hr)s?\s+(.+)/)
    if (simpleWorkoutMatch) {
      const duration = parseInt(simpleWorkoutMatch[1])
      const exercise = simpleWorkoutMatch[2].trim().replace(/workout|exercise|session/gi, '').trim() || 'workout'
      
      console.log(`✅ SIMPLE WORKOUT: ${duration} min ${exercise}`)
      
      await saveToSupabase(supabase, userId, 'fitness', {
        id: randomUUID(),
        type: 'workout',
        exercise,
        duration,
        timestamp: new Date().toISOString(),
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_workout',
        message: `✅ Logged ${duration} min ${exercise} workout in Fitness domain`
      }
    }
  }
  
  // Activity verbs (running, walking, etc): "ran X minutes", "I cycled 20 min", etc.
  if (lowerMessage.match(/\b(?:ran|run|jogged|jog|walked|walk|cycled|cycle|biked|bike|swam|swim|hiked|hike)\b/)) {
    const activityMatch = lowerMessage.match(/(?:ran|run|jogged|jog|walked|walk|cycled|cycle|biked|bike|swam|swim|hiked|hike)\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/)
    if (activityMatch) {
      const duration = parseInt(activityMatch[1])
      const isHours = lowerMessage.includes('hour')
      const durationInMinutes = isHours ? duration * 60 : duration
      
      // Detect activity type
      let activity = 'cardio'
      if (lowerMessage.match(/\b(?:ran|run|jog)/)) activity = 'running'
      else if (lowerMessage.match(/\bwalk/)) activity = 'walking'
      else if (lowerMessage.match(/\b(?:cycl|bik)/)) activity = 'cycling'
      else if (lowerMessage.match(/\bswim/)) activity = 'swimming'
      else if (lowerMessage.match(/\bhik/)) activity = 'hiking'
      
      console.log(`✅ SIMPLE ACTIVITY: ${activity} for ${durationInMinutes} min (from: "${lowerMessage}")`)
      
      await saveToSupabase(supabase, userId, 'fitness', {
        id: randomUUID(),
        type: 'workout',
        exercise: activity,
        duration: durationInMinutes,
        timestamp: new Date().toISOString(),
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_workout',
        message: `✅ Logged ${durationInMinutes}-minute ${activity} workout`
      }
    }
  }
  
  // ============================================
  // WATER - NUTRITION ONLY
  // ============================================
  const waterMatch = lowerMessage.match(/(?:drank|drink|log|add|had)?\s*(\d+(?:\.\d+)?)\s*(?:ounces?|oz|ml|liters?|l)(?:\s+of)?\s*water/)
  if (waterMatch) {
    const amount = parseFloat(waterMatch[1])
    const unit = lowerMessage.includes('ml') || lowerMessage.includes('liter') ? 'ml' : 'oz'
    
    console.log(`✅ Water: ${amount} ${unit} → nutrition domain`)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'water',
      value: amount,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_water',
      message: `✅ Logged ${amount} ${unit} of water in Nutrition domain`
    }
  }
  
  // ============================================
  // HEALTH DOMAIN
  // ============================================
  
  // Weight
  const weightMatch = lowerMessage.match(/(?:i\s+)?(?:weigh|weight)(?:\s+is|\s+was|\s+about|\s+around)?\s+(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|lb|kg)?/)
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1])
    const unit = lowerMessage.includes('kg') ? 'kg' : 'lbs'
    console.log(`✅ Weight: ${weight} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'weight',
      value: weight,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_weight',
      message: `✅ Logged weight: ${weight} ${unit} in Health domain`
    }
  }
  
  // Height
  const heightMatch = lowerMessage.match(/(?:height|tall)(?:\s+is|\s+was)?\s+(\d+)\s*(?:feet|ft|foot)?\s*(\d+)?\s*(?:inches|in)?/)
  if (heightMatch) {
    const feet = parseInt(heightMatch[1])
    const inches = heightMatch[2] ? parseInt(heightMatch[2]) : 0
    console.log(`✅ Height: ${feet}'${inches}"`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'height',
      feet,
      inches,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_height',
      message: `✅ Logged height: ${feet}' ${inches}" in Health domain`
    }
  }
  
  // Sleep
  const sleepMatch = lowerMessage.match(/(?:slept|sleep)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/)
  if (sleepMatch) {
    const hours = parseFloat(sleepMatch[1])
    console.log(`✅ Sleep: ${hours} hours`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'sleep',
      hours,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_sleep',
      message: `✅ Logged ${hours} hours of sleep in Health domain`
    }
  }
  
  // Heart Rate
  const heartRateMatch = lowerMessage.match(/(?:heart\s+rate|pulse)(?:\s+is|\s+was)?\s+(\d+)\s*(?:bpm)?/)
  if (heartRateMatch) {
    const bpm = parseInt(heartRateMatch[1])
    console.log(`✅ Heart Rate: ${bpm} bpm`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'heart_rate',
      value: bpm,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_heart_rate',
      message: `✅ Logged heart rate: ${bpm} bpm in Health domain`
    }
  }
  
  // Temperature
  const tempMatch = lowerMessage.match(/(?:temperature|temp)(?:\s+is|\s+was)?\s+(\d+(?:\.\d+)?)\s*(?:degrees?|°)?/)
  if (tempMatch) {
    const temp = parseFloat(tempMatch[1])
    console.log(`✅ Temperature: ${temp}°`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'temperature',
      value: temp,
      unit: 'fahrenheit',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_temperature',
      message: `✅ Logged temperature: ${temp}° in Health domain`
    }
  }
  
  // Mood
  const moodMatch = lowerMessage.match(/(?:feeling|feel|mood)(?:\s+is|\s+was)?\s+(great|good|okay|fine|bad|terrible|happy|sad|stressed|anxious|calm|energetic|tired|angry)/)
  if (moodMatch) {
    const mood = moodMatch[1]
    const moodValues: any = {
      'terrible': 1, 'bad': 2, 'sad': 2, 'stressed': 2, 'anxious': 2, 'angry': 2,
      'okay': 3, 'fine': 3, 'tired': 3,
      'good': 4, 'calm': 4,
      'great': 5, 'happy': 5, 'energetic': 5
    }
    const moodValue = moodValues[mood] || 3
    console.log(`✅ Mood: ${mood} (${moodValue}/5)`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'mood',
      mood,
      value: moodValue,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mood',
      message: `✅ Logged mood: ${mood} in Health domain`
    }
  }
  
  // Steps command
  const stepsMatch = lowerMessage.match(/(?:log|walked|did|took)?\s*(\d+(?:,\d+)?)\s*steps?/)
  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Steps command detected: ${steps} steps`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'steps',
      value: steps,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_steps',
      message: `✅ Logged ${steps.toLocaleString()} steps in Health domain`
    }
  }
  
  // Blood pressure command
  const bpMatch = lowerMessage.match(/blood\s+pressure\s+(\d+)\s*(?:over|\/)\s*(\d+)/)
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1])
    const diastolic = parseInt(bpMatch[2])
    console.log(`✅ Blood Pressure: ${systolic}/${diastolic}`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'blood_pressure',
      systolic,
      diastolic,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_bp',
      message: `✅ Logged blood pressure: ${systolic}/${diastolic} in Health domain`
    }
  }
  
  // ============================================
  // FITNESS DOMAIN
  // ============================================
  
  // Workout - MORE FLEXIBLE (optional "workout" keyword)
  const workoutMatch = lowerMessage.match(/(?:did|finished|completed)?\s*(?:a\s+)?(\d+)\s*(?:minute|min|hour|hr)\s+(.+?)(?:\s+(?:workout|exercise|session))?$/)
  if (workoutMatch && (lowerMessage.includes('cardio') || lowerMessage.includes('workout') || 
                        lowerMessage.includes('exercise') || lowerMessage.includes('training') ||
                        lowerMessage.includes('yoga') || lowerMessage.includes('hiit') ||
                        lowerMessage.includes('running') || lowerMessage.includes('cycling') ||
                        lowerMessage.match(/did\s+\d+\s*(?:minute|min)/))) {
    const duration = parseInt(workoutMatch[1])
    let exercise = workoutMatch[2].trim()
    
    // Remove trailing "workout", "exercise", "session" if present
    exercise = exercise.replace(/\s+(workout|exercise|session)$/i, '')
    
    console.log(`✅ Workout: ${exercise} for ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'workout',
      exercise,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_workout',
      message: `✅ Logged ${duration} min ${exercise} workout in Fitness domain`
    }
  }
  
  // Exercise with reps
  const repsMatch = lowerMessage.match(/(?:did)?\s*(\d+)\s+(.+?)\s+(\d+)\s+(?:reps?|repetitions?)/)
  if (repsMatch) {
    const sets = parseInt(repsMatch[1])
    const exercise = repsMatch[2].trim()
    const reps = parseInt(repsMatch[3])
    console.log(`✅ Exercise: ${exercise} ${sets} sets x ${reps} reps`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'strength',
      exercise,
      sets,
      reps,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_exercise',
      message: `✅ Logged ${exercise}: ${sets} sets x ${reps} reps in Fitness domain`
    }
  }
  
  // Calories burned
  const caloriesBurnedMatch = lowerMessage.match(/burned\s+(\d+)\s*(?:cal|calories)/)
  if (caloriesBurnedMatch) {
    const calories = parseInt(caloriesBurnedMatch[1])
    console.log(`✅ Burned: ${calories} calories`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'calories_burned',
      value: calories,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_calories_burned',
      message: `✅ Logged ${calories} calories burned in Fitness domain`
    }
  }
  
  // ============================================
  // NUTRITION DOMAIN
  // ============================================
  
  // Meal with calories
  const mealMatch = lowerMessage.match(/(?:ate|eat|had|log|consumed|eating)\s+(?:a\s+)?(.+?)\s+(?:for\s+)?(?:today\s+)?(\d+)\s*(?:cal|calories)/)
  if (mealMatch) {
    const description = mealMatch[1].trim()
    const calories = parseInt(mealMatch[2])
    console.log(`✅ Meal: ${description} - ${calories} cal`)
    
    // Determine meal type based on time of day
    const hour = new Date().getHours()
    let mealType = 'Other'
    if (hour >= 5 && hour < 11) mealType = 'Breakfast'
    else if (hour >= 11 && hour < 15) mealType = 'Lunch'
    else if (hour >= 15 && hour < 22) mealType = 'Dinner'
    else mealType = 'Snack'
    
    // Estimate macros using AI
    console.log(`🧠 [VOICE] Estimating macros for ${description}...`)
    const macros = await estimateMealMacros(description, calories)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'meal',
      logType: 'meal',
      name: description,  // ← UI displays this field
      description,
      mealType,
      calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      fiber: macros.fiber,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_meal',
      message: `✅ Logged meal: "${description}" (${calories} cal, ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fats}g fat) in Nutrition domain`
    }
  }
  
  // Protein intake
  const proteinMatch = lowerMessage.match(/(?:ate|had|consumed)\s+(\d+)\s*(?:g|grams?)\s+(?:of\s+)?protein/)
  if (proteinMatch) {
    const protein = parseInt(proteinMatch[1])
    console.log(`✅ Protein: ${protein}g`)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'macros',
      protein,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_protein',
      message: `✅ Logged ${protein}g protein in Nutrition domain`
    }
  }
  
  // ============================================
  // FINANCIAL DOMAIN
  // ============================================
  
  // Expense - MORE FLEXIBLE
  const expenseMatch = lowerMessage.match(/(?:spent|paid|expense|bought)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?|bucks?)?\s*(?:on|for|at)?\s*(.+)/)
  if (expenseMatch && (lowerMessage.includes('spent') || lowerMessage.includes('paid') || lowerMessage.includes('bought'))) {
    const amount = parseFloat(expenseMatch[1])
    let description = expenseMatch[2].trim()
    
    // Remove common filler words
    description = description.replace(/^(on|for|at)\s+/, '')
    
    console.log(`✅ Expense: $${amount} for ${description}`)
    
    await saveToSupabase(supabase, userId, 'financial', {
      id: randomUUID(),
      type: 'expense',
      amount,
      description,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_expense',
      message: `✅ Logged expense: $${amount} for ${description} in Financial domain`
    }
  }
  
  // Income
  const incomeMatch = lowerMessage.match(/(?:earned|received|income|got\s+paid)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?)?(?:\s+for\s+(.+))?/)
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1])
    const description = incomeMatch[2] ? incomeMatch[2].trim() : 'income'
    console.log(`✅ Income: $${amount} - ${description}`)
    
    await saveToSupabase(supabase, userId, 'financial', {
      id: randomUUID(),
      type: 'income',
      amount,
      description,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_income',
      message: `✅ Logged income: $${amount} for ${description} in Financial domain`
    }
  }
  
  // ============================================
  // VEHICLES DOMAIN
  // ============================================
  
  // Gas fillup
  const gasMatch = lowerMessage.match(/(?:filled\s+up|got\s+gas|filled\s+gas)\s+(?:for\s+)?(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?)?/)
  if (gasMatch) {
    const amount = parseFloat(gasMatch[1])
    console.log(`✅ Gas: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'gas',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gas',
      message: `✅ Logged gas fillup: $${amount} in Vehicles domain`
    }
  }
  
  // ============================================
  // PETS DOMAIN
  // ============================================
  
  // Fed pet
  const fedPetMatch = lowerMessage.match(/fed\s+(?:the\s+)?(?:dog|cat|pet)(?:\s+(.+))?/)
  if (fedPetMatch) {
    const note = fedPetMatch[1] || ''
    console.log(`✅ Fed pet ${note}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'feeding',
      note,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_feeding',
      message: `✅ Logged pet feeding in Pets domain`
    }
  }
  
  // Walked pet
  const walkedPetMatch = lowerMessage.match(/walked\s+(?:the\s+)?(?:dog|pet)\s+(?:for\s+)?(\d+)\s*(?:min|minutes?)/)
  if (walkedPetMatch) {
    const duration = parseInt(walkedPetMatch[1])
    console.log(`✅ Walked pet: ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'walk',
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_walk',
      message: `✅ Logged ${duration} min dog walk in Pets domain`
    }
  }
  
  // ============================================
  // MINDFULNESS DOMAIN
  // ============================================
  
  // ============================================
  // HABITS DOMAIN
  // ============================================
  
  // Completed habit
  const habitMatch = lowerMessage.match(/(?:completed|did|finished)\s+(?:my\s+)?(.+?)\s+habit/)
  if (habitMatch) {
    const habit = habitMatch[1].trim()
    console.log(`✅ Habit: ${habit}`)
    
    await saveToSupabase(supabase, userId, 'habits', {
      id: randomUUID(),
      type: 'completion',
      habit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_habit',
      message: `✅ Logged habit completion: "${habit}" in Habits domain`
    }
  }
  
  // ============================================
  // GOALS DOMAIN
  // ============================================
  
  // Goal progress
  const goalProgressMatch = lowerMessage.match(/(?:goal|progress)\s+(.+?)\s+(?:is\s+)?(\d+)%/)
  if (goalProgressMatch) {
    const goal = goalProgressMatch[1].trim()
    const progress = parseInt(goalProgressMatch[2])
    console.log(`✅ Goal: ${goal} - ${progress}%`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'progress',
      goal,
      progress,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal_progress',
      message: `✅ Logged goal progress: "${goal}" at ${progress}% in Goals domain`
    }
  }
  
  // ============================================
  // TASKS DOMAIN
  // ============================================
  
  // Task command
  const taskMatch = lowerMessage.match(/(?:add|create)\s+(?:a\s+)?task\s+(.+)/)
  if (taskMatch) {
    const taskTitle = taskMatch[1].trim()
    console.log(`✅ Task: ${taskTitle}`)
    
    // Save to tasks table
    await supabase.from('tasks').insert({
      user_id: userId,
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString()
    })
    
    return {
      isCommand: true,
      action: 'add_task',
      message: `✅ Task added: "${taskTitle}" in Tasks domain`
    }
  }
  
  // ============================================
  // PROPERTY DOMAIN
  // ============================================
  
  // Property value
  const propertyValueMatch = lowerMessage.match(/(?:property|house|home)\s+(?:value|worth)\s+(?:\$)?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:dollars?)?/)
  if (propertyValueMatch) {
    const value = parseFloat(propertyValueMatch[1].replace(/,/g, ''))
    console.log(`✅ Property value: $${value}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'valuation',
      value,
      description: 'Property valuation',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_property_value',
      message: `✅ Logged property value: $${value.toLocaleString()} in Property domain`
    }
  }
  
  // ============================================
  // EDUCATION DOMAIN
  // ============================================
  
  // Study session
  const studyMatch = lowerMessage.match(/(?:studied|study|studying)\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|hours?|hrs?)(?:\s+(.+))?/)
  if (studyMatch) {
    const duration = parseInt(studyMatch[1])
    const subject = studyMatch[2] ? studyMatch[2].trim() : 'general study'
    const isHours = lowerMessage.includes('hour')
    console.log(`✅ Study session: ${duration} ${isHours ? 'hours' : 'minutes'} - ${subject}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'study_session',
      duration,
      unit: isHours ? 'hours' : 'minutes',
      subject,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_study_session',
      message: `✅ Logged study session: ${duration} ${isHours ? 'hours' : 'minutes'} on ${subject} in Education domain`
    }
  }
  
  // Course/class
  const courseMatch = lowerMessage.match(/(?:enrolled|taking|started)\s+(?:a\s+)?(?:course|class)\s+(.+)/)
  if (courseMatch) {
    const courseName = courseMatch[1].trim()
    console.log(`✅ Course: ${courseName}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'course',
      name: courseName,
      status: 'enrolled',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_course',
      message: `✅ Added course: "${courseName}" in Education domain`
    }
  }
  
  // ============================================
  // CAREER DOMAIN
  // ============================================
  
  // (Interview pattern moved to top of file for higher priority)
  
  // ============================================
  // RELATIONSHIPS DOMAIN
  // ============================================
  
  // Contact/interaction
  const contactMatch = lowerMessage.match(/(?:called|texted|met\s+with|talked\s+to|messaged)\s+(.+)/)
  if (contactMatch) {
    const person = contactMatch[1].trim()
    const method = lowerMessage.includes('called') ? 'call' :
                   lowerMessage.includes('texted') ? 'text' :
                   lowerMessage.includes('met') ? 'meeting' : 'message'
    console.log(`✅ Contact: ${method} with ${person}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'interaction',
      person,
      method,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_interaction',
      message: `✅ Logged ${method} with ${person} in Relationships domain`
    }
  }
  
  // ============================================
  // TRAVEL DOMAIN
  // ============================================
  
  // Trip/vacation
  const tripMatch = lowerMessage.match(/(?:planning|booked|going\s+to)\s+(?:a\s+)?(?:trip|vacation)\s+to\s+(.+)/)
  if (tripMatch) {
    const destination = tripMatch[1].trim()
    console.log(`✅ Trip: ${destination}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'trip',
      destination,
      status: lowerMessage.includes('booked') ? 'booked' : 'planning',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_trip',
      message: `✅ Added trip to ${destination} in Travel domain`
    }
  }
  
  // Flight
  const flightMatch = lowerMessage.match(/(?:booked|booking)\s+(?:a\s+)?flight\s+to\s+(.+)/)
  if (flightMatch) {
    const destination = flightMatch[1].trim()
    console.log(`✅ Flight: ${destination}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'flight',
      destination,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'book_flight',
      message: `✅ Logged flight to ${destination} in Travel domain`
    }
  }
  
  // ============================================
  // HOBBIES DOMAIN
  // ============================================
  
  // Hobby activity
  const hobbyMatch = lowerMessage.match(/(?:played|practiced|did)\s+(.+?)\s+(?:for\s+)?(\d+)\s*(?:minutes?|hours?)/)
  if (hobbyMatch && (lowerMessage.includes('guitar') || lowerMessage.includes('piano') || 
                      lowerMessage.includes('painting') || lowerMessage.includes('reading') ||
                      lowerMessage.includes('gaming') || lowerMessage.includes('photography'))) {
    const activity = hobbyMatch[1].trim()
    const duration = parseInt(hobbyMatch[2])
    const isHours = lowerMessage.includes('hour')
    console.log(`✅ Hobby: ${activity} for ${duration} ${isHours ? 'hours' : 'minutes'}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'activity',
      activity,
      duration,
      unit: isHours ? 'hours' : 'minutes',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_hobby',
      message: `✅ Logged ${activity}: ${duration} ${isHours ? 'hours' : 'minutes'} in Hobbies domain`
    }
  }
  
  // ============================================
  // INSURANCE DOMAIN
  // ============================================
  
  // Insurance payment
  const insuranceMatch = lowerMessage.match(/(?:paid|pay)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:for\s+)?(?:insurance|premium)/)
  if (insuranceMatch && lowerMessage.includes('insurance')) {
    const amount = parseFloat(insuranceMatch[1])
    const type = lowerMessage.includes('health') ? 'health' :
                 lowerMessage.includes('car') || lowerMessage.includes('auto') ? 'auto' :
                 lowerMessage.includes('home') ? 'home' :
                 lowerMessage.includes('life') ? 'life' : 'other'
    console.log(`✅ Insurance: $${amount} (${type})`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'premium_payment',
      insuranceType: type,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'pay_insurance',
      message: `✅ Logged ${type} insurance payment: $${amount} in Insurance domain`
    }
  }
  
  // ============================================
  // LEGAL DOMAIN
  // ============================================
  
  // Document signing
  const legalDocMatch = lowerMessage.match(/(?:signed|signing)\s+(?:a\s+)?(.+?)\s+(?:document|contract|agreement)/)
  if (legalDocMatch) {
    const documentType = legalDocMatch[1].trim()
    console.log(`✅ Legal doc: ${documentType}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'document',
      documentType,
      action: 'signed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'sign_legal_doc',
      message: `✅ Logged signing of ${documentType} document in Legal domain`
    }
  }
  
  // ============================================
  // APPLIANCES DOMAIN
  // ============================================
  
  // Appliance maintenance
  const applianceMatch = lowerMessage.match(/(?:serviced|repaired|fixed|maintained)\s+(?:the\s+)?(.+?)(?:\s+for\s+\$)?(\d+)?/)
  if (applianceMatch && (lowerMessage.includes('washer') || lowerMessage.includes('dryer') || 
                          lowerMessage.includes('fridge') || lowerMessage.includes('refrigerator') ||
                          lowerMessage.includes('oven') || lowerMessage.includes('dishwasher') ||
                          lowerMessage.includes('ac') || lowerMessage.includes('air conditioner'))) {
    const appliance = applianceMatch[1].trim()
    const cost = applianceMatch[2] ? parseFloat(applianceMatch[2]) : null
    console.log(`✅ Appliance: ${appliance}${cost ? ` - $${cost}` : ''}`)
    
    await saveToSupabase(supabase, userId, 'appliances', {
      id: randomUUID(),
      type: 'maintenance',
      appliance,
      action: lowerMessage.includes('repaired') ? 'repair' : 
              lowerMessage.includes('fixed') ? 'repair' : 'maintenance',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_appliance',
      message: `✅ Logged ${appliance} maintenance${cost ? ` ($${cost})` : ''} in Appliances domain`
    }
  }
  
  // ============================================
  // DIGITAL LIFE DOMAIN
  // ============================================
  
  // Subscription
  const subscriptionMatch = lowerMessage.match(/(?:subscribed|subscribing|signed\s+up)\s+(?:to|for)\s+(.+?)(?:\s+for\s+\$)?(\d+(?:\.\d+)?)?(?:\s+per\s+month)?/)
  if (subscriptionMatch && (lowerMessage.includes('subscription') || lowerMessage.includes('subscribed'))) {
    const service = subscriptionMatch[1].trim()
    const cost = subscriptionMatch[2] ? parseFloat(subscriptionMatch[2]) : null
    console.log(`✅ Subscription: ${service}${cost ? ` - $${cost}/mo` : ''}`)
    
    await saveToSupabase(supabase, userId, 'digital', {
      id: randomUUID(),
      type: 'subscription',
      service,
      cost,
      frequency: 'monthly',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_subscription',
      message: `✅ Added subscription: ${service}${cost ? ` ($${cost}/mo)` : ''} in Digital-Life domain`
    }
  }
  
  // ============================================
  // HOME/UTILITIES DOMAIN
  // ============================================
  
  // Utility bill
  const utilityMatch = lowerMessage.match(/(?:paid|pay)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:for\s+)?(?:electric|electricity|gas|water|internet|utility)/)
  if (utilityMatch && (lowerMessage.includes('bill') || lowerMessage.includes('utility'))) {
    const amount = parseFloat(utilityMatch[1])
    const utilityType = lowerMessage.includes('electric') ? 'electricity' :
                        lowerMessage.includes('gas') ? 'gas' :
                        lowerMessage.includes('water') ? 'water' :
                        lowerMessage.includes('internet') ? 'internet' : 'utility'
    console.log(`✅ Utility: $${amount} (${utilityType})`)
    
    await saveToSupabase(supabase, userId, 'home', {
      id: randomUUID(),
      type: 'utility_payment',
      itemType: 'bill',
      category: 'utilities',
      utilityType,
      utilityName: utilityType,
      serviceName: utilityType,
      amount,
      monthlyCost: amount,
      cost: amount,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'pay_utility',
      message: `✅ Logged ${utilityType} bill: $${amount} in Home domain`
    }
  }
  
  // ============================================
  // VEHICLES DOMAIN
  // ============================================
  
  // Mileage Update
  const mileageMatch = lowerMessage.match(/(?:car|vehicle|honda|toyota|ford|chevrolet|chevy|bmw|mercedes|audi|lexus|nissan|mazda|subaru|volkswagen|vw|jeep|dodge|ram|tesla)?\s*(?:has|at|is|reached|hit)?\s*(\d{1,6})(?:,\d{3})?\s*(?:thousand|k|miles?|mi|km|kilometers?)/)
  if (mileageMatch && (lowerMessage.includes('mile') || lowerMessage.includes('km') || lowerMessage.includes('odometer'))) {
    let mileage = parseInt(mileageMatch[1].replace(',', ''))
    if (lowerMessage.includes('thousand') || lowerMessage.includes('k')) {
      mileage = mileage * 1000
    }
    const unit = lowerMessage.includes('km') || lowerMessage.includes('kilometer') ? 'km' : 'miles'
    
    console.log(`✅ Mileage: ${mileage} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'mileage_update',
      currentMileage: mileage,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mileage',
      message: `✅ Updated vehicle mileage: ${mileage.toLocaleString()} ${unit} in Vehicles domain`
    }
  }
  
  // Fuel/Gas Fill-up
  const fuelMatch = lowerMessage.match(/(?:filled|fill|got|bought|pumped)?\s*(?:up|tank|gas)?\s*(\d+(?:\.\d+)?)\s*(?:gallons?|gal|liters?|l)(?:\s+(?:for|at|cost))?\s*\$?(\d+(?:\.\d+)?)/)
  if (fuelMatch && (lowerMessage.includes('gas') || lowerMessage.includes('fuel') || lowerMessage.includes('fill'))) {
    const gallons = parseFloat(fuelMatch[1])
    const cost = parseFloat(fuelMatch[2])
    const unit = lowerMessage.includes('liter') ? 'liters' : 'gallons'
    
    console.log(`✅ Fuel: ${gallons} ${unit} for $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'fuel_purchase',
      gallons,
      cost,
      unit,
      pricePerUnit: cost / gallons,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_fuel',
      message: `✅ Logged fuel purchase: ${gallons} ${unit} for $${cost} in Vehicles domain`
    }
  }
  
  // Oil Change
  const oilChangeMatch = lowerMessage.match(/oil\s*change(?:\s+(?:at|done|completed|finished))?\s*(?:at)?\s*(\d{1,6})(?:k|,000)?\s*miles?|oil\s*change.*?\$(\d+)/)
  if (oilChangeMatch) {
    const mileage = oilChangeMatch[1] ? parseInt(oilChangeMatch[1].replace('k', '000').replace(',', '')) : null
    const cost = oilChangeMatch[2] ? parseFloat(oilChangeMatch[2]) : null
    
    // Try to extract cost if not found
    const costMatch = lowerMessage.match(/\$(\d+(?:\.\d+)?)/)
    const finalCost = cost || (costMatch ? parseFloat(costMatch[1]) : null)
    
    console.log(`✅ Oil change at ${mileage || 'unknown'} miles, cost: $${finalCost || 'unknown'}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType: 'oil_change',
      mileage,
      cost: finalCost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged oil change${mileage ? ` at ${mileage.toLocaleString()} miles` : ''}${finalCost ? ` for $${finalCost}` : ''} in Vehicles domain`
    }
  }
  
  // Tire Rotation
  const tireMatch = lowerMessage.match(/tire\s*(?:rotation|rotated|service).*?\$?(\d+)/)
  if (tireMatch) {
    const cost = parseFloat(tireMatch[1])
    
    console.log(`✅ Tire rotation: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType: 'tire_rotation',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged tire rotation: $${cost} in Vehicles domain`
    }
  }
  
  // General Vehicle Maintenance/Repair
  const vehicleServiceMatch = lowerMessage.match(/(?:brake|transmission|alignment|battery|alternator|starter|radiator|suspension|exhaust|muffler|catalytic|tune.?up|inspection|smog)\s*(?:service|repair|replacement|check|maintenance|done|completed|fixed)?.*?\$?(\d+)/)
  if (vehicleServiceMatch) {
    const cost = parseFloat(vehicleServiceMatch[1])
    const serviceType = vehicleServiceMatch[0].split('$')[0].trim()
    
    console.log(`✅ Vehicle service: ${serviceType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged ${serviceType}: $${cost} in Vehicles domain`
    }
  }
  
  // Vehicle Registration
  const registrationMatch = lowerMessage.match(/(?:registration|reg|dmv)(?:\s+(?:expires|renewed|due|paid))?\s*(?:in)?\s*([a-z]+)?\s*(\d{4})/)
  if (registrationMatch && (lowerMessage.includes('registration') || lowerMessage.includes('dmv'))) {
    const month = registrationMatch[1] || null
    const year = registrationMatch[2] ? parseInt(registrationMatch[2]) : null
    const costMatch = lowerMessage.match(/\$(\d+)/)
    const cost = costMatch ? parseFloat(costMatch[1]) : null
    
    console.log(`✅ Registration ${month ? month + ' ' : ''}${year || ''} ${cost ? '$' + cost : ''}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'registration',
      expiryMonth: month,
      expiryYear: year,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_registration',
      message: `✅ Logged vehicle registration${year ? ' expires ' + (month || '') + ' ' + year : ''}${cost ? ' - $' + cost : ''} in Vehicles domain`
    }
  }
  
  // Car Wash/Detailing
  const carWashMatch = lowerMessage.match(/(?:car\s*wash|detail|detailing|cleaned\s*car).*?\$?(\d+)/)
  if (carWashMatch) {
    const cost = parseFloat(carWashMatch[1])
    const isDetailing = lowerMessage.includes('detail')
    
    console.log(`✅ Car ${isDetailing ? 'detailing' : 'wash'}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'car_wash',
      serviceType: isDetailing ? 'detailing' : 'wash',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_car_wash',
      message: `✅ Logged car ${isDetailing ? 'detailing' : 'wash'}: $${cost} in Vehicles domain`
    }
  }
  
  // Vehicle Purchase
  const vehiclePurchaseMatch = lowerMessage.match(/(?:bought|purchased|got|acquired)\s+(?:a\s+)?(?:(\d{4})\s+)?([a-z]+\s+[a-z]+)(?:\s+for)?\s+\$?(\d+(?:,\d{3})*(?:k|thousand)?)/)
  if (vehiclePurchaseMatch && (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('truck') || lowerMessage.includes('suv'))) {
    const year = vehiclePurchaseMatch[1] ? parseInt(vehiclePurchaseMatch[1]) : null
    const makeModel = vehiclePurchaseMatch[2]
    const priceStr = vehiclePurchaseMatch[3].replace(/,/g, '')
    let price: string
    if (priceStr.includes('k') || priceStr.includes('thousand')) {
      price = (parseInt(priceStr) * 1000).toString()
    } else {
      price = parseFloat(priceStr).toString()
    }
    
    console.log(`✅ Vehicle purchase: ${year || ''} ${makeModel} for $${price}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'vehicle_purchase',
      year,
      makeModel,
      purchasePrice: price,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vehicle_purchase',
      message: `✅ Logged vehicle purchase: ${year || ''} ${makeModel} for $${price.toLocaleString()} in Vehicles domain`
    }
  }
  
  // ============================================
  // PROPERTY DOMAIN
  // ============================================
  
  // Home Value
  const homeValueMatch = lowerMessage.match(/(?:house|home|property)(?:\s+is)?(?:\s+worth|valued|appraised|value)?\s+\$?(\d+(?:,\d{3})*(?:k|thousand)?)/)
  if (homeValueMatch && !lowerMessage.includes('insurance')) {
    const tempValue = homeValueMatch[1].replace(/,/g, '')
    let value: string
    if (tempValue.includes('k') || tempValue.includes('thousand')) {
      value = (parseInt(tempValue) * 1000).toString()
    } else {
      value = parseFloat(tempValue).toString()
    }

    console.log(`✅ Home value: $${value}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'home_value',
      value,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_home_value',
      message: `✅ Logged home value: $${value.toLocaleString()} in Property domain`
    }
  }
  
  // Mortgage Payment
  const mortgageMatch = lowerMessage.match(/(?:mortgage|home\s*loan)(?:\s+payment)?\s+\$?(\d+(?:,\d{3})*)/)
  if (mortgageMatch) {
    const amount = parseFloat(mortgageMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Mortgage payment: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'mortgage_payment',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mortgage',
      message: `✅ Logged mortgage payment: $${amount.toLocaleString()} in Property domain`
    }
  }
  
  // Property Tax
  const propertyTaxMatch = lowerMessage.match(/property\s*tax(?:es)?(?:\s+bill)?\s+\$?(\d+(?:,\d{3})*)(?:\s+(annually|yearly|quarterly|monthly))?/)
  if (propertyTaxMatch) {
    const amount = parseFloat(propertyTaxMatch[1].replace(/,/g, ''))
    const frequency = propertyTaxMatch[2] || 'annually'
    
    console.log(`✅ Property tax: $${amount} ${frequency}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'property_tax',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_property_tax',
      message: `✅ Logged property tax: $${amount.toLocaleString()} ${frequency} in Property domain`
    }
  }
  
  // Square Footage
  const squareFootageMatch = lowerMessage.match(/(?:house|home)(?:\s+is)?\s+(\d+(?:,\d{3})?)\s*(?:square|sq)\s*(?:feet|ft)/)
  if (squareFootageMatch) {
    const sqft = parseInt(squareFootageMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Square footage: ${sqft} sq ft`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'property_info',
      squareFootage: sqft,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_square_footage',
      message: `✅ Logged square footage: ${sqft.toLocaleString()} sq ft in Property domain`
    }
  }
  
  // HOA Fees
  const hoaMatch = lowerMessage.match(/(?:hoa|homeowners\s*association)(?:\s+fee)?\s+\$?(\d+)(?:\s*\/?\s*(month|monthly|year|annually))?/)
  if (hoaMatch) {
    const amount = parseFloat(hoaMatch[1])
    const frequency = hoaMatch[2] || 'monthly'
    
    console.log(`✅ HOA fee: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'hoa_fee',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_hoa',
      message: `✅ Logged HOA fee: $${amount}/${frequency} in Property domain`
    }
  }
  
  // Home Purchase
  const homePurchaseMatch = lowerMessage.match(/(?:bought|purchased)\s+(?:house|home)(?:\s+in)?\s+(\d{4})(?:\s+for)?\s+\$?(\d+(?:,\d{3})*(?:k)?)/)
  if (homePurchaseMatch) {
    const year = parseInt(homePurchaseMatch[1])
    const tempPrice = homePurchaseMatch[2].replace(/,/g, '')
    let price: string
    if (tempPrice.includes('k')) {
      price = (parseInt(tempPrice) * 1000).toString()
    } else {
      price = parseFloat(tempPrice).toString()
    }

    console.log(`✅ Home purchase: ${year} for $${price}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'home_purchase',
      purchaseYear: year,
      purchasePrice: price,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_home_purchase',
      message: `✅ Logged home purchase in ${year} for $${price.toLocaleString()} in Property domain`
    }
  }
  
  // ============================================
  // PETS DOMAIN
  // ============================================
  
  // Pet Feeding
  const petFeedingMatch = lowerMessage.match(/(?:fed|feed|gave\s+food)\s+([a-z]+)/)
  if (petFeedingMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const petName = petFeedingMatch[1]
    const timeMatch = lowerMessage.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
    const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3] || ''}` : new Date().toLocaleTimeString()
    
    console.log(`✅ Fed ${petName} at ${time}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'feeding',
      petName,
      time,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_feeding',
      message: `✅ Logged feeding for ${petName} in Pets domain`
    }
  }
  
  // Pet Vet Expense with Dollar Amount (NEW - More specific pattern)
  const petVetCostMatch = lowerMessage.match(/([a-z]+)\s+(?:had|went to|got|has)\s+(?:a\s+)?vet(?:\s+appointment|\s+visit)?(?:\s+for)?\s+\$(\d+)/)
  if (petVetCostMatch) {
    const petName = petVetCostMatch[1]
    const amount = parseFloat(petVetCostMatch[2])
    
    console.log(`✅ [REGEX FALLBACK] Pet vet expense: ${petName} - $${amount}`)
    
    // Find the pet in database
    const { data: pets } = await supabase
      .from('pets')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', petName)
      .limit(1)
    
    if (pets && pets.length > 0) {
      const pet = pets[0]
      console.log(`✅ [REGEX] Found pet: ${pet.name}`)
      
      // Save directly to pet_costs table
      const { error: costError } = await supabase
        .from('pet_costs')
        .insert({
          id: randomUUID(),
          user_id: userId,
          pet_id: pet.id,
          cost_type: 'vet',
          amount,
          date: new Date().toISOString().split('T')[0],
          description: 'Vet visit',
          vendor: null
        })
      
      if (!costError) {
        console.log(`✅ [REGEX] Saved $${amount} to pet_costs for ${pet.name}`)
        
        return {
          isCommand: true,
          action: 'save_pet_cost',
          message: `✅ Logged $${amount} vet cost for ${pet.name}`
        }
      } else {
        console.error('❌ [REGEX] Failed to save to pet_costs:', costError)
      }
    } else {
      console.log(`⚠️ [REGEX] Pet '${petName}' not found`)
    }
  }
  
  // Vet Appointment with Time (OLD pattern - keep for time-based appointments)
  const vetMatch = lowerMessage.match(/vet(?:\s+appointment)?(?:\s+(?:tomorrow|today|on|for))?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (vetMatch) {
    const time = `${vetMatch[1]}:${vetMatch[2] || '00'} ${vetMatch[3] || ''}`
    const costMatch = lowerMessage.match(/\$(\d+)/)
    const cost = costMatch ? parseFloat(costMatch[1]) : null
    
    console.log(`✅ Vet appointment at ${time}${cost ? ' - $' + cost : ''}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'vet_appointment',
      time,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vet_appointment',
      message: `✅ Logged vet appointment at ${time}${cost ? ' for $' + cost : ''} in Pets domain`
    }
  }
  
  // Pet Vaccination
  const vaccinationMatch = lowerMessage.match(/(?:rabies|vaccine|vaccination|shot)(?:\s+(?:expires|due))?\s*(\d{4})/)
  if (vaccinationMatch && (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat'))) {
    const year = parseInt(vaccinationMatch[1])
    const vaccineType = lowerMessage.includes('rabies') ? 'rabies' : 'general'
    
    console.log(`✅ ${vaccineType} vaccination expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'vaccination',
      vaccineType,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vaccination',
      message: `✅ Logged ${vaccineType} vaccination (expires ${year}) in Pets domain`
    }
  }
  
  // Pet Medication
  const petMedicationMatch = lowerMessage.match(/(?:flea|heartworm|pain|antibiotic)\s*(?:medication|medicine|treatment|prevention)(?:\s+monthly)?\s*\$?(\d+)?/)
  if (petMedicationMatch && (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat'))) {
    const medicationType = petMedicationMatch[0].split(/\s/)[0]
    const cost = petMedicationMatch[1] ? parseFloat(petMedicationMatch[1]) : null
    const isMonthly = lowerMessage.includes('monthly')
    
    console.log(`✅ Pet medication: ${medicationType}${cost ? ' $' + cost : ''}${isMonthly ? ' monthly' : ''}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'medication',
      medicationType,
      cost,
      frequency: isMonthly ? 'monthly' : 'as_needed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_medication',
      message: `✅ Logged ${medicationType} medication${cost ? ' $' + cost : ''}${isMonthly ? ' monthly' : ''} in Pets domain`
    }
  }
  
  // Pet Weight
  const petWeightMatch = lowerMessage.match(/([a-z]+)?\s*(?:weighs?|weight)?\s+(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)/)
  if (petWeightMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const petName = petWeightMatch[1] || 'pet'
    const weight = parseFloat(petWeightMatch[2])
    
    console.log(`✅ Pet weight: ${petName} - ${weight} lbs`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'weight',
      petName,
      weight,
      unit: 'lbs',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_weight',
      message: `✅ Logged ${petName} weight: ${weight} lbs in Pets domain`
    }
  }
  
  // Pet Grooming
  const groomingMatch = lowerMessage.match(/(?:grooming|groomed|bath|haircut).*?\$?(\d+)/)
  if (groomingMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const cost = parseFloat(groomingMatch[1])
    const serviceType = lowerMessage.includes('haircut') ? 'haircut' : lowerMessage.includes('bath') ? 'bath' : 'grooming'
    
    console.log(`✅ Pet ${serviceType}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'grooming',
      serviceType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_grooming',
      message: `✅ Logged pet ${serviceType}: $${cost} in Pets domain`
    }
  }
  
  // Pet Supplies Purchase
  const petSuppliesMatch = lowerMessage.match(/(?:bought|purchased)\s+(?:dog|cat|pet)\s+(?:food|toy|collar|leash|bed|bowl|treats?).*?\$?(\d+)/)
  if (petSuppliesMatch) {
    const cost = parseFloat(petSuppliesMatch[1])
    const itemType = petSuppliesMatch[0].match(/(food|toy|collar|leash|bed|bowl|treat)/)?.[1] || 'supplies'
    
    console.log(`✅ Pet ${itemType}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'supplies',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_supplies',
      message: `✅ Logged pet ${itemType} purchase: $${cost} in Pets domain`
    }
  }
  
  // ============================================
  // MINDFULNESS DOMAIN
  // ============================================
  
  // Meditation
  const meditationMatch = lowerMessage.match(/(?:meditated|meditation|meditate)(?:\s+for)?\s+(\d+)\s*(?:minutes?|min|hours?|hr)/)
  if (meditationMatch) {
    let duration = parseInt(meditationMatch[1])
    if (lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    const meditationType = lowerMessage.includes('guided') ? 'guided' : lowerMessage.includes('breathing') ? 'breathing' : 'general'
    
    console.log(`✅ Meditation: ${duration} min (${meditationType})`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'meditation',
      duration,
      meditationType,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_meditation',
      message: `✅ Logged ${meditationType} meditation: ${duration} minutes in Mindfulness domain`
    }
  }
  
  // Breathing Exercise
  const breathingMatch = lowerMessage.match(/breathing\s*(?:exercise|practice)?\s*(\d+)?\s*(?:minutes?|min)?/)
  if (breathingMatch && lowerMessage.includes('breathing')) {
    const duration = breathingMatch[1] ? parseInt(breathingMatch[1]) : 5
    const breathingType = lowerMessage.includes('box') ? 'box breathing' : lowerMessage.includes('deep') ? 'deep breathing' : 'breathing exercise'
    
    console.log(`✅ ${breathingType}: ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'breathing',
      breathingType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_breathing',
      message: `✅ Logged ${breathingType}: ${duration} minutes in Mindfulness domain`
    }
  }
  
  // Mood Check-in
  const moodCheckMatch = lowerMessage.match(/(?:feeling|mood|emotional\s*state)(?:\s+is)?(?:\s+)?(calm|peaceful|anxious|stressed|content|happy|sad|angry|worried|excited|grateful|tired|energized)/)
  if (moodCheckMatch && (lowerMessage.includes('feeling') || lowerMessage.includes('mood'))) {
    const mood = moodCheckMatch[1]
    
    console.log(`✅ Mood check-in: ${mood}`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'mood_checkin',
      mood,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mood_checkin',
      message: `✅ Logged mood: ${mood} in Mindfulness domain`
    }
  }
  
  // Journaling
  const journalingMatch = lowerMessage.match(/(?:journaled|journaling|wrote\s*journal)(?:\s+for)?\s*(\d+)?\s*(?:minutes?|min)?/)
  if (journalingMatch) {
    const duration = journalingMatch[1] ? parseInt(journalingMatch[1]) : null
    const journalType = lowerMessage.includes('gratitude') ? 'gratitude' : 'general'
    
    console.log(`✅ Journaling: ${journalType}${duration ? ' ' + duration + ' min' : ''}`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'journaling',
      journalType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_journaling',
      message: `✅ Logged ${journalType} journaling${duration ? ': ' + duration + ' minutes' : ''} in Mindfulness domain`
    }
  }
  
  // Gratitude Practice
  const gratitudeMatch = lowerMessage.match(/grateful\s*(?:for|about)?/)
  if (gratitudeMatch && lowerMessage.includes('grateful')) {
    const gratitudeNote = lowerMessage.replace(/grateful\s*(?:for|about)?\s*/i, '').trim()
    
    console.log(`✅ Gratitude practice`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'gratitude',
      note: gratitudeNote,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gratitude',
      message: `✅ Logged gratitude practice in Mindfulness domain`
    }
  }
  
  // Stress Level
  const stressMatch = lowerMessage.match(/stress(?:\s+level)?(?:\s+is)?(?:\s+)?(\d+)(?:\s*\/\s*10)?/)
  if (stressMatch) {
    const stressLevel = parseInt(stressMatch[1])
    
    console.log(`✅ Stress level: ${stressLevel}/10`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'stress_level',
      level: stressLevel,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_stress_level',
      message: `✅ Logged stress level: ${stressLevel}/10 in Mindfulness domain`
    }
  }
  
  // ============================================
  // RELATIONSHIPS DOMAIN
  // ============================================
  
  // Birthday/Important Date
  const birthdayMatch = lowerMessage.match(/([a-z]+)(?:'s)?\s+birthday\s+(?:is\s+)?([a-z]+)\s+(\d{1,2})/)
  if (birthdayMatch) {
    const personName = birthdayMatch[1]
    const month = birthdayMatch[2]
    const day = parseInt(birthdayMatch[3])
    
    console.log(`✅ Birthday: ${personName} - ${month} ${day}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'birthday',
      personName,
      month,
      day,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_birthday',
      message: `✅ Logged ${personName}'s birthday: ${month} ${day} in Relationships domain`
    }
  }
  
  // Anniversary
  const anniversaryMatch = lowerMessage.match(/anniversary\s+(?:is\s+)?([a-z]+)\s+(\d{1,2})/)
  if (anniversaryMatch) {
    const month = anniversaryMatch[1]
    const day = parseInt(anniversaryMatch[2])
    
    console.log(`✅ Anniversary: ${month} ${day}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'anniversary',
      month,
      day,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_anniversary',
      message: `✅ Logged anniversary: ${month} ${day} in Relationships domain`
    }
  }
  
  // Gift Purchase
  const giftMatch = lowerMessage.match(/(?:bought|purchased)\s+gift\s+(?:for\s+)?([a-z]+).*?\$?(\d+)/)
  if (giftMatch) {
    const personName = giftMatch[1]
    const amount = parseFloat(giftMatch[2])
    
    console.log(`✅ Gift for ${personName}: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'gift',
      personName,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gift',
      message: `✅ Logged gift for ${personName}: $${amount} in Relationships domain`
    }
  }
  
  // ============================================
  // CAREER DOMAIN
  // ============================================
  
  // Salary/Income
  const salaryMatch = lowerMessage.match(/(?:salary|annual\s*income|hourly\s*rate)(?:\s+is)?(?:\s+)?\$?(\d+(?:,\d{3})*(?:k)?)(?:\s*\/?\s*(year|annually|hour|hourly))?/)
  if (salaryMatch && !lowerMessage.includes('bonus')) {
    const tempAmount = salaryMatch[1].replace(/,/g, '')
    let amount: string
    if (tempAmount.includes('k')) {
      amount = (parseInt(tempAmount) * 1000).toString()
    } else {
      amount = parseFloat(tempAmount).toString()
    }
    const frequency = salaryMatch[2] || 'year'
    const isHourly = frequency.includes('hour')
    
    console.log(`✅ ${isHourly ? 'Hourly rate' : 'Salary'}: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: isHourly ? 'hourly_rate' : 'salary',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_salary',
      message: `✅ Logged ${isHourly ? 'hourly rate' : 'salary'}: $${amount.toLocaleString()}/${frequency} in Career domain`
    }
  }
  
  // Promotion/Raise
  const promotionMatch = lowerMessage.match(/(?:promoted|promotion)(?:\s+to)?\s+([a-z\s]+?)(?:\s+|$)|(?:got|received)\s+raise(?:\s+to)?\s+\$?(\d+(?:,\d{3})*k?)/)
  if (promotionMatch) {
    const newTitle = promotionMatch[1] ? promotionMatch[1].trim() : null
    const newSalary = promotionMatch[2] ? parseFloat(promotionMatch[2].replace(/,|k/g, '')) * (promotionMatch[2].includes('k') ? 1000 : 1) : null
    
    console.log(`✅ Promotion${newTitle ? ': ' + newTitle : ''}${newSalary ? ' - $' + newSalary : ''}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'promotion',
      newTitle,
      newSalary,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_promotion',
      message: `✅ Logged promotion${newTitle ? ': ' + newTitle : ''}${newSalary ? ' - $' + newSalary.toLocaleString() : ''} in Career domain`
    }
  }
  
  // Work Hours
  const workHoursMatch = lowerMessage.match(/worked\s+(\d+)\s*hours?(?:\s+(?:this\s+week|today|yesterday))?/)
  if (workHoursMatch) {
    const hours = parseInt(workHoursMatch[1])
    const period = lowerMessage.includes('week') ? 'week' : lowerMessage.includes('yesterday') ? 'yesterday' : 'today'
    
    console.log(`✅ Work hours: ${hours} hours (${period})`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'work_hours',
      hours,
      period,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_work_hours',
      message: `✅ Logged ${hours} work hours (${period}) in Career domain`
    }
  }
  
  // Bonus
  const bonusMatch = lowerMessage.match(/(?:received|got)\s+bonus\s+\$?(\d+(?:,\d{3})*(?:k)?)/)
  if (bonusMatch) {
    const tempAmount = bonusMatch[1].replace(/,/g, '')
    let amount: string
    if (tempAmount.includes('k')) {
      amount = (parseInt(tempAmount) * 1000).toString()
    } else {
      amount = parseFloat(tempAmount).toString()
    }

    console.log(`✅ Bonus: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'bonus',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_bonus',
      message: `✅ Logged bonus: $${amount.toLocaleString()} in Career domain`
    }
  }
  
  // Certification/Skill
  const certificationMatch = lowerMessage.match(/(?:learned|completed|earned|got)\s+([a-z0-9\s\+]+?)\s*(?:certification|cert|training|course)/)
  if (certificationMatch && !lowerMessage.includes('dog') && !lowerMessage.includes('pet')) {
    const certName = certificationMatch[1].trim()
    
    console.log(`✅ Certification: ${certName}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'certification',
      name: certName,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_certification',
      message: `✅ Logged ${certName} certification in Career domain`
    }
  }
  
  // ============================================
  // EDUCATION DOMAIN
  // ============================================
  
  // Grades
  const gradeMatch = lowerMessage.match(/(?:got|received|earned)\s+([a-f][\+\-]?|\d+%)\s+(?:in|on|for)?/)
  if (gradeMatch && (lowerMessage.includes('class') || lowerMessage.includes('exam') || lowerMessage.includes('test'))) {
    const grade = gradeMatch[1].toUpperCase()
    
    console.log(`✅ Grade: ${grade}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'grade',
      grade,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_grade',
      message: `✅ Logged grade: ${grade} in Education domain`
    }
  }
  
  // Tuition Payment
  const tuitionMatch = lowerMessage.match(/(?:paid|tuition|semester\s*fees?)\s+\$?(\d+(?:,\d{3})*)/)
  if (tuitionMatch && (lowerMessage.includes('tuition') || lowerMessage.includes('semester') || lowerMessage.includes('fees'))) {
    const amount = parseFloat(tuitionMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Tuition: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'tuition',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_tuition',
      message: `✅ Logged tuition payment: $${amount.toLocaleString()} in Education domain`
    }
  }
  
  // Credits Completed
  const creditsMatch = lowerMessage.match(/completed\s+(\d+)\s*credits?/)
  if (creditsMatch) {
    const credits = parseInt(creditsMatch[1])
    
    console.log(`✅ Credits: ${credits}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'credits',
      credits,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_credits',
      message: `✅ Logged ${credits} credits completed in Education domain`
    }
  }
  
  // ============================================
  // LEGAL DOMAIN
  // ============================================
  
  // Document Signing
  const signedDocMatch = lowerMessage.match(/signed\s+(lease|contract|agreement|will|trust|power\s*of\s*attorney)/)
  if (signedDocMatch) {
    const docType = signedDocMatch[1]
    
    console.log(`✅ Signed ${docType}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'document',
      documentType: docType,
      action: 'signed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_legal_document',
      message: `✅ Logged signed ${docType} in Legal domain`
    }
  }
  
  // Legal Fees
  const legalFeeMatch = lowerMessage.match(/(?:attorney|lawyer|legal)(?:\s+fee|\s+consultation)?\s+\$?(\d+(?:,\d{3})*)/)
  if (legalFeeMatch) {
    const amount = parseFloat(legalFeeMatch[1].replace(/,/g, ''))
    const serviceType = lowerMessage.includes('consultation') ? 'consultation' : 'legal service'
    
    console.log(`✅ Legal fee: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'legal_fee',
      serviceType,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_legal_fee',
      message: `✅ Logged legal fee: $${amount} in Legal domain`
    }
  }
  
  // License Expiration
  const licenseMatch = lowerMessage.match(/(?:drivers?|professional)\s*license\s*(?:expires|renewed)?\s*(\d{4})/)
  if (licenseMatch) {
    const year = parseInt(licenseMatch[1])
    const licenseType = lowerMessage.includes('professional') ? 'professional' : 'drivers'
    
    console.log(`✅ ${licenseType} license expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'license',
      licenseType,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_license',
      message: `✅ Logged ${licenseType} license (expires ${year}) in Legal domain`
    }
  }
  
  // ============================================
  // INSURANCE DOMAIN
  // ============================================
  
  // Insurance Premium
  const insurancePremiumMatch = lowerMessage.match(/(?:(health|car|auto|life|dental|vision|home|homeowners|disability)\s+)?insurance(?:\s+premium)?\s+\$?(\d+(?:,\d{3})*)(?:\s*\/?\s*(month|monthly|year|annually))?/)
  if (insurancePremiumMatch && !lowerMessage.includes('claim')) {
    const insuranceType = insurancePremiumMatch[1] || 'general'
    const amount = parseFloat(insurancePremiumMatch[2].replace(/,/g, ''))
    const frequency = insurancePremiumMatch[3] || 'monthly'
    
    console.log(`✅ ${insuranceType} insurance: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'premium',
      insuranceType,
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_premium',
      message: `✅ Logged ${insuranceType} insurance premium: $${amount}/${frequency} in Insurance domain`
    }
  }
  
  // Insurance Claim
  const claimMatch = lowerMessage.match(/filed\s+claim\s+(?:for\s+)?\$?(\d+(?:,\d{3})*)/)
  if (claimMatch) {
    const amount = parseFloat(claimMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Insurance claim: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'claim',
      amount,
      status: 'filed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_claim',
      message: `✅ Logged insurance claim: $${amount} in Insurance domain`
    }
  }
  
  // Insurance Coverage/Deductible
  const coverageMatch = lowerMessage.match(/(?:deductible|out.?of.?pocket\s+max|coverage\s+limit)\s+\$?(\d+(?:,\d{3})*)/)
  if (coverageMatch) {
    const amount = parseFloat(coverageMatch[1].replace(/,/g, ''))
    const coverageType = lowerMessage.includes('deductible') ? 'deductible' : lowerMessage.includes('out') ? 'out_of_pocket_max' : 'coverage_limit'
    
    console.log(`✅ Insurance ${coverageType}: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'coverage',
      coverageType,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_coverage',
      message: `✅ Logged insurance ${coverageType}: $${amount.toLocaleString()} in Insurance domain`
    }
  }
  
  // Insurance Renewal
  const renewalMatch = lowerMessage.match(/insurance\s+(?:renews|expires)\s+([a-z]+)\s*(\d{4})/)
  if (renewalMatch) {
    const month = renewalMatch[1]
    const year = parseInt(renewalMatch[2])
    
    console.log(`✅ Insurance renewal: ${month} ${year}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'renewal',
      renewalMonth: month,
      renewalYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_renewal',
      message: `✅ Logged insurance renewal: ${month} ${year} in Insurance domain`
    }
  }
  
  // ============================================
  // TRAVEL DOMAIN
  // ============================================
  
  // Hotel Booking
  const hotelMatch = lowerMessage.match(/(?:booked|hotel|airbnb).*?(\d+)\s*nights?.*?\$?(\d+(?:,\d{3})*)/)
  if (hotelMatch && (lowerMessage.includes('hotel') || lowerMessage.includes('airbnb') || lowerMessage.includes('booked'))) {
    const nights = parseInt(hotelMatch[1])
    const cost = parseFloat(hotelMatch[2].replace(/,/g, ''))
    const accommodationType = lowerMessage.includes('airbnb') ? 'airbnb' : 'hotel'
    
    console.log(`✅ ${accommodationType}: ${nights} nights for $${cost}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'accommodation',
      accommodationType,
      nights,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_accommodation',
      message: `✅ Logged ${accommodationType}: ${nights} nights for $${cost} in Travel domain`
    }
  }
  
  // Passport Expiration
  const passportMatch = lowerMessage.match(/passport\s+expires\s+(\d{4})/)
  if (passportMatch) {
    const year = parseInt(passportMatch[1])
    
    console.log(`✅ Passport expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'passport',
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_passport',
      message: `✅ Logged passport expiration: ${year} in Travel domain`
    }
  }
  
  // Airline Miles/Points
  const milesMatch = lowerMessage.match(/(?:earned|redeemed)\s+(\d+(?:,\d{3})?)\s*(?:airline\s+)?(?:miles?|points?)/)
  if (milesMatch && (lowerMessage.includes('airline') || lowerMessage.includes('miles') || lowerMessage.includes('points'))) {
    const miles = parseInt(milesMatch[1].replace(/,/g, ''))
    const action = lowerMessage.includes('earned') ? 'earned' : 'redeemed'
    
    console.log(`✅ ${action} ${miles} miles`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'airline_miles',
      action,
      miles,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_airline_miles',
      message: `✅ Logged ${action} ${miles.toLocaleString()} airline miles in Travel domain`
    }
  }
  
  // ============================================
  // HOBBIES DOMAIN
  // ============================================
  
  // Music Practice
  const musicMatch = lowerMessage.match(/played\s+(guitar|piano|drums|violin|bass|keyboard|saxophone|flute|trumpet|cello)\s+(\d+)?\s*(?:hour|hr|minute|min)/)
  if (musicMatch) {
    const instrument = musicMatch[1]
    let duration = musicMatch[2] ? parseInt(musicMatch[2]) : 30
    if (lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    
    console.log(`✅ Played ${instrument}: ${duration} minutes`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'music',
      instrument,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_music_practice',
      message: `✅ Logged ${instrument} practice: ${duration} minutes in Hobbies domain`
    }
  }
  
  // Art/Creative
  const artMatch = lowerMessage.match(/(?:painted|drawing|sketched|sculpted|crafted)(?:\s+for)?\s*(\d+)?\s*(?:hour|hr|minute|min)?/)
  if (artMatch && !lowerMessage.includes('house') && !lowerMessage.includes('room')) {
    const activityType = lowerMessage.includes('painted') ? 'painting' : lowerMessage.includes('drawing') ? 'drawing' : lowerMessage.includes('sketch') ? 'sketching' : 'art'
    let duration = artMatch[1] ? parseInt(artMatch[1]) : null
    if (duration && lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    
    console.log(`✅ ${activityType}${duration ? ': ' + duration + ' min' : ''}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'art',
      activityType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_art_activity',
      message: `✅ Logged ${activityType}${duration ? ': ' + duration + ' minutes' : ''} in Hobbies domain`
    }
  }
  
  // Reading
  const readingMatch = lowerMessage.match(/read(?:ing)?\s+(\d+)\s*(?:pages?|hours?|minutes?)/)
  if (readingMatch) {
    const amount = parseInt(readingMatch[1])
    const unit = lowerMessage.includes('page') ? 'pages' : lowerMessage.includes('hour') ? 'hours' : 'minutes'
    
    console.log(`✅ Reading: ${amount} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'reading',
      amount,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_reading',
      message: `✅ Logged reading: ${amount} ${unit} in Hobbies domain`
    }
  }
  
  // Equipment Purchase (for hobbies)
  const hobbyEquipmentMatch = lowerMessage.match(/bought\s+(?:new\s+)?(camera|guitar|lens|keyboard|easel|art\s*supplies|paints?|canvas).*?\$?(\d+(?:,\d{3})*)/)
  if (hobbyEquipmentMatch) {
    const itemType = hobbyEquipmentMatch[1]
    const cost = parseFloat(hobbyEquipmentMatch[2].replace(/,/g, ''))
    
    console.log(`✅ Hobby equipment: ${itemType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'equipment',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_hobby_equipment',
      message: `✅ Logged ${itemType} purchase: $${cost} in Hobbies domain`
    }
  }
  
  // ============================================
  // COLLECTIBLES DOMAIN
  // ============================================
  
  // Collectible Purchase
  const collectibleMatch = lowerMessage.match(/(?:bought|purchased)\s+(baseball\s*card|comic\s*book|trading\s*card|figurine|coin|stamp|vintage\s*toy|collectible).*?\$?(\d+(?:,\d{3})*)/)
  if (collectibleMatch) {
    const itemType = collectibleMatch[1]
    const cost = parseFloat(collectibleMatch[2].replace(/,/g, ''))
    
    console.log(`✅ Collectible: ${itemType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'collectibles', {
      id: randomUUID(),
      type: 'purchase',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_collectible',
      message: `✅ Logged ${itemType} purchase: $${cost} in Collectibles domain`
    }
  }
  
  // Collectible Valuation
  const valuationMatch = lowerMessage.match(/(?:comic|card|collectible|item)(?:\s+is)?\s+worth\s+\$?(\d+(?:,\d{3})*)/)
  if (valuationMatch && !lowerMessage.includes('house') && !lowerMessage.includes('home') && !lowerMessage.includes('car')) {
    const value = parseFloat(valuationMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Collectible valuation: $${value}`)
    
    await saveToSupabase(supabase, userId, 'collectibles', {
      id: randomUUID(),
      type: 'valuation',
      value,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_collectible_valuation',
      message: `✅ Logged collectible valuation: $${value.toLocaleString()} in Collectibles domain`
    }
  }
  
  // ============================================
  // DIGITAL-LIFE DOMAIN
  // ============================================
  
  // Domain Name
  const domainNameMatch = lowerMessage.match(/domain\s+([a-z0-9\-\.]+)\s+(?:expires|renewed)\s+(\d{4})/)
  if (domainNameMatch) {
    const domainName = domainNameMatch[1]
    const year = parseInt(domainNameMatch[2])
    
    console.log(`✅ Domain ${domainName} expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'digital-life', {
      id: randomUUID(),
      type: 'domain',
      domainName,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_domain',
      message: `✅ Logged domain ${domainName} (expires ${year}) in Digital-Life domain`
    }
  }
  
  // Cloud Storage
  const storageMatch = lowerMessage.match(/upgraded\s+to\s+(\d+)\s*(tb|gb)\s*storage/)
  if (storageMatch) {
    const size = parseInt(storageMatch[1])
    const unit = storageMatch[2].toUpperCase()
    
    console.log(`✅ Cloud storage: ${size} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'digital-life', {
      id: randomUUID(),
      type: 'cloud_storage',
      size,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_cloud_storage',
      message: `✅ Logged cloud storage upgrade: ${size} ${unit} in Digital-Life domain`
    }
  }
  
  // ============================================
  // GOALS DOMAIN
  // ============================================
  
  // Goal Setting
  const goalMatch = lowerMessage.match(/(?:goal|new\s*goal):\s*(.+)/)
  if (goalMatch) {
    const goalDescription = goalMatch[1].trim()
    
    console.log(`✅ Goal: ${goalDescription}`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'goal',
      description: goalDescription,
      status: 'active',
      progress: 0,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal',
      message: `✅ Created goal: ${goalDescription} in Goals domain`
    }
  }
  
  // Goal Progress
  const progressMatch = lowerMessage.match(/goal\s+(\d+)%\s+complete/)
  if (progressMatch) {
    const progress = parseInt(progressMatch[1])
    
    console.log(`✅ Goal progress: ${progress}%`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'goal_progress',
      progress,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal_progress',
      message: `✅ Logged goal progress: ${progress}% in Goals domain`
    }
  }
  
  // Milestone Reached
  const milestoneMatch = lowerMessage.match(/reached\s+milestone|hit\s+milestone/)
  if (milestoneMatch) {
    const milestoneDesc = lowerMessage.replace(/reached\s+milestone:?|hit\s+milestone:?/i, '').trim()
    
    console.log(`✅ Milestone reached${milestoneDesc ? ': ' + milestoneDesc : ''}`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'milestone',
      description: milestoneDesc || 'milestone reached',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_milestone',
      message: `✅ Logged milestone${milestoneDesc ? ': ' + milestoneDesc : ''} in Goals domain`
    }
  }
  
  // Not a command
  return {
    isCommand: false
  }
}

// Save data to Supabase domains table in DomainData format
async function saveToSupabase(supabase: any, userId: string, domain: string, entry: any) {
  console.log(`💾 [SAVE START] Domain: ${domain}, User: ${userId}`)
  console.log(`📝 Entry to save:`, JSON.stringify(entry, null, 2))
  
  // Get active person ID from user settings
  const { getUserSettings } = await import('@/lib/supabase/user-settings')
  const settings = await getUserSettings()
  const activePersonId = settings?.activePersonId || 
                        settings?.people?.find((p: any) => p.isActive)?.id || 
                        'me'
  
  try {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // Helper: detect if an entry represents health vitals even if type is inconsistent
    const isHealthVitalsEntry = (e: any): boolean => {
      const t = (e?.type || '').toLowerCase()
      const hasDirectFields =
        e?.weight != null || e?.value != null || e?.heartRate != null || e?.hr != null ||
        (e?.systolic != null && e?.diastolic != null) || e?.bloodPressure != null ||
        e?.temperature != null || e?.sleepHours != null || e?.steps != null ||
        e?.waterIntake != null || e?.mood != null
      return (
        (domain === 'health' && [
          'weight','height','sleep','steps','blood_pressure','heart_rate','temperature','mood'
        ].includes(t)) || (domain === 'health' && hasDirectFields)
      )
    }

    // Helper: normalize vitals from arbitrary entry structures
    const extractVitals = (e: any) => {
      const getNum = (v: any) => (typeof v === 'number' ? v : parseFloat(v))
      const weight = e?.weight ?? e?.value ?? (typeof e?.amount === 'number' ? e?.amount : undefined)
      const heartRate = e?.heartRate ?? e?.hr ?? (e?.type === 'heart_rate' ? e?.value : undefined)
      const bp = e?.bloodPressure || (e?.systolic != null && e?.diastolic != null
        ? { systolic: getNum(e?.systolic), diastolic: getNum(e?.diastolic) }
        : undefined)
      const glucose = e?.glucose ?? e?.bloodGlucose ?? (e?.type === 'glucose' ? e?.value : undefined)
      const temperature = e?.temperature ?? (e?.type === 'temperature' ? e?.value : undefined)
      const sleepHours = e?.sleepHours ?? (e?.type === 'sleep' ? e?.hours : undefined)
      const steps = e?.steps ?? (e?.type === 'steps' ? e?.value : undefined)
      const waterIntake = e?.waterIntake ?? (e?.type === 'water' ? e?.value : undefined)
      const mood = e?.mood
      const moodValue = e?.moodValue ?? (e?.type === 'mood' ? e?.value : undefined)

      return {
        weight: typeof weight === 'number' && !Number.isNaN(weight) ? weight : undefined,
        heartRate: typeof heartRate === 'number' && !Number.isNaN(heartRate) ? heartRate : undefined,
        bloodPressure: bp,
        glucose: typeof glucose === 'number' && !Number.isNaN(glucose) ? glucose : undefined,
        temperature: typeof temperature === 'number' && !Number.isNaN(temperature) ? temperature : undefined,
        sleepHours: typeof sleepHours === 'number' && !Number.isNaN(sleepHours) ? sleepHours : undefined,
        steps: typeof steps === 'number' && !Number.isNaN(steps) ? steps : undefined,
        waterIntake: typeof waterIntake === 'number' && !Number.isNaN(waterIntake) ? waterIntake : undefined,
        mood,
        moodValue: typeof moodValue === 'number' && !Number.isNaN(moodValue) ? moodValue : undefined,
      }
    }
    
    // For health vitals, create SEPARATE entries for each metric (matches manual UI format)
    if (isHealthVitalsEntry(entry)) {
      console.log(`🏥 Health vitals entry detected - creating separate entries for each metric...`)
      
      const v = extractVitals(entry)
      const entriesToCreate = []
      
      // Create separate entry for weight
      if (v.weight != null) {
        entriesToCreate.push({
          title: `Weight: ${v.weight} lbs`,
          description: `Weight check for ${today}`,
          metadata: {
            logType: 'weight',
            weight: v.weight,
            date: today
          }
        })
      }
      
      // Create separate entry for blood pressure
      if (v.bloodPressure) {
        entriesToCreate.push({
          title: `Blood Pressure: ${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}`,
          description: `BP reading for ${today}`,
          metadata: {
            logType: 'blood_pressure',
            systolic: v.bloodPressure.systolic,
            diastolic: v.bloodPressure.diastolic,
            date: today
          }
        })
      }
      
      // Create separate entry for heart rate
      if (v.heartRate != null) {
        entriesToCreate.push({
          title: `Heart Rate: ${v.heartRate} bpm`,
          description: `HR reading for ${today}`,
          metadata: {
            logType: 'heart_rate',
            heartRate: v.heartRate,
            bpm: v.heartRate,
            date: today
          }
        })
      }
      
      // Create separate entry for glucose (if supported)
      const glucose = v.glucose || (entry.glucose != null ? parseFloat(entry.glucose) : undefined)
      if (glucose != null && !Number.isNaN(glucose)) {
        entriesToCreate.push({
          title: `Blood Sugar: ${glucose} mg/dL`,
          description: `Glucose reading for ${today}`,
          metadata: {
            logType: 'glucose',
            glucose: glucose,
            date: today
          }
        })
      }
      
      // Create separate entry for sleep
      if (v.sleepHours != null) {
        entriesToCreate.push({
          title: `Sleep: ${v.sleepHours} hours`,
          description: `Sleep tracking for ${today}`,
          metadata: {
            logType: 'sleep',
            sleepHours: v.sleepHours,
            sleepQuality: 'Good',
            date: today
          }
        })
      }
      
      console.log(`📝 Creating ${entriesToCreate.length} separate vital sign entries`)
      
      // Insert all entries
      for (const vitalEntry of entriesToCreate) {
        console.log(`💾 Inserting ${vitalEntry.metadata.logType} entry...`)
        
        const { data: insertedVital, error: insertError } = await supabase
          .from('domain_entries')
          .insert({
            user_id: userId,
            domain,
            title: vitalEntry.title,
            description: vitalEntry.description,
            metadata: vitalEntry.metadata,
            person_id: activePersonId, // 🔧 NEW: Include person_id for vitals
          })
          .select()
          .single()
        
        if (insertError) {
          console.error(`❌ Insert error for ${vitalEntry.metadata.logType}:`, insertError)
          throw insertError
        }
        
        console.log(`✅ [SAVE SUCCESS] Saved ${vitalEntry.metadata.logType} entry! ID: ${insertedVital?.id}`)
      }
      
      return
    }
    
    // For non-vitals data, save as individual normalized rows in domain_entries
    console.log(`📝 Creating new domain_entries row for ${domain} domain...`)
    
    // Create DomainData entry with smart title
    let title = entry.description || entry.type || 'Entry'
    
    // Generate better titles based on entry type
    // NUTRITION & HEALTH
    if (entry.type === 'water') {
      title = `${entry.value} ${entry.unit || 'oz'} water`
    } else if (entry.type === 'meal') {
      // Use name if available (preferred), otherwise fall back to description
      const mealName = entry.name || entry.description || 'Meal'
      title = `${mealName} (${entry.calories || 0} cal)`
    } 
    // FITNESS
    else if (entry.type === 'workout') {
      const exerciseName = entry.exercise || entry.exercise_type || entry.activityType || 'workout'
      title = `${entry.duration || 0} min ${exerciseName}`
    } 
    // FINANCIAL
    else if (entry.type === 'expense') {
      title = `$${entry.amount} - ${entry.description}`
    } else if (entry.type === 'income') {
      title = `Income: $${entry.amount}`
    } else if (entry.type === 'gas') {
      title = `Gas: $${entry.amount}`
    } 
    // VEHICLES
    else if (entry.type === 'mileage_update') {
      title = `Mileage: ${entry.currentMileage?.toLocaleString()} ${entry.unit}`
    } else if (entry.type === 'fuel_purchase') {
      title = `Fuel: ${entry.gallons} ${entry.unit} ($${entry.cost})`
    } else if (entry.type === 'maintenance') {
      title = `${entry.serviceType?.replace(/_/g, ' ')}: $${entry.cost || 'N/A'}`
    } else if (entry.type === 'registration') {
      title = `Registration ${entry.expiryYear}`
    } else if (entry.type === 'car_wash') {
      title = `Car ${entry.serviceType}: $${entry.cost}`
    } else if (entry.type === 'vehicle_purchase') {
      title = `${entry.year || ''} ${entry.makeModel}: $${entry.purchasePrice?.toLocaleString()}`
    } 
    // PROPERTY
    else if (entry.type === 'home_value') {
      title = `Home Value: $${entry.value?.toLocaleString()}`
    } else if (entry.type === 'mortgage_payment') {
      title = `Mortgage: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'property_tax') {
      title = `Property Tax: $${entry.amount?.toLocaleString()} ${entry.frequency}`
    } else if (entry.type === 'hoa_fee') {
      title = `HOA: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'home_purchase') {
      title = `Home Purchase ${entry.purchaseYear}: $${entry.purchasePrice?.toLocaleString()}`
    } 
    // PETS
    else if (entry.type === 'feeding') {
      title = `Fed ${entry.petName}`
    } else if (entry.type === 'vet_appointment') {
      title = `Vet at ${entry.time}${entry.cost ? ' - $' + entry.cost : ''}`
    } else if (entry.type === 'vaccination') {
      title = `${entry.vaccineType} vaccine (exp ${entry.expiryYear})`
    } else if (entry.type === 'grooming') {
      title = `Pet ${entry.serviceType}: $${entry.cost}`
    } else if (entry.type === 'supplies') {
      title = `Pet ${entry.itemType}: $${entry.cost}`
    } 
    // MINDFULNESS
    else if (entry.type === 'meditation') {
      title = `${entry.meditationType} meditation: ${entry.duration} min`
    } else if (entry.type === 'breathing') {
      title = `${entry.breathingType}: ${entry.duration} min`
    } else if (entry.type === 'mood_checkin') {
      title = `Mood: ${entry.mood}`
    } else if (entry.type === 'journaling') {
      title = `${entry.journalType} journal${entry.duration ? ': ' + entry.duration + ' min' : ''}`
    } else if (entry.type === 'gratitude') {
      title = `Gratitude practice`
    } else if (entry.type === 'stress_level') {
      title = `Stress: ${entry.level}/10`
    } 
    // RELATIONSHIPS
    else if (entry.type === 'contact') {
      title = `${entry.contactMethod} with ${entry.personName}`
    } else if (entry.type === 'birthday') {
      title = `${entry.personName}'s birthday: ${entry.month} ${entry.day}`
    } else if (entry.type === 'anniversary') {
      title = `Anniversary: ${entry.month} ${entry.day}`
    } else if (entry.type === 'gift') {
      title = `Gift for ${entry.personName}: $${entry.amount}`
    } 
    // CAREER
    else if (entry.type === 'salary' || entry.type === 'hourly_rate') {
      title = `${entry.type === 'hourly_rate' ? 'Hourly Rate' : 'Salary'}: $${entry.amount?.toLocaleString()}/${entry.frequency}`
    } else if (entry.type === 'promotion') {
      title = `Promotion${entry.newTitle ? ': ' + entry.newTitle : ''}${entry.newSalary ? ' - $' + entry.newSalary.toLocaleString() : ''}`
    } else if (entry.type === 'work_hours') {
      title = `Worked ${entry.hours}h (${entry.period})`
    } else if (entry.type === 'bonus') {
      title = `Bonus: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'certification') {
      title = `Certification: ${entry.name}`
    } 
    // EDUCATION
    else if (entry.type === 'course') {
      title = `Course: ${entry.name}`
    } else if (entry.type === 'grade') {
      title = `Grade: ${entry.grade}`
    } else if (entry.type === 'study_time') {
      title = `Studied: ${entry.hours}h`
    } else if (entry.type === 'tuition') {
      title = `Tuition: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'credits') {
      title = `Completed ${entry.credits} credits`
    } 
    // LEGAL
    else if (entry.type === 'document') {
      title = `Signed ${entry.documentType}`
    } else if (entry.type === 'legal_fee') {
      title = `Legal ${entry.serviceType}: $${entry.amount}`
    } else if (entry.type === 'license') {
      title = `${entry.licenseType} license (exp ${entry.expiryYear})`
    } 
    // INSURANCE
    else if (entry.type === 'premium') {
      title = `${entry.insuranceType} insurance: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'claim') {
      title = `Insurance claim: $${entry.amount} (${entry.status})`
    } else if (entry.type === 'coverage') {
      title = `${entry.coverageType?.replace(/_/g, ' ')}: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'renewal') {
      title = `Insurance renewal: ${entry.renewalMonth} ${entry.renewalYear}`
    } 
    // TRAVEL
    else if (entry.type === 'flight') {
      title = `Flight to ${entry.destination}: $${entry.cost}`
    } else if (entry.type === 'accommodation') {
      title = `${entry.accommodationType}: ${entry.nights} nights ($${entry.cost})`
    } else if (entry.type === 'passport') {
      title = `Passport expires ${entry.expiryYear}`
    } else if (entry.type === 'airline_miles') {
      title = `${entry.action} ${entry.miles?.toLocaleString()} miles`
    } 
    // HOBBIES
    else if (entry.type === 'music') {
      title = `${entry.instrument}: ${entry.duration} min`
    } else if (entry.type === 'art') {
      title = `${entry.activityType}${entry.duration ? ': ' + entry.duration + ' min' : ''}`
    } else if (entry.type === 'reading') {
      title = `Read ${entry.amount} ${entry.unit}`
    } else if (entry.type === 'equipment') {
      title = `${entry.itemType}: $${entry.cost}`
    } 
    // COLLECTIBLES
    else if (entry.type === 'purchase') {
      title = `${entry.itemType}: $${entry.cost}`
    } else if (entry.type === 'valuation') {
      title = `Valuation: $${entry.value?.toLocaleString()}`
    } 
    // DIGITAL-LIFE
    else if (entry.type === 'subscription') {
      title = `${entry.service}: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'domain') {
      title = `Domain ${entry.domainName} (exp ${entry.expiryYear})`
    } else if (entry.type === 'cloud_storage') {
      title = `Storage: ${entry.size} ${entry.unit}`
    } 
    // GOALS
    else if (entry.type === 'goal') {
      title = `Goal: ${entry.description}`
    } else if (entry.type === 'goal_progress') {
      title = `Progress: ${entry.progress}%`
    } else if (entry.type === 'milestone') {
      title = `Milestone: ${entry.description}`
    }
    
    const insertPayload = {
      user_id: userId,
      domain,
      title,
      description: entry.note || entry.description || '',
      metadata: entry,
      person_id: activePersonId, // 🔧 NEW: Include person_id
    }

    console.log(`📝 Inserting ${domain} entry:`, JSON.stringify(insertPayload, null, 2))

    const { data: insertedData, error: insertError } = await supabase
      .from('domain_entries')
      .insert(insertPayload)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2))
      throw insertError
    }

    console.log(`✅ [SAVE SUCCESS] Saved new entry to domain_entries for ${domain}! ID: ${insertedData?.id}`)
    console.log(`✅ Inserted data:`, JSON.stringify(insertedData, null, 2))
  } catch (error: any) {
    console.error(`❌ [SAVE FAILED] Error saving to Supabase:`, error)
    console.error(`❌ Error message:`, error?.message)
    throw error
  }
}

// Fallback response when OpenAI API is not available
function generateFallbackResponse(message: string, userData: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Financial queries
  if (lowerMessage.includes('net worth') || lowerMessage.includes('financial')) {
    const accounts = userData.financial || []
    const total = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0)
    return `Based on your financial data, your estimated net worth is $${total.toLocaleString()}. You have ${accounts.length} financial accounts tracked.`
  }
  
  // Task queries
  if (lowerMessage.includes('task') || lowerMessage.includes('to-do')) {
    const tasks = userData.tasks || []
    const pending = tasks.filter((t: any) => !t.completed).length
    return `You currently have ${pending} pending tasks out of ${tasks.length} total tasks.`
  }
  
  // Default
  return `I understand you're asking about "${message}". I have access to your data across ${Object.keys(userData).length} life domains. Could you be more specific about what you'd like to know?`
}
