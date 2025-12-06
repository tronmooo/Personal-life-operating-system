import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { count = 3 } = await request.json()
    
    // Use Gemini API if available, otherwise fallback to predefined prompts
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Generate ${count} unique, thoughtful journal prompts for mindfulness and self-reflection. Each prompt should be a question or statement that encourages deep personal reflection. Make them varied - some about gratitude, some about emotions, some about growth, some about challenges. Return ONLY the prompts as a JSON array of strings, no extra text.

Example format:
["What am I grateful for today?", "How am I feeling in this moment?", "What did I learn about myself recently?"]

Generate ${count} new prompts now:`
                }]
              }],
              generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              }
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          // Try to parse JSON from the response
          const jsonMatch = text.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const prompts = JSON.parse(jsonMatch[0])
            if (Array.isArray(prompts) && prompts.length > 0) {
              return NextResponse.json({ prompts: prompts.slice(0, count) })
            }
          }
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError)
        // Fall through to fallback prompts
      }
    }
    
    // Fallback: Large pool of high-quality prompts
    const promptPool = [
      "What am I grateful for today?",
      "What's weighing on my mind right now?",
      "How am I feeling in this moment?",
      "Describe a moment today when I felt truly present",
      "What would I tell my younger self about today?",
      "What's one thing I did today that I'm proud of?",
      "What emotions am I feeling, and where do I feel them in my body?",
      "What's something I'm looking forward to?",
      "Write about a recent challenge and what I learned from it",
      "What does self-care look like for me right now?",
      "What relationships am I nurturing, and which need attention?",
      "How have I grown in the past month?",
      "What boundaries do I need to set for my well-being?",
      "Describe a time I felt deeply connected to someone",
      "What fears are holding me back, and how can I address them?",
      "What brings me joy, and am I making time for it?",
      "How do I show love to myself?",
      "What would I do if I wasn't afraid?",
      "Reflect on a mistake and the wisdom it brought",
      "What does my ideal day look like?",
      "How can I be more present in my daily life?",
      "What patterns in my life need to change?",
      "What am I learning about myself right now?",
      "How do I want to feel, and what can I do to cultivate that feeling?",
      "What makes me feel most alive?",
      "Who do I want to become?",
      "What am I avoiding and why?",
      "What does success mean to me today?",
      "How can I be kinder to myself?",
      "What values guide my decisions?",
    ]
    
    // Return random prompts from the pool
    const shuffled = [...promptPool].sort(() => Math.random() - 0.5)
    const selectedPrompts = shuffled.slice(0, count)
    
    return NextResponse.json({ prompts: selectedPrompts })
  } catch (error) {
    console.error('Error generating journal prompts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate prompts',
        prompts: [
          "What am I grateful for today?",
          "How am I feeling in this moment?",
          "What did I learn about myself recently?"
        ]
      },
      { status: 200 } // Return 200 with fallback prompts
    )
  }
}






















