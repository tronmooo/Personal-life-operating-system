/**
 * React hook for using AI tools in components
 */

import { useState, useCallback } from 'react'

interface UseAIToolOptions {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

export function useAITool(options?: UseAIToolOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<any>(null)

  const execute = useCallback(async (operation: string, data: any) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai-tools/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, data })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI request failed')
      }

      const responseData = await response.json()
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'AI processing failed')
      }

      setResult(responseData.result)
      options?.onSuccess?.(responseData.result)
      
      return responseData.result
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options?.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  // Convenience methods for specific operations
  const performOCR = useCallback((imageBase64: string) => {
    return execute('ocr', { imageBase64 })
  }, [execute])

  const extractStructuredData = useCallback((text: string, schema: any, context?: string) => {
    return execute('extract_structured', { text, schema, context })
  }, [execute])

  const analyzeExpense = useCallback((description: string, amount?: number, imageBase64?: string) => {
    return execute('analyze_expense', { description, amount, imageBase64 })
  }, [execute])

  const analyzeFinancialReport = useCallback((data: any) => {
    return execute('analyze_financial_report', data)
  }, [execute])

  const summarizeDocument = useCallback((text: string, options?: any) => {
    return execute('summarize_document', { text, options })
  }, [execute])

  const analyzeContract = useCallback((text: string) => {
    return execute('analyze_contract', { text })
  }, [execute])

  const fillForm = useCallback((formFields: string[], userData: any) => {
    return execute('fill_form', { formFields, userData })
  }, [execute])

  const generateDocument = useCallback((type: string, context: any) => {
    return execute('generate_document', { type, context })
  }, [execute])

  const translateText = useCallback((text: string, targetLanguage: string, sourceLanguage = 'auto') => {
    return execute('translate', { text, targetLanguage, sourceLanguage })
  }, [execute])

  const optimizeSchedule = useCallback((events: any[], preferences?: any) => {
    return execute('optimize_schedule', { events, preferences })
  }, [execute])

  const prioritizeTasks = useCallback((tasks: any[], context?: any) => {
    return execute('prioritize_tasks', { tasks, context })
  }, [execute])

  const processMeetingNotes = useCallback((transcript: string) => {
    return execute('process_meeting_notes', { transcript })
  }, [execute])

  const comparePrices = useCallback((product: string, currentPrice?: number) => {
    return execute('compare_prices', { product, currentPrice })
  }, [execute])

  const requestAI = useCallback((prompt: string, options?: {
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    imageBase64?: string
  }) => {
    return execute('ai_request', { prompt, ...options })
  }, [execute])

  return {
    loading,
    error,
    result,
    execute,
    // Convenience methods
    performOCR,
    extractStructuredData,
    analyzeExpense,
    analyzeFinancialReport,
    summarizeDocument,
    analyzeContract,
    fillForm,
    generateDocument,
    translateText,
    optimizeSchedule,
    prioritizeTasks,
    processMeetingNotes,
    comparePrices,
    requestAI
  }
}






