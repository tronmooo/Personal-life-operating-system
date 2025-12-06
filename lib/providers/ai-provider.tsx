'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ChatMessage, AIAdvisor } from '@/types/ai'

interface AIContextType {
  messages: ChatMessage[]
  activeAdvisor: AIAdvisor | null
  setActiveAdvisor: (advisor: AIAdvisor | null) => void
  sendMessage: (content: string, advisor: AIAdvisor) => Promise<void>
  clearMessages: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeAdvisor, setActiveAdvisor] = useState<AIAdvisor | null>(null)

  const sendMessage = async (content: string, advisor: AIAdvisor) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      advisor,
    }

    setMessages(prev => [...prev, userMessage])

    // Simulate AI response (will be replaced with actual API call)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `This is a simulated response from ${advisor}. In production, this will connect to an AI API.`,
        timestamp: new Date().toISOString(),
        advisor,
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  const clearMessages = () => {
    setMessages([])
  }

  return (
    <AIContext.Provider
      value={{
        messages,
        activeAdvisor,
        setActiveAdvisor,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}


