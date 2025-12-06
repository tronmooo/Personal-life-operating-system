/**
 * Google Cloud Vision API OCR Service
 * Superior OCR compared to Tesseract with better accuracy
 */

export interface OCRResult {
  text: string
  confidence: number
  blocks: TextBlock[]
}

export interface TextBlock {
  text: string
  confidence: number
  boundingBox: {
    vertices: Array<{ x: number; y: number }>
  }
}

export class GoogleVisionOCR {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_CLOUD_VISION_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ Google Cloud Vision API key not configured')
    }
  }

  /**
   * Extract text from an image using Google Cloud Vision API
   */
  async extractText(imageFile: File | string): Promise<OCRResult> {
    console.log('🔍 Starting Google Vision OCR...')

    // Check if API key is configured
    if (!this.apiKey) {
      throw new Error(
        'Google Cloud Vision API key is not configured. Please add GOOGLE_CLOUD_VISION_API_KEY to your .env.local file. See 🚀_QUICK_SETUP_SCANNER.md for instructions.'
      )
    }

    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile)

      // Call Google Cloud Vision API
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.error?.message || response.statusText
        throw new Error(`Google Vision API error: ${errorMessage}. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Google Vision OCR complete')

      // Parse response
      const textAnnotations = data.responses[0]?.textAnnotations || []
      const fullText = data.responses[0]?.fullTextAnnotation

      if (!textAnnotations.length) {
        return {
          text: '',
          confidence: 0,
          blocks: [],
        }
      }

      // Extract blocks
      const blocks: TextBlock[] = textAnnotations.slice(1).map((annotation: any) => ({
        text: annotation.description,
        confidence: annotation.confidence || 0.95,
        boundingBox: annotation.boundingPoly,
      }))

      return {
        text: textAnnotations[0].description || '',
        confidence: fullText?.pages?.[0]?.confidence || 0.95,
        blocks,
      }
    } catch (error: any) {
      console.error('❌ Google Vision OCR error:', error)
      throw new Error(`OCR failed: ${error.message}`)
    }
  }

  /**
   * Convert File or data URL to base64
   * Works in both browser and Node.js environments
   */
  private async fileToBase64(file: File | string): Promise<string> {
    if (typeof file === 'string') {
      // It's already a data URL or base64
      if (file.startsWith('data:')) {
        return file.split(',')[1]
      }
      return file
    }

    // Server-side: Convert File to Buffer then to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  }

  /**
   * Detect document type from image
   */
  async detectDocumentType(imageFile: File | string): Promise<string> {
    try {
      const base64Image = await this.fileToBase64(imageFile)

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      )

      const data = await response.json()
      const labels = data.responses[0]?.labelAnnotations || []

      // Check for common document types
      const labelTexts = labels.map((l: any) => l.description.toLowerCase())

      if (labelTexts.some((l: string) => l.includes('receipt') || l.includes('invoice'))) {
        return 'receipt'
      }
      if (labelTexts.some((l: string) => l.includes('card') || l.includes('insurance'))) {
        return 'insurance_card'
      }
      if (labelTexts.some((l: string) => l.includes('prescription') || l.includes('medicine'))) {
        return 'prescription'
      }
      if (labelTexts.some((l: string) => l.includes('vehicle') || l.includes('registration'))) {
        return 'vehicle_registration'
      }

      return 'unknown'
    } catch (error) {
      console.error('Document type detection failed:', error)
      return 'unknown'
    }
  }
}

