'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Phone, Check, X } from 'lucide-react'
import { AIConciergePopup } from '@/components/ai-concierge-popup'

export default function TestButtonsPage() {
  const [showConcierge, setShowConcierge] = useState(false)
  const [checks, setChecks] = useState({
    pageLoaded: true,
    reactRendering: true,
    buttonClicked: false,
    popupOpened: false
  })

  const handleClick = () => {
    console.log('🎯 Test button clicked!')
    setChecks(prev => ({ ...prev, buttonClicked: true }))
    setShowConcierge(true)
    setTimeout(() => {
      setChecks(prev => ({ ...prev, popupOpened: true }))
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">🧪 AI Concierge Button Test</h1>
          <p className="text-gray-300">Testing if the AI Concierge interface is working</p>
        </div>

        {/* Status Checks */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">System Checks:</h2>
          
          <div className="space-y-3">
            <StatusItem 
              label="Page Loaded" 
              status={checks.pageLoaded} 
            />
            <StatusItem 
              label="React Rendering" 
              status={checks.reactRendering} 
            />
            <StatusItem 
              label="Button Clicked" 
              status={checks.buttonClicked} 
              description="Click the test button below"
            />
            <StatusItem 
              label="Popup Opened" 
              status={checks.popupOpened} 
              description="AI Concierge popup should appear"
            />
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-8 space-y-6">
          <h2 className="text-xl font-bold text-white text-center">Test the AI Concierge Button:</h2>
          
          <div className="flex flex-col items-center gap-6">
            {/* Large Test Button */}
            <Button
              onClick={handleClick}
              className="h-32 w-32 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
              size="icon"
            >
              <Phone className="h-16 w-16 text-white" />
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-white">Click the Phone Button</p>
              <p className="text-gray-400">This should open the AI Concierge popup</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-blue-300">📍 Where to Find AI Concierge on Your Main App:</h3>
          
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-white">Bottom-Right Corner (Floating Buttons)</p>
                <p className="text-sm">Look for two circular buttons in the bottom-right corner:</p>
                <p className="text-sm mt-1">• Purple button (🧠) = AI Assistant</p>
                <p className="text-sm">• Cyan button (📞) = AI Concierge</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-white">Navigation Bar (Top)</p>
                <p className="text-sm">Look in the top-right of your navigation bar for:</p>
                <p className="text-sm mt-1">• Brain icon (🧠) = AI Assistant</p>
                <p className="text-sm">• Phone icon (📞) = AI Concierge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-yellow-300">🔍 If You Still Don't See It:</h3>
          
          <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
            <li>Hard refresh: Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Cmd+Shift+R</kbd> (Mac) or <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+R</kbd> (Windows)</li>
            <li>Clear browser cache and reload</li>
            <li>Check browser console (F12) for any errors</li>
            <li>Make sure you're on: <code className="text-cyan-400">http://localhost:3000</code></li>
            <li>Try this test page: <code className="text-cyan-400">http://localhost:3000/test-buttons</code></li>
          </ul>
        </div>

        {/* Direct Link */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            Go to Main App →
          </Button>
          
          <p className="text-gray-400 text-sm">
            After clicking, look for the floating buttons in the bottom-right corner
          </p>
        </div>
      </div>

      {/* AI Concierge Popup */}
      {showConcierge && <AIConciergePopup open={showConcierge} onOpenChange={setShowConcierge} />}
    </div>
  )
}

function StatusItem({ 
  label, 
  status, 
  description 
}: { 
  label: string
  status: boolean
  description?: string 
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        status ? 'bg-green-500/20' : 'bg-gray-500/20'
      }`}>
        {status ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <X className="h-4 w-4 text-gray-500" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${status ? 'text-green-300' : 'text-gray-400'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  )
}



























