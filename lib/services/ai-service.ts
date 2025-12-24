/**
 * Universal AI Service Layer
 * Provides AI functionality for all tools using Gemini API with OpenAI fallback
 */

export interface AIRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  imageBase64?: string
  image?: string  // Alias for imageBase64 (data URL or base64 string)
}

export interface AIResponse {
  content: string
  source: 'gemini' | 'openai' | 'fallback'
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface OCRResult {
  text: string
  confidence: number
  structured?: any
}

export interface AnalysisResult {
  summary: string
  insights: string[]
  recommendations: string[]
  data?: any
}

/**
 * Main AI request function with Gemini primary, OpenAI fallback
 */
export async function requestAI(request: AIRequest): Promise<AIResponse> {
  const {
    prompt,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 2000,
    imageBase64,
    image
  } = request
  
  // Support both imageBase64 and image parameters
  const imageData = imageBase64 || image

  // Try Gemini first (FREE and powerful)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      console.log('🤖 Using Gemini AI...')
      
      const parts: any[] = []
      
      // Add system prompt if provided
      if (systemPrompt) {
        parts.push({ text: systemPrompt + '\n\n' + prompt })
      } else {
        parts.push({ text: prompt })
      }
      
      // Add image if provided
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        })
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              topP: 0.95,
              topK: 40
            }
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }
      )

      if (response.ok) {
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (content) {
          console.log('✅ Gemini AI response generated')
          return {
            content,
            source: 'gemini',
            usage: {
              promptTokens: data.usageMetadata?.promptTokenCount || 0,
              completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata?.totalTokenCount || 0
            }
          }
        }
      } else {
        console.warn('⚠️ Gemini API error:', response.status, await response.text())
      }
    } catch (geminiError) {
      console.warn('⚠️ Gemini request failed:', geminiError)
    }
  }

  // Fallback to OpenAI
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      console.log('🤖 Using OpenAI as fallback...')
      
      const messages: any[] = []
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      }
      
      if (imageData) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageData }
            }
          ]
        })
      } else {
        messages.push({ role: 'user', content: prompt })
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: imageData ? 'gpt-4o' : 'gpt-4o-mini',  // Use gpt-4o for vision tasks
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          console.log('✅ OpenAI response generated')
          return {
            content,
            source: 'openai',
            usage: data.usage
          }
        }
      }
    } catch (openaiError) {
      console.warn('⚠️ OpenAI request failed:', openaiError)
    }
  }

  // No API keys available
  throw new Error('No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.')
}

/**
 * Extract structured data from text using AI
 */
export async function extractStructuredData(
  text: string,
  schema: any,
  context?: string
): Promise<any> {
  const prompt = `Extract structured data from the following text according to this schema:

${JSON.stringify(schema, null, 2)}

${context ? `Context: ${context}\n\n` : ''}Text to extract from:
${text}

Return ONLY valid JSON matching the schema. No explanations, just the JSON object.`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a data extraction expert. Extract information accurately and return valid JSON.',
    temperature: 0.3
  })

  try {
    // Try to parse JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // If no JSON found, try to parse the whole response
    return JSON.parse(response.content)
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error)
    throw new Error('AI returned invalid JSON response')
  }
}

/**
 * Perform OCR on an image
 */
export async function performOCR(imageBase64: string): Promise<OCRResult> {
  const response = await requestAI({
    prompt: 'Extract ALL text from this image. Be thorough and accurate. Return the text exactly as it appears, preserving formatting where possible.',
    imageBase64,
    temperature: 0.2
  })

  return {
    text: response.content,
    confidence: 0.9,
    structured: null
  }
}

/**
 * Analyze and categorize expense/receipt
 */
export async function analyzeExpense(
  description: string,
  amount?: number,
  imageBase64?: string
): Promise<{
  category: string
  subcategory: string
  vendor: string
  date?: string
  isBusinessExpense: boolean
  taxDeductible: boolean
  confidence: number
}> {
  const prompt = `Analyze this expense and categorize it:

${description}
${amount ? `Amount: $${amount}` : ''}

Return a JSON object with:
- category: main category (Food, Transportation, Shopping, Utilities, Entertainment, Healthcare, etc.)
- subcategory: specific subcategory
- vendor: vendor/merchant name if identifiable
- date: date if mentioned (YYYY-MM-DD format)
- isBusinessExpense: true/false
- taxDeductible: true/false  
- confidence: 0-1 score

Return ONLY the JSON object.`

  const response = await requestAI({
    prompt,
    imageBase64,
    systemPrompt: 'You are a financial categorization expert. Analyze expenses and provide accurate categorization.',
    temperature: 0.3
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      category: 'Uncategorized',
      subcategory: 'Other',
      vendor: 'Unknown',
      isBusinessExpense: false,
      taxDeductible: false,
      confidence: 0.5
    }
  }
}

