'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { useSpeechRecognition } from '@/lib/voice/speech-recognition'
import { parseMultipleCommands } from '@/lib/voice/command-parser'
import { executeCommand } from '@/lib/voice/command-executor'
import { toast } from '@/lib/utils/toast'

interface VoiceCommandButtonProps {
  className?: string
}

export function VoiceCommandButton({ className = '' }: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [parsedCommands, setParsedCommands] = useState<any[]>([])
  const [showTranscript, setShowTranscript] = useState(true)
  const [debugStatus, setDebugStatus] = useState<string>('Ready')

  const {
    isSupported,
    isListening: speechIsListening,
    transcript: speechTranscript,
    interimTranscript,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition()

  // Debug: Log everything
  useEffect(() => {
    console.log('🔍 Voice Button State:', {
      isSupported,
      isListening,
      speechIsListening,
      transcript,
      speechTranscript,
      interimTranscript,
      error: speechError
    })
  }, [isSupported, isListening, speechIsListening, transcript, speechTranscript, interimTranscript, speechError])

  // Update transcript from speech recognition
  useEffect(() => {
    console.log('📝 Speech transcript changed:', speechTranscript)
    if (speechTranscript) {
      setTranscript(speechTranscript)
      setDebugStatus(`Got transcript: ${speechTranscript.substring(0, 30)}...`)
    }
  }, [speechTranscript])

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      console.error('❌ Speech error:', speechError)
      toast.error('Voice recognition error', speechError)
      setIsListening(false)
      setDebugStatus(`Error: ${speechError}`)
    }
  }, [speechError])

  const handleVoiceToggle = async () => {
    console.log('🎤 Voice toggle clicked. Current state:', { isListening, isSupported })
    
    if (isListening) {
      // Stop listening
      console.log('⏹️ Stopping listening...')
      setDebugStatus('Stopping...')
      stopListening()
      setIsListening(false)
      
      // Process the command if we have transcript
      if (transcript.trim()) {
        console.log('🔄 Processing transcript:', transcript)
        setDebugStatus('Processing command...')
        await processCommand(transcript)
      } else {
        console.warn('⚠️ No transcript to process')
        setDebugStatus('No speech detected')
      }
    } else {
      // Start listening
      console.log('▶️ Starting voice recognition...')
      setDebugStatus('Checking browser support...')
      
      if (!isSupported) {
        console.error('❌ Speech recognition not supported')
        setDebugStatus('Not supported in this browser')
        toast.error('Voice commands not supported', 'Your browser does not support speech recognition. Try Chrome or Edge.')
        return
      }

      console.log('✅ Browser supported. Requesting microphone...')
      setDebugStatus('Requesting microphone...')
      
      setTranscript('')
      setParsedCommands([])
      setShowConfirmation(false)
      setShowTranscript(true)
      
      const started = await startListening()
      console.log('🎙️ Start listening result:', started)
      
      if (started) {
        setIsListening(true)
        setDebugStatus('Listening - speak now!')
        toast.info('Listening...', 'Speak your command(s) now')
        console.log('🟢 Now listening for speech...')
      } else {
        console.error('❌ Failed to start listening')
        setDebugStatus('Failed to start - check permissions')
        toast.error('Failed to start', 'Check microphone permissions')
      }
    }
  }

  const processCommand = async (text: string) => {
    console.log('🎤 Processing transcript:', text)
    setIsProcessing(true)
    
    try {
      // Parse multiple commands using AI
      const parsed = await parseMultipleCommands(text)
      
      console.log('📝 Parsed commands:', parsed)
      
      if (!parsed || parsed.length === 0) {
        toast.warning('Could not understand command', 'Please try again with a clearer command.')
        setIsProcessing(false)
        return
      }

      // Show confirmation dialog
      setParsedCommands(parsed)
      setShowConfirmation(true)
      
      // Speak confirmation
      if (parsed.length === 1) {
        speak(`I understood: ${parsed[0].summary}. Should I proceed?`)
      } else {
        speak(`I understood ${parsed.length} commands. Should I proceed?`)
      }
      
    } catch (error) {
      console.error('Command processing error:', error)
      toast.error('Failed to process command', 'Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmCommand = async () => {
    if (!parsedCommands || parsedCommands.length === 0) return

    setIsProcessing(true)
    const results = []
    
    try {
      // Execute all commands
      for (const command of parsedCommands) {
        const result = await executeCommand(command)
        results.push(result)
      }
      
      // Show results
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (failCount === 0) {
        // All succeeded
        if (parsedCommands.length === 1) {
          toast.success('Command executed!', results[0].message)
          speak(results[0].message)
        } else {
          toast.success(`All ${successCount} commands executed!`, results.map(r => r.message).join('. '))
          speak(`Successfully executed ${successCount} commands!`)
        }
      } else if (successCount === 0) {
        // All failed
        toast.error('Commands failed', results.map(r => r.message).join('. '))
      } else {
        // Mixed results
        toast.warning(`${successCount} succeeded, ${failCount} failed`, results.map(r => r.message).join('. '))
        speak(`${successCount} commands succeeded, ${failCount} failed`)
      }
    } catch (error) {
      console.error('Command execution error:', error)
      toast.error('Failed to execute commands')
    } finally {
      setIsProcessing(false)
      setShowConfirmation(false)
      setTranscript('')
      setParsedCommands([])
    }
  }

  const cancelCommand = () => {
    setShowConfirmation(false)
    setTranscript('')
    setParsedCommands([])
    speak('Commands cancelled')
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // Show button even if not supported (for debugging)
  const showDebug = true // Set to false in production

  return (
    <>
      {/* Voice Command Button */}
      <Button
        onClick={handleVoiceToggle}
        className={`relative ${className} ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : isSupported 
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-600 hover:bg-gray-700'
        }`}
        size="icon"
        disabled={isProcessing || !isSupported}
        title={isSupported ? 'Voice Commands' : 'Voice not supported in this browser'}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {/* Listening Indicator */}
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        
        {/* Not Supported Indicator */}
        {!isSupported && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500">×</span>
          </span>
        )}
      </Button>

      {/* Debug Status Badge */}
      {showDebug && (
        <div className="fixed bottom-4 left-4 z-50 bg-black/90 text-white px-4 py-2 rounded-lg text-xs font-mono max-w-md">
          <div className="font-bold mb-1">🔍 Voice Debug:</div>
          <div>Supported: {isSupported ? '✅' : '❌'}</div>
          <div>Listening: {speechIsListening ? '🟢' : '⚪'}</div>
          <div>Status: {debugStatus}</div>
          <div>Transcript: {transcript || '(empty)'}</div>
          <div>Interim: {interimTranscript || '(empty)'}</div>
          {speechError && <div className="text-red-400">Error: {speechError}</div>}
        </div>
      )}

      {/* Listening Overlay */}
      {isListening && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full mb-4 animate-pulse">
                  <Mic className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Listening...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Speak your command clearly
                </p>
              </div>

              {/* Live Transcript - ALWAYS SHOW */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg mb-4 border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Volume2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      What I'm hearing:
                    </p>
                    {transcript || speechTranscript ? (
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        "{transcript || speechTranscript}"
                      </p>
                    ) : (
                      <p className="text-sm text-purple-600 dark:text-purple-400 italic">
                        Speak now... I'm listening
                      </p>
                    )}
                    {interimTranscript && (
                      <p className="text-xs text-purple-500 dark:text-purple-400 italic mt-2">
                        (hearing: "{interimTranscript}")
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleVoiceToggle} 
                variant="outline"
                className="w-full"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop Listening
              </Button>

              <p className="text-xs text-muted-foreground mt-4">
                💡 Try: "My weight is 175 pounds" or "Log 10000 steps and add water 16 ounces"
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && parsedCommands.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <Card className="max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Volume2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Confirm {parsedCommands.length === 1 ? 'Command' : `${parsedCommands.length} Commands`}
                  </h3>
                  
                  {/* Show Full Transcript */}
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">You said:</p>
                    <p className="text-sm italic">"{transcript}"</p>
                  </div>
                  
                  {/* Show All Parsed Commands */}
                  <div className="space-y-3 mb-3">
                    {parsedCommands.map((cmd, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 flex-1">
                            {cmd.summary}
                          </p>
                        </div>
                        
                        {/* Action Details */}
                        <div className="ml-8 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline">{cmd.action}</Badge>
                            {cmd.domain && (
                              <Badge variant="secondary">{cmd.domain}</Badge>
                            )}
                          </div>
                          
                          {/* Parameters */}
                          {cmd.parameters && Object.keys(cmd.parameters).length > 0 && (
                            <div className="mt-2 text-xs space-y-1">
                              {Object.entries(cmd.parameters).map(([key, value]: [string, any]) => (
                                key !== 'date' && (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-medium">{String(value)}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Should I proceed with {parsedCommands.length === 1 ? 'this action' : 'these actions'}?
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={cancelCommand}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmCommand}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

