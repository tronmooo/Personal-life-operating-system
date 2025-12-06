/**
 * Universal AI Tools API Route
 * Handles all AI tool requests with different operation types
 */

import { NextRequest, NextResponse } from 'next/server'
import * as AI from '@/lib/services/ai-service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, data } = body

    console.log('🔧 AI Tool Operation:', operation)

    switch (operation) {
      // OCR Operations
      case 'ocr':
        const ocrResult = await AI.performOCR(data.imageBase64)
        return NextResponse.json({ success: true, result: ocrResult })

      case 'extract_structured':
        const extracted = await AI.extractStructuredData(
          data.text,
          data.schema,
          data.context
        )
        return NextResponse.json({ success: true, result: extracted })

      // Financial Operations
      case 'analyze_expense':
        const expenseAnalysis = await AI.analyzeExpense(
          data.description,
          data.amount,
          data.imageBase64
        )
        return NextResponse.json({ success: true, result: expenseAnalysis })

      case 'analyze_financial_report':
        const financialAnalysis = await AI.analyzeFinancialReport(data)
        return NextResponse.json({ success: true, result: financialAnalysis })

      // Document Operations
      case 'summarize_document':
        const summary = await AI.summarizeDocument(data.text, data.options)
        return NextResponse.json({ success: true, result: summary })

      case 'analyze_contract':
        const contractAnalysis = await AI.analyzeContract(data.text)
        return NextResponse.json({ success: true, result: contractAnalysis })

      case 'fill_form':
        const filledForm = await AI.fillForm(data.formFields, data.userData)
        return NextResponse.json({ success: true, result: filledForm })

      // Document Generation
      case 'generate_document':
        const document = await AI.generateDocument(data.type, data.context)
        return NextResponse.json({ success: true, result: { content: document } })

      // Translation
      case 'translate':
        const translation = await AI.translateText(
          data.text,
          data.targetLanguage,
          data.sourceLanguage
        )
        return NextResponse.json({ success: true, result: translation })

      // Scheduling & Planning
      case 'optimize_schedule':
        const scheduleOptimization = await AI.optimizeSchedule(
          data.events,
          data.preferences
        )
        return NextResponse.json({ success: true, result: scheduleOptimization })

      case 'prioritize_tasks':
        const taskPrioritization = await AI.prioritizeTasks(
          data.tasks,
          data.context
        )
        return NextResponse.json({ success: true, result: taskPrioritization })

      case 'process_meeting_notes':
        const meetingNotes = await AI.processMeetingNotes(data.transcript)
        return NextResponse.json({ success: true, result: meetingNotes })

      // Shopping & Price Analysis
      case 'compare_prices':
        const priceComparison = await AI.comparePrices(
          data.product,
          data.currentPrice
        )
        return NextResponse.json({ success: true, result: priceComparison })

      // Generic AI Request
      case 'ai_request':
        const aiResponse = await AI.requestAI({
          prompt: data.prompt,
          systemPrompt: data.systemPrompt,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          imageBase64: data.imageBase64
        })
        return NextResponse.json({ success: true, result: { content: aiResponse.content, source: aiResponse.source } })

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('❌ AI Tool Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'AI processing failed',
        details: error.stack
      },
      { status: 500 }
    )
  }
}






