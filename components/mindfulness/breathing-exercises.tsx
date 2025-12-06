'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wind, Play, Pause, RotateCcw, Square } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

const BREATHING_TECHNIQUES = [
  {
    id: 'box',
    name: '📦 Box Breathing',
    description: 'Equal counts: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s',
    duration: 16,
    pattern: [
      { phase: 'Breathe In', duration: 4, type: 'inhale', color: 'from-blue-400 to-cyan-500' },
      { phase: 'Hold', duration: 4, type: 'hold', color: 'from-cyan-400 to-purple-500' },
      { phase: 'Breathe Out', duration: 4, type: 'exhale', color: 'from-purple-400 to-green-500' },
      { phase: 'Hold', duration: 4, type: 'hold', color: 'from-green-400 to-blue-500' }
    ],
    benefits: 'Perfect for stress relief and mental clarity'
  },
  {
    id: '478',
    name: '💤 4-7-8 Relaxation',
    description: 'Inhale 4s, Hold 7s, Exhale 8s - deep relaxation',
    duration: 19,
    pattern: [
      { phase: 'Breathe In', duration: 4, type: 'inhale', color: 'from-blue-400 to-cyan-500' },
      { phase: 'Hold', duration: 7, type: 'hold', color: 'from-cyan-400 to-purple-500' },
      { phase: 'Breathe Out', duration: 8, type: 'exhale', color: 'from-purple-400 to-green-500' }
    ],
    benefits: 'Excellent for sleep and deep relaxation'
  },
  {
    id: 'calm',
    name: '🌊 Calm Wave',
    description: 'Inhale 4s, Exhale 6s - continuous rhythm',
    duration: 10,
    pattern: [
      { phase: 'Breathe In', duration: 4, type: 'inhale', color: 'from-blue-400 to-cyan-500' },
      { phase: 'Breathe Out', duration: 6, type: 'exhale', color: 'from-purple-400 to-green-500' }
    ],
    benefits: 'Simple and effective for quick stress relief'
  },
  {
    id: 'energize',
    name: '⚡ Energizing Burst',
    description: 'Quick Inhale 2s, Quick Exhale 2s - energizing',
    duration: 4,
    pattern: [
      { phase: 'Quick Inhale', duration: 2, type: 'inhale', color: 'from-orange-400 to-red-500' },
      { phase: 'Quick Exhale', duration: 2, type: 'exhale', color: 'from-red-400 to-orange-500' }
    ],
    benefits: 'Boost energy and mental alertness instantly'
  }
]

