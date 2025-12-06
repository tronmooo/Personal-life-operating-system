/**
 * Document Saver - Save scanned documents to appropriate domains
 * Uploads to Supabase Storage (Google Drive upload handled by API)
 */

import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface ScannedDocument {
  text: string
  documentType: string
  confidence: number
  suggestedDomain: string
  suggestedAction: string
  reasoning: string
  extractedData: any
  icon: string
  file?: File
  previewUrl?: string
}

export class DocumentSaver {
  private supabase = createClientComponentClient()

  /**
   * Save a scanned document to the appropriate domain
   */
  async saveToSupabase(document: ScannedDocument): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('💾 Saving document to Supabase...', {
        type: document.documentType,
        domain: document.suggestedDomain,
      })

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Upload file to Supabase Storage if provided
      let fileUrl: string | null = null
      
      if (document.file) {
        console.log('📁 File provided:', {
          name: document.file.name,
          size: document.file.size,
          type: document.file.type
        })
        
        // Upload to Supabase Storage
        fileUrl = await this.uploadFile(document.file, user.id)
        console.log('📎 Supabase upload result:', fileUrl || 'EMPTY - File not uploaded')
      } else {
        console.log('⚠️ No file provided in document object')
      }

      // Route to appropriate domain based on document type and extracted data
      const result = await this.routeAndSave(document, user.id, fileUrl)

