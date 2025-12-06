import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      )
    }

    // Use OpenAI to parse warranty information
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY not set, using fallback parsing')
      return fallbackParse(text)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a warranty document parser. Extract warranty information from the provided text and return it in JSON format with these fields: warrantyName, provider, expiryDate (YYYY-MM-DD format), coverageMiles (number only). If a field is not found, omit it from the response.'
            },
            {
              role: 'user',
              content: `Extract warranty information from this text:\n\n${text}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const extracted = JSON.parse(data.choices[0].message.content)

      return NextResponse.json({
        success: true,
        ...extracted
      })
    } catch (aiError) {
      console.error('AI parsing failed, using fallback:', aiError)
      return fallbackParse(text)
    }
  } catch (error) {
    console.error('Error parsing warranty:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to parse warranty document' },
      { status: 500 }
    )
  }
}

// Fallback regex-based parsing
function fallbackParse(text: string) {
  const result: any = { success: true }

  // Extract warranty name (look for "Warranty", "Protection Plan", etc.)
  const warrantyMatch = text.match(/([\w\s]+(?:Warranty|Protection\s+Plan|Extended\s+Service|Coverage))/i)
  if (warrantyMatch) {
    result.warrantyName = warrantyMatch[1].trim()
  }

  // Extract provider (look for company names, typically capitalized words before "Warranty")
  const providerMatch = text.match(/(?:provided\s+by|issued\s+by|from)\s+([\w\s&]+?)(?:\s+Warranty|\s+Inc\.|\s+LLC)/i)
  if (providerMatch) {
    result.provider = providerMatch[1].trim()
  } else {
    // Try to find capitalized company names
    const companyMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s+(?:Inc\.|LLC|Corporation|Company))?/i)
    if (companyMatch) {
      result.provider = companyMatch[1].trim()
    }
  }

  // Extract expiry date
  const dateMatches = [
    /expir(?:y|es|ation)\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /valid\s+through[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /coverage\s+ends[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g
  ]

  for (const pattern of dateMatches) {
    const match = text.match(pattern)
    if (match) {
      try {
        const dateStr = match[1]
        const date = new Date(dateStr)
        if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
          result.expiryDate = date.toISOString().split('T')[0]
          break
        }
      } catch (error) {
        // Invalid date format, try next pattern
        continue
      }
    }
  }

  // Extract coverage miles
  const milesMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles|mi)/i)
  if (milesMatch) {
    result.coverageMiles = parseInt(milesMatch[1].replace(/,/g, ''))
  }

  return NextResponse.json(result)
}