export function BreathingExercises() {
  const { addData } = useData()
  const [selectedTechniqueId, setSelectedTechniqueId] = useState('box')
  const [isActive, setIsActive] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(BREATHING_TECHNIQUES[0].pattern[0].duration)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  const selectedTechnique = BREATHING_TECHNIQUES.find(t => t.id === selectedTechniqueId) || BREATHING_TECHNIQUES[0]
  const currentPhase = selectedTechnique.pattern[currentPhaseIndex]

  // Calculate scale based on phase type and progress
  const getScale = () => {
    const progress = (currentPhase.duration - timeLeft) / currentPhase.duration
    
    if (currentPhase.type === 'inhale') {
      // Expand: scale from 1 to 1.5 during inhale
      return 1 + progress * 0.5
    } else if (currentPhase.type === 'exhale') {
      // Contract: scale from 1.5 to 1 during exhale
      return 1.5 - progress * 0.5
    } else {
      // Hold: maintain current scale
      return currentPhase === selectedTechnique.pattern[0] ? 1.5 : 1
    }
  }

  // Main timer effect
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setCurrentPhaseIndex((idx) => {
            const nextIdx = (idx + 1) % selectedTechnique.pattern.length
            
            // If we completed a full cycle (back to phase 0)
            if (nextIdx === 0) {
              setCyclesCompleted((cycles) => {
                const newCycles = cycles + 1
                
                // Auto-save and stop after 4 cycles
                if (newCycles >= 4) {
                  saveBreathingSession(newCycles)
                  setIsActive(false)
                  return newCycles
                }
                
                return newCycles
              })
            }
            
            setTimeLeft(selectedTechnique.pattern[nextIdx].duration)
            return nextIdx
          })
          return selectedTechnique.pattern[0].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, selectedTechnique])

  const saveBreathingSession = (cycles: number) => {
    const durationSeconds = cycles * selectedTechnique.duration
    const durationMinutes = Math.round(durationSeconds / 60)
    
    addData('mindfulness', {
      title: `${selectedTechnique.name} Session`,
      description: `Completed ${cycles} cycles (${durationMinutes} min)`,
      metadata: {
        type: 'breathing',
        entryType: 'Breathing',
        logType: 'breathing-exercise',
        technique: selectedTechnique.name,
        cycles,
        durationSeconds,
        durationMinutes,
        startTime: sessionStartRef.current?.toISOString(),
        endTime: new Date().toISOString(),
        date: new Date().toISOString()
      }
    })
    
    console.log(`✅ Saved breathing session: ${selectedTechnique.name} - ${cycles} cycles`)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mindfulness-data-updated'))
    }
  }

  const handleStart = () => {
    setIsActive(true)
    sessionStartRef.current = new Date()
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsActive(false)
    
    if (cyclesCompleted > 0) {
      console.log('⏹️ Stopped. Saving session...')
      saveBreathingSession(cyclesCompleted)
    }
    
    // Reset
    setCurrentPhaseIndex(0)
    setTimeLeft(selectedTechnique.pattern[0].duration)
    setCyclesCompleted(0)
    sessionStartRef.current = null
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsActive(false)
    setCurrentPhaseIndex(0)
    setTimeLeft(selectedTechnique.pattern[0].duration)
    setCyclesCompleted(0)
    sessionStartRef.current = null
  }

  const handleTechniqueChange = (techniqueId: string) => {
    handleReset()
    setSelectedTechniqueId(techniqueId)
    const newTechnique = BREATHING_TECHNIQUES.find(t => t.id === techniqueId)!
    setTimeLeft(newTechnique.pattern[0].duration)
  }

  const progressPercent = ((currentPhase.duration - timeLeft) / currentPhase.duration) * 100
  const scale = getScale()

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-cyan-400" />
            Breathing Exercises
          </CardTitle>
          <CardDescription>
            Choose a technique and follow the guidance to breathe mindfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Technique Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BREATHING_TECHNIQUES.map((tech) => (
              <button
                key={tech.id}
                onClick={() => handleTechniqueChange(tech.id)}
                disabled={isActive}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedTechniqueId === tech.id && !isActive
                    ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/50'
                    : isActive
                    ? 'border-gray-600 opacity-50 cursor-not-allowed'
                    : 'border-gray-600 hover:border-cyan-400 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold text-white mb-1">{tech.name}</div>
                <div className="text-xs text-gray-300">{tech.description}</div>
              </button>
            ))}
          </div>

          {/* Main Visualization */}
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            {/* Animated Breathing Circle */}
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Outer glow */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentPhase.color} opacity-20 blur-2xl transition-transform duration-1000`}
                style={{ transform: `scale(${scale})` }}
              />
              
              {/* Main circle */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentPhase.color} shadow-2xl transition-transform duration-1000 flex items-center justify-center`}
                style={{ 
                  transform: `scale(${scale})`,
                  boxShadow: `0 0 60px ${currentPhase.color === 'from-blue-400 to-cyan-500' ? 'rgba(34, 211, 238, 0.6)' : currentPhase.color === 'from-purple-400 to-green-500' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
                }}
              >
                <div className="text-center">
                  <div className="text-7xl font-bold text-white mb-2 tabular-nums">{timeLeft}</div>
                  <div className="text-2xl font-semibold text-white/90">{currentPhase.phase}</div>
                  <div className="text-sm text-white/70 mt-2">
                    {currentPhase.type === 'inhale' && '↗️ Expand'}
                    {currentPhase.type === 'exhale' && '↙️ Contract'}
                    {currentPhase.type === 'hold' && '⏸️ Hold'}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="w-full max-w-md">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${currentPhase.color} transition-all duration-1000`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-center mt-3 text-sm text-gray-400">
                {currentPhase.phase} • {timeLeft}s
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 flex-wrap justify-center">
              {!isActive ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-6 rounded-xl"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Breathing
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
              
              {isActive && (
                <Button 
                  onClick={handleStop} 
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop & Save
                </Button>
              )}
              
              <Button 
                onClick={handleReset} 
                size="lg" 
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Cycle Counter */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Cycles Progress</div>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4].map((cycle) => (
                  <div
                    key={cycle}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold transition-all ${
                      cycle <= cyclesCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {cycle}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technique Info */}
          <Card className={`border-2 bg-gradient-to-r ${selectedTechnique.pattern[0].color} opacity-20`}>
            <CardContent className="pt-4">
              <div className="text-sm font-semibold mb-2 text-white">✨ {selectedTechnique.name}</div>
              <p className="text-sm text-gray-200">{selectedTechnique.benefits}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

























