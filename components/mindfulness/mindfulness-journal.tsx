'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mic, MicOff, Save, BookOpen, Calendar, Sparkles, Lightbulb, Heart, Loader2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface JournalEntry {
  id: string
  content: string
  date: string
  wordCount: number
  aiInsight?: string
}

export function MindfulnessJournal() {
  const { addData, getData, reloadDomain } = useData()
  const [entry, setEntry] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Load journal entries from DataProvider
  const loadJournalEntries = useCallback(() => {
    try {
      const mindfulnessData = getData('mindfulness')
      if (!Array.isArray(mindfulnessData)) return
      
      const journals = mindfulnessData
        .filter((item: any) => {
          if (!item?.metadata) return false
          return (
            item.metadata?.type === 'journal' ||
            item.metadata?.entryType === 'Journal' ||
            item.metadata?.logType === 'journal-entry'
          )
        })
        .map((item: any): JournalEntry => ({
          id: item.id,
          content: item.metadata?.fullContent || item.description || '',
          date: item.metadata?.date || item.createdAt,
          wordCount: item.metadata?.wordCount || 0,
          aiInsight: item.metadata?.aiInsight
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10) // Show last 10 entries
      
      console.log('📖 Loaded journal entries:', journals.length)
      setRecentEntries(journals)
    } catch (error) {
      console.error('Failed to load journal entries:', error)
    }
  }, [getData])

  // Initial load and listen for data updates
  useEffect(() => {
    loadJournalEntries()
    
    const handleDataUpdate = () => {
      console.log('📖 Data updated, reloading journal entries...')
      loadJournalEntries()
    }
    
    window.addEventListener('data-updated', handleDataUpdate)
    window.addEventListener('mindfulness-data-updated', handleDataUpdate)
    window.addEventListener('data-provider-loaded', handleDataUpdate)
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate)
      window.removeEventListener('mindfulness-data-updated', handleDataUpdate)
      window.removeEventListener('data-provider-loaded', handleDataUpdate)
    }
  }, [loadJournalEntries])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        
        setEntry(transcript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      recognition.start()
      setIsRecording(true)
    }
  }

  const handleSave = async () => {
    if (!entry.trim() || isSaving) return
    
    setIsSaving(true)
    
    try {
      const journalEntry: JournalEntry = {
        id: Date.now().toString(),
        content: entry,
        date: new Date().toISOString(),
        wordCount: entry.split(' ').filter(w => w).length,
        aiInsight: insights?.overview
      }

      // Save to DataProvider with AI insights if available
      await addData('mindfulness', {
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        description: entry.substring(0, 200),
        metadata: {
          type: 'journal',
          entryType: 'Journal',
          logType: 'journal-entry',
          fullContent: entry,
          wordCount: journalEntry.wordCount,
          date: journalEntry.date,
          aiInsight: insights ? insights.overview : undefined
        }
      })

      console.log('✅ Journal saved with AI insights:', insights ? 'Yes' : 'No')

      // Trigger data reload event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mindfulness-data-updated'))
      }
      
      // Reload entries from database to show the new entry
      await reloadDomain('mindfulness')
      loadJournalEntries()
      
      // Clear form
      setEntry('')
      setInsights(null)
      setShowInsights(false)
    } catch (error) {
      console.error('❌ Failed to save journal entry:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const analyzeEntry = async () => {
    if (!entry.trim()) return
    
    setIsAnalyzing(true)
    
    try {
      console.log('🧠 Getting AI journal reflection insight...')
      const response = await fetch('/api/ai/journal-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry })
      })

      const data = await response.json()
      const aiInsight = data.insight || 'Thank you for sharing your thoughts.'
      console.log('✅ AI insight received:', aiInsight)
      
      // Generate sentiment analysis
      const positiveWords = ['good', 'happy', 'great', 'amazing', 'wonderful', 'grateful', 'blessed', 'excited', 'love', 'peaceful']
      const negativeWords = ['bad', 'sad', 'angry', 'stress', 'worried', 'anxious', 'difficult', 'hard', 'frustrated', 'upset']
      const entryLower = entry.toLowerCase()
      
      const positiveCount = positiveWords.filter(word => entryLower.includes(word)).length
      const negativeCount = negativeWords.filter(word => entryLower.includes(word)).length
      
      let sentiment = 'neutral'
      let emoji = '😐'
      if (positiveCount > negativeCount) {
        sentiment = 'positive'
        emoji = '😊'
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative'
        emoji = '😔'
      }
      
      const analysisResult = {
        sentiment,
        emoji,
        overview: aiInsight,
        keyThemes: [
          negativeCount > 0 && 'Stress management',
          positiveCount > 0 && 'Gratitude',
          entryLower.includes('work') && 'Work-life balance',
          entryLower.includes('family') && 'Relationships',
          'Self-reflection'
        ].filter(Boolean),
        copingStrategies: sentiment === 'negative' 
          ? [
              '🧘 Practice deep breathing exercises',
              '🚶 Take a short walk outside',
              '📝 Write down 3 things you\'re grateful for',
              '☎️ Connect with a trusted friend or family member',
              '🎵 Listen to calming music',
              '💤 Ensure you\'re getting enough sleep'
            ]
          : sentiment === 'positive'
          ? [
              '📝 Reflect on what brought you joy today',
              '🎯 Set intentions to maintain this positive state',
              '💌 Share your positive energy with others',
              '🙏 Practice gratitude journaling',
              '🎨 Engage in creative activities'
            ]
          : [
              '🧘 Regular meditation practice',
              '📊 Track your mood daily',
              '🎯 Set small, achievable goals',
              '☀️ Spend time in nature',
              '📚 Read something inspiring'
            ],
        resources: [
          'Consider speaking with a mental health professional',
          'Explore mindfulness apps like Calm or Headspace',
          'Join a support group or community',
          'Practice daily journaling for continued self-awareness'
        ]
      }
      
      setInsights(analysisResult)
      setShowInsights(true)
    } catch (error) {
      console.error('Error analyzing entry:', error)
      // Fallback to basic analysis
      const analysisResult = {
        sentiment: 'neutral',
        emoji: '😐',
        overview: 'Thank you for sharing your thoughts. Your self-reflection shows emotional awareness.',
        keyThemes: ['Self-reflection'],
        copingStrategies: [
          '🧘 Regular meditation practice',
          '📊 Track your mood daily',
          '🎯 Set small, achievable goals'
        ],
        resources: [
          'Consider speaking with a mental health professional',
          'Practice daily journaling for continued self-awareness'
        ]
      }
      setInsights(analysisResult)
      setShowInsights(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Journal Entry Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Journal Entry
          </CardTitle>
          <CardDescription>
            Write or speak your thoughts, reflections, and gratitude
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Area */}
          <Textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="What's on your mind today? Express your thoughts, feelings, or gratitude..."
            className="min-h-[300px] text-base"
          />

          {/* Word Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {entry.split(' ').filter(w => w).length} words
            </span>
            <div className="flex gap-2">
              {/* Voice-to-Text Button */}
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Voice to Text
                  </>
                )}
              </Button>

              {/* AI Insights Button */}
              <Button
                variant="outline"
                onClick={analyzeEntry}
                disabled={!entry.trim() || isAnalyzing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
              </Button>

              {/* Save Button */}
              <Button onClick={handleSave} disabled={!entry.trim() || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Recording... Speak now
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Dialog */}
      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Journal Insights
            </DialogTitle>
            <DialogDescription>
              Here's an analysis of your journal entry with personalized recommendations
            </DialogDescription>
          </DialogHeader>
          
          {insights && (
            <div className="space-y-6 pt-4">
              {/* Sentiment Overview */}
              <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{insights.emoji}</span>
                    <div>
                      <div className="font-semibold text-lg capitalize">{insights.sentiment} Sentiment</div>
                      <div className="text-sm text-muted-foreground">Detected emotional state</div>
                    </div>
                  </div>
                  <p className="text-sm">{insights.overview}</p>
                </CardContent>
              </Card>

              {/* Key Themes */}
              {insights.keyThemes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Key Themes Identified</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.keyThemes.map((theme: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Coping Strategies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Ways to Cope & Improve</h3>
                </div>
                <div className="space-y-2">
                  {insights.copingStrategies.map((strategy: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-accent rounded-lg">
                      <span className="text-sm">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Additional Resources</h3>
                </div>
                <div className="space-y-2">
                  {insights.resources.map((resource: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span>•</span>
                      <span>{resource}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button onClick={() => setShowInsights(false)} className="w-full">
                Close Insights
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Entries
          </CardTitle>
          <CardDescription>
            {recentEntries.length > 0 
              ? `Your last ${recentEntries.length} journal entries` 
              : 'No journal entries yet. Start writing above!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((journalEntry) => (
                <Card key={journalEntry.id} className="bg-accent/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(journalEntry.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <Badge variant="outline">{journalEntry.wordCount} words</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {journalEntry.content}
                    </p>
                    {journalEntry.aiInsight && (
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/50 rounded text-xs text-purple-700 dark:text-purple-300">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {journalEntry.aiInsight.substring(0, 150)}...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Write your first journal entry to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

