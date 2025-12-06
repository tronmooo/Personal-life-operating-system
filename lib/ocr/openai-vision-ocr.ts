/**
 * OpenAI Vision OCR
 * Uses GPT-4 Vision to extract text from images
 */

export class OpenAIVisionOCR {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
  }

  async extractText(file: File): Promise<{ text: string; confidence: number }> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('🔍 Starting OpenAI Vision OCR...')

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract ALL text from this image. Include:
- Every word, number, and date visible
- Preserve the original layout and formatting
- Include headers, labels, and fine print
- Extract barcodes/IDs if readable

Output ONLY the extracted text, exactly as it appears, with no additional commentary.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI Vision API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const extractedText = data.choices[0]?.message?.content || ''

      console.log(`✅ OpenAI Vision extracted ${extractedText.length} characters`)

      return {
        text: extractedText,
        confidence: 0.95 // OpenAI Vision is very accurate
      }
    } catch (error: any) {
      console.error('❌ OpenAI Vision error:', error.message)
      throw new Error(`OCR failed: ${error.message}`)
    }
  }
}












