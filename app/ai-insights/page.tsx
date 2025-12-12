'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AI_ADVISORS, AIAdvisor } from '@/types/ai'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  Brain, MessageSquare, Sparkles, TrendingUp, Send, Loader2,
  Home, Car, Shield, Plane, Laptop, Briefcase, Heart, DollarSign,
  Dumbbell, Apple, Scale, RefreshCw, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AutomatedInsight {
  id: string
  type: 'celebration' | 'warning' | 'recommendation'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  domain?: string
  actionLabel?: string
  actionPath?: string
}

// Icon map for advisors
const iconMap: Record<string, any> = {
  TrendingUp,
  Stethoscope: Heart,
  Briefcase,
  Apple,
  Dumbbell,
  Home,
  Car,
  Sparkles,
  Scale,
  Plane,
  Laptop,
  Shield,
  Heart,
  DollarSign
}

export default function AIInsightsPage() {
  const { data } = useData()
  const [selectedAdvisor, setSelectedAdvisor] = useState<AIAdvisor | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [automatedInsights, setAutomatedInsights] = useState<AutomatedInsight[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)
  const [conversationCount, setConversationCount] = useState(0)

  // Load automated insights
  const loadAutomatedInsights = useCallback(async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Analyze all my data and provide 5-7 specific insights. For each insight, identify: the type (celebration for achievements, warning for concerns, recommendation for improvements), a short title, a detailed message, priority (high/medium/low), and relevant domain. Format as JSON array.',
          userData: data,
          conversationHistory: [],
          requestType: 'automated_insights'
        })
      })

      if (response.ok) {
        const result = await response.json()
        const parsedInsights = parseInsightsFromResponse(result.response || '')
        setAutomatedInsights(parsedInsights)
      }
    } catch (error) {
      console.error('Failed to load automated insights:', error)
    } finally {
      setIsLoadingInsights(false)
    }
  }, [data])

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      loadAutomatedInsights()
    } else {
      setIsLoadingInsights(false)
    }
  }, [data, loadAutomatedInsights])

  // Parse insights from AI response
  const parseInsightsFromResponse = (response: string): AutomatedInsight[] => {
    const insights: AutomatedInsight[] = []
    
    // Try to parse as JSON first
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: any, idx: number) => ({
          id: `insight-${idx}`,
          type: item.type || 'recommendation',
          title: item.title || 'Insight',
          message: item.message || item.content || '',
          priority: item.priority || 'medium',
          domain: item.domain,
          actionLabel: item.actionLabel,
          actionPath: item.actionPath
        })).slice(0, 7)
      }
    } catch {
      // Fall through to text parsing
    }

    // Parse from text
    const lines = response.split('\n').filter(l => l.trim())
    let currentType: AutomatedInsight['type'] = 'recommendation'
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.includes('🎉') || trimmed.toLowerCase().includes('celebration') || trimmed.toLowerCase().includes('achievement')) {
        currentType = 'celebration'
      } else if (trimmed.includes('⚠️') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('attention')) {
        currentType = 'warning'
      } else if (trimmed.includes('💡') || trimmed.toLowerCase().includes('recommend')) {
        currentType = 'recommendation'
      }
      
      if (trimmed.match(/^[-•*\d.]\s*/) && trimmed.length > 20) {
        const content = trimmed.replace(/^[-•*\d.]\s*/, '').trim()
        insights.push({
          id: `insight-${insights.length}`,
          type: currentType,
          title: content.split(':')[0]?.slice(0, 50) || 'Insight',
          message: content,
          priority: currentType === 'warning' ? 'high' : 'medium'
        })
      }
    }

    return insights.slice(0, 7)
  }

  // Send message to advisor
  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAdvisor || isLoading) return

    const advisor = AI_ADVISORS[selectedAdvisor]
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Get domain-specific data
      const relevantData: Record<string, any> = {}
      for (const domain of advisor.domains) {
        if (data[domain]) {
          relevantData[domain] = data[domain]
        }
      }

      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          userData: relevantData,
          conversationHistory: chatMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          advisorContext: {
            name: advisor.name,
            systemPrompt: advisor.systemPrompt,
            domains: advisor.domains
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response || "I'm here to help! Could you tell me more about what you need?",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiMessage])
        setConversationCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Open advisor chat
  const openAdvisorChat = (advisorId: AIAdvisor) => {
    setSelectedAdvisor(advisorId)
    setChatMessages([])
    
    const advisor = AI_ADVISORS[advisorId]
    // Add welcome message
    setChatMessages([{
      id: '0',
      role: 'assistant',
      content: `Hi! I'm ${advisor.name}. ${advisor.description}. How can I help you today?`,
      timestamp: new Date()
    }])
  }

  const getInsightColor = (type: AutomatedInsight['type']) => {
    switch (type) {
      case 'celebration': return 'bg-green-100 dark:bg-green-950/30 border-green-200'
      case 'warning': return 'bg-orange-100 dark:bg-orange-950/30 border-orange-200'
      default: return 'bg-blue-100 dark:bg-blue-950/30 border-blue-200'
    }
  }

  const getInsightIcon = (type: AutomatedInsight['type']) => {
    switch (type) {
      case 'celebration': return '🎉'
      case 'warning': return '⚠️'
      default: return '💡'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
          AI Insights
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized insights and recommendations from 12 specialized AI advisors
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Brain className="h-4 w-4 mr-2" />
              AI Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Specialized advisors available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Messages exchanged this session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Sparkles className="h-4 w-4 mr-2" />
              Insights Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automatedInsights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Personalized insights</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Advisors Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your AI Advisors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.values(AI_ADVISORS).map((advisor) => {
            const IconComponent = iconMap[advisor.icon] || Brain
            return (
              <Card key={advisor.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openAdvisorChat(advisor.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`h-10 w-10 rounded-lg ${advisor.color} flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{advisor.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {advisor.domains.join(', ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-3 line-clamp-2">
                    {advisor.description}
                  </CardDescription>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat Now
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Automated Insights Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automated Insights</CardTitle>
              <CardDescription>AI-generated insights based on your data</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadAutomatedInsights} disabled={isLoadingInsights}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : automatedInsights.length > 0 ? (
            <div className="space-y-3">
              {automatedInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {insight.domain && (
                          <Badge variant="outline" className="text-xs">{insight.domain}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                      {insight.actionLabel && (
                        <Link href={insight.actionPath || '/domains'}>
                          <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                            {insight.actionLabel} <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start adding data to your domains to receive personalized AI insights
              </p>
              <Button asChild>
                <Link href="/domains">Add Data</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/insights">
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                AI Chat Assistant
              </Button>
            </Link>
            <Link href="/goals-coach">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Goals Coach
              </Button>
            </Link>
            <Link href="/predictive-analytics">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Predictive Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Advisor Chat Dialog */}
      <Dialog open={!!selectedAdvisor} onOpenChange={(open) => !open && setSelectedAdvisor(null)}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          {selectedAdvisor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${AI_ADVISORS[selectedAdvisor].color} flex items-center justify-center`}>
                    {(() => {
                      const IconComponent = iconMap[AI_ADVISORS[selectedAdvisor].icon] || Brain
                      return <IconComponent className="h-5 w-5 text-white" />
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{AI_ADVISORS[selectedAdvisor].name}</DialogTitle>
                    <DialogDescription>{AI_ADVISORS[selectedAdvisor].description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(message.timestamp, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder={`Ask ${AI_ADVISORS[selectedAdvisor].name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
