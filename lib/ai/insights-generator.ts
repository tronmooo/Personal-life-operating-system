import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

type DomainData = Record<string, any[]>

export type GeneratedInsight = {
  type: 'financial' | 'health' | 'vehicles' | 'home' | 'relationships' | 'goals' | 'other'
  title: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
const looksLikePlaceholder = (value?: string) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return lower.includes('your-project-id') || lower.includes('placeholder') || lower.includes('dummy')
}

export async function generateWeeklyInsightsForUser(userId: string, data: DomainData): Promise<GeneratedInsight[]> {
  if (!process.env.OPENAI_API_KEY) return []

  const prompt = `You are an assistant generating proactive weekly insights (max 10) across domains. Use short, actionable, natural language. Include emojis that match examples.

Examples:
- Financial: "💰 Spending up 15% this month vs. last month (mostly dining out)"
- Health: "💪 Great job! 7-day workout streak 🔥"
- Vehicles: "🚗 Honda Civic due for oil change in 300 miles"
- Home: "🏠 Property value up $5K this quarter"
- Relationships: "🎂 3 birthdays coming up this month"
- Goals: "🎯 Net worth up 3% this quarter"

Rules:
- Compare recent period (last 7/30 days) vs prior when possible.
- Detect anomalies/spikes and missed patterns.
- Prioritize critical/important items first.
- Keep each message under 140 chars.

Return JSON array of objects with keys: type, title, message, priority.
Allowed types: financial, health, vehicles, home, relationships, goals, other.

User data (truncated for privacy):
${safeStringify(compactDataForPrompt(data)).slice(0, 8000)}
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 800,
    messages: [
      { role: 'system', content: 'You generate concise, high-signal weekly user insights.' },
      { role: 'user', content: prompt },
    ],
  })

  const text = completion.choices[0]?.message?.content?.trim() || '[]'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  let insights: GeneratedInsight[] = []
  try {
    insights = JSON.parse(cleaned)
  } catch {
    insights = []
  }
  // Basic sanitize
  return (Array.isArray(insights) ? insights : [])
    .filter(i => i && i.title && i.message)
    .slice(0, 10)
}

export async function saveInsights(userId: string, insights: GeneratedInsight[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(serviceRoleKey)) {
    console.warn('Skipping insight persistence: Supabase service credentials are not configured.')
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const rows = insights.map(i => ({
    user_id: userId,
    type: i.type,
    title: i.title,
    message: i.message,
    priority: i.priority,
  }))
  await supabase.from('insights').insert(rows).throwOnError()
}

function compactDataForPrompt(data: DomainData) {
  const pick = (obj: any, keys: string[]) => keys.reduce((acc: any, k) => { if (obj && obj[k] !== undefined) acc[k] = obj[k]; return acc }, {})
  return Object.fromEntries(Object.entries(data).map(([k, arr]) => {
    const sample = (arr || []).slice(0, 50).map((item: any) => {
      const m = item?.metadata || item
      return pick(m, ['amount','category','date','status','steps','weight','glucose','systolic','diastolic','calories','protein','vehicleId','currentMileage','serviceName','nextServiceMileage','purchasePrice','estimatedValue','propertyValue','mortgageBalance','birthday','relationship','dueDate','value'])
    })
    return [k, sample]
  }))
}

function safeStringify(v: any) {
  try { return JSON.stringify(v) } catch { return '[]' }
}

