'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ChatMessage, AIAdvisor } from '@/types/ai'

interface AIContextType {
  messages: ChatMessage[]
  activeAdvisor: AIAdvisor | null
  isLoading: boolean
  setActiveAdvisor: (advisor: AIAdvisor | null) => void
  sendMessage: (content: string, advisor: AIAdvisor) => Promise<void>
  clearMessages: () => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeAdvisor, setActiveAdvisor] = useState<AIAdvisor | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string, advisor: AIAdvisor) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      advisor,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call the actual AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'ai',
            text: m.content
          }))
        })
      })

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || "I'm here to help. Could you tell me more?",
        timestamp: new Date().toISOString(),
        advisor,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        advisor,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return (
    <AIContext.Provider
      value={{
        messages,
        activeAdvisor,
        isLoading,
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


