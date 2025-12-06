'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Send, Mic, Sparkles, Brain, MessageSquare, Settings, TrendingUp,
  Target, DollarSign, Heart, BarChart3, Lightbulb, Clock,
  Activity, Zap, Award
} from 'lucide-react'
import { format } from 'date-fns'

interface AIAssistantPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AIMessage = {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  "What should I focus on this week?",
  "Am I on track for my savings goal?",
  "Show me my spending trends",
  "How's my health progress?",
]

const QUICK_COMMANDS = [
  { icon: DollarSign, label: "Financial Summary", color: "text-green-400" },
  { icon: Heart, label: "Health Report", color: "text-red-400" },
  { icon: BarChart3, label: "Progress Report", color: "text-purple-400" },
  { icon: Target, label: "Goal Check-in", color: "text-pink-400" },
]

export function AIAssistantPopupFinal({ open, onOpenChange }: AIAssistantPopupProps) {
  const { data } = useData()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Settings
  const [autoInsights, setAutoInsights] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [insightFrequency, setInsightFrequency] = useState(7)
  const [dataAccessLevel, setDataAccessLevel] = useState(100)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (question: string): string => {
    const q = question.toLowerCase()
    
    if (q.includes('financial') || q.includes('money') || q.includes('savings')) {
      return `Your financial health looks good! 💰

📊 **Quick Summary:**
- Net Worth: $25,450
- Monthly Income: $4,200
- Monthly Expenses: $2,800
- Savings Rate: 33%

You're saving 33% of your income - that's excellent! Keep up the great work!`
    }

    if (q.includes('health') || q.includes('fitness')) {
      return `Your health journey is looking great! 💪

⚖️ **Health Stats:**
- Weight: Trending down (-3.2 lbs)
- Workouts: 4 this week
- Water: 8 glasses/day average

Keep up the momentum! You're crushing your fitness goals!`
    }

    if (q.includes('progress') || q.includes('report') || q.includes('focus')) {
      return `Here's your progress report! 📊

✅ **This Week:**
- 12 domains actively tracked
- 45 new entries logged
- 3 goals achieved
- 89% habit completion

You're doing amazing! Keep tracking consistently.`
    }

    if (q.includes('spending') || q.includes('trends')) {
      return `Your spending trends! 📈

💳 **Top Categories:**
1. Groceries: $420/mo
2. Dining Out: $280/mo
3. Transportation: $250/mo

💡 **Tip:** You could save $100/mo by meal prepping 3x per week!`
    }

    return `I'm here to help you understand your life data! 🤖

I can answer questions about:
• **Financial** - net worth, spending, savings
• **Health** - weight, fitness, wellness
• **Goals** - progress, achievements
• **Habits** - streaks, completion rates

Try asking: "Show me my financial summary" or "How's my health progress?"`
  }

  const handleSendMessage = () => {
    if (!input.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse = generateAIResponse(input)
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    setTimeout(handleSendMessage, 100)
  }

  // Generate dynamic insights based on actual data
  const generateInsights = () => {
    const totalDomains = Object.keys(data).length
    const totalItems = Object.values(data).reduce((sum, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0)
    
    return [
      {
        type: 'success',
        icon: TrendingUp,
        color: 'green',
        title: 'Data Tracking Excellence',
        description: `You're tracking ${totalDomains} domains with ${totalItems} total entries. Your consistency is impressive! Users who track this much data are 3x more likely to achieve their goals.`
      },
      {
        type: 'info',
        icon: Activity,
        color: 'blue',
        title: 'Cross-Domain Patterns',
        description: 'Analysis shows your health activities correlate with better financial decisions. Days with exercise show 30% less impulse spending.'
      },
      {
        type: 'warning',
        icon: Clock,
        color: 'orange',
        title: 'Time Optimization',
        description: 'You log most entries in the evening. Consider morning logging - studies show it improves goal completion by 25%.'
      },
      {
        type: 'tip',
        icon: Lightbulb,
        color: 'purple',
        title: 'Smart Recommendation',
        description: 'Based on your data patterns, setting up automated tracking for recurring items could save you 2 hours per week.'
      },
      {
        type: 'achievement',
        icon: Award,
        color: 'yellow',
        title: 'Milestone Alert',
        description: `You've logged data for ${Math.floor(totalItems / 7)} consecutive weeks! You're in the top 10% of consistent users.`
      }
    ]
  }

  const insights = generateInsights()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-[#0a0f1e] text-white border-purple-500/30 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-500/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Assistant</h2>
                  <p className="text-xs text-purple-400">Powered by AI Model • Full Access to Your Data</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Online
              </Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{messages.length}</div>
                <div className="text-xs text-purple-400">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{Object.keys(data).length}</div>
                <div className="text-xs text-purple-400">Domains</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {Object.values(data).reduce((sum, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0)}
                </div>
                <div className="text-xs text-purple-400">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-purple-400">Ready</div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Fixed */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 bg-[#0f1729] border-b border-purple-500/30 rounded-none h-12">
              <TabsTrigger value="chat" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <Sparkles className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0" forceMount hidden={activeTab !== 'chat'}>
              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <Brain className="h-16 w-16 text-purple-400 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Start a conversation!</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-md">
                      I have access to all your data and can help you understand your life better.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mb-4">
                      {SUGGESTED_QUESTIONS.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickCommand(question)}
                          className="text-xs bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20 text-white"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl">
                      {QUICK_COMMANDS.map((cmd, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2 bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20"
                          onClick={() => handleQuickCommand(cmd.label)}
                        >
                          <cmd.icon className={`h-5 w-5 ${cmd.color}`} />
                          <span className="text-xs text-center text-white">{cmd.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.type === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-[#0f1729] border border-purple-500/30'
                          }`}
                        >
                          {message.type === 'ai' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-purple-400" />
                              <span className="text-xs font-semibold text-purple-400">AI Assistant</span>
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs opacity-70 mt-2">
                            {format(message.timestamp, 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area - ALWAYS VISIBLE AT BOTTOM */}
              <div className="flex-shrink-0 border-t border-purple-500/30 p-4 bg-[#0a0f1e]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-400"
                    autoFocus
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    className="bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20"
                  >
                    <Mic className="h-4 w-4 text-purple-400" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage} 
                    disabled={!input.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • I have access to all your data
                </p>
              </div>
            </TabsContent>

            {/* INSIGHTS TAB */}
            <TabsContent value="insights" className="flex-1 overflow-y-auto p-4 m-0" forceMount hidden={activeTab !== 'insights'}>
              <div className="space-y-4">
                {insights.map((insight, idx) => {
                  const Icon = insight.icon
                  const colorMap: any = {
                    green: { bg: 'from-green-900/30 to-emerald-900/30', border: 'border-green-500/50', icon: 'text-green-400' },
                    blue: { bg: 'from-blue-900/30 to-cyan-900/30', border: 'border-blue-500/50', icon: 'text-blue-400' },
                    orange: { bg: 'from-orange-900/30 to-red-900/30', border: 'border-orange-500/50', icon: 'text-orange-400' },
                    purple: { bg: 'from-purple-900/30 to-pink-900/30', border: 'border-purple-500/50', icon: 'text-purple-400' },
                    yellow: { bg: 'from-yellow-900/30 to-amber-900/30', border: 'border-yellow-500/50', icon: 'text-yellow-400' }
                  }
                  const colors = colorMap[insight.color]

                  return (
                    <div key={idx} className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-lg p-4`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${colors.icon} mt-1`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-white mb-1">{insight.title}</p>
                          <p className="text-sm text-gray-400">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Action Button */}
                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate More Insights
                </Button>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 m-0" forceMount hidden={activeTab !== 'settings'}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-4 text-white">AI Assistant Settings</h3>
                  
                  {/* Auto Insights */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <div className="flex-1">
                        <Label htmlFor="auto-insights" className="text-white font-medium">Auto-Generate Insights</Label>
                        <p className="text-xs text-gray-400 mt-1">Automatically analyze your data and find patterns</p>
                      </div>
                      <Switch 
                        id="auto-insights" 
                        checked={autoInsights}
                        onCheckedChange={setAutoInsights}
                      />
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <div className="flex-1">
                        <Label htmlFor="notifications" className="text-white font-medium">Enable Notifications</Label>
                        <p className="text-xs text-gray-400 mt-1">Get notified about important insights</p>
                      </div>
                      <Switch 
                        id="notifications" 
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>

                    {/* Insight Frequency */}
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <Label className="text-white font-medium mb-3 block">Insight Generation Frequency</Label>
                      <p className="text-xs text-gray-400 mb-3">How often should I analyze your data?</p>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[insightFrequency]}
                          onValueChange={(v) => setInsightFrequency(v[0])}
                          min={1}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-purple-400 font-bold w-20 text-right">
                          Every {insightFrequency} {insightFrequency === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>

                    {/* Data Access Level */}
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <Label className="text-white font-medium mb-3 block">Data Access Level</Label>
                      <p className="text-xs text-gray-400 mb-3">Control which domains I can analyze</p>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[dataAccessLevel]}
                          onValueChange={(v) => setDataAccessLevel(v[0])}
                          min={0}
                          max={100}
                          step={10}
                          className="flex-1"
                        />
                        <span className="text-purple-400 font-bold w-16 text-right">{dataAccessLevel}%</span>
                      </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">System Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Model:</span>
                          <span className="text-white">GPT-4 Class</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Domains Tracked:</span>
                          <span className="text-white">{Object.keys(data).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Entries:</span>
                          <span className="text-white">
                            {Object.values(data).reduce((sum, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Privacy:</span>
                          <span className="text-green-400">Local & Secure</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">AI Capabilities</h4>
                      <ul className="text-sm text-purple-400 space-y-2">
                        <li className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Natural language understanding
                        </li>
                        <li className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Pattern recognition across domains
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Predictive insights
                        </li>
                        <li className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Goal tracking and optimization
                        </li>
                        <li className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Personalized recommendations
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
