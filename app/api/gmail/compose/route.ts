/**
 * POST /api/gmail/compose
 * AI-powered email composition
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { OpenAIService } from '@/lib/external-apis/openai-service'
import type { AIEmailGenerateRequest, AIEmailGenerateResponse } from '@/lib/types/email-types'

const openai = new OpenAIService()

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AIEmailGenerateRequest = await request.json()

    if (!body.context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      )
    }

    // Build the AI prompt based on email type
    const prompt = buildEmailPrompt(body)

    const response = await openai.chatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(body.tone)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate email content' },
        { status: 500 }
      )
    }

    // Parse the AI response
    const result = parseEmailResponse(content, body.type)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Exception in POST /api/gmail/compose:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSystemPrompt(tone: string): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'You are a professional email writer. Write clear, concise, and business-appropriate emails.',
    friendly: 'You are a friendly email writer. Write warm, personable, and approachable emails.',
    formal: 'You are a formal email writer. Write polished, respectful, and traditional business emails.',
    casual: 'You are a casual email writer. Write relaxed, conversational, and informal emails.'
  }

  return `${toneDescriptions[tone] || toneDescriptions.professional}

You will generate email content in JSON format with the following structure:
{
  "subject": "Email subject line",
  "body": "Complete email body text",
  "suggestions": ["Alternative phrasing 1", "Alternative phrasing 2"]
}

Guidelines:
- Keep emails concise and to the point
- Use appropriate greetings and sign-offs based on tone
- Include placeholders like [Your Name] or [Recipient Name] where appropriate
- Provide 2-3 alternative phrasings for key sentences
- Do not include any markdown formatting in the body
- Always respond with valid JSON only`
}

function buildEmailPrompt(req: AIEmailGenerateRequest): string {
  let prompt = ''

  if (req.type === 'reply' && req.originalEmail) {
    prompt = `Generate a ${req.tone} reply to this email:

Original Subject: ${req.originalEmail.subject}
From: ${req.originalEmail.from}
Body: ${req.originalEmail.body.substring(0, 1500)}

Context for reply: ${req.context}`
  } else if (req.type === 'follow-up' && req.originalEmail) {
    prompt = `Generate a ${req.tone} follow-up email based on:

Original Subject: ${req.originalEmail.subject}
Original Body: ${req.originalEmail.body.substring(0, 1000)}

Follow-up context: ${req.context}`
  } else {
    prompt = `Generate a new ${req.tone} email about: ${req.context}`
  }

  if (req.recipientName) {
    prompt += `\n\nRecipient: ${req.recipientName}`
  }
  if (req.senderName) {
    prompt += `\nSender: ${req.senderName}`
  }

  return prompt
}

function parseEmailResponse(content: string, type: string): AIEmailGenerateResponse {
  try {
    // Try to parse as JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        subject: parsed.subject || '',
        body: parsed.body || '',
        suggestions: parsed.suggestions || []
      }
    }
  } catch (e) {
    // If JSON parsing fails, extract content as plain text
  }

  // Fallback: treat entire response as body
  return {
    subject: type === 'reply' ? 'Re: ' : type === 'follow-up' ? 'Follow-up: ' : '',
    body: content,
    suggestions: []
  }
}