/**
 * Generate document summary
 */
export async function summarizeDocument(
  text: string,
  options?: {
    maxLength?: number
    includeKeyPoints?: boolean
    includeActionItems?: boolean
  }
): Promise<{
  summary: string
  keyPoints?: string[]
  actionItems?: string[]
}> {
  const { maxLength = 200, includeKeyPoints = true, includeActionItems = true } = options || {}

  const prompt = `Summarize this document in ${maxLength} words or less:

${text}

${includeKeyPoints ? 'Also extract 3-5 key points as bullet points.' : ''}
${includeActionItems ? 'Also identify any action items or to-dos.' : ''}

Format as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a document analysis expert. Provide clear, concise summaries.',
    temperature: 0.5
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      summary: response.content,
      keyPoints: [],
      actionItems: []
    }
  }
}

/**
 * Analyze financial report and provide insights
 */
export async function analyzeFinancialReport(data: {
  income?: number
  expenses?: number
  assets?: number
  liabilities?: number
  categories?: any[]
}): Promise<AnalysisResult> {
  const prompt = `Analyze this financial data and provide insights:

${JSON.stringify(data, null, 2)}

Provide:
1. A summary of financial health
2. Key insights (3-5 points)
3. Actionable recommendations (3-5 points)

Format as JSON:
{
  "summary": "...",
  "insights": ["...", "..."],
  "recommendations": ["...", "..."]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a financial advisor. Provide practical, actionable advice based on data.',
    temperature: 0.6
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      summary: 'Unable to analyze financial data.',
      insights: [],
      recommendations: []
    }
  }
}

/**
 * Generate professional document/email/letter
 */
export async function generateDocument(
  type: 'email' | 'letter' | 'invoice' | 'report' | 'contract',
  context: any
): Promise<string> {
  const prompts = {
    email: `Generate a professional email with the following details:
${JSON.stringify(context, null, 2)}

Write a clear, professional email that is appropriate for the context.`,
    letter: `Generate a professional business letter with these details:
${JSON.stringify(context, null, 2)}

Write a formal, well-structured business letter.`,
    invoice: `Generate a professional invoice with these details:
${JSON.stringify(context, null, 2)}

Create a detailed invoice with all line items, totals, and payment terms.`,
    report: `Generate a professional report with these details:
${JSON.stringify(context, null, 2)}

Write a comprehensive, data-driven report with clear sections.`,
    contract: `Generate a contract template with these details:
${JSON.stringify(context, null, 2)}

Create a professional contract with standard clauses. Mark placeholders with [PLACEHOLDER].`
  }

  const response = await requestAI({
    prompt: prompts[type],
    systemPrompt: `You are a professional document writer. Generate high-quality ${type}s.`,
    temperature: 0.7,
    maxTokens: 3000
  })

  return response.content
}

/**
 * Smart form filling with AI
 */
export async function fillForm(
  formFields: string[],
  userData: any
): Promise<Record<string, string>> {
  const prompt = `Fill out this form using the provided user data:

Form fields: ${JSON.stringify(formFields)}

User data: ${JSON.stringify(userData, null, 2)}

Match user data to form fields intelligently. If data is missing, leave it as an empty string.

Return JSON object mapping form field names to values.`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a form-filling assistant. Match data to form fields accurately.',
    temperature: 0.3
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    const result: Record<string, string> = {}
    formFields.forEach(field => result[field] = '')
    return result
  }
}

/**
 * Translate text
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage = 'auto'
): Promise<{ translatedText: string; detectedLanguage?: string }> {
  const prompt = `Translate the following text to ${targetLanguage}:

${text}

Return ONLY the translated text, no explanations.`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a professional translator. Provide accurate, natural translations.',
    temperature: 0.3
  })

  return {
    translatedText: response.content.trim(),
    detectedLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage
  }
}

/**
 * Analyze contract and extract key terms
 */
