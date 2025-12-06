'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  targetElement?: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard!',
    description: 'Your personal command center for managing all aspects of your life. Let\'s take a quick tour.',
    icon: '👋',
  },
  {
    id: 'dashboard-modes',
    title: 'Dashboard Modes',
    description: 'You can switch between Standard (fixed layout) and Customizable (drag & resize cards) modes in Settings.',
    icon: '🎨',
  },
  {
    id: 'domains',
    title: 'Domain Cards',
    description: 'Each card represents a life domain: Financial, Health, Vehicles, Career, and more. Click any card to explore.',
    icon: '📊',
  },
  {
    id: 'customize',
    title: 'Customize Your View',
    description: 'Go to Settings → Dashboard to change layouts, hide cards, adjust colors, and create custom layouts.',
    icon: '⚙️',
  },
  {
    id: 'wizard',
    title: 'Layout Creation Wizard',
    description: 'Use the wizard in settings to create your perfect layout with a step-by-step guide.',
    icon: '✨',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start exploring your dashboard. You can always revisit this tutorial from Settings.',
    icon: '🎉',
  },
]

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true)

  useEffect(() => {
    // Check if user has seen onboarding via server settings
    (async () => {
      try {
        const res = await fetch('/api/user-settings', { credentials: 'include' })
        const json = res.ok ? await res.json() : { settings: {} }
        const seen = json?.settings?.onboarding?.tutorialSeen
        if (!seen) {
          setIsOpen(true)
          setHasSeenOnboarding(false)
        }
      } catch {
        // default to open once
        setIsOpen(true)
        setHasSeenOnboarding(false)
      }
    })()
  }, [])

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setIsOpen(false)
    setHasSeenOnboarding(true)
    fetch('/api/user-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ onboarding: { tutorialSeen: true } })
    }).catch(() => {})
  }

  const handleComplete = () => {
    setIsOpen(false)
    setHasSeenOnboarding(true)
    fetch('/api/user-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ onboarding: { tutorialSeen: true } })
    }).catch(() => {})
  }

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const currentStepData = ONBOARDING_STEPS[currentStep]

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 shadow-lg z-40"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Tutorial
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-2xl w-full animate-fade-in-scale">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{currentStepData.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <Progress value={progress} className="mb-6 h-2" />

          {/* Content */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">{currentStepData.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Illustration/Visual */}
          <div className="mb-8 p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <div className="text-6xl mb-4">{currentStepData.icon}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentStep === 0 && "Let's get started with a quick tour"}
                {currentStep === 1 && "Toggle between Standard and Customizable modes"}
                {currentStep === 2 && "Each card shows important information at a glance"}
                {currentStep === 3 && "Make the dashboard truly yours"}
                {currentStep === 4 && "Create layouts with our guided wizard"}
                {currentStep === 5 && "You're ready to explore!"}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < ONBOARDING_STEPS.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Tutorial
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-purple-600 w-6'
                    : index < currentStep
                    ? 'bg-purple-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simple helper to reset onboarding (for testing or re-showing)
export function resetOnboarding() {
  fetch('/api/user-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ onboarding: { tutorialSeen: false } })
  }).finally(() => window.location.reload())
}
















