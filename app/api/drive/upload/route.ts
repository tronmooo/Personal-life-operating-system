import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { createClient } from '@supabase/supabase-js'
import { extractStructuredMetadata, ExtractedMetadata } from '@/lib/ocr-processor'

/**
 * POST /api/drive/upload
 * Upload a file to Google Drive and save metadata to Supabase
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get Google access token from session
    const accessToken = session.provider_token
    const refreshToken = session.provider_refresh_token

    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const domain = formData.get('domain') as string
    const recordId = formData.get('recordId') as string
    const extractedText = formData.get('extractedText') as string | null

    if (!file || !domain) {
      return NextResponse.json({ error: 'Missing file or domain' }, { status: 400 })
    }

    console.log(`📤 Uploading ${file.name} to Google Drive (${domain})...`)
    console.log('   Access token exists:', accessToken.substring(0, 20) + '...')
    console.log('   GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID)
    console.log('   GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)
    console.log('   Domain folder:', domain)

    // Extract structured metadata from OCR text (if available)
    let extractedMetadata: ExtractedMetadata = {}
    if (extractedText) {
      console.log('🔍 Extracting structured metadata from OCR text...')
      extractedMetadata = await extractStructuredMetadata(extractedText)
      console.log('✨ Extracted metadata:', extractedMetadata)
    }

    const driveService = new GoogleDriveService(
      accessToken,
      refreshToken || ''
    )
    console.log('   ✅ GoogleDriveService initialized')

    // Upload to Google Drive
    const driveFile = await driveService.uploadFile({
      file,
      fileName: file.name,
      mimeType: file.type,
      domainFolder: domain,
      extractedText: extractedText || undefined,
    })

    // Save metadata to Supabase with ALL extracted fields (using service role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const documentMetadata = {
      // Required/base columns
      user_id: session.user.id, // Supabase user UUID
      domain: domain, // Domain type (insurance, health, etc.)
      domain_id: recordId && recordId !== 'null' ? recordId : null, // Link to policy/record if provided (must be UUID or null)
      drive_file_id: driveFile.id,
      file_name: driveFile.name,
      mime_type: driveFile.mimeType,
      web_view_link: driveFile.webViewLink,
      web_content_link: driveFile.webContentLink,
      thumbnail_link: driveFile.thumbnailLink,
      file_size: driveFile.size,
      extracted_text: extractedText,
      // Optional AI-extracted base fields
      document_name: extractedMetadata.documentName || null,
      document_description: extractedMetadata.documentDescription || null,
      issue_date: extractedMetadata.issueDate || null,
      expiration_date: extractedMetadata.expirationDate || null,
      document_type: extractedMetadata.documentType || null,
      issuing_organization: extractedMetadata.issuingOrganization || null,
      holder_name: extractedMetadata.holderName || null,
      identification_numbers: extractedMetadata.identificationNumbers || null,
      key_dates: extractedMetadata.keyDates || null,
      additional_info: extractedMetadata.additionalInfo || null,
      // Category-specific fields from AI extraction
      coverage_amount: extractedMetadata.coverageAmount || null,
      premium: extractedMetadata.premium || null,
      effective_date: extractedMetadata.effectiveDate || null,
      id_type: extractedMetadata.idType || null,
      address: extractedMetadata.address || null,
      parcel_number: extractedMetadata.parcelNumber || null,
      mortgage_number: extractedMetadata.mortgageNumber || null,
      party_a: extractedMetadata.partyA || null,
      party_b: extractedMetadata.partyB || null,
      case_number_ext: extractedMetadata.caseNumberExt || null,
      patient_name: extractedMetadata.patientName || null,
      provider_name: extractedMetadata.providerName || null,
      test_date: extractedMetadata.testDate || null,
      tax_year: extractedMetadata.taxYear || null,
      form_type: extractedMetadata.formType || null,
      vin: extractedMetadata.vin || null,
      plate: extractedMetadata.plate || null,
      registration_date: extractedMetadata.registrationDate || null,
      school: extractedMetadata.school || null,
      credential: extractedMetadata.credential || null,
      graduation_date: extractedMetadata.graduationDate || null,
      attorney: extractedMetadata.attorney || null,
      instrument_type: extractedMetadata.instrumentType || null,
      signed_date: extractedMetadata.signedDate || null,
    }

    console.log('💾 Saving document metadata to Supabase...', { file_name: driveFile.name, user_id: session.user.id })

    // Store in documents table
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert(documentMetadata)
      .select()
      .single()

    if (error) {
      console.error('❌ Error saving document metadata:', error)
      // Don't fail the upload if metadata save fails
    } else {
      console.log('✅ Document metadata saved to Supabase:', data.id)
    }

    return NextResponse.json({
      success: true,
      file: driveFile,
      metadata: data,
      extractedMetadata, // Include extracted metadata in response
    })
  } catch (error: any) {
    console.error('Upload error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

