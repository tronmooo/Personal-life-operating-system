'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Save, Trash2 } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface UniversalAIToolProps {
  toolId: string
  name: string
  description: string
  icon: string
  features: string[]
  inputPlaceholder?: string
  resultLabel?: string
}

interface SavedItem {
  id: string
  input: string
  output: string
  created_at: string
}

export function UniversalAITool({
  toolId,
  name,
  description,
  icon,
  features,
  inputPlaceholder = 'Enter your request or upload content...',
  resultLabel = 'AI-Generated Result'
}: UniversalAIToolProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    // Load saved items from Supabase (with IndexedDB fallback)
    loadSavedItems()
  }, [toolId])

  const loadSavedItems = async () => {
    try {
      setLoadingItems(true)
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Load from Supabase domain_entries
        const { data: entries } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'ai_tools')
          .eq('metadata->>toolId', toolId)
          .order('created_at', { ascending: false })

        if (entries) {
          const items: SavedItem[] = entries.map(entry => ({
            id: entry.id,
            input: entry.metadata?.input || '',
            output: entry.metadata?.output || entry.description || '',
            created_at: entry.created_at
          }))
          setSavedItems(items)
        }
      } else {
        // Fallback to IndexedDB
        const saved = await idbGet<SavedItem[]>(`ai-tool-${toolId}`, [])
        setSavedItems(saved || [])
      }
    } catch (error) {
      console.error('Error loading saved items:', error)
      setSavedItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  const processWithAI = async () => {
    if (!input.trim()) {
      toast.error('Input Required', 'Please enter some text to process')
      return
    }

    setLoading(true)
    try {
      const prompt = buildPrompt(toolId, input)

      const response = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          type: toolId
        })
      })

      if (!response.ok) {
        throw new Error('AI processing failed')
      }

      const data = await response.json()
      const result = data.analysis || data.result || 'Processing complete'

      setOutput(result)
      toast.success('Complete!', 'AI has processed your request')
    } catch (error: any) {
      toast.error('Processing Failed', error.message || 'Could not process request')
    } finally {
      setLoading(false)
    }
  }

  const saveResult = async () => {
    if (!output) return

    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Save to Supabase domain_entries
      const { data: newEntry } = await supabase
        .from('domain_entries')
        .insert({
          user_id: user.id,
          domain: 'ai_tools',
          title: `${toolId} - ${new Date().toLocaleDateString()}`,
          description: output.substring(0, 500),
          metadata: {
            toolId,
            input,
            output
          }
        })
        .select()
        .single()

      if (newEntry) {
        const newItem: SavedItem = {
          id: newEntry.id,
          input,
          output,
          created_at: newEntry.created_at
        }
        setSavedItems([newItem, ...savedItems])
      }
    } else {
      // Fallback to IndexedDB
      const newItem: SavedItem = {
        id: Date.now().toString(),
        input,
        output,
        created_at: new Date().toISOString()
      }
      const updated = [newItem, ...savedItems]
      setSavedItems(updated)
      await idbSet(`ai-tool-${toolId}`, updated)
    }

    toast.success('Saved!', 'Result saved to your library')
    setInput('')
    setOutput('')
  }

  const deleteItem = async (id: string) => {
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Delete from Supabase
      await supabase
        .from('domain_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
    } else {
      // Fallback to IndexedDB
      const updated = savedItems.filter(item => item.id !== id)
      await idbSet(`ai-tool-${toolId}`, updated)
    }

    const updated = savedItems.filter(item => item.id !== id)
    setSavedItems(updated)
    toast.success('Deleted', 'Item removed')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl">{icon}</div>
        <div>
          <h2 className="text-3xl font-bold">{name}</h2>
          <p className="text-muted-foreground text-lg mt-2">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {features.map((feature, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              ✓ {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Process with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Input</Label>
            <Textarea
              placeholder={inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={processWithAI}
            disabled={loading || !input.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Output Section */}
      {output && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                {resultLabel}
              </CardTitle>
              <Button onClick={saveResult} size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save Result
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-accent rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-sm">{output}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Results */}
      {savedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Results ({savedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm">
                  <strong>Input:</strong> {item.input.substring(0, 100)}...
                </div>
                <div className="text-sm bg-accent p-2 rounded">
                  <strong>Output:</strong>
                  <pre className="whitespace-pre-wrap mt-1 font-sans">
                    {item.output.substring(0, 200)}...
                  </pre>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your text or requirements above</li>
            <li>Click "Generate with AI" to process</li>
            <li>Review the AI-generated results</li>
            <li>Save useful results to your library</li>
            <li>Access saved results anytime</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function buildPrompt(toolId: string, input: string): string {
  const prompts: Record<string, string> = {
    'meal-planner-ai': `Create a detailed weekly meal plan based on: ${input}. Include breakfast, lunch, and dinner for 7 days. Add a grocery shopping list.`,
    'chatbot-builder': `Create a simple chatbot conversation flow for: ${input}. Include welcome message, common questions/answers, and helpful responses.`,
    'translator-pro': `Translate the following text to the target language (detect source language automatically): ${input}`,
    'service-comparator': `Compare different service providers for: ${input}. Include pros/cons, pricing, features, and recommendations.`,
    'eligibility-checker': `Check eligibility requirements for: ${input}. List all criteria, qualifications needed, and application process.`,
    'deadline-tracker': `Create a deadline tracking plan for: ${input}. Include important dates, milestones, and reminders.`,
    'checklist-generator': `Generate a comprehensive checklist for: ${input}. Include all necessary steps, sub-tasks, and completion criteria.`,
    'renewal-reminder': `Create a renewal tracking system for: ${input}. Include renewal dates, costs, providers, and notification schedule.`,
    'status-tracker': `Create an application status tracking system for: ${input}. Include pipeline stages, required documents, and next steps.`
  }

  return prompts[toolId] || `Process this request: ${input}`
}
