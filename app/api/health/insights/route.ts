/**
 * Health Insights API
 * Generates AI-powered health insights from vital data using OpenAI
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai/client'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get health entries from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: healthEntries, error: entriesError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('domain', 'health')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (entriesError) {
      console.error('Error fetching health entries:', entriesError)
      return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 })
    }

    // Get health profile
    const { data: profile } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Organize data by type
    const bloodPressure = healthEntries.filter(e => e.metadata?.logType === 'blood_pressure')
    const heartRate = healthEntries.filter(e => e.metadata?.logType === 'heart_rate')
    const weight = healthEntries.filter(e => e.metadata?.logType === 'weight')
    const glucose = healthEntries.filter(e => e.metadata?.logType === 'glucose')
    const sleep = healthEntries.filter(e => e.metadata?.logType === 'sleep')
    const water = healthEntries.filter(e => e.metadata?.logType === 'water')
    const symptoms = healthEntries.filter(e => e.metadata?.logType === 'symptom')
    const medications = healthEntries.filter(e => e.metadata?.logType === 'medication')

    // Calculate averages
    const avgBP = bloodPressure.length > 0
      ? {
          systolic: Math.round(bloodPressure.reduce((sum, e) => sum + (e.metadata?.systolic || 0), 0) / bloodPressure.length),
          diastolic: Math.round(bloodPressure.reduce((sum, e) => sum + (e.metadata?.diastolic || 0), 0) / bloodPressure.length)
        }
      : null

    const avgHR = heartRate.length > 0
      ? Math.round(heartRate.reduce((sum, e) => sum + (e.metadata?.heartRate || e.metadata?.bpm || 0), 0) / heartRate.length)
      : null

    const avgWeight = weight.length > 0
      ? (weight.reduce((sum, e) => sum + (e.metadata?.weight || 0), 0) / weight.length).toFixed(1)
      : null

    const avgGlucose = glucose.length > 0
      ? Math.round(glucose.reduce((sum, e) => sum + (e.metadata?.glucose || 0), 0) / glucose.length)
      : null

    const avgSleep = sleep.length > 0
      ? (sleep.reduce((sum, e) => sum + (e.metadata?.sleepHours || 0), 0) / sleep.length).toFixed(1)
      : null

    const avgWater = water.length > 0
      ? (water.reduce((sum, e) => sum + (e.metadata?.waterGlasses || 0), 0) / water.length).toFixed(1)
      : null

    // Build context for AI
    const healthContext = {
      profile: profile ? {
        age: profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : null,
        gender: profile.gender,
        bloodType: profile.blood_type,
        height: profile.height_ft && profile.height_in ? `${profile.height_ft}'${profile.height_in}"` : null,
        targetWeight: profile.target_weight_lbs,
        chronicConditions: profile.chronic_conditions,
        knownAllergies: profile.known_allergies,
      } : null,
      vitals: {
        bloodPressure: avgBP ? `${avgBP.systolic}/${avgBP.diastolic}` : 'No data',
        heartRate: avgHR ? `${avgHR} bpm` : 'No data',
        weight: avgWeight ? `${avgWeight} lbs` : 'No data',
        glucose: avgGlucose ? `${avgGlucose} mg/dL` : 'No data',
        sleep: avgSleep ? `${avgSleep} hours` : 'No data',
        water: avgWater ? `${avgWater} glasses/day` : 'No data',
      },
      recentSymptoms: symptoms.slice(0, 5).map(s => ({
        type: s.title,
        severity: s.metadata?.severity,
        triggers: s.metadata?.triggers,
      })),
      medicationAdherence: medications.length > 0 
        ? `${medications.filter(m => m.metadata?.taken).length}/${medications.length} taken`
        : 'No data',
      dataPoints: {
        bloodPressureReadings: bloodPressure.length,
        weightReadings: weight.length,
        sleepLogs: sleep.length,
        symptomEntries: symptoms.length,
      }
    }

    // Generate insights with OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional health data analyst. Analyze the user's health data and provide 3-4 concise, actionable insights. Each insight should:
1. Have a clear title (e.g., "Blood Pressure Trending Well")
2. Include specific data points and numbers
3. Provide actionable recommendations
4. Be categorized as "positive" (green), "caution" (yellow), or "concern" (red)
5. Be friendly and encouraging

Format each insight as JSON with: { category: "positive"|"caution"|"concern", title: string, message: string, icon: "heart"|"moon"|"droplet"|"activity"|"alert" }`
        },
        {
          role: 'user',
          content: `Please analyze this health data and provide insights:\n\n${JSON.stringify(healthContext, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const insights = JSON.parse(completion.choices[0].message.content || '{"insights":[]}')

    return NextResponse.json({
      success: true,
      insights: insights.insights || [],
      summary: {
        vitals: healthContext.vitals,
        dataPoints: healthContext.dataPoints,
      }
    })

  } catch (error: any) {
    console.error('Health insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}


