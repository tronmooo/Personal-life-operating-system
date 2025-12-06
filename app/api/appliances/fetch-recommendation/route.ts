import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { name, category, brand, model, purchaseDate, condition, maintenanceCount, totalCosts } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const ageInYears = purchaseDate 
      ? Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 'Unknown'

    const prompt = `You are an appliance lifecycle and maintenance expert. Provide a recommendation for the following appliance:

Appliance: ${name}
Category: ${category}
Brand: ${brand}
Model: ${model}
Age: ${ageInYears} years
Condition: ${condition}
Maintenance Records: ${maintenanceCount}
Total Repair Costs: $${totalCosts}

Based on typical appliance lifespans, repair costs vs. replacement value, and the provided information, recommend one of the following actions: "Keep", "Monitor", "Replace Soon", or "Replace Now".

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "action": "<Keep/Monitor/Replace Soon/Replace Now>",
  "reasoning": "<2-3 sentence explanation>",
  "expectedLifeRemaining": "<estimate in years or 'end of life'>",
  "estimatedReplacementCost": <number>,
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Consider factors like:
- Typical lifespan for this category of appliance
- Repair costs exceeding 50% of replacement value
- Frequency of maintenance/repairs
- Current condition
- Energy efficiency improvements in newer models`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an appliance expert specializing in lifecycle management and cost-benefit analysis. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    
    // Parse the JSON response
    let recommendation
    try {
      recommendation = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recommendation: {
        action: recommendation.action,
        reasoning: recommendation.reasoning,
        expectedLifeRemaining: recommendation.expectedLifeRemaining,
        estimatedReplacementCost: recommendation.estimatedReplacementCost,
        recommendations: recommendation.recommendations || [],
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error fetching appliance recommendation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendation' },
      { status: 500 }
    )
  }
}

















