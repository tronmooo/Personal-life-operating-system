'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Phone } from 'lucide-react'
import { AIAssistantPopupClean } from './ai-assistant-popup-clean'
import { AIConciergePopup } from './ai-concierge-popup'

export function FloatingAIButtons() {
  const [showAssistant, setShowAssistant] = useState(false)
  const [showConcierge, setShowConcierge] = useState(false)

  return (
    <>
      {/* Floating Buttons - Using inline styles to ensure positioning works */}
      <div 
        className="flex flex-col gap-3 z-50"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 50
        }}
      >
        {/* AI Assistant Button */}
        <Button
          onClick={() => {
            console.log('🎯 AI Assistant button clicked!')
            setShowAssistant(true)
          }}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
          size="icon"
          aria-label="Open AI Assistant"
        >
          <Brain className="h-6 w-6 text-white" />
        </Button>

        {/* AI Concierge Button */}
        <Button
          onClick={() => {
            console.log('📞 AI Concierge button clicked!')
            setShowConcierge(true)
          }}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
          size="icon"
          aria-label="Open AI Concierge"
        >
          <Phone className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Popups */}
      {showAssistant && <AIAssistantPopupClean open={showAssistant} onOpenChange={setShowAssistant} />}
      {showConcierge && <AIConciergePopup open={showConcierge} onOpenChange={setShowConcierge} />}
    </>
  )
}

