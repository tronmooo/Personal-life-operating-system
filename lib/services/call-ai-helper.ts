/**
 * Call AI Helper
 * Specialized AI functions for Personal AI Calling Assistant
 * Wraps the existing AI service with call-task-specific functionality
 */

import { requestAI, extractStructuredData } from './ai-service'

export interface CallAIParams {
  systemPrompt: string
  userPrompt?: string
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  data?: any // Structured context: user, task, transcript, etc.
  temperature?: number
  maxTokens?: number
}

export interface CallTaskPlan {
  goal: string
  contactInfo?: {
    name?: string
    phone?: string
    type: 'business' | 'person'
  }
  steps: string[]
  questionsToAsk: string[]
  missingInfo: string[]
  requiresClarification: boolean
  hardConstraints: Record<string, any>
  softPreferences: Record<string, any>
  maxPrice?: number
  tone?: 'friendly' | 'neutral' | 'firm' | 'assertive'
}

export interface CallScriptPlan {
  introduction: string
  keyQuestions: string[]
  fallbackResponses: Record<string, string>
  successConditions: string[]
  priceNegotiation?: {
    maxBudget: number
    walkawayPrice: number
    strategy: string
  }
}

export interface CallSummary {
  summary: string
  goalAchieved: boolean
  extractedData: {
    names?: string[]
    businessName?: string
    prices?: Array<{ amount: number; currency: string; details: string }>
    appointments?: Array<{ date: string; time: string; confirmationNumber?: string }>
    confirmationNumbers?: string[]
    instructions?: string[]
  }
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative' | 'mixed'
    assistant: 'positive' | 'neutral' | 'negative' | 'mixed'
    human: 'positive' | 'neutral' | 'negative' | 'mixed'
  }
  followUpRequired: boolean
  followUpTasks?: string[]
}

/**
 * Main AI helper function - wraps requestAI with call-specific context
 */
export async function callAI(params: CallAIParams): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    messages,
    data,
    temperature = 0.7,
    maxTokens = 2000
  } = params

  // If messages array provided, use it
  if (messages && messages.length > 0) {
    // Build single prompt from messages
    const combinedPrompt = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')
    
    const response = await requestAI({
      prompt: combinedPrompt,
      temperature,
      maxTokens
    })
    return response.content
  }

  // Otherwise use system + user prompt
  const fullPrompt = userPrompt || ''
  
  // Add structured data context if provided
  const dataContext = data ? `\n\nContext Data:\n${JSON.stringify(data, null, 2)}` : ''
  
  const response = await requestAI({
    prompt: fullPrompt + dataContext,
    systemPrompt,
    temperature,
    maxTokens
  })

  return response.content
}

/**
 * Plan a call task from raw instruction
 * Interprets user intent, extracts constraints, identifies missing info
 */
export async function planCallTask(
  rawInstruction: string,
  userProfile?: any,
  existingContacts?: any[]
): Promise<CallTaskPlan> {
  const systemPrompt = `You are an AI assistant that plans phone call tasks.

Your job is to:
1. Parse the user's raw instruction
2. Extract the goal of the call
3. Identify contact information (if any)
4. Determine what information is needed to make the call
5. List steps the AI will take during the call
6. Identify any missing information that requires user clarification

Return ONLY valid JSON matching this schema:
{
  "goal": "Clear description of what we're trying to achieve",
  "contactInfo": {
    "name": "Contact name if mentioned",
    "phone": "Phone number if provided",
    "type": "business" or "person"
  },
  "steps": ["Step 1", "Step 2", ...],
  "questionsToAsk": ["What questions the AI will ask during the call"],
  "missingInfo": ["List of information needed from user before calling"],
  "requiresClarification": true/false,
  "hardConstraints": {
    "earliest_date": "YYYY-MM-DD if mentioned",
    "latest_date": "YYYY-MM-DD if mentioned",
    "time_window": ["HH:MM", "HH:MM"],
    "max_price": number
  },
  "softPreferences": {
    "prefer_morning": true/false,
    "prefer_nearest_location": true/false
  },
  "maxPrice": number or null,
  "tone": "friendly" | "neutral" | "firm" | "assertive"
}`

  const userPrompt = `Parse this call task instruction:

"${rawInstruction}"

${userProfile ? `User Profile:\n${JSON.stringify(userProfile, null, 2)}\n` : ''}
${existingContacts && existingContacts.length > 0 ? `Existing Contacts:\n${JSON.stringify(existingContacts, null, 2)}\n` : ''}

Return the call task plan as JSON.`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.4
  })

  return parseJSONResponse<CallTaskPlan>(response, {
    goal: 'Make a phone call',
    steps: [],
    questionsToAsk: [],
    missingInfo: [],
    requiresClarification: false,
    hardConstraints: {},
    softPreferences: {}
  })
}

