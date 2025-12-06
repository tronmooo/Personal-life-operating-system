'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Play, Pause, RotateCcw, Square, Heart, Sparkles } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

const GUIDED_MEDITATIONS = [
  {
    id: 'body-scan',
    name: '🧘 Body Scan',
    description: '15-min guided relaxation focusing on each body part progressively',
    duration: 15,
    icon: '🧘',
    color: 'from-blue-500 to-purple-600',
    steps: [
      { duration: 60, instruction: 'Get comfortable. Close your eyes and take three deep breaths...', bodyPart: 'Preparation', emoji: '🌬️' },
      { duration: 90, instruction: 'Bring your attention to your feet. Notice any sensations... tension, warmth, tingling...', bodyPart: 'Feet', emoji: '🦶' },
      { duration: 90, instruction: 'Move awareness to your lower legs and calves. Feel the muscles relax...', bodyPart: 'Lower Legs', emoji: '🦵' },
      { duration: 90, instruction: 'Shift focus to your thighs and hips. Release any tension you find...', bodyPart: 'Thighs & Hips', emoji: '💪' },
      { duration: 90, instruction: 'Notice your lower back and abdomen. Breathe deeply into this area...', bodyPart: 'Core', emoji: '✨' },
      { duration: 90, instruction: 'Scan your chest and upper back. Feel your breath moving naturally...', bodyPart: 'Chest', emoji: '❤️' },
      { duration: 90, instruction: 'Focus on your shoulders and neck. Let them drop and soften...', bodyPart: 'Shoulders', emoji: '🤲' },
      { duration: 90, instruction: 'Notice your arms, hands, and fingers. Feel them heavy and relaxed...', bodyPart: 'Arms', emoji: '👋' },
      { duration: 90, instruction: 'Bring attention to your face. Relax your jaw, eyes, and forehead...', bodyPart: 'Face', emoji: '😌' },
      { duration: 60, instruction: 'Feel your whole body now. Completely relaxed and at peace...', bodyPart: 'Completion', emoji: '🌟' }
    ]
  },
  {
    id: '54321',
    name: '🔢 5-4-3-2-1 Grounding',
    description: '5-min anxiety relief using five senses to stay present',
    duration: 5,
    icon: '🔢',
    color: 'from-green-500 to-teal-600',
    steps: [
      { duration: 30, instruction: 'Take a deep breath. This exercise will ground you in the present moment using your 5 senses.', bodyPart: 'Introduction', emoji: '🌬️' },
      { duration: 60, instruction: 'Look around and name 5 things you can SEE. Say them out loud or in your mind: "I see..."', bodyPart: '5 Things You See', emoji: '👁️' },
      { duration: 60, instruction: 'Notice 4 things you can TOUCH. Feel the texture, temperature. "I feel..."', bodyPart: '4 Things You Touch', emoji: '✋' },
      { duration: 60, instruction: 'Identify 3 things you can HEAR. Close your eyes if helpful. "I hear..."', bodyPart: '3 Things You Hear', emoji: '👂' },
      { duration: 60, instruction: 'Notice 2 things you can SMELL. Or think of your favorite scents. "I smell..."', bodyPart: '2 Things You Smell', emoji: '👃' },
      { duration: 30, instruction: 'Name 1 thing you can TASTE. Or imagine a favorite flavor. "I taste..."', bodyPart: '1 Thing You Taste', emoji: '👅' },
      { duration: 30, instruction: 'Take a final deep breath. Notice how you feel more present and grounded now.', bodyPart: 'Complete', emoji: '✅' }
    ]
  },
  {
    id: 'progressive-muscle',
    name: '💪 Progressive Muscle Relaxation',
    description: '10-min tension and release technique for deep relaxation',
    duration: 10,
    icon: '💪',
    color: 'from-orange-500 to-red-600',
    steps: [
      { duration: 45, instruction: 'Get comfortable. We will tense and release each muscle group. Breathe normally.', bodyPart: 'Preparation', emoji: '🌬️' },
      { duration: 60, instruction: 'Tense your FEET by curling your toes tightly. Hold... 1, 2, 3, 4, 5... Now RELEASE. Feel the difference.', bodyPart: 'Feet', emoji: '🦶' },
      { duration: 60, instruction: 'Tense your CALVES by pulling toes toward you. Hold tight... Now let go completely. Notice the warmth.', bodyPart: 'Calves', emoji: '🦵' },
      { duration: 60, instruction: 'Squeeze your THIGHS together firmly. Hold the tension... 5 seconds... Release. Feel the relaxation spread.', bodyPart: 'Thighs', emoji: '💪' },
      { duration: 60, instruction: 'Tighten your STOMACH muscles. Pull belly button to spine. Hold... Hold... Let go. Breathe deeply.', bodyPart: 'Abdomen', emoji: '✨' },
      { duration: 60, instruction: 'Make FISTS with both hands. Squeeze tight... tighter... Now open and let hands rest. Feel the release.', bodyPart: 'Hands', emoji: '✊' },
      { duration: 60, instruction: 'Tense your ARMS. Bend elbows and tighten biceps. Hold... Hold... Release. Arms heavy and warm.', bodyPart: 'Arms', emoji: '💪' },
      { duration: 60, instruction: 'Raise SHOULDERS to ears. Hold tension... up high... Drop them down. Let shoulders melt.', bodyPart: 'Shoulders', emoji: '🤲' },
      { duration: 60, instruction: 'Scrunch your FACE. Squeeze eyes shut, wrinkle nose. Hold... Now relax everything. Smooth and soft.', bodyPart: 'Face', emoji: '😌' },
      { duration: 45, instruction: 'Scan your whole body. Notice the deep relaxation. You are completely at ease. Well done.', bodyPart: 'Complete', emoji: '🌟' }
    ]
  },
  {
    id: 'loving-kindness',
    name: '💗 Loving-Kindness Meditation',
    description: '12-min practice to cultivate compassion for self and others',
    duration: 12,
    icon: '💗',
    color: 'from-pink-500 to-rose-600',
    steps: [
      { duration: 60, instruction: 'Sit comfortably. Place hand on heart. Take three gentle breaths, feeling your chest rise and fall.', bodyPart: 'Centering', emoji: '❤️' },
      { duration: 120, instruction: 'Start with YOURSELF. Silently repeat: "May I be happy. May I be healthy. May I be safe. May I live with ease."', bodyPart: 'Self-Compassion', emoji: '🫶' },
      { duration: 120, instruction: 'Think of someone you LOVE. Picture them clearly. "May you be happy. May you be healthy. May you be safe. May you live with ease."', bodyPart: 'Loved One', emoji: '💝' },
      { duration: 120, instruction: 'Bring to mind a NEUTRAL person - someone you see but don\'t know well. Extend the same wishes to them sincerely.', bodyPart: 'Neutral Person', emoji: '🤝' },
      { duration: 120, instruction: 'Now someone DIFFICULT. This is challenging but powerful. Try: "May you be happy. May you be healthy..." Take your time.', bodyPart: 'Difficult Person', emoji: '🕊️' },
      { duration: 120, instruction: 'Expand to ALL BEINGS everywhere. "May all beings be happy. May all beings be healthy, safe, and at ease."', bodyPart: 'All Beings', emoji: '🌍' },
      { duration: 60, instruction: 'Return to your breath. Notice any warmth in your heart. Carry this compassion with you today. 🙏', bodyPart: 'Closing', emoji: '✨' }
    ]
  }
]