export async function analyzeContract(text: string): Promise<{
  summary: string
  keyTerms: Array<{ term: string; description: string }>
  redFlags: string[]
  recommendations: string[]
}> {
  const prompt = `Analyze this contract and extract:

${text}

Return JSON:
{
  "summary": "Brief summary of the contract",
  "keyTerms": [{"term": "...", "description": "..."}],
  "redFlags": ["Potential issues or concerns"],
  "recommendations": ["Advice for the user"]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a legal contract analyst. Identify key terms, risks, and provide advice.',
    temperature: 0.4,
    maxTokens: 3000
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      summary: 'Unable to analyze contract.',
      keyTerms: [],
      redFlags: [],
      recommendations: []
    }
  }
}

/**
 * Optimize schedule/calendar
 */
export async function optimizeSchedule(
  events: Array<{ title: string; start: string; end: string; priority?: number }>,
  preferences?: any
): Promise<{
  suggestions: string[]
  optimizedSchedule?: any[]
  insights: string[]
}> {
  const prompt = `Analyze and optimize this schedule:

Events: ${JSON.stringify(events, null, 2)}
Preferences: ${JSON.stringify(preferences, null, 2)}

Provide:
- Optimization suggestions
- Time management insights
- Potential conflicts or issues

Return JSON:
{
  "suggestions": ["...", "..."],
  "insights": ["...", "..."]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a time management and productivity expert. Optimize schedules for maximum efficiency.',
    temperature: 0.6
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      suggestions: [],
      insights: []
    }
  }
}

/**
 * Generate meeting notes and action items
 */
export async function processMeetingNotes(
  transcript: string
): Promise<{
  summary: string
  keyPoints: string[]
  actionItems: Array<{ task: string; owner?: string; dueDate?: string }>
  decisions: string[]
}> {
  const prompt = `Process these meeting notes:

${transcript}

Extract:
- Summary
- Key discussion points
- Action items (with owners if mentioned)
- Key decisions made

Return JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": [{"task": "...", "owner": "...", "dueDate": "..."}],
  "decisions": ["...", "..."]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a meeting facilitator. Extract structured information from meeting notes.',
    temperature: 0.4
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      summary: transcript.substring(0, 200),
      keyPoints: [],
      actionItems: [],
      decisions: []
    }
  }
}

/**
 * Price comparison and shopping advice
 */
export async function comparePrices(
  product: string,
  currentPrice?: number
): Promise<{
  analysis: string
  priceRange: { min: number; max: number; average: number }
  recommendations: string[]
  bestTimeToBy: string
}> {
  const prompt = `Analyze pricing for: ${product}
${currentPrice ? `Current price: $${currentPrice}` : ''}

Provide:
- Typical price range for this product
- Whether current price is good
- Best time to buy
- Shopping recommendations

Return JSON:
{
  "analysis": "...",
  "priceRange": {"min": 0, "max": 0, "average": 0},
  "recommendations": ["...", "..."],
  "bestTimeToBuy": "..."
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a shopping advisor. Provide practical price analysis and buying advice.',
    temperature: 0.5
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      analysis: 'Unable to analyze pricing.',
      priceRange: { min: 0, max: 0, average: 0 },
      recommendations: [],
      bestTimeToBy: 'Unknown'
    }
  }
}

/**
 * Prioritize tasks with AI
 */
export async function prioritizeTasks(
  tasks: Array<{ title: string; description?: string; deadline?: string; effort?: string }>,
  context?: any
): Promise<{
  prioritizedTasks: Array<{ task: string; priority: number; reasoning: string }>
  recommendations: string[]
}> {
  const prompt = `Prioritize these tasks:

${JSON.stringify(tasks, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Return JSON with prioritized list (1 = highest priority):
{
  "prioritizedTasks": [
    {"task": "...", "priority": 1, "reasoning": "why this priority"},
    ...
  ],
  "recommendations": ["Time management tips"]
}`

  const response = await requestAI({
    prompt,
    systemPrompt: 'You are a productivity expert. Prioritize tasks based on urgency, importance, and impact.',
    temperature: 0.5
  })

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response.content)
  } catch (error) {
    return {
      prioritizedTasks: tasks.map((t, i) => ({
        task: t.title,
        priority: i + 1,
        reasoning: 'Default ordering'
      })),
      recommendations: []
    }
  }
}






