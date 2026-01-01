import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getSupabaseAdmin } from '@/lib/supabase/server'
import * as AI from '@/lib/services/ai-service'
import { randomUUID } from 'crypto'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image, scanMode } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('🖼️ [IMAGE ANALYSIS] Starting analysis for user:', user.id, 'Mode:', scanMode || 'general')

    // Use AI vision to analyze the image (Gemini primary, OpenAI fallback)
    let systemPrompt = ''
    
    // Get available document types for AI context
    const documentTypesList = `receipt, invoice, bill, tax_document, pay_stub, bank_statement, 
      id_card, drivers_license, passport, birth_certificate, social_security_card,
      insurance_card, insurance_policy, medical_record, prescription, lab_results, vaccination_record,
      vehicle_registration, vehicle_title, pet_record, property_deed, lease_agreement, warranty,
      boarding_pass, hotel_confirmation, ticket, diploma, transcript, report_card, assignment, syllabus, exam,
      resume, job_offer, employment_contract, project_plan, meeting_notes, whiteboard, diagram,
      contract, power_of_attorney, will, court_document, photo, recipe, screenshot, coupon, gift_card, product_manual`
    
    // MEAL SCANNING - Specialized prompt for food analysis
    if (scanMode === 'meal') {
      systemPrompt = `You are a NUTRITION EXPERT AI that analyzes food images and estimates nutritional content.

**YOUR JOB:**
1. Identify all foods/items visible in the image
2. Estimate portion sizes
3. Calculate approximate nutritional values

**RESPONSE FORMAT:**
Return ONLY valid JSON with:
{
  "domain": "nutrition",
  "type": "meal",
  "data": {
    "name": "[Main food description, e.g., 'Grilled Chicken Salad']",
    "mealType": "[breakfast/lunch/dinner/snack]",
    "calories": [estimated total calories],
    "protein": [grams],
    "carbs": [grams],
    "fats": [grams],
    "fiber": [grams],
    "items": ["list", "of", "visible", "food", "items"],
    "portionSize": "[small/medium/large/extra-large]"
  },
  "description": "Brief description of the meal",
  "confidence": "high/medium/low"
}

**ESTIMATION RULES:**
- Use typical restaurant/home portion sizes
- If multiple items, sum the calories
- Be conservative with estimates (don't over-estimate)
- Include all visible foods in the items array

Return ONLY valid JSON, no additional text.`
    } 
    // RECEIPT SCANNING - Specialized prompt
    else if (scanMode === 'receipt') {
      systemPrompt = `You are an AI that extracts data from receipts for expense tracking.

**YOUR JOB:**
1. Extract merchant name, date, total amount
2. Identify individual items if visible
3. Categorize the expense

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "financial",
  "type": "receipt",
  "data": {
    "merchant": "[Store/Restaurant name]",
    "amount": [total amount as number],
    "date": "[date if visible, ISO format]",
    "category": "[groceries/dining/shopping/entertainment/transportation/utilities/other]",
    "items": [{"name": "item", "price": 0.00}],
    "paymentMethod": "[cash/card/unknown]"
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // EDUCATION DOCUMENTS - Specialized prompt for school/academic documents
    else if (['diploma', 'transcript', 'report_card', 'assignment', 'syllabus', 'exam', 'scholarship', 'tuition_bill', 'research_paper'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts data from educational documents.

**YOUR JOB:**
1. Identify the type of educational document
2. Extract key information (school, student, grades, dates, etc.)
3. Return structured data

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "education",
  "type": "${scanMode}",
  "data": {
    "institution": "[School/University name]",
    "studentName": "[Student name if visible]",
    "date": "[Date in ISO format if visible]",
    "title": "[Document title/course name]",
    "grade": "[Grade/score if applicable]",
    "details": "[Any other relevant details]"
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // WORK & CAREER DOCUMENTS
    else if (['resume', 'job_offer', 'employment_contract', 'performance_review', 'nda', 'business_card'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts data from work/career documents.

**YOUR JOB:**
1. Identify the document type
2. Extract relevant career/employment information
3. Return structured data

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "career",
  "type": "${scanMode}",
  "data": {
    "company": "[Company name]",
    "position": "[Job title/position]",
    "name": "[Person's name]",
    "date": "[Date if visible]",
    "salary": "[Salary if visible]",
    "details": "[Other relevant details]"
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // PROJECT DOCUMENTS
    else if (['project_plan', 'meeting_notes', 'whiteboard', 'diagram', 'blueprint'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts information from project/planning documents.

**YOUR JOB:**
1. Identify the document type
2. Extract key information (project name, tasks, dates, participants)
3. Capture important details and action items

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "career",
  "type": "${scanMode}",
  "data": {
    "projectName": "[Project name if visible]",
    "date": "[Date if visible]",
    "participants": ["list", "of", "participants"],
    "actionItems": ["key", "action", "items"],
    "notes": "[Key points/content captured]"
  },
  "description": "Brief description of the document",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // ID & LEGAL DOCUMENTS
    else if (['id_card', 'drivers_license', 'passport', 'birth_certificate', 'social_security_card', 'insurance_card'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts data from identity documents. Be careful with sensitive data.

**YOUR JOB:**
1. Identify the document type
2. Extract key identifying information
3. Note expiration dates if present

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "legal",
  "type": "${scanMode}",
  "data": {
    "documentType": "${scanMode}",
    "name": "[Full name]",
    "number": "[ID/Document number - partially masked for security]",
    "expirationDate": "[Expiration date if visible]",
    "issueDate": "[Issue date if visible]",
    "issuer": "[Issuing authority/state]"
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Note: For privacy, mask sensitive numbers like SSN (show only last 4 digits).
Return ONLY valid JSON.`
    }
    // MEDICAL DOCUMENTS
    else if (['medical_record', 'prescription', 'lab_results', 'vaccination_record', 'xray', 'medical_bill', 'eob'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts data from medical documents.

**YOUR JOB:**
1. Identify the medical document type
2. Extract relevant health information
3. Note dates and providers

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "health",
  "type": "${scanMode}",
  "data": {
    "provider": "[Healthcare provider/facility]",
    "date": "[Date of service/document]",
    "patientName": "[Patient name]",
    "diagnosis": "[Diagnosis/condition if present]",
    "medications": ["list", "of", "medications"],
    "results": "[Test results or findings]",
    "amount": [Amount if it's a bill - number only]
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // VEHICLE DOCUMENTS
    else if (['vehicle_registration', 'vehicle_title', 'vehicle_insurance', 'smog_certificate', 'car_loan'].includes(scanMode)) {
      systemPrompt = `You are an AI that extracts data from vehicle documents.

**YOUR JOB:**
1. Identify the vehicle document type
2. Extract vehicle and owner information
3. Note important dates

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "vehicles",
  "type": "${scanMode}",
  "data": {
    "make": "[Vehicle make]",
    "model": "[Vehicle model]",
    "year": [Vehicle year],
    "vin": "[VIN if visible]",
    "licensePlate": "[License plate]",
    "owner": "[Owner name]",
    "expirationDate": "[Expiration/renewal date]"
  },
  "description": "Brief description",
  "confidence": "high/medium/low"
}

Return ONLY valid JSON.`
    }
    // GENERAL SCANNING - Comprehensive auto-detect prompt
    else {
      systemPrompt = `You are an AI assistant that analyzes images and extracts structured data for a life management app.

**SUPPORTED DOCUMENT TYPES:**
${documentTypesList}

**DOMAINS:**
financial, health, nutrition, fitness, vehicles, home, pets, education, career, legal, insurance, travel, relationships, digital-life, mindfulness, appliances

**YOUR JOB:**
1. Analyze the image and identify what type of document or data it contains
2. Match it to the most appropriate document type from the list above
3. Extract ALL relevant information (amounts, dates, names, etc.)
4. Return structured JSON

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "domain": "[most appropriate domain]",
  "type": "[document type from list above]",
  "data": {
    // Include all extracted fields relevant to this document type
    // For receipts: merchant, amount, date, items
    // For IDs: name, number, expiration
    // For education: institution, grade, date
    // etc.
  },
  "description": "Brief description of what you see",
  "confidence": "high/medium/low"
}

**IMPORTANT:**
- Always try to identify a specific document type rather than "general"
- Extract as much structured data as possible
- For amounts, use numbers only (no currency symbols in the number)
- For dates, use ISO format when possible

Return ONLY valid JSON with no additional text.`
    }

    const visionResponse = await AI.requestAI({
      prompt: 'Analyze this image and extract structured data in the JSON format specified.',
      systemPrompt,
      maxTokens: 1000,
      image
    })

    const analysisText = visionResponse.content || '{}'
    console.log('🤖 [GPT-4 VISION] Raw response:', analysisText)

    // Parse the JSON response
    let analysisData
    try {
      // Remove markdown code blocks if present
      const jsonText = analysisText.replace(/```json\n?|\n?```/g, '').trim()
      analysisData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ [JSON PARSE ERROR]:', parseError)
      throw new Error('Failed to parse AI response')
    }

    console.log('📊 [EXTRACTED DATA]:', JSON.stringify(analysisData, null, 2))

    // Validate that we have the required fields
    if (!analysisData.domain || !analysisData.data) {
      throw new Error('Invalid analysis data structure')
    }

    // Upload image to Google Drive and Supabase Storage
    const fileUploads = await uploadImageToStorage(
      user.id,
      image,
      analysisData.domain,
      analysisData.type,
      session
    )

    // Now save the data to the correct domain using the same logic as voice commands
    const savedData = await saveImageDataToSupabase(
      supabase,
      user.id,
      analysisData.domain,
      analysisData.type,
      analysisData.data,
      fileUploads
    )

    // Generate confirmation message
    let confirmationMessage = ''
    let detailedMessage = ''
    
    if (analysisData.domain === 'financial' && analysisData.data.amount) {
      confirmationMessage = `✅ Logged expense: $${analysisData.data.amount}${analysisData.data.merchant ? ` at ${analysisData.data.merchant}` : ''}`
      detailedMessage = `🧾 **Receipt Scanned**\n\n**Merchant:** ${analysisData.data.merchant || 'Unknown'}\n**Amount:** $${analysisData.data.amount}\n**Category:** ${analysisData.data.category || 'Other'}\n\n${confirmationMessage}`
    } else if (analysisData.domain === 'health' && analysisData.data.weight) {
      confirmationMessage = `✅ Logged weight: ${analysisData.data.weight} ${analysisData.data.unit || 'lbs'}`
      detailedMessage = `⚖️ **Weight Logged**\n\n${confirmationMessage}`
    } else if (analysisData.domain === 'vehicles' && analysisData.data.mileage) {
      confirmationMessage = `✅ Logged mileage: ${analysisData.data.mileage.toLocaleString()} ${analysisData.data.unit || 'miles'}`
      detailedMessage = `🚗 **Mileage Logged**\n\n${confirmationMessage}`
    } else if (analysisData.domain === 'nutrition' && analysisData.data.calories) {
      // Detailed meal confirmation
      const d = analysisData.data
      confirmationMessage = `✅ Logged meal: ${d.name || 'Meal'}`
      detailedMessage = `🍽️ **Meal Logged to Nutrition**\n\n**${d.name || 'Meal'}**${d.mealType ? ` (${d.mealType})` : ''}\n\n` +
        `📊 **Nutrition Facts:**\n` +
        `• Calories: **${d.calories}** kcal\n` +
        `• Protein: **${d.protein || 0}g**\n` +
        `• Carbs: **${d.carbs || 0}g**\n` +
        `• Fat: **${d.fats || 0}g**\n` +
        `• Fiber: **${d.fiber || 0}g**\n\n` +
        (d.items?.length ? `**Items detected:** ${d.items.join(', ')}\n\n` : '') +
        confirmationMessage
    } else if (analysisData.domain === 'nutrition') {
      confirmationMessage = `✅ Logged ${analysisData.type || 'nutrition entry'}`
      detailedMessage = `🥗 **Nutrition Entry**\n\n${analysisData.description}\n\n${confirmationMessage}`
    } else {
      confirmationMessage = `✅ Logged ${analysisData.description || 'data'} in ${analysisData.domain.charAt(0).toUpperCase() + analysisData.domain.slice(1)} domain`
      detailedMessage = `📊 **${analysisData.domain.charAt(0).toUpperCase() + analysisData.domain.slice(1)}**\n\n${analysisData.description}\n\n${confirmationMessage}`
    }

    // Add storage info to message
    let storageInfo = ''
    if (fileUploads.driveUrl) {
      storageInfo = '\n\n☁️ **Saved to Google Drive**'
    } else if (fileUploads.supabaseUrl) {
      storageInfo = '\n\n💾 **Saved to cloud storage**'
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysisData,
        confirmationMessage,
        driveUrl: fileUploads.driveUrl,
        supabaseUrl: fileUploads.supabaseUrl
      },
      message: detailedMessage + storageInfo
    })

  } catch (error: any) {
    console.error('❌ [IMAGE ANALYSIS ERROR]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to analyze image' 
      },
      { status: 500 }
    )
  }
}

