/**
 * Health Recommendations API
 * Generates personalized health recommendations using OpenAI
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { focusArea } = body // 'cardiovascular', 'sleep', 'weight', 'overall'

    // Get recent health data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentEntries, error: entriesError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('domain', 'health')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (entriesError) {
      return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 })
    }

    // Get health profile
    const { data: profile } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Organize recent data
    const latest = {
      bloodPressure: recentEntries.find(e => e.metadata?.logType === 'blood_pressure'),
      heartRate: recentEntries.find(e => e.metadata?.logType === 'heart_rate'),
      weight: recentEntries.find(e => e.metadata?.logType === 'weight'),
      glucose: recentEntries.find(e => e.metadata?.logType === 'glucose'),
      sleep: recentEntries.filter(e => e.metadata?.logType === 'sleep').slice(0, 7),
      water: recentEntries.filter(e => e.metadata?.logType === 'water').slice(0, 7),
      symptoms: recentEntries.filter(e => e.metadata?.logType === 'symptom').slice(0, 3),
    }

    // Build context
    const context = {
      profile: profile ? {
        age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : null,
        gender: profile.gender,
        targetWeight: profile.target_weight_lbs,
        chronicConditions: profile.chronic_conditions,
      } : null,
      currentMetrics: {
        bloodPressure: latest.bloodPressure ? `${latest.bloodPressure.metadata.systolic}/${latest.bloodPressure.metadata.diastolic}` : null,
        heartRate: latest.heartRate ? latest.heartRate.metadata.heartRate || latest.heartRate.metadata.bpm : null,
        weight: latest.weight ? latest.weight.metadata.weight : null,
        glucose: latest.glucose ? latest.glucose.metadata.glucose : null,
        avgSleep: latest.sleep.length > 0 ? (latest.sleep.reduce((sum, s) => sum + (s.metadata.sleepHours || 0), 0) / latest.sleep.length).toFixed(1) : null,
        avgWater: latest.water.length > 0 ? (latest.water.reduce((sum, w) => sum + (w.metadata.waterGlasses || 0), 0) / latest.water.length).toFixed(1) : null,
      },
      recentSymptoms: latest.symptoms.map(s => s.title),
      focusArea: focusArea || 'overall',
    }

    // Generate recommendations
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a certified health coach providing personalized recommendations. Based on the user's health data, provide 4-6 specific, actionable recommendations focused on "${focusArea}". Each recommendation should:
1. Be specific and measurable
2. Include the rationale (why it matters)
3. Provide a concrete action step
4. Be appropriate for the user's current health status

Format as JSON array with: { title: string, description: string, action: string, priority: "high"|"medium"|"low", category: string }`
        },
        {
          role: 'user',
          content: `Generate recommendations based on:\n\n${JSON.stringify(context, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"recommendations":[]}')

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations || [],
      context: {
        focusArea,
        metrics: context.currentMetrics,
      }
    })

  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}