export function GuidedMeditations() {
  const { addData } = useData()
  const [selectedMeditationId, setSelectedMeditationId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  const selectedMeditation = selectedMeditationId 
    ? GUIDED_MEDITATIONS.find(m => m.id === selectedMeditationId)
    : null

  const currentStep = selectedMeditation?.steps[currentStepIndex]

  // Calculate progress
  const totalDuration = selectedMeditation?.duration ? selectedMeditation.duration * 60 : 0
  const progressPercent = totalDuration > 0 ? (totalTimeElapsed / totalDuration) * 100 : 0

  // Main timer effect
  useEffect(() => {
    if (!isActive || !selectedMeditation) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next step
          setCurrentStepIndex((idx) => {
            const nextIdx = idx + 1
            
            // If completed all steps
            if (nextIdx >= selectedMeditation.steps.length) {
              saveMeditationSession()
              setIsActive(false)
              return idx // Stay on last step
            }
            
            setTimeLeft(selectedMeditation.steps[nextIdx].duration)
            return nextIdx
          })
          return selectedMeditation.steps[0]?.duration || 0
        }
        return prev - 1
      })

      setTotalTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, selectedMeditation])

  const saveMeditationSession = () => {
    if (!selectedMeditation) return

    const durationMinutes = Math.round(totalTimeElapsed / 60)
    
    addData('mindfulness', {
      title: `${selectedMeditation.name} Session`,
      description: `Completed guided meditation (${durationMinutes} min)`,
      metadata: {
        type: 'meditation',
        entryType: 'Meditation',
        logType: 'guided-meditation',
        meditation: selectedMeditation.name,
        durationSeconds: totalTimeElapsed,
        durationMinutes,
        startTime: sessionStartRef.current?.toISOString(),
        endTime: new Date().toISOString(),
        date: new Date().toISOString()
      }
    })
    
    console.log(`✅ Saved meditation session: ${selectedMeditation.name} - ${durationMinutes} min`)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mindfulness-data-updated'))
    }
  }

  const handleSelectMeditation = (meditationId: string) => {
    const meditation = GUIDED_MEDITATIONS.find(m => m.id === meditationId)!
    setSelectedMeditationId(meditationId)
    setCurrentStepIndex(0)
    setTimeLeft(meditation.steps[0].duration)
    setTotalTimeElapsed(0)
  }

  const handleStart = () => {
    if (!selectedMeditation) return
    setIsActive(true)
    sessionStartRef.current = new Date()
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsActive(false)
    
    if (totalTimeElapsed > 30) {
      console.log('⏹️ Stopped. Saving session...')
      saveMeditationSession()
    }
    
    // Reset to selection screen
    setSelectedMeditationId(null)
    setCurrentStepIndex(0)
    setTimeLeft(0)
    setTotalTimeElapsed(0)
    sessionStartRef.current = null
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsActive(false)
    setCurrentStepIndex(0)
    setTimeLeft(selectedMeditation?.steps[0].duration || 0)
    setTotalTimeElapsed(0)
    sessionStartRef.current = null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Meditation selection screen
  if (!selectedMeditation) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              Guided Meditations
            </CardTitle>
            <CardDescription>
              Choose a guided practice for deep relaxation and mindfulness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GUIDED_MEDITATIONS.map((meditation) => (
                <Card 
                  key={meditation.id}
                  className="border-2 border-gray-700 hover:border-purple-500 transition-all cursor-pointer group bg-slate-800/50"
                  onClick={() => handleSelectMeditation(meditation.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{meditation.icon}</div>
                      <div className="text-sm text-gray-400">
                        {meditation.duration} min
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {meditation.name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4">
                      {meditation.description}
                    </p>
                    <Button 
                      className={`w-full bg-gradient-to-r ${meditation.color} hover:opacity-90 text-white`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active meditation screen
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-3xl">{selectedMeditation.icon}</span>
              {selectedMeditation.name}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStop}
              className="border-gray-600 text-gray-300"
            >
              ← Back
            </Button>
          </div>
          <CardDescription>
            Follow the guided instructions for a complete meditation experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Visualization */}
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Animated Circle */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Pulsing outer glow */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedMeditation.color} opacity-30 blur-3xl animate-pulse`}
                style={{ 
                  animationDuration: '3s',
                  transform: `scale(${isActive ? 1.1 : 0.9})`
                }}
              />
              
              {/* Main circle */}
              <div 
                className={`absolute inset-4 rounded-full bg-gradient-to-br ${selectedMeditation.color} shadow-2xl transition-all duration-1000 flex flex-col items-center justify-center p-8 text-center`}
                style={{ 
                  transform: `scale(${isActive ? 1 : 0.95})`,
                }}
              >
                <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
                  {currentStep?.emoji}
                </div>
                <div className="text-3xl font-bold text-white mb-2 tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-lg font-semibold text-white/90 mb-4">
                  {currentStep?.bodyPart}
                </div>
                <div className="text-xs text-white/70">
                  Step {currentStepIndex + 1} of {selectedMeditation.steps.length}
                </div>
              </div>
            </div>

            {/* Instruction Text */}
            <Card className="max-w-2xl w-full bg-slate-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-200 leading-relaxed">
                    {currentStep?.instruction}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{formatTime(totalTimeElapsed)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${selectedMeditation.color} transition-all duration-1000`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap justify-center">
              {!isActive ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className={`bg-gradient-to-r ${selectedMeditation.color} hover:opacity-90 text-white font-semibold px-8 py-6 rounded-xl`}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {totalTimeElapsed > 0 ? 'Resume' : 'Begin Meditation'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePause} 
                  size="lg" 
                  variant="secondary"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 py-6"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {totalTimeElapsed > 0 && (
                <>
                  <Button 
                    onClick={handleStop} 
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop & Save
                  </Button>
                  
                  <Button 
                    onClick={handleReset} 
                    size="lg" 
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Restart
                  </Button>
                </>
              )}
            </div>

            {/* Step Progress Dots */}
            <div className="flex gap-2 flex-wrap justify-center max-w-md">
              {selectedMeditation.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < currentStepIndex
                      ? `bg-gradient-to-r ${selectedMeditation.color}`
                      : idx === currentStepIndex
                      ? `bg-gradient-to-r ${selectedMeditation.color} scale-150`
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tips */}
          <Card className={`border-2 bg-gradient-to-r ${selectedMeditation.color} bg-opacity-10`}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Heart className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold mb-1 text-white">💡 Tips for Success</div>
                  <p className="text-sm text-gray-200">
                    Find a quiet space. Use headphones if possible. Close your eyes or soften your gaze. 
                    Let thoughts come and go without judgment. Be patient with yourself.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}






















