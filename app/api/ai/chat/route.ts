import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      // Fallback response if no API key
      return NextResponse.json({
        response: generateFallbackResponse(message)
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
            content: 'You are a compassionate, supportive AI therapist. Provide empathetic, non-judgmental responses. Focus on active listening, validation, and gentle guidance. Keep responses concise (2-3 sentences). Never provide medical advice or diagnose conditions.'
          },
          ...history.map((msg: any) => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.text
          })),
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    })

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || generateFallbackResponse(message)

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({
      response: "I'm here to listen. Can you tell me more about how you're feeling?"
    })
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
    return "It's completely understandable to feel anxious. These feelings are valid. Have you tried taking a few deep breaths? Sometimes grounding exercises can help when anxiety feels overwhelming."
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return "I hear that you're going through a difficult time. Your feelings matter, and it's okay to not be okay. What's one small thing that usually brings you comfort?"
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
    return "Feeling stressed and overwhelmed is a natural response to challenging situations. Remember to be kind to yourself. What's one task you could break down into smaller, more manageable steps?"
  }
  
  if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
    return "Work-related stress is very common. It sounds like you have a lot on your plate. Have you been able to take any breaks today? Even small moments of rest can make a difference."
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('grateful')) {
    return "I'm glad I could be here for you. Remember, taking time for self-reflection and self-care is a strength, not a weakness. How are you feeling right now?"
  }
  
  // Default response
  return "I'm here to support you. Your feelings and experiences are important. Would you like to tell me more about what's on your mind?"
}
