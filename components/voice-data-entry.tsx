'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mic, Loader2, CheckCircle, X } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'

export function VoiceDataEntry() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { addData } = useData()

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const transcript = event.results[current][0].transcript
      setTranscript(transcript)
      
      // If final result, parse it
      if (event.results[current].isFinal) {
        parseVoiceInput(transcript)
      }
    }

    recognition.start()
  }

  const parseVoiceInput = (text: string) => {
    const parsed: any[] = []
    const lower = text.toLowerCase()

    // Parse weight
    const weightMatch = lower.match(/(?:weigh|weight|weighed)\s+(?:is\s+)?(\d+(?:\.\d+)?)\s*(?:pounds|lbs|lb)?/i)
    if (weightMatch) {
      parsed.push({
        domain: 'health',
        type: 'weight',
        value: weightMatch[1],
        label: `Weight: ${weightMatch[1]} lbs`,
        icon: '⚖️'
      })
    }

    // Parse steps
    const stepsMatch = lower.match(/(\d+(?:,\d+)?)\s*steps/i)
    if (stepsMatch) {
      const steps = stepsMatch[1].replace(',', '')
      parsed.push({
        domain: 'health',
        type: 'steps',
        value: steps,
        label: `Steps: ${steps.toLocaleString()}`,
        icon: '👣'
      })
    }

    // Parse food/calories
    const foodMatch = lower.match(/(?:ate|eat|eating|had)\s+([^for]+)\s+(?:for|that\s+is|with)?\s*(\d+)\s*(?:cal|calories)/i)
    if (foodMatch) {
      parsed.push({
        domain: 'nutrition',
        type: 'meal',
        value: foodMatch[2],
        food: foodMatch[1].trim(),
        label: `${foodMatch[1].trim()} - ${foodMatch[2]} cal`,
        icon: '🍽️'
      })
    }

    // Parse exercise
    const exerciseMatch = lower.match(/(?:did|worked out|exercised)\s+(\d+)\s*(?:min|minutes)/i)
    if (exerciseMatch) {
      parsed.push({
        domain: 'fitness',
        type: 'workout',
        value: exerciseMatch[1],
        label: `Workout: ${exerciseMatch[1]} min`,
        icon: '💪'
      })
    }

    // Parse water intake
    const waterMatch = lower.match(/(?:drank|drink)\s+(\d+(?:\.\d+)?)\s*(?:glasses?|cups?|liters?|oz)/i)
    if (waterMatch) {
      parsed.push({
        domain: 'health',
        type: 'water',
        value: waterMatch[1],
        label: `Water: ${waterMatch[1]} glasses`,
        icon: '💧'
      })
    }

    // Parse mood
    const moodMatch = lower.match(/(?:feeling|feel|mood\s+is)\s+(great|good|okay|bad|terrible|happy|sad|stressed|calm)/i)
    if (moodMatch) {
      const moodMap: any = {
        'terrible': 1, 'bad': 2, 'okay': 3, 'good': 4, 'great': 5,
        'sad': 2, 'stressed': 2, 'calm': 4, 'happy': 5
      }
      const moodValue = moodMap[moodMatch[1].toLowerCase()] || 3
      parsed.push({
        domain: 'health',
        type: 'mood',
        value: moodValue,
        label: `Mood: ${moodMatch[1]}`,
        icon: '😊'
      })
    }

    // Parse expense
    const expenseMatch = lower.match(/(?:spent|spend|paid)\s+(?:\$)?(\d+(?:\.\d+)?)\s+(?:on|for)\s+([^.]+)/i)
    if (expenseMatch) {
      parsed.push({
        domain: 'financial',
        type: 'expense',
        value: expenseMatch[1],
        description: expenseMatch[2].trim(),
        label: `Expense: $${expenseMatch[1]} - ${expenseMatch[2].trim()}`,
        icon: '💰'
      })
    }

    setParsedData(parsed)
  }

  const saveAllData = async () => {
    setIsSaving(true)
    const today = format(new Date(), 'yyyy-MM-dd')

    for (const item of parsedData) {
      await addData(item.domain, {
        title: `${item.type} - ${item.value}`,
        description: `Voice entry: ${item.type}`,
        metadata: {
          ...item,
          logType: item.type,
          date: today,
          source: 'voice'
        }
      })
    }

    setIsSaving(false)
    
    // Success feedback
    setTimeout(() => {
      setIsOpen(false)
      setTranscript('')
      setParsedData([])
    }, 1000)
  }

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 z-50"
      >
        <Mic className="h-6 w-6" />
      </Button>

      {/* Voice Entry Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-500" />
              Voice Data Entry
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Microphone Button */}
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={startListening}
                disabled={isListening}
                size="lg"
                variant={isListening ? 'destructive' : 'default'}
                className={`h-24 w-24 rounded-full ${isListening ? 'animate-pulse' : ''}`}
              >
                <Mic className="h-12 w-12" />
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                {isListening ? (
                  <span className="text-red-500 font-medium">🎤 Listening...</span>
                ) : (
                  'Tap microphone and speak naturally'
                )}
              </p>
            </div>

            {/* Example */}
            {!transcript && !isListening && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="text-xs font-medium mb-2">Example:</p>
                <p className="text-xs text-muted-foreground">
                  "I weighed 194 pounds, I made 10,000 steps today, and I ate chicken for 300 calories"
                </p>
              </div>
            )}

            {/* Transcript */}
            {transcript && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium mb-1">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {/* Parsed Data */}
            {parsedData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Detected data:</p>
                <div className="space-y-2">
                  {parsedData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.domain}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {parsedData.length > 0 && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setTranscript('')
                    setParsedData([])
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveAllData}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save All
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

























