'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Send } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIDiagnosticsDialog({ open, onOpenChange }: Props) {
  const [symptoms, setSymptoms] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Check for pre-loaded text from document OCR (Supabase first, then IndexedDB fallback)
      const loadPreloadedText = async () => {
        
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Load most recent ai_diagnostic_draft from Supabase
          const { data: drafts } = await supabase
            .from('domain_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('domain', 'health')
            .eq('metadata->>type', 'ai_diagnostic_draft')
            .order('created_at', { ascending: false })
            .limit(1)

          if (drafts && drafts.length > 0) {
            const draft = drafts[0]
            setSymptoms(draft.metadata?.extractedText || draft.description || '')
            
            // Delete the draft after loading
            await supabase
              .from('domain_entries')
              .delete()
              .eq('id', draft.id)
            
            return
          }
        }

        // Fallback to IndexedDB for unauthenticated users
        const { idbGet, idbDel } = await import('@/lib/utils/idb-cache')
        const preloadedText = await idbGet<string>('health-ai-diagnostic-text')
        if (preloadedText) {
          setSymptoms(preloadedText)
          await idbDel('health-ai-diagnostic-text')
        }
      }
      loadPreloadedText()
    }
  }, [open])

  const handleSubmit = async () => {
    if (!symptoms.trim()) return

    setIsLoading(true)
    
    // Simulate AI response (in production, this would call your AI API)
    setTimeout(() => {
      setResponse(`Based on the symptoms you described: "${symptoms}"

**Possible Considerations:**
• These symptoms could be related to several conditions
• It's important to monitor the severity and duration
• Consider any recent changes in diet, activity, or stress levels

**Recommendations:**
• Keep track of when symptoms occur and their severity
• Stay hydrated and maintain regular sleep schedule
• If symptoms persist or worsen, contact your healthcare provider

**Important Note:**
This AI diagnostic tool is for informational purposes only and does not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.`)
      setIsLoading(false)
    }, 2000)
  }

  const handleClose = () => {
    setSymptoms('')
    setResponse('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Health Diagnostics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your symptoms:
            </label>
            <Textarea
              placeholder="E.g., I've been experiencing headaches for the past 3 days, especially in the morning..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!symptoms.trim() || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Get AI Analysis
              </>
            )}
          </Button>

          {response && (
            <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">AI Analysis</h3>
              </div>
              <div className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {response}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <strong>Disclaimer:</strong> This AI diagnostic tool is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