/**
 * Generate clarification questions for user
 */
export async function generateClarificationQuestions(
  callTask: CallTaskPlan,
  missingInfo: string[]
): Promise<string[]> {
  const systemPrompt = 'You are an AI assistant generating clarification questions. Be concise and clear.'

  const userPrompt = `The user wants to: ${callTask.goal}

Missing information: ${missingInfo.join(', ')}

Generate 2-4 specific clarification questions to ask the user. Return as JSON array of strings.`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.5,
    maxTokens: 300
  })

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    return [response]
  }
}

/**
 * Generate call script / conversation plan
 */
export async function generateCallScript(
  callTask: CallTaskPlan,
  userProfile: any,
  contactType: 'business' | 'person'
): Promise<CallScriptPlan> {
  const systemPrompt = `You are creating a call script for an AI voice agent.

The script should:
- Be natural and conversational
- Match the specified tone
- Ask the right questions efficiently
- Handle common objections
- Know when to end the call

Return ONLY valid JSON.`

  const userPrompt = `Create a call script for:

Goal: ${callTask.goal}
Contact Type: ${contactType}
Tone: ${callTask.tone || 'friendly'}
User: ${JSON.stringify(userProfile)}
Constraints: ${JSON.stringify(callTask.hardConstraints)}

Return JSON:
{
  "introduction": "How the AI should introduce itself",
  "keyQuestions": ["Question 1", "Question 2", ...],
  "fallbackResponses": {
    "busy": "What to say if they're busy",
    "no_service": "What to say if they don't offer the service",
    "too_expensive": "How to handle price objections"
  },
  "successConditions": ["What indicates the goal was achieved"],
  "priceNegotiation": {
    "maxBudget": number,
    "walkawayPrice": number,
    "strategy": "negotiation approach"
  }
}`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.6
  })

  return parseJSONResponse<CallScriptPlan>(response, {
    introduction: 'Hello, this is an AI assistant calling on behalf of a customer.',
    keyQuestions: [],
    fallbackResponses: {},
    successConditions: []
  })
}

/**
 * Generate next AI response during call
 */
export async function generateCallResponse(
  transcript: string[],
  callScript: CallScriptPlan,
  callTask: CallTaskPlan
): Promise<{ nextResponse: string; isComplete: boolean; extractedData?: any }> {
  const systemPrompt = `You are an AI voice agent making a phone call. 

Your goal: ${callTask.goal}

Constraints:
- ${callTask.hardConstraints ? JSON.stringify(callTask.hardConstraints) : 'None'}

Tone: ${callTask.tone || 'friendly'}

Script guidance:
${JSON.stringify(callScript, null, 2)}

Rules:
- Be natural and conversational
- Don't repeat yourself
- If goal is achieved, politely end the call
- If they can't help, thank them and end the call
- Stay on topic
- Be respectful of their time

Based on the conversation so far, generate your next response.

Return JSON:
{
  "nextResponse": "What you should say next",
  "isComplete": true/false (is the goal achieved or should we end?),
  "extractedData": {} (any data gathered so far)
}`

  const conversationHistory = transcript
    .map((msg, i) => `${i % 2 === 0 ? 'AI' : 'Human'}: ${msg}`)
    .join('\n')

  const userPrompt = `Conversation so far:
${conversationHistory}

Generate your next response.`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 150
  })

  return parseJSONResponse(response, {
    nextResponse: 'Thank you for your time. Have a great day!',
    isComplete: true
  })
}

