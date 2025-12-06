import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { GoogleVisionOCR } from '@/lib/ocr/google-vision-ocr'
import { OpenAIVisionOCR } from '@/lib/ocr/openai-vision-ocr'
import { DocumentClassifier } from '@/lib/ai/document-classifier'
import { DocumentExtractor } from '@/lib/ai/document-extractor'
import { EnhancedDocumentExtractor } from '@/lib/ai/enhanced-document-extractor'

export const runtime = 'nodejs'
export const maxDuration = 120 // 120 seconds timeout for processing (increased for large files)

/**
 * POST /api/documents/smart-scan
 * Smart document scanning with AI-powered classification and data extraction
 * 
 * Query params:
 * - enhanced=true: Use enhanced extractor (extracts 20-30+ fields with confidence scores)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if enhanced extraction is requested
    const { searchParams } = new URL(request.url)
    const useEnhanced = searchParams.get('enhanced') === 'true'
    
    console.log(`📄 Smart scan request received (enhanced: ${useEnhanced})`)

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📎 Processing file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Optimize image if it's large (compress for faster OCR)
    let processedFile = file
    if (file.size > 500000 && file.type.startsWith('image/')) {
      try {
        console.log('🖼️ Compressing large image for faster OCR...')
        const buffer = Buffer.from(await file.arrayBuffer())
        const compressed = await sharp(buffer)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
        
        // Convert Buffer to Uint8Array to Blob to File
        const uint8Array = new Uint8Array(compressed)
        const blob = new Blob([uint8Array], { type: 'image/jpeg' })
        processedFile = new File([blob], file.name, { type: 'image/jpeg' })
        console.log(`✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(compressed.length / 1024 / 1024).toFixed(2)} MB`)
      } catch (compressionError) {
        console.log('⚠️ Image compression failed, using original:', compressionError)
        processedFile = file
      }
    }

    const processingStartedAt = Date.now()

    // Step 1: Extract text with OCR (Google Vision or fallback to Tesseract)
    console.log('🔍 Step 1: Extracting text with OCR...')
    
    let ocrResult: { text: string; confidence: number }
    let ocrMethod = 'unknown'
    
    try {
      // Try OpenAI Vision first (works with existing OPENAI_API_KEY)
      console.log('Attempting OpenAI Vision OCR...')
      const openaiOCR = new OpenAIVisionOCR()
      ocrResult = await openaiOCR.extractText(processedFile)
      ocrMethod = 'OpenAI GPT-4 Vision'
      console.log('✅ Using OpenAI Vision OCR')
    } catch (openaiError: any) {
      console.log('⚠️ OpenAI Vision unavailable, trying Google Cloud Vision...')
      console.log('Reason:', openaiError.message)
      
      try {
        const googleOCR = new GoogleVisionOCR()
        ocrResult = await googleOCR.extractText(processedFile)
        ocrMethod = 'Google Cloud Vision'
        console.log('✅ Using Google Cloud Vision OCR')
      } catch (googleError: any) {
        // Fallback to Tesseract.js (on-device, no API key needed)
        console.log('⚠️ Both OpenAI and Google Vision unavailable, using Tesseract fallback...')
        console.log('Reason:', googleError.message)
      
      try {
        const optimizedBuffer = await optimizeImageForOcr(file)
        console.log(
          `🪄 Optimized image for Tesseract fallback: ${(optimizedBuffer.length / 1024).toFixed(1)} KB`
        )

        const fallbackStart = Date.now()
        const fallbackResult = await recognizeWithTesseract(optimizedBuffer, (progress) => {
          const percent = Math.round(progress * 100)
          if (percent % 10 === 0) {
            console.log(`Tesseract fallback progress: ${percent}%`)
          }
        })

        console.log(
          `✅ Tesseract fallback completed in ${Date.now() - fallbackStart}ms`
        )

        ocrResult = {
          text: fallbackResult.text,
          confidence: fallbackResult.confidence
        }
        ocrMethod = 'Tesseract.js (Fallback)'
        console.log('✅ Using Tesseract.js OCR fallback')
        } catch (tesseractError: any) {
          console.error('❌ All OCR methods failed:', tesseractError)
          return NextResponse.json({
            error: 'OCR processing failed',
            details: `OpenAI: ${openaiError.message}. Google Vision: ${googleError.message}. Tesseract: ${tesseractError.message}`,
            suggestion: 'Please configure OPENAI_API_KEY or GOOGLE_CLOUD_VISION_API_KEY in your .env.local file.'
          }, { status: 500 })
        }
      }
    }

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      return NextResponse.json({
        text: '',
        documentType: 'Unknown',
        confidence: 0,
        suggestedDomain: 'Documents',
        suggestedAction: 'No text detected in image',
        reasoning: 'Could not extract any text from the document',
        extractedData: {},
        icon: '📄',
      })
    }

    console.log(`✅ OCR complete (${ocrMethod}): ${ocrResult.text.length} characters extracted`)

    // Step 2: Classify document type with AI
    console.log('🤖 Step 2: Classifying document with AI...')
    const classifier = new DocumentClassifier()
    const classification = await classifier.classifyDocument(ocrResult.text)

    console.log(`✅ Classification complete: ${classification.type}`)

    // Step 3: Extract structured data with AI
    console.log('📊 Step 3: Extracting structured data...')
    
    let extractedData: any
    let enhancedData: any = null
    
    if (useEnhanced) {
      // Use enhanced extractor (20-30+ fields with confidence scores)
      const enhancedExtractor = new EnhancedDocumentExtractor()
      enhancedData = await enhancedExtractor.extractAllFields(
        ocrResult.text,
        classification.type
      )
      
      // Convert enhanced format to standard format for backward compatibility
      extractedData = {}
      Object.entries(enhancedData.fields).forEach(([key, field]: [string, any]) => {
        extractedData[key] = field.value
      })
      
      console.log(`✅ Enhanced extraction complete: ${Object.keys(enhancedData.fields).length} fields extracted`)
    } else {
      // Use standard extractor (4-6 fields)
      const extractor = new DocumentExtractor()
      extractedData = await extractor.extractData(
        ocrResult.text,
        classification.type
      )
      
      console.log('✅ Standard extraction complete')
    }

    // Prepare response
    const result = {
      text: ocrResult.text,
      documentType: classifier.getTypeDescription(classification.type),
      confidence: classification.confidence,
      suggestedDomain: classification.suggestedDomain,
      suggestedAction: classification.suggestedAction,
      reasoning: classification.reasoning,
      extractedData,
      icon: classifier.getTypeIcon(classification.type),
      ocrEngine: ocrMethod,
      processingDurationMs: Date.now() - processingStartedAt,
      // Include enhanced data if requested
      ...(useEnhanced && enhancedData ? {
        enhancedData: {
          fields: enhancedData.fields,
          documentTitle: enhancedData.documentTitle,
          summary: enhancedData.summary,
          allDatesFound: enhancedData.allDatesFound,
          allNumbersFound: enhancedData.allNumbersFound,
          allNamesFound: enhancedData.allNamesFound,
        }
      } : {})
    }

    console.log('✅ Smart scan complete:', {
      type: classification.type,
      domain: classification.suggestedDomain,
      dataFields: Object.keys(extractedData).length,
      enhanced: useEnhanced,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Smart scan error:', error)
    
    // Provide helpful error messages
    const errorMessage = error.message || 'Failed to process document'
    let suggestion = ''
    
    if (errorMessage.includes('API key')) {
      suggestion = 'Please add GOOGLE_CLOUD_VISION_API_KEY to your .env.local file. See 🚀_QUICK_SETUP_SCANNER.md for setup instructions.'
    } else if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('OPENAI_API_KEY')) {
      suggestion = 'Please configure an AI API key (GEMINI_API_KEY or OPENAI_API_KEY) in your .env.local file.'
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error.toString(),
        suggestion
      },
      { status: 500 }
    )
  }
}

type TesseractLoggerMessage = {
  status: string
  progress: number
}

let tesseractWorkerPromise: Promise<Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>> | null = null
let tesseractQueue: Promise<unknown> = Promise.resolve()
let activeTesseractLogger: ((message: TesseractLoggerMessage) => void) | null = null

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    const { createWorker } = await import('tesseract.js')
    tesseractWorkerPromise = createWorker('eng', undefined, {
      logger: (message: TesseractLoggerMessage) => {
        if (message.status === 'recognizing text' && activeTesseractLogger) {
          activeTesseractLogger(message)
        }
      }
    })
  }
  return tesseractWorkerPromise
}

async function recognizeWithTesseract(imageBuffer: Buffer, onProgress?: (progress: number) => void) {
  const job = async () => {
    const worker = await getTesseractWorker()
    let lastLogged = -1

    if (onProgress) {
      activeTesseractLogger = (message) => {
        const percent = Math.round(message.progress * 100)
        if (percent === 100 || percent >= lastLogged + 5) {
          lastLogged = percent
          onProgress(message.progress)
        }
      }
    } else {
      activeTesseractLogger = null
    }

    try {
      const { data } = await worker.recognize(imageBuffer)
      return {
        text: data.text?.trim?.() ?? '',
        confidence: typeof data.confidence === 'number' ? data.confidence / 100 : 0
      }
    } finally {
      activeTesseractLogger = null
    }
  }

  const resultPromise = tesseractQueue.then(job)
  tesseractQueue = resultPromise.then(() => undefined).catch(() => undefined)
  return resultPromise
}

async function optimizeImageForOcr(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (!file.type.startsWith('image/')) {
    return buffer
  }

  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .grayscale()
      .normalize()
      .toFormat('png')
      .toBuffer()

    return optimized
  } catch (error) {
    console.warn('⚠️ Image optimization for Tesseract failed, using original buffer', error)
    return buffer
  }
}






























