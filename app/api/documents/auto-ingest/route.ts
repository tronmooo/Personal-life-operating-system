import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { GoogleDriveService } from '@/lib/integrations/google-drive'

/**
 * Validates and sanitizes a date string for PostgreSQL
 * Returns null for invalid dates like "0000-00-00" or malformed dates
 */
function sanitizeDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  
  // Reject obviously invalid dates
  if (dateString === '0000-00-00' || dateString.startsWith('0000-')) {
    console.log(`⚠️ Sanitizing invalid date: "${dateString}" → null`)
    return null
  }
  
  try {
    const date = new Date(dateString)
    // Check if date is valid and not in the past century or too far in future
    if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
      console.log(`⚠️ Sanitizing invalid date: "${dateString}" → null`)
      return null
    }
    return dateString
  } catch {
    console.log(`⚠️ Sanitizing unparseable date: "${dateString}" → null`)
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('\n🚀 ============ AUTO-INGEST START ============')
  console.log(`⏰ Start time: ${new Date().toISOString()}`)
  
  try {
    // Auth check
    console.log('🔐 Step 1: Checking authentication...')
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth failed: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log(`✅ Auth success: ${user.email}`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('📦 Step 2: Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('✅ File received:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    })

    // STEP 1: Use OpenAI Vision (ChatGPT) to extract ALL info from the image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    console.log('🤖 Step 3: Calling OpenAI Vision...')

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured!')
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.')
    }

    console.log(`✅ API key found (starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...)`)
    
    // Initialize OpenAI client with API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    console.log('✅ OpenAI client initialized')

    // Add timeout to OpenAI API call (30 seconds)
    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this document and extract information. This is for OFFICIAL DOCUMENTS only (IDs, licenses, insurance, legal docs, registrations, etc.).

**Extract:**
1. **Title** - Be specific with issuer (e.g., "Driver License - California DMV", "Auto Insurance - Geico", "Passport - USA", "Credit Card - Chase Visa")
2. **Type** - Exact document type from this list:
   - Identity: Driver License, Passport, State ID, Birth Certificate, Social Security Card, Visa, Work Permit, Green Card
   - Insurance: Auto Insurance, Health Insurance, Home Insurance, Life Insurance, Dental Insurance, Pet Insurance, Renters Insurance
   - Vehicle: Vehicle Registration, Vehicle Title, Smog Certificate, Inspection Sticker, Parking Permit
   - Health: Prescription, Vaccination Certificate, Medical Card, Lab Result, Health Record
   - Financial: Credit Card, Debit Card, Bank Statement, Tax Return, Loan Agreement
   - Property: Lease Agreement, Deed, Mortgage, Property Tax, Home Warranty
   - Legal: Contract, Will, Power of Attorney, License Agreement, Certification
   - Education: Diploma, Transcript, Student ID, Certificate
   - Professional: Business License, Professional License, Permit, Certification
   - Membership: Gym Membership, Club Membership, Subscription Card
3. **Expiration Date** - Find ANY date labeled: EXPIRES, EXPIRATION, VALID UNTIL, VALID THRU, RENEWAL, EXP DATE, EFFECTIVE END, etc.
4. **Category** - Pick the BEST match:
   - identity = Driver License, Passport, State ID, Birth Certificate, Social Security, Visa, Work Permit
   - insurance = Any type of insurance card or policy
   - vehicles = Vehicle Registration, Title, Inspection (NOT Driver License!)
   - health = Medical records, prescriptions, vaccination records
   - financial = Credit/debit cards, bank statements, tax documents
   - legal = Contracts, wills, legal agreements, certifications
   - education = Diplomas, transcripts, student IDs
   - home = Leases, deeds, mortgages, property documents
   - professional = Business licenses, professional certifications, permits
   - miscellaneous = Anything else

**IMPORTANT:** Driver License = identity category (NOT vehicles!)

Return ONLY JSON:
{"documentTitle":"specific title","documentType":"exact type","expirationDate":"YYYY-MM-DD or null","category":"category","ocrText":"all visible text"}

**Date Format:** "03/15/2025"→"2025-03-15", "12/2025"→"2025-12-31", "2025"→"2025-12-31"`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI API request timed out after 30 seconds')), 30000)
    )

    const completion = await Promise.race([completionPromise, timeoutPromise]) as Awaited<typeof completionPromise>

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ OpenAI API call completed in ${elapsed}s`)
    
    const aiText = completion.choices[0]?.message?.content || ''
    console.log('📝 OpenAI response length:', aiText.length, 'characters')
    console.log('📝 OpenAI response preview:', aiText.substring(0, 200))

    // Parse JSON from response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON')
    }

    const extracted = JSON.parse(jsonMatch[0])
    console.log('✅ Extracted data (raw):', extracted)
    
    // Sanitize the expiration date
    const sanitizedExpirationDate = sanitizeDate(extracted.expirationDate)
    if (extracted.expirationDate && !sanitizedExpirationDate) {
      console.log(`⚠️ Expiration date "${extracted.expirationDate}" was sanitized to null`)
    }
    
    console.log('✅ Extracted data (sanitized):', { ...extracted, expirationDate: sanitizedExpirationDate })

    // Map AI categories to Document Manager tab categories
    const categoryMap: Record<string, string> = {
      'identity': 'ID & Licenses',
      'insurance': 'Insurance',
      'health': 'Medical',
      'vehicles': 'Vehicle',
      'home': 'Property',
      'financial': 'Financial & Tax',
      'legal': 'Legal',
      'education': 'Education',
      'professional': 'Legal',
      'pets': 'Medical', // Pet medical records
      'travel': 'ID & Licenses', // Passports, visas
      'miscellaneous': 'Insurance' // Default fallback
    }
    
    // Enhanced mapping based on document type (CHECK DOCUMENT TYPE FIRST!)
    const docTypeLower = extracted.documentType?.toLowerCase() || ''
    const docTitleLower = extracted.documentTitle?.toLowerCase() || ''
    
    let mappedCategory = 'Insurance' // Default
    
    // PRIORITY 1: Check document type for specific keywords (override AI category)
    if (docTypeLower.includes('license') && !docTypeLower.includes('business license')) {
      // Driver License, Professional License, etc. (but NOT business licenses)
      mappedCategory = 'ID & Licenses'
    } else if (docTypeLower.includes('passport') || docTypeLower.includes('visa') || 
               docTypeLower.includes('birth certificate') || docTypeLower.includes('social security') ||
               docTypeLower.includes('id card') || docTypeLower.includes('id ') || 
               docTypeLower === 'id') {
      mappedCategory = 'ID & Licenses'
    } else if (docTypeLower.includes('registration') || docTypeLower.includes('title') || 
               docTypeLower.includes('vehicle')) {
      mappedCategory = 'Vehicle'
    } else if (docTypeLower.includes('deed') || docTypeLower.includes('lease') || 
               docTypeLower.includes('mortgage')) {
      mappedCategory = 'Property'
    } else if (docTypeLower.includes('diploma') || docTypeLower.includes('transcript') || 
               docTypeLower.includes('certificate')) {
      mappedCategory = 'Education'
    } else if (docTypeLower.includes('tax') || docTypeLower.includes('bank') || 
               docTypeLower.includes('credit card') || docTypeLower.includes('statement')) {
      mappedCategory = 'Financial & Tax'
    } else if (docTypeLower.includes('prescription') || docTypeLower.includes('medical') || 
               docTypeLower.includes('health card') || docTypeLower.includes('lab result')) {
      mappedCategory = 'Medical'
    } else if (docTypeLower.includes('contract') || docTypeLower.includes('will') || 
               docTypeLower.includes('power of attorney') || docTypeLower.includes('agreement')) {
      mappedCategory = 'Legal'
    } else if (docTypeLower.includes('insurance')) {
      mappedCategory = 'Insurance'
    } else {
      // PRIORITY 2: Fall back to AI category mapping
      mappedCategory = categoryMap[extracted.category?.toLowerCase()] || 'Insurance'
    }
    
    console.log('📂 Mapped category:', extracted.category, '+', extracted.documentType, '→', mappedCategory)

    // STEP 2: Upload to Supabase Storage in categorized folder
    const fileExt = file.name.split('.').pop()
    const storageCategory = extracted.category || 'miscellaneous'
    const fileName = `${user.id}/${storageCategory}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    console.log('✅ File uploaded to Supabase Storage:', publicUrl)

    // STEP 2.5: Upload to Google Drive if user has OAuth token
    let driveFileId: string | null = null
    let driveWebViewLink: string | null = null
    let driveWebContentLink: string | null = null
    let driveThumbnailLink: string | null = null

    if (session.provider_token) {
      console.log('🔑 Google provider token found - attempting Google Drive upload...')
      console.log('   Provider token exists:', session.provider_token.substring(0, 20) + '...')
      console.log('   GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID)
      console.log('   GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)
      console.log('   Domain folder:', storageCategory)
      try {
        const driveService = new GoogleDriveService(
          session.provider_token,
          session.provider_refresh_token || undefined
        )

        // Re-read the file for Drive upload
        const fileArrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(fileArrayBuffer)

        const driveFile = await driveService.uploadFile({
          file: fileBuffer,
          fileName: file.name,
          mimeType: file.type,
          domainFolder: storageCategory,
          extractedText: extracted.ocrText || undefined,
        })

        driveFileId = driveFile.id
        driveWebViewLink = driveFile.webViewLink || null
        driveWebContentLink = driveFile.webContentLink || null
        driveThumbnailLink = driveFile.thumbnailLink || null

        console.log('✅ File also uploaded to Google Drive!')
        console.log('   Drive File ID:', driveFileId)
        console.log('   Drive View Link:', driveWebViewLink)
      } catch (driveError: any) {
        // Don't fail the entire upload if Drive fails
        console.error('⚠️ Google Drive upload failed (non-critical):', driveError.message)
        console.error('   Error details:', driveError)
      }
    } else {
      console.log('ℹ️ No Google provider token - skipping Google Drive upload')
    }

    // STEP 3: Save to documents table with all metadata (including Drive links)
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        domain: extracted.category || 'miscellaneous',
        file_path: publicUrl,
        file_url: publicUrl,
        file_name: file.name,
        document_name: extracted.documentTitle || extracted.documentType || file.name,
        document_type: extracted.documentType || mappedCategory,
        mime_type: file.type,
        file_size: file.size,
        ocr_text: extracted.ocrText || null,
        ocr_processed: true,
        ocr_confidence: 95,
        expiration_date: sanitizedExpirationDate,
        // Google Drive fields
        drive_file_id: driveFileId,
        web_view_link: driveWebViewLink,
        web_content_link: driveWebContentLink,
        thumbnail_link: driveThumbnailLink,
        metadata: {
          aiExtracted: true,
          extractedBy: 'openai-vision',
          category: mappedCategory,
          originalCategory: extracted.category,
          uploadedToDrive: !!driveFileId
        }
      })
      .select()
      .single()

    if (docError) {
      throw new Error(`Failed to save document: ${docError.message}`)
    }

    console.log('✅ Document saved to database:', docData.id)

    // STEP 4: Save to domain_entries for organization
    const { error: domainError } = await supabase
      .from('domain_entries')
      .insert({
        user_id: user.id,
        domain: 'documents',
        title: extracted.documentTitle || extracted.documentType || file.name,
        description: `${extracted.documentType || 'Document'} - Uploaded ${new Date().toLocaleDateString()}`,
        metadata: {
          category: mappedCategory,
          originalCategory: extracted.category,
          file_url: publicUrl,
          expiration_date: extracted.expirationDate,
          ocr_text: extracted.ocrText,
          document_id: docData.id,
          document_type: extracted.documentType
        }
      })

    if (domainError) {
      console.warn('⚠️ Failed to create domain entry:', domainError)
    } else {
      console.log('✅ Domain entry created')
    }

    // STEP 4b: If it's auto insurance, ALSO add to vehicles domain
    const isAutoInsurance = 
      (extracted.documentType?.toLowerCase().includes('auto') || 
       extracted.documentType?.toLowerCase().includes('vehicle') ||
       extracted.ocrText?.toLowerCase().includes('vehicle') ||
       extracted.ocrText?.toLowerCase().includes('vin')) &&
      extracted.category === 'insurance'

    if (isAutoInsurance) {
      const { error: vehicleError } = await supabase
        .from('domain_entries')
        .insert({
          user_id: user.id,
          domain: 'vehicles',
          title: extracted.documentTitle || extracted.documentType || file.name,
          description: `Auto Insurance Document - Uploaded ${new Date().toLocaleDateString()}`,
          metadata: {
            type: 'insurance_document',
            file_url: publicUrl,
            expiration_date: extracted.expirationDate,
            document_id: docData.id,
            insurance_type: 'auto',
            document_type: extracted.documentType
          }
        })

      if (vehicleError) {
        console.warn('⚠️ Failed to create vehicle entry:', vehicleError)
      } else {
        console.log('✅ Vehicle domain entry created (auto insurance)')
      }
    }

    // STEP 5: Create critical alert if expiration date exists
    // Alert shows from 30 days BEFORE until 30 days AFTER expiration
    if (sanitizedExpirationDate) {
      try {
        const expiryDate = new Date(sanitizedExpirationDate)
        const today = new Date()
        const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Show alert from 30 days before to 30 days after expiration
        if (daysUntil >= -30 && daysUntil <= 30) {
            let alertTitle = ''
            let priority = 'medium'
            
            if (daysUntil < 0) {
              // Already expired
              const daysExpired = Math.abs(daysUntil)
              alertTitle = `🚨 ${extracted.documentTitle || extracted.documentType} expired ${daysExpired} day${daysExpired > 1 ? 's' : ''} ago - RENEW NOW!`
              priority = 'high'
            } else if (daysUntil === 0) {
              alertTitle = `🚨 ${extracted.documentTitle || extracted.documentType} expires TODAY!`
              priority = 'high'
            } else if (daysUntil <= 7) {
              alertTitle = `⚠️ ${extracted.documentTitle || extracted.documentType} expires in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
              priority = 'high'
            } else if (daysUntil <= 14) {
              alertTitle = `⚠️ ${extracted.documentTitle || extracted.documentType} expires in ${daysUntil} days`
              priority = 'high'
            } else {
              alertTitle = `📅 ${extracted.documentTitle || extracted.documentType} expires in ${daysUntil} days`
              priority = 'medium'
            }

            const { error: alertError } = await supabase
              .from('domain_entries')
              .insert({
                user_id: user.id,
                domain: 'critical_alerts',
                title: alertTitle,
                description: `Expiration: ${new Date(sanitizedExpirationDate).toLocaleDateString()} | Type: ${extracted.documentType || 'Document'} | Category: ${mappedCategory}`,
                metadata: {
                  date: sanitizedExpirationDate,
                  category: mappedCategory,
                  file_url: publicUrl,
                  drive_link: driveWebViewLink,
                  alert_type: 'expiration',
                  document_id: docData.id,
                  days_until: daysUntil,
                  priority: priority,
                  is_expired: daysUntil < 0,
                  document_type: extracted.documentType,
                  document_title: extracted.documentTitle
                }
              })

          if (alertError) {
            console.warn('⚠️ Failed to create alert:', alertError)
          } else {
            console.log(`✅ Critical alert created: "${alertTitle}" (${daysUntil} days)`)
          }
        } else {
          console.log(`ℹ️ No alert needed - document expires in ${daysUntil} days (outside -30 to +30 day window)`)
        }
      } catch (err) {
        console.warn('⚠️ Failed to process expiration alert:', err)
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ ========== AUTO-INGEST SUCCESS (${totalTime}s) ==========`)
    console.log('📊 Summary:', {
      documentId: docData.id,
      title: extracted.documentTitle,
      type: extracted.documentType,
      category: mappedCategory,
      expiration: extracted.expirationDate,
      duration: `${totalTime}s`
    })
    console.log('========================================\n')

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and categorized successfully',
      document: docData,
      extracted: {
        documentTitle: extracted.documentTitle,
        documentType: extracted.documentType,
        expirationDate: extracted.expirationDate,
        category: extracted.category
      }
    })

  } catch (error: any) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`\n❌ ========== AUTO-INGEST FAILED (${totalTime}s) ==========`)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('========================================\n')
    
    return NextResponse.json({ 
      error: error.message || 'Failed to process document',
      errorType: error.constructor.name,
      success: false 
    }, { status: 500 })
  }
}


