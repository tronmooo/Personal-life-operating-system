import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let text = ''
  try {
    const body = await request.json()
    text = body.text

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      // Fallback response if no API key
      return NextResponse.json({
        insight: generateFallbackInsight(text)
      })
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an empathetic mindfulness coach analyzing journal entries. Provide supportive insights that: 1) Validate the person\'s feelings, 2) Identify patterns or themes, 3) Offer gentle, actionable suggestions. Keep response to 3-4 sentences. Be warm, non-judgmental, and encouraging.'
          },
          {
            role: 'user',
            content: `Please analyze this journal entry and provide supportive insights:\n\n"${text}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    })

    const data = await response.json()
    const insight = data.choices?.[0]?.message?.content || generateFallbackInsight(text)

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('AI Journal Analysis Error:', error)
    return NextResponse.json({
      insight: generateFallbackInsight(text)
    })
  }
}

function generateFallbackInsight(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('stress') || lowerText.includes('overwhelm')) {
    return "I notice you're expressing concerns about feeling stressed or overwhelmed. These feelings are completely valid and common. Remember that it's okay to take breaks and set boundaries. Consider trying a short breathing exercise or scheduling small moments of rest throughout your day to help manage these feelings."
  }
  
  if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('worry')) {
    return "Your journal reflects some anxiety and worry, which is a natural response to uncertain situations. Thank you for being honest about how you're feeling. Grounding techniques like the 5-4-3-2-1 exercise or mindful breathing can help when anxiety feels overwhelming. Remember to be compassionate with yourself."
  }
  
  if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('depressed')) {
    return "I hear that you're going through a difficult emotional time. Your feelings are valid, and it's brave of you to express them. While these feelings are challenging, they won't last forever. Consider reaching out to supportive people in your life, and remember that small acts of self-care can make a difference."
  }
  
  if (lowerText.includes('work') || lowerText.includes('deadline') || lowerText.includes('project')) {
    return "It sounds like work-related pressures are weighing on you right now. This is very common and your concerns are legitimate. Breaking large tasks into smaller, manageable steps can help reduce feelings of overwhelm. Also remember to celebrate small wins along the way. Taking regular breaks isn't being lazy—it's essential for maintaining your wellbeing and productivity."
  }
  
  if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('sleep')) {
    return "Fatigue and exhaustion can significantly impact our emotional state. Your body may be signaling that it needs more rest. Prioritizing sleep and establishing a calming bedtime routine can make a real difference. Remember that rest is productive, not lazy. Consider what small adjustments you could make to honor your body's need for recovery."
  }
  
  if (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('happy')) {
    return "It's wonderful that you're taking time to acknowledge positive feelings and gratitude. This practice can significantly boost wellbeing and resilience. Keep cultivating this awareness of what brings you joy and meaning. Consider extending this gratitude practice by noting one thing you're grateful for each day."
  }
  
  // Default insight
  return "Thank you for sharing your thoughts openly. Your self-reflection shows emotional awareness and courage. Remember that all feelings are valid and temporary. Consider practicing self-compassion as you navigate these experiences. What's one kind thing you could do for yourself today?"
}








