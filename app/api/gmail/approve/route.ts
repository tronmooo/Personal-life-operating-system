/**
 * Gmail Suggestion Approval API Endpoint
 * 
 * Approve a suggestion and add to appropriate domain
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { suggestionId } = body

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID required' },
        { status: 400 }
      )
    }

    // Get the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('processed_emails')
      .select('*')
      .eq('id', suggestionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Create item in appropriate domain based on classification
    let itemId: string | null = null
    let domainTable = ''

    switch (suggestion.classification) {
      case 'bill':
        domainTable = 'utilities'
        const { data: billItem, error: billError } = await supabase
          .from('domain_data')
          .insert({
            user_id: user.id,
            domain: 'utilities',
            title: suggestion.extracted_data.companyName || 'Bill',
            metadata: {
              type: 'bill',
              amount: suggestion.extracted_data.amount,
              dueDate: suggestion.extracted_data.dueDate,
              status: 'unpaid',
              accountNumber: suggestion.extracted_data.accountNumber,
              source: 'gmail_smart_parsing'
            }
          })
          .select()
          .single()
        
        if (!billError && billItem) itemId = billItem.id
        break

      case 'appointment':
        domainTable = 'health'
        const { data: apptItem, error: apptError } = await supabase
          .from('domain_data')
          .insert({
            user_id: user.id,
            domain: 'health',
            title: `${suggestion.extracted_data.provider} - ${suggestion.extracted_data.type}`,
            metadata: {
              recordType: 'Appointment',
              provider: suggestion.extracted_data.provider,
              date: suggestion.extracted_data.date,
              time: suggestion.extracted_data.time,
              location: suggestion.extracted_data.location,
              address: suggestion.extracted_data.address,
              confirmationNumber: suggestion.extracted_data.confirmationNumber,
              source: 'gmail_smart_parsing'
            }
          })
          .select()
          .single()
        
        if (!apptError && apptItem) itemId = apptItem.id
        break

      case 'service_reminder':
        domainTable = 'vehicles'
        const { data: serviceItem, error: serviceError } = await supabase
          .from('domain_data')
          .insert({
            user_id: user.id,
            domain: 'vehicles',
            title: `${suggestion.extracted_data.serviceType} - ${suggestion.extracted_data.vehicle || 'Vehicle'}`,
            metadata: {
              type: 'maintenance',
              vehicle: suggestion.extracted_data.vehicle,
              serviceType: suggestion.extracted_data.serviceType,
              scheduledDate: suggestion.extracted_data.recommendedDate,
              provider: suggestion.extracted_data.provider,
              status: 'scheduled',
              source: 'gmail_smart_parsing'
            }
          })
          .select()
          .single()
        
        if (!serviceError && serviceItem) itemId = serviceItem.id
        break

      case 'receipt':
        domainTable = 'finance'
        // For receipts, we could add to finance transactions
        // This would require integration with the finance system
        const { data: receiptItem, error: receiptError } = await supabase
          .from('domain_data')
          .insert({
            user_id: user.id,
            domain: 'miscellaneous',
            title: `Purchase - ${suggestion.extracted_data.vendor}`,
            metadata: {
              type: 'receipt',
              vendor: suggestion.extracted_data.vendor,
              amount: suggestion.extracted_data.amount,
              date: suggestion.extracted_data.date,
              category: suggestion.extracted_data.category,
              source: 'gmail_smart_parsing'
            }
          })
          .select()
          .single()
        
        if (!receiptError && receiptItem) itemId = receiptItem.id
        break

      case 'insurance':
        domainTable = 'insurance'
        const { data: insuranceItem, error: insuranceError } = await supabase
          .from('domain_data')
          .insert({
            user_id: user.id,
            domain: 'insurance',
            title: `${suggestion.extracted_data.policyType} Insurance - ${suggestion.extracted_data.provider}`,
            metadata: {
              type: suggestion.extracted_data.policyType?.toLowerCase() || 'other',
              provider: suggestion.extracted_data.provider,
              policyNumber: suggestion.extracted_data.policyNumber,
              monthlyPremium: suggestion.extracted_data.premium,
              renewalDate: suggestion.extracted_data.renewalDate,
              effectiveDate: suggestion.extracted_data.effectiveDate,
              coverageAmount: suggestion.extracted_data.coverageAmount,
              source: 'gmail_smart_parsing'
            }
          })
          .select()
          .single()
        
        if (!insuranceError && insuranceItem) itemId = insuranceItem.id
        break
    }

    // Update suggestion status
    const { error: updateError } = await supabase
      .from('processed_emails')
      .update({
        status: 'approved',
        domain_added_to: domainTable,
        item_id: itemId,
        action_taken_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      itemId,
      domain: domainTable
    })
  } catch (error: any) {
    console.error('Error approving suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve suggestion' },
      { status: 500 }
    )
  }
}






