// Upload image to Google Drive and Supabase Storage
async function uploadImageToStorage(
  userId: string,
  imageBase64: string,
  domain: string,
  type: string,
  session: any
): Promise<{ driveUrl?: string; driveFileId?: string; supabaseUrl?: string; thumbnailUrl?: string }> {
  const result: { driveUrl?: string; driveFileId?: string; supabaseUrl?: string; thumbnailUrl?: string } = {}
  
  try {
    // Extract base64 data (remove data:image/...;base64, prefix)
    const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      console.error('⚠️ Invalid image base64 format')
      return result
    }
    
    const imageFormat = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${type || 'scan'}_${timestamp}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`
    const mimeType = `image/${imageFormat}`

    console.log(`📤 [UPLOAD] Starting upload for ${fileName} to domain: ${domain}`)

    // 1. Upload to Supabase Storage first (always works)
    try {
      const adminClient = getSupabaseAdmin()
      const filePath = `${userId}/${domain}/${fileName}`
      
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false
        })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = adminClient.storage
          .from('documents')
          .getPublicUrl(filePath)
        
        result.supabaseUrl = publicUrl
        console.log('✅ [UPLOAD] Saved to Supabase Storage:', publicUrl)
      } else if (uploadError) {
        console.error('⚠️ Supabase Storage upload failed:', uploadError.message)
      }
    } catch (storageErr: any) {
      console.error('⚠️ Supabase Storage error:', storageErr.message)
    }

    // 2. Try Google Drive upload (requires OAuth)
    try {
      // Get Google tokens
      let googleAccessToken = session?.provider_token || null
      let googleRefreshToken = session?.provider_refresh_token || null

      // Fallback to stored tokens
      if (!googleAccessToken) {
        const storedTokens = await getGoogleTokens()
        if (storedTokens) {
          googleAccessToken = storedTokens.accessToken
          googleRefreshToken = storedTokens.refreshToken
          console.log('✅ Found Google tokens in storage')
        }
      }

      if (googleAccessToken) {
        // Validate/refresh token
        const tokenResult = await getValidGoogleToken(
          userId,
          googleAccessToken,
          googleRefreshToken
        )

        if (tokenResult.success && tokenResult.accessToken) {
          const driveService = new GoogleDriveService(
            tokenResult.accessToken,
            googleRefreshToken || undefined
          )

          const driveFile = await driveService.uploadFile({
            file: buffer,
            fileName,
            mimeType,
            domainFolder: domain,
            extractedText: type ? `Document type: ${type}` : undefined
          })

          result.driveFileId = driveFile.id
          result.driveUrl = driveFile.webViewLink
          result.thumbnailUrl = driveFile.thumbnailLink

          console.log('✅ [UPLOAD] Saved to Google Drive:', driveFile.webViewLink)
        } else {
          console.log('⚠️ Google token validation failed, skipping Drive upload')
        }
      } else {
        console.log('ℹ️ No Google OAuth token, skipping Drive upload')
      }
    } catch (driveErr: any) {
      console.error('⚠️ Google Drive upload failed:', driveErr.message)
    }

    return result
  } catch (err: any) {
    console.error('❌ [UPLOAD] Error:', err.message)
    return result
  }
}

// Save image data to Supabase in the same format as voice commands
async function saveImageDataToSupabase(
  supabase: any,
  userId: string,
  domain: string,
  type: string,
  data: any,
  fileUploads?: { driveUrl?: string; driveFileId?: string; supabaseUrl?: string; thumbnailUrl?: string }
) {
  console.log(`💾 [SAVE IMAGE DATA] Domain: ${domain}, Type: ${type}`)
  
  try {
    const now = new Date().toISOString()

    // Generate smart title based on domain and type (normalized rows)
    let title = type || 'Entry'
    if (domain === 'financial' && data.amount) {
      title = `$${data.amount}${data.merchant ? ' - ' + data.merchant : ''}${data.category ? ' (' + data.category + ')' : ''}`
    } else if (domain === 'health' && data.weight) {
      title = `${data.weight} ${data.unit || 'lbs'}`
    } else if (domain === 'vehicles' && data.mileage) {
      title = `Mileage: ${data.mileage.toLocaleString()} ${data.unit || 'miles'}`
    } else if (domain === 'vehicles' && data.pricePerGallon) {
      title = `Gas: $${data.pricePerGallon}/gal`
    } else if (domain === 'nutrition' && data.description) {
      title = `${data.description}${data.calories ? ' (' + data.calories + ' cal)' : ''}`
    } else if (domain === 'health' && data.name) {
      title = `${data.name}${data.dosage ? ' ' + data.dosage : ''}`
    }

    // For nutrition meals, ensure name field is set (UI expects metadata.name)
    if (domain === 'nutrition' && type === 'meal' && !data.name && data.description) {
      data.name = data.description
    }

    // Insert normalized domain_entries row with file links
    const { data: inserted, error: insertError } = await supabase
      .from('domain_entries')
      .insert({
        user_id: userId,
        domain,
        title,
        description: data.description || data.merchant || data.notes || '',
        metadata: { 
          ...data, 
          type, 
          logType: type === 'meal' ? 'meal' : undefined,  // Add logType for meals
          source: 'image_scan', 
          timestamp: now,
          // File storage links
          ...(fileUploads?.supabaseUrl && { fileUrl: fileUploads.supabaseUrl }),
          ...(fileUploads?.driveUrl && { driveUrl: fileUploads.driveUrl }),
          ...(fileUploads?.driveFileId && { driveFileId: fileUploads.driveFileId }),
          ...(fileUploads?.thumbnailUrl && { thumbnailUrl: fileUploads.thumbnailUrl }),
          uploadedToCloud: !!(fileUploads?.driveUrl || fileUploads?.supabaseUrl)
        },
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      throw insertError
    }

    console.log(`✅ [SAVE SUCCESS] Saved image data to domain_entries (${domain})!`)

    // Also save to documents table for document scans (not meals/financial)
    if (fileUploads && (fileUploads.supabaseUrl || fileUploads.driveUrl)) {
      const isDocument = !['meal', 'receipt'].includes(type)
      if (isDocument) {
        try {
          const adminClient = getSupabaseAdmin()
          await adminClient
            .from('documents')
            .insert({
              user_id: userId,
              domain,
              document_name: title,
              document_type: type,
              file_url: fileUploads.supabaseUrl || null,
              drive_file_id: fileUploads.driveFileId || null,
              web_view_link: fileUploads.driveUrl || null,
              thumbnail_link: fileUploads.thumbnailUrl || null,
              metadata: {
                ...data,
                source: 'image_scan',
                scanTimestamp: now
              }
            })
          console.log(`✅ [SAVE SUCCESS] Also saved to documents table`)
        } catch (docErr: any) {
          console.warn('⚠️ Failed to save to documents table:', docErr.message)
        }
      }
    }

    return inserted

  } catch (error: any) {
    console.error(`❌ [SAVE FAILED] Error saving to Supabase:`, error)
    throw error
  }
}


