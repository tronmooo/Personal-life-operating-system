'use client'

import { createContext, useContext, ReactNode } from 'react'

interface Insight {
  id: string
  type: 'info' | 'warning' | 'success' | 'alert'
  title: string
  description: string
  domain?: string
  timestamp: string
}

interface InsightsContextType {
  insights: Insight[]
  generateInsights: () => void
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined)

export function InsightsProvider({ children }: { children: ReactNode }) {
  const insights: Insight[] = []

  const generateInsights = () => {
    // This will be implemented with actual AI insights later
    console.log('Generating insights...')
  }

  return (
    <InsightsContext.Provider value={{ insights, generateInsights }}>
      {children}
    </InsightsContext.Provider>
  )
}

export function useInsights() {
  const context = useContext(InsightsContext)
  if (!context) {
    throw new Error('useInsights must be used within InsightsProvider')
  }
  return context
}


