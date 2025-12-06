'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VoiceCommandSimple() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [isSupported, setIsSupported] = useState(false)

  // Initialize on mount
  useEffect(() => {
    console.log('🎙️ Voice Command Simple - Initializing...')
    
    // Check browser support
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setIsSupported(supported)
    
    if (!supported) {
      console.error('❌ Speech recognition not supported')
      setError('Voice commands not supported in this browser. Please use Chrome or Edge.')
      return
    }

    console.log('✅ Speech recognition is supported!')
    
    try {
      // Create recognition instance
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      // Configure
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      console.log('⚙️ Speech recognition configured')
      
      // Handle results
      recognitionInstance.onresult = (event: any) => {
        console.log('🎤 Got speech result!')
        
        let interim = ''
        let final = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript
          
          if (result.isFinal) {
            final += text + ' '
            console.log('✅ Final:', text)
          } else {
            interim += text
            console.log('⏳ Interim:', text)
          }
        }
        
        if (final) {
          setTranscript(prev => prev + final)
        }
        setInterimTranscript(interim)
      }
      
      // Handle errors
      recognitionInstance.onerror = (event: any) => {
        console.error('❌ Speech error:', event.error)
        
        // Ignore network errors - they're transient and can be retried
        if (event.error === 'network') {
          console.warn('⚠️ Network error (transient, ignoring)')
          return // Don't stop, keep listening
        }
        
        // Ignore aborted errors - these happen when we stop listening
        if (event.error === 'aborted') {
          console.log('✅ Aborted (expected)')
          return
        }
        
        // Handle real errors
        setError(`Error: ${event.error}`)
        
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.')
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Try speaking louder.')
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found. Please connect a microphone.')
        }
      }
      
      // Handle start
      recognitionInstance.onstart = () => {
        console.log('🟢 Speech recognition started!')
        setIsListening(true)
        setError('')
      }
      
      // Handle end
      recognitionInstance.onend = () => {
        console.log('⏹️ Speech recognition ended')
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
      console.log('✅ Recognition instance ready')
      
    } catch (err) {
      console.error('❌ Failed to create recognition:', err)
      setError('Failed to initialize voice recognition')
    }
  }, [])

  const toggleListening = async () => {
    console.log('🎤 Toggle clicked. Currently listening:', isListening)
    
    if (!recognition) {
      console.error('❌ No recognition instance')
      setError('Voice recognition not initialized')
      return
    }

    if (isListening) {
      // Stop
      console.log('⏹️ Stopping...')
      try {
        recognition.stop()
      } catch (err) {
        console.error('Error stopping:', err)
      }
    } else {
      // Start
      console.log('▶️ Starting...')
      setTranscript('')
      setInterimTranscript('')
      setError('')
      
      try {
        // Request microphone permission explicitly
        console.log('🎙️ Requesting microphone...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Got microphone permission!')
        
        // Stop the stream (we just needed permission)
        stream.getTracks().forEach(track => track.stop())
        
        // Now start recognition
        console.log('▶️ Starting recognition...')
        recognition.start()
        console.log('✅ Recognition started!')
        
      } catch (err: any) {
        console.error('❌ Microphone error:', err)
        
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Click the camera icon in your browser address bar to allow.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.')
        } else {
          setError(`Microphone error: ${err.message}`)
        }
      }
    }
  }

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Not Supported</h2>
          <p className="mb-4">Voice commands require Chrome, Edge, or Safari browser.</p>
          <p className="text-sm text-muted-foreground">You're currently using an unsupported browser.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Small button for navigation bar */}
      <Button
        onClick={toggleListening}
        size="icon"
        className={`h-10 w-10 rounded-lg ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
        title="Voice Commands"
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>

      {/* Transcription Display - Shows when listening - FIXED POSITION CENTER SCREEN */}
      {isListening && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-[600px] max-w-[90vw] border-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-lg">Listening...</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* What you're saying RIGHT NOW */}
            <div className="mb-4 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-300 dark:border-blue-700">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
                🗣️ SPEAKING NOW:
              </div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 min-h-[60px]">
                {interimTranscript || '...waiting for speech...'}
              </div>
            </div>

            {/* Full transcript */}
            <div className="p-6 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-300 dark:border-green-700 max-h-64 overflow-y-auto">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">
                ✅ TRANSCRIPT:
              </div>
              <div className="text-xl text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {transcript || 'Start speaking...'}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-sm text-muted-foreground text-center">
              💡 Speak clearly. Your words will appear above. Network errors are normal and ignored.
            </div>
          </div>
        </div>
      )}

      {/* Error Display - Shows as overlay if there's a real error */}
      {error && error !== 'Error: network' && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 dark:bg-red-950 rounded-lg p-4 w-96 border-2 border-red-500 shadow-2xl">
          <div className="font-bold text-red-600 dark:text-red-400 mb-2">
            ⚠️ Error:
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError('')}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}
    </>
  
  )
}

