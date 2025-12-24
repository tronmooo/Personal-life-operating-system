import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get AI response using Gemini or OpenAI
async function getAIVetResponse(question: string, pet: { name: string; species: string; breed?: string; age?: string }): Promise<string> {
  const systemPrompt = `You are an AI Veterinary Assistant. You provide helpful, informative guidance about pet health and care. 

Important guidelines:
- Always be compassionate and understanding
- Provide practical, actionable advice
- Be clear when symptoms require immediate veterinary attention
- Consider the pet's species, breed, and age when relevant
- Always remind users that you provide general guidance and serious concerns require a licensed veterinarian

Pet information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${pet.age || 'Unknown'}

Respond in a helpful, professional manner. Structure your response with:
1. Assessment of the concern
2. Possible causes or explanations
3. Recommended actions or home care tips
4. When to see a veterinarian`

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser question about ${pet.name}: ${question}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (aiResponse) {
          return aiResponse
        }
      }
    } catch (error) {
      console.error('Gemini AI error:', error)
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.choices?.[0]?.message?.content
        if (aiResponse) {
          return aiResponse
        }
      }
    } catch (error) {
      console.error('OpenAI error:', error)
    }
  }

  // Final fallback - rule-based response
  return generateFallbackResponse(question, pet)
}

function generateFallbackResponse(question: string, pet: { name: string; species: string; breed?: string }): string {
  const lowerQuestion = question.toLowerCase()
  
  let response = `Thank you for your question about ${pet.name}.\n\n`

  if (lowerQuestion.includes('eat') || lowerQuestion.includes('food') || lowerQuestion.includes('diet')) {
    response += `**Assessment:** Diet and nutrition concerns\n\n`
    response += `For a ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}, proper nutrition is essential. Here are some general guidelines:\n\n`
    response += `• Ensure ${pet.name} has access to fresh, clean water at all times\n`
    response += `• Feed age-appropriate and species-specific food\n`
    response += `• Maintain consistent feeding schedules\n`
    response += `• Avoid sudden diet changes\n\n`
    response += `**When to see a vet:** If ${pet.name} hasn't eaten for more than 24-48 hours, shows signs of weight loss, or has changes in drinking habits.`
  } else if (lowerQuestion.includes('scratch') || lowerQuestion.includes('itch') || lowerQuestion.includes('skin')) {
    response += `**Assessment:** Skin/itching concerns\n\n`
    response += `Scratching can have various causes including allergies, parasites, or skin conditions.\n\n`
    response += `**Recommendations:**\n`
    response += `• Check for fleas or ticks\n`
    response += `• Look for any visible skin irritation, rashes, or hot spots\n`
    response += `• Consider recent environmental changes or new products\n`
    response += `• Ensure ${pet.name} is on appropriate flea/tick prevention\n\n`
    response += `**When to see a vet:** If scratching is severe, causing hair loss, or accompanied by wounds or infection.`
  } else if (lowerQuestion.includes('vomit') || lowerQuestion.includes('sick') || lowerQuestion.includes('diarrhea')) {
    response += `**Assessment:** Digestive concerns\n\n`
    response += `These symptoms can range from minor to serious. Here's what to watch for:\n\n`
    response += `**Recommendations:**\n`
    response += `• Withhold food for 12-24 hours (adults only), then reintroduce bland diet\n`
    response += `• Ensure ${pet.name} stays hydrated\n`
    response += `• Monitor frequency and appearance of symptoms\n\n`
    response += `**Seek immediate veterinary care if:**\n`
    response += `• Blood is present in vomit or stool\n`
    response += `• ${pet.name} is lethargic or unresponsive\n`
    response += `• Symptoms persist beyond 24 hours\n`
    response += `• ${pet.name} appears to be in pain`
  } else {
    response += `Based on your question about ${pet.name} (${pet.species}), here's some general guidance:\n\n`
    response += `**Recommendations:**\n`
    response += `• Monitor ${pet.name}'s behavior and symptoms closely\n`
    response += `• Document when symptoms started and any changes\n`
    response += `• Ensure basic needs are met: food, water, comfortable environment\n`
    response += `• Keep ${pet.name}'s routine as normal as possible\n\n`
    response += `**When to consult a veterinarian:**\n`
    response += `• If symptoms worsen or persist\n`
    response += `• If ${pet.name} shows signs of pain or distress\n`
    response += `• If you notice any sudden behavioral changes\n`
    response += `• If basic care doesn't improve the situation within 24-48 hours`
  }

  response += `\n\n**Important Reminder:** This is general guidance only. For serious concerns, emergencies, or if you're unsure, please consult a licensed veterinarian who can provide proper diagnosis and treatment for ${pet.name}.`

  return response
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')

    if (!petId) {
      return NextResponse.json({ error: 'Pet ID required' }, { status: 400 })
    }

    const { data: consultations, error } = await supabase
      .from('pet_ai_consultations')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ consultations: consultations || [] })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { petId, question } = body

    if (!petId || !question) {
      return NextResponse.json({ error: 'Pet ID and question required' }, { status: 400 })
    }

    // Get pet details
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('name, species, breed, birth_date')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Calculate age if birth_date is available
    let age: string | undefined
    if (pet.birth_date) {
      const birthDate = new Date(pet.birth_date)
      const now = new Date()
      const ageYears = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      age = ageYears > 0 ? `${ageYears} years old` : 'less than 1 year old'
    }

    // Get AI response
    const aiResponse = await getAIVetResponse(question, {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || undefined,
      age
    })

    // Save consultation
    const { data: consultation, error: saveError } = await supabase
      .from('pet_ai_consultations')
      .insert({
        user_id: user.id,
        pet_id: petId,
        question,
        response: aiResponse
      })
      .select()
      .single()

    if (saveError) throw saveError

    return NextResponse.json({ consultation }, { status: 201 })
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const consultationId = searchParams.get('consultationId')

    if (!consultationId) {
      return NextResponse.json({ error: 'Consultation ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pet_ai_consultations')
      .delete()
      .eq('id', consultationId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting consultation:', error)
    return NextResponse.json({ error: 'Failed to delete consultation' }, { status: 500 })
  }
}















