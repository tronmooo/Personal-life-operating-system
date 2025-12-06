export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThumbsUp, ThumbsDown, Send, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  feedback?: 'helpful' | 'not_helpful' | 'neutral'
  timestamp: Date
}

const QUICK_REPLIES = [
  "I'm feeling stressed about work",
  "I've been feeling anxious lately",
  "I'm having trouble sleeping"
]

export default function TherapyChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null)
  const [feedbackNote, setFeedbackNote] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Initial greeting
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: "Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind.",
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/therapy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      
      if (!conversationId) {
        setConversationId(data.conversationId)
      }

      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const submitFeedback = async (messageId: string, feedback: 'helpful' | 'not_helpful') => {
    try {
      await fetch('/api/therapy-chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          feedback,
          note: feedbackNote || undefined
        })
      })

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      ))

      setFeedbackMode(null)
      setFeedbackNote('')

    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">AI Therapist Chat</h1>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="flex flex-col gap-2 max-w-[70%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? 'bg-slate-700 text-white'
                      : 'bg-purple-600 text-white'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {message.role === 'assistant' && message.id !== 'greeting' && (
                  <div className="flex items-center gap-2 px-2">
                    {!message.feedback && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-slate-400 hover:text-green-400"
                          onClick={() => submitFeedback(message.id, 'helpful')}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-slate-400 hover:text-red-400"
                          onClick={() => {
                            setFeedbackMode(message.id)
                          }}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {message.feedback === 'helpful' && (
                      <span className="text-xs text-green-400">✓ Helpful</span>
                    )}
                    {message.feedback === 'not_helpful' && (
                      <span className="text-xs text-red-400">Feedback received</span>
                    )}
                  </div>
                )}

                {feedbackMode === message.id && (
                  <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-slate-400">
                      Help us improve (optional):
                    </p>
                    <Textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder="What could be better?"
                      className="bg-slate-900 border-slate-700 text-white text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => submitFeedback(message.id, 'not_helpful')}
                      >
                        Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFeedbackMode(null)
                          setFeedbackNote('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="bg-purple-600 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {messages.length === 1 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <p className="text-sm text-slate-400 mb-3">Quick replies:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(reply)}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 border-slate-700 text-white resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

























