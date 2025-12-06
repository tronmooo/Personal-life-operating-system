'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, MessageCircle, Settings, Loader2 } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  timestamp: Date
}

export function ChatbotBuilder() {
  const [businessName, setBusinessName] = useState<string>('')
  const [businessType, setBusinessType] = useState<string>('')
  const [faqKnowledge, setFaqKnowledge] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState(false)
  
  const { loading, requestAI } = useAITool()

  const configureChatbot = () => {
    if (!businessName || !businessType) return
    setIsConfigured(true)
    setChatMessages([{
      role: 'bot',
      content: `Hello! I'm the ${businessName} assistant. How can I help you today?`,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, newUserMessage])
    setUserMessage('')

    const conversationHistory = chatMessages
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`)
      .join('\n')

    const prompt = `You are a customer service chatbot for ${businessName}, a ${businessType} business.

Business Knowledge:
${faqKnowledge || 'General customer service'}

Previous conversation:
${conversationHistory}

Customer: ${userMessage}

Respond as a helpful, professional customer service agent. Be concise, friendly, and provide actionable assistance. If you don't know something, offer to escalate to a human agent.

Bot:`

    try {
      const result = await requestAI(prompt, {
        systemPrompt: 'You are a professional customer service chatbot. Provide helpful, accurate responses.',
        temperature: 0.7
      })

      const botMessage: ChatMessage = {
        role: 'bot',
        content: result.content.trim(),
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat failed:', error)
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or contact our support team.',
        timestamp: new Date()
      }])
    }
  }

  return (
    <div className="space-y-6">
      {!isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-500" />
              Customer Service Chatbot Builder
            </CardTitle>
            <CardDescription>
              Create an AI-powered customer service chatbot for your business in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input 
                placeholder="e.g. Acme Corp"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Business Type</Label>
              <Input 
                placeholder="e.g. E-commerce, SaaS, Retail, etc."
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>FAQ & Knowledge Base (Optional)</Label>
              <Textarea 
                placeholder="Paste your FAQs, policies, or key information here...&#10;&#10;Example:&#10;- Shipping: We ship within 2-3 business days&#10;- Returns: 30-day return policy&#10;- Support hours: Mon-Fri 9am-5pm EST"
                value={faqKnowledge}
                onChange={(e) => setFaqKnowledge(e.target.value)}
                rows={8}
              />
            </div>

            <Button onClick={configureChatbot} disabled={!businessName || !businessType} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Launch Chatbot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                  {businessName} Customer Service
                </span>
                <Button variant="outline" size="sm" onClick={() => setIsConfigured(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Reconfigure
                </Button>
              </CardTitle>
              <CardDescription>
                AI-powered customer support • 24/7 availability • Instant responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-96 overflow-y-auto space-y-3 p-4 bg-muted rounded-lg">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-background border'
                        }`}
                      >
                        {msg.role === 'bot' && (
                          <Badge className="mb-2" variant="secondary">
                            <Bot className="h-3 w-3 mr-1" />
                            Bot
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-background border">
                        <Badge className="mb-2" variant="secondary">
                          <Bot className="h-3 w-3 mr-1" />
                          Bot
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="Type your question..."
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={handleSendMessage} disabled={loading || !userMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">✨ Chatbot Features:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ 24/7 instant customer support</li>
                <li>✓ Handles FAQs automatically</li>
                <li>✓ Escalates complex issues to humans</li>
                <li>✓ Learns from your knowledge base</li>
                <li>✓ Reduces support ticket volume</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}