      console.log('✅ Document saved to Supabase:', {
        id: result.id,
        fileUrl: fileUrl ? '✅' : '❌'
      })
      return { success: true, id: result.id }
    } catch (error: any) {
      console.error('❌ Failed to save document:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  private async uploadFile(file: File, userId: string): Promise<string> {
    try {
      console.log('⬆️ Uploading file to Supabase Storage...')
      const fileName = `${userId}/${Date.now()}-${file.name}`
      console.log('📂 Storage path:', fileName)
      
      const { data, error } = await this.supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (error) {
        console.error('❌ Storage upload error:', error)
        // If bucket doesn't exist, skip file upload and return empty string
        if (error.message.includes('Bucket not found')) {
          console.error('🚨 Storage bucket "documents" not found!')
          console.error('👉 Create the bucket in Supabase Dashboard:')
          console.error('   1. Go to Supabase Dashboard → Storage')
          console.error('   2. Click "New Bucket"')
          console.error('   3. Name: "documents"')
          console.error('   4. Set as Public bucket')
          return ''
        }
        throw error
      }

      console.log('✅ File uploaded successfully:', data.path)

      const { data: { publicUrl } } = this.supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      console.log('🔗 Public URL:', publicUrl)
      return publicUrl
    } catch (error: any) {
      console.error('❌ File upload failed:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      // Return empty string if upload fails - we can still save the data without the file
      return ''
    }
  }

  /**
   * Route document to correct domain and save
   */
  private async routeAndSave(document: ScannedDocument, userId: string, fileUrl: string | null) {
    const data = document.extractedData || {}

    // Route based on document type
    if (document.documentType.toLowerCase().includes('receipt')) {
      return await this.saveReceipt(data, userId, fileUrl, document)
    }
    
    if (document.documentType.toLowerCase().includes('insurance')) {
      return await this.saveInsuranceCard(data, userId, fileUrl, document)
    }
    
    if (document.documentType.toLowerCase().includes('prescription')) {
      return await this.savePrescription(data, userId, fileUrl, document)
    }
    
    if (document.documentType.toLowerCase().includes('vehicle')) {
      return await this.saveVehicleDocument(data, userId, fileUrl, document)
    }
    
    if (document.documentType.toLowerCase().includes('bill') || document.documentType.toLowerCase().includes('invoice')) {
      return await this.saveBill(data, userId, fileUrl, document)
    }
    
    if (document.documentType.toLowerCase().includes('medical')) {
      return await this.saveMedicalRecord(data, userId, fileUrl, document)
    }

    // Default: save as general document
    return await this.saveGenericDocument(data, userId, fileUrl, document)
  }

  /**
   * Save receipt to Finance domain
   */
  private async saveReceipt(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    // Save to finance_transactions table
    const record = {
      user_id: userId,
      type: 'expense',
      category: data.category || 'Shopping',
      vendor: data.vendor || 'Unknown Vendor',
      amount: data.total || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      description: `Scanned receipt - ${data.vendor || 'Purchase'}`,
      receipt_url: fileUrl,
      items: data.items || [],
      tax: data.tax,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
      },
    }

    const { data: result, error } = await this.supabase
      .from('finance_transactions')
      .insert(record)
      .select()
      .single()

    if (error) throw error

    // ALSO save to domain_entries for display in app
    await this.saveToDomain(userId, 'financial', {
      title: `${data.vendor || 'Purchase'} - $${data.total || 0}`,
      description: `Scanned receipt - ${data.category || 'Shopping'}`,
      type: 'expense',
      amount: data.total || 0,
      vendor: data.vendor,
      category: data.category,
      date: data.date,
      receipt_url: fileUrl,
      items: data.items,
      tax: data.tax,
      scanned: true,
      confidence: document.confidence,
    })

    return result
  }

  /**
   * Save insurance card to Insurance domain
   */
  private async saveInsuranceCard(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    // Save to insurance_policies table
    const record = {
      user_id: userId,
      type: data.coverageType || 'Other',
      provider: data.provider || 'Unknown Provider',
      policy_number: data.policyNumber || '',
      effective_date: data.effectiveDate,
      expiration_date: data.expirationDate,
      member_id: data.memberId,
      document_url: fileUrl,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
      },
    }

    const { data: result, error } = await this.supabase
      .from('insurance_policies')
      .insert(record)
      .select()
      .single()

    if (error) throw error

    // ALSO save to domains table so it shows up in the app
    await this.saveToDomain(userId, 'insurance', {
      id: result.id,
      type: 'insurance_policy',
      title: `${data.provider || 'Insurance'} - ${data.policyNumber || 'Policy'}`,
      provider: data.provider,
      policyNumber: data.policyNumber,
      memberId: data.memberId,
      coverageType: data.coverageType || data.type,
      effectiveDate: data.effectiveDate,
      expirationDate: data.expirationDate,
      documentUrl: fileUrl,
      scannedDocument: true,
      confidence: document.confidence,
      createdAt: new Date().toISOString(),
    })

    return result
  }

  /**
   * Save prescription to Health domain
   */
  private async savePrescription(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    const record = {
      user_id: userId,
      medication_name: data.medicationName || 'Unknown Medication',
      dosage: data.dosage || '',
      prescriber: data.prescriber || '',
      pharmacy: data.pharmacy,
      refills: data.refills,
      date_filled: data.dateFilled,
      expiration_date: data.expirationDate,
      document_url: fileUrl,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
      },
    }

    const { data: result, error } = await this.supabase
      .from('health_medications')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return result
  }

  /**
   * Save vehicle document to Vehicles domain
   */
  private async saveVehicleDocument(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    // Check if vehicle exists, update it, or create new one
    const record = {
      user_id: userId,
      make: data.make || '',
      model: data.model || '',
      year: data.year || new Date().getFullYear(),
      vin: data.vin || '',
      license_plate: data.licensePlate,
      registration_expiration: data.expirationDate,
      document_url: fileUrl,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
      },
    }

    const { data: result, error } = await this.supabase
      .from('vehicles')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return result
  }

  /**
   * Save bill to Utilities/Finance domain
   */
  private async saveBill(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    const record = {
      user_id: userId,
      title: data.company || 'Unknown Company',
      amount: data.amount || 0,
      due_date: data.dueDate || new Date().toISOString(),
      category: data.billType || 'Utility',
      status: 'pending',
      recurring: false,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
        company: data.company,
        accountNumber: data.accountNumber,
        billType: data.billType,
        document_url: fileUrl,
      },
    }

    const { data: result, error } = await this.supabase
      .from('bills')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return result
  }

  /**
   * Save medical record to Health domain
   */
  private async saveMedicalRecord(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    const record = {
      user_id: userId,
      provider: data.provider || 'Unknown Provider',
      date: data.date || new Date().toISOString().split('T')[0],
      diagnosis: data.diagnosis,
      notes: data.notes,
      test_results: data.testResults,
      document_url: fileUrl,
      metadata: {
        scanned: true,
        confidence: document.confidence,
        extractedText: document.text,
      },
    }

    const { data: result, error } = await this.supabase
      .from('health_records')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return result
  }

  /**
   * Save generic document
   */
  private async saveGenericDocument(data: any, userId: string, fileUrl: string | null, document: ScannedDocument) {
    const record = {
      user_id: userId,
      title: data.title || `Scanned Document - ${new Date().toLocaleDateString()}`,
      category: document.suggestedDomain,
      file_url: fileUrl,
      extracted_text: document.text,
      extracted_data: data,
      document_type: document.documentType,
      confidence: document.confidence,
      created_at: new Date().toISOString(),
    }

    const { data: result, error } = await this.supabase
      .from('documents')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return result
  }

  /**
   * Save item to domain_entries table (normalized storage)
   */
  private async saveToDomain(userId: string, domainName: string, item: any) {
    // Save to the new normalized domain_entries table
    const record = {
      user_id: userId,
      domain: domainName,
      title: item.title || `${domainName} entry`,
      description: item.description || '',
      metadata: {
        ...item,
        scannedDocument: true,
        createdAt: item.createdAt || new Date().toISOString(),
      },
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: result, error } = await this.supabase
      .from('domain_entries')
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to save to domain_entries:', error)
      throw error
    }

    console.log('✅ Saved to domain_entries:', result.id)
    return result
  }
}

