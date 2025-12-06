/**
 * Gmail Smart Parsing - Example Usage
 * 
 * This file demonstrates how to use the Gmail parser and classifier
 */

import { createGmailParser } from './gmail-parser'
import { emailClassifier } from '../ai/email-classifier'

/**
 * Example 1: Parse recent emails
 */
export async function exampleParseRecentEmails(accessToken: string) {
  console.log('📧 Example: Parsing recent emails...')
  
  const parser = createGmailParser(accessToken)
  
  // Get last 7 days of emails
  const classifiedEmails = await parser.parseRecentEmails(7)
  
  console.log(`Found ${classifiedEmails.length} actionable emails:`)
  
  classifiedEmails.forEach((email, index) => {
    console.log(`\n${index + 1}. ${email.classification.toUpperCase()}`)
    console.log(`   Subject: ${email.subject}`)
    console.log(`   Suggestion: ${email.suggestionText}`)
    console.log(`   Target Domain: ${email.targetDomain}`)
    console.log(`   Confidence: ${(email.confidence * 100).toFixed(0)}%`)
  })
  
  return classifiedEmails
}

/**
 * Example 2: Classify a single email
 */
export async function exampleClassifySingleEmail() {
  console.log('🤖 Example: Classifying a single email...')
  
  // Mock email data
  const mockEmail = {
    id: 'msg123',
    threadId: 'thread123',
    subject: 'Your Electric Bill is Ready',
    from: 'billing@electric-company.com',
    to: 'user@example.com',
    date: new Date(),
    snippet: 'Your monthly electric bill of $150 is due on October 20th',
    body: `
      Dear Customer,
      
      Your monthly electric bill is now available.
      
      Account Number: 123456789
      Billing Period: September 1 - September 30, 2025
      Amount Due: $150.00
      Due Date: October 20, 2025
      
      Please pay by the due date to avoid late fees.
      
      Thank you,
      Electric Company
    `,
    labels: ['INBOX']
  }
  
  const classified = await emailClassifier.classifyEmail(mockEmail)
  
  if (classified) {
    console.log('\n✅ Classification Result:')
    console.log(`   Type: ${classified.classification}`)
    console.log(`   Confidence: ${(classified.confidence * 100).toFixed(0)}%`)
    console.log(`   Suggestion: ${classified.suggestionText}`)
    console.log(`   Extracted Data:`, JSON.stringify(classified.extractedData, null, 2))
  } else {
    console.log('❌ Failed to classify email')
  }
  
  return classified
}

/**
 * Example 3: Batch classify multiple emails
 */
export async function exampleBatchClassify(accessToken: string) {
  console.log('📦 Example: Batch classifying emails...')
  
  const parser = createGmailParser(accessToken)
  
  // Get raw emails
  const emails = await parser.getRecentEmails(7)
  console.log(`Fetched ${emails.length} emails`)
  
  // Classify in batch
  const classified = await emailClassifier.classifyBatch(emails)
  console.log(`Classified ${classified.length} actionable emails`)
  
  // Group by classification
  const grouped = classified.reduce((acc, email) => {
    if (!acc[email.classification]) {
      acc[email.classification] = []
    }
    acc[email.classification].push(email)
    return acc
  }, {} as Record<string, typeof classified>)
  
  console.log('\n📊 Results by Category:')
  Object.entries(grouped).forEach(([type, emails]) => {
    console.log(`   ${type}: ${emails.length} emails`)
  })
  
  return grouped
}

/**
 * Example 4: Store in database
 */
export async function exampleStoreInDatabase(
  classifiedEmail: any,
  userId: string,
  supabase: any
) {
  console.log('💾 Example: Storing in database...')
  
  const { data, error } = await supabase
    .from('processed_emails')
    .insert({
      user_id: userId,
      email_id: classifiedEmail.emailId,
      email_subject: classifiedEmail.subject,
      email_from: classifiedEmail.from,
      email_date: classifiedEmail.date.toISOString(),
      classification: classifiedEmail.classification,
      extracted_data: classifiedEmail.extractedData,
      suggestion_text: classifiedEmail.suggestionText,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ Error storing email:', error)
    throw error
  }
  
  console.log('✅ Stored successfully:', data.id)
  return data
}

/**
 * Example 5: Complete workflow
 */
export async function exampleCompleteWorkflow(
  accessToken: string,
  userId: string,
  supabase: any
) {
  console.log('🔄 Example: Complete workflow...')
  
  // Step 1: Fetch and classify
  const parser = createGmailParser(accessToken)
  const classified = await parser.parseRecentEmails(7)
  console.log(`✅ Step 1: Classified ${classified.length} emails`)
  
  // Step 2: Store in database
  const stored = []
  for (const email of classified) {
    try {
      const result = await exampleStoreInDatabase(email, userId, supabase)
      stored.push(result)
    } catch (error: any) {
      if (error.code === '23505') {
        // Duplicate - already processed
        console.log(`⏭️  Skipping duplicate: ${email.emailId}`)
      } else {
        console.error('❌ Error storing email:', error)
      }
    }
  }
  console.log(`✅ Step 2: Stored ${stored.length} new suggestions`)
  
  // Step 3: Mark emails as processed in Gmail
  for (const email of classified) {
    await parser.addLabel(email.emailId, 'LifeOS/Processed')
  }
  console.log(`✅ Step 3: Labeled emails in Gmail`)
  
  return {
    classified: classified.length,
    stored: stored.length,
    skipped: classified.length - stored.length
  }
}

/**
 * Example 6: Check if configured
 */
export function exampleCheckConfiguration() {
  console.log('⚙️  Checking configuration...')
  
  const isOpenAIConfigured = emailClassifier.isConfigured()
  console.log(`   OpenAI: ${isOpenAIConfigured ? '✅' : '❌'}`)
  
  if (!isOpenAIConfigured) {
    console.log('   → Set OPENAI_API_KEY in environment variables')
  }
  
  return {
    openai: isOpenAIConfigured
  }
}

// Export all examples
export const examples = {
  parseRecentEmails: exampleParseRecentEmails,
  classifySingleEmail: exampleClassifySingleEmail,
  batchClassify: exampleBatchClassify,
  storeInDatabase: exampleStoreInDatabase,
  completeWorkflow: exampleCompleteWorkflow,
  checkConfiguration: exampleCheckConfiguration
}






























