'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, VolumeX, Pause } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateVoiceSummary } from '@/lib/analytics/ai-insights-generator'

interface VoiceSummaryProps {
  analyticsData: {
    financialHealth: number
    lifeBalance: number
    productivity: number
    wellbeing: number
    goalProgress: number
    activeDomains: string[]
  }
}

export function VoiceSummary({ analyticsData }: VoiceSummaryProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynthesis(window.speechSynthesis)
    }
  }, [])

  const handlePlay = () => {
    if (!synthesis) {
      alert('Text-to-speech is not supported in your browser')
      return
    }

    if (isPaused && utterance) {
      synthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    // Generate summary text
    const summaryText = generateVoiceSummary(analyticsData)

    // Create utterance
    const newUtterance = new SpeechSynthesisUtterance(summaryText)
    newUtterance.rate = 0.9
    newUtterance.pitch = 1
    newUtterance.volume = 1

    // Get available voices
    const voices = synthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (preferredVoice) {
      newUtterance.voice = preferredVoice
    }

    newUtterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setUtterance(null)
    }

    newUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsPlaying(false)
      setIsPaused(false)
      setUtterance(null)
    }

    setUtterance(newUtterance)
    synthesis.speak(newUtterance)
    setIsPlaying(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    if (synthesis && isPlaying) {
      synthesis.pause()
      setIsPaused(true)
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (synthesis) {
      synthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
      setUtterance(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-purple-600" />
          Voice Summary
        </CardTitle>
        <CardDescription>
          Listen to your analytics summary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {!isPlaying && !isPaused && (
            <Button onClick={handlePlay} className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Play Summary
            </Button>
          )}
          
          {isPlaying && (
            <Button onClick={handlePause} variant="secondary" className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          
          {isPaused && (
            <Button onClick={handlePlay} variant="secondary" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Resume
            </Button>
          )}
          
          {(isPlaying || isPaused) && (
            <Button onClick={handleStop} variant="outline" className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              Stop
            </Button>
          )}
        </div>

        {!synthesis && (
          <p className="text-sm text-muted-foreground mt-4">
            Voice summary is not supported in your browser
          </p>
        )}
      </CardContent>
    </Card>
  )
}