/**
 * Summarize and extract data from completed call
 */
export async function summarizeCall(
  fullTranscript: string,
  callTask: CallTaskPlan
): Promise<CallSummary> {
  const systemPrompt = `You are an AI analyst extracting structured data from call transcripts.

Be thorough and accurate. Extract:
- Prices mentioned (with currency and details)
- Appointment dates/times
- Confirmation numbers
- Names of people spoken to
- Business names
- Special instructions
- Whether the goal was achieved
- Overall sentiment
- Whether follow-up is needed

Return ONLY valid JSON.`

  const userPrompt = `Analyze this call transcript:

Goal: ${callTask.goal}

Transcript:
${fullTranscript}

Return JSON:
{
  "summary": "1-3 sentence summary",
  "goalAchieved": true/false,
  "extractedData": {
    "names": ["Person 1", "Person 2"],
    "businessName": "Business name if mentioned",
    "prices": [{"amount": 29.99, "currency": "USD", "details": "large pizza"}],
    "appointments": [{"date": "2025-12-01", "time": "14:00", "confirmationNumber": "ABC123"}],
    "confirmationNumbers": ["ABC123"],
    "instructions": ["Bring ID", "Arrive 10 minutes early"]
  },
  "sentiment": {
    "overall": "positive" | "neutral" | "negative" | "mixed",
    "assistant": "positive" | "neutral" | "negative" | "mixed",
    "human": "positive" | "neutral" | "negative" | "mixed"
  },
  "followUpRequired": true/false,
  "followUpTasks": ["Task 1", "Task 2"]
}`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 1500
  })

  return parseJSONResponse<CallSummary>(response, {
    summary: 'Call completed.',
    goalAchieved: false,
    extractedData: {},
    sentiment: {
      overall: 'neutral',
      assistant: 'neutral',
      human: 'neutral'
    },
    followUpRequired: false
  })
}

/**
 * Detect if user approval is needed (e.g. price exceeded, legal concern)
 */
export async function detectApprovalNeeded(
  transcript: string,
  constraints: any,
  assistantSettings: any
): Promise<{
  approvalNeeded: boolean
  reason?: string
  details?: any
}> {
  const systemPrompt = `You are a safety monitor for AI phone calls.

Check if user approval is needed for:
- Price exceeds maximum budget
- Price exceeds auto-approval limit
- Legal/liability concerns
- Sharing sensitive information
- Making binding commitments

Return JSON:
{
  "approvalNeeded": true/false,
  "reason": "Why approval is needed",
  "details": {"price": 500, "limit": 200}
}`

  const userPrompt = `Transcript: ${transcript}

Constraints: ${JSON.stringify(constraints)}
Settings: ${JSON.stringify(assistantSettings)}

Check if approval is needed.`

  const response = await callAI({
    systemPrompt,
    userPrompt,
    temperature: 0.2
  })

  return parseJSONResponse(response, {
    approvalNeeded: false
  })
}

/**
 * Helper to parse JSON responses with fallback
 */
function parseJSONResponse<T>(response: string, fallback: T): T {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    // Try to parse entire response
    return JSON.parse(response) as T
  } catch (error) {
    console.error('Failed to parse AI JSON response:', error)
    return fallback
  }
}

/**
 * Risk detection - identify potentially problematic content
 */
export async function detectRisks(text: string): Promise<{
  hasRisks: boolean
  risks: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }>
}> {
  const systemPrompt = `You are a content safety analyzer.

Detect:
- Legal issues (contracts, liability)
- Privacy violations
- Unsafe requests
- Inappropriate content
- Scam/fraud indicators

Return JSON:
{
  "hasRisks": true/false,
  "risks": [{"type": "legal", "severity": "high", "description": "..."}]
}`

  const response = await callAI({
    systemPrompt,
    userPrompt: `Analyze this for risks:\n\n${text}`,
    temperature: 0.2
  })

  return parseJSONResponse(response, {
    hasRisks: false,
    risks: []
  })
}


























