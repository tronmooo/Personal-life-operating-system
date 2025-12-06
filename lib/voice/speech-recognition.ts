'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface SpeechRecognitionHook {
  isSupported: boolean
  isListening: boolean
  transcript: string
  interimTranscript: string
  startListening: () => Promise<boolean>
  stopListening: () => void
  error: string | null
}

// Check if browser supports Web Speech API
const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && 
         ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const isSupported = isSpeechRecognitionSupported()

  // Initialize speech recognition
  useEffect(() => {
    console.log('🎙️ Initializing speech recognition. Supported:', isSupported)
    
    if (!isSupported) {
      console.warn('⚠️ Speech recognition not supported')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.error('❌ SpeechRecognition constructor not found')
      return
    }
    
    console.log('✅ Creating SpeechRecognition instance...')
    const recognition = new SpeechRecognition()

    // Configuration
    recognition.continuous = true // Keep listening until stopped
    recognition.interimResults = true // Get interim results
    recognition.lang = 'en-US' // Language
    recognition.maxAlternatives = 1
    
    console.log('⚙️ Speech recognition configured:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang
    })

    // Event: Result (when speech is recognized)
    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''

      // Log for debugging
      console.log('🎤 Speech recognition result event fired!', {
        resultsLength: event.results.length,
        resultIndex: event.resultIndex
      })

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptPiece = result[0].transcript

        console.log(`  Result ${i}:`, {
          transcript: transcriptPiece,
          isFinal: result.isFinal,
          confidence: result[0].confidence
        })

        if (result.isFinal) {
          finalText += transcriptPiece + ' '
          console.log('✅ Final transcript:', transcriptPiece)
        } else {
          interimText += transcriptPiece
          console.log('⏳ Interim transcript:', transcriptPiece)
        }
      }

      if (finalText) {
        setTranscript(prev => {
          const newTranscript = (prev + ' ' + finalText).trim()
          console.log('📝 Updated full transcript:', newTranscript)
          return newTranscript
        })
      }
      
      setInterimTranscript(interimText)
      setError(null)
    }

    // Event: Error
    recognition.onerror = (event: any) => {
      // Only log non-critical errors to console
      if (event.error !== 'network' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error)
      }
      
      let errorMessage = ''
      let shouldStopListening = true
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.'
          break
        case 'network':
          // Network errors are often transient, don't stop listening
          // The API will retry automatically in many cases
          console.warn('⚠️ Speech recognition network error (may be transient, ignoring)')
          shouldStopListening = false
          errorMessage = '' // Don't show error to user for network issues
          break
        case 'aborted':
          // Aborted is expected when stopping, don't show error
          shouldStopListening = false
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available. Try again later.'
          break
        default:
          // Don't show error for unknown errors, just log them
          console.warn('Speech recognition error:', event.error)
          shouldStopListening = false
      }

      // Only set error and stop if it's a critical error
      if (errorMessage && shouldStopListening) {
        setError(errorMessage)
        setIsListening(false)
      }
    }

    // Event: End (when recognition stops)
    recognition.onend = () => {
      setIsListening(false)
    }

    // Event: Start
    recognition.onstart = () => {
      console.log('🟢 Speech recognition STARTED')
      setIsListening(true)
      setError(null)
    }
    
    // Event: Audio Start
    recognition.onaudiostart = () => {
      console.log('🎵 Audio capture started')
    }
    
    // Event: Sound Start
    recognition.onsoundstart = () => {
      console.log('🔊 Sound detected')
    }
    
    // Event: Speech Start
    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected!')
    }
    
    // Event: Speech End
    recognition.onspeechend = () => {
      console.log('🤐 Speech ended')
    }
    
    // Event: Sound End
    recognition.onsoundend = () => {
      console.log('🔇 Sound ended')
    }
    
    // Event: Audio End
    recognition.onaudioend = () => {
      console.log('🎵 Audio capture ended')
    }
    
    // Event: No Match
    recognition.onnomatch = () => {
      console.warn('🤷 No speech match found')
    }

    recognitionRef.current = recognition
    console.log('✅ Speech recognition setup complete')

    return () => {
      console.log('🧹 Cleaning up speech recognition')
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('⚠️ Error during cleanup (ignored):', e)
        }
      }
    }
  }, [isSupported])

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    console.log('🎤 startListening called. Supported:', isSupported, 'Recognition ref:', !!recognitionRef.current)
    
    if (!isSupported || !recognitionRef.current) {
      const msg = 'Speech recognition not supported in this browser'
      console.error('❌', msg)
      setError(msg)
      return false
    }

    try {
      console.log('🎙️ Requesting microphone permission...')
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone permission granted!', stream.getTracks())
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => {
        console.log('🔇 Stopping track:', track.kind, track.label)
        track.stop()
      })

      // Clear previous transcript
      console.log('🧹 Clearing previous transcripts')
      setTranscript('')
      setInterimTranscript('')
      setError(null)

      // Start recognition
      console.log('▶️ Calling recognition.start()...')
      recognitionRef.current.start()
      console.log('✅ Recognition.start() called successfully')
      
      return true
    } catch (error: any) {
      console.error('❌ Microphone error:', error)
      console.error('   Error name:', error.name)
      console.error('   Error message:', error.message)
      
      let errorMessage = 'Could not access microphone'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.'
      }

      setError(errorMessage)
      return false
    }
  }, [isSupported])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
    }
  }, [isListening])

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
  }
}

// Utility function to check microphone permission
export async function checkMicrophonePermission(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    return false
  }
}

