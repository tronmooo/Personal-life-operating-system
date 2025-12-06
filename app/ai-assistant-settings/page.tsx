'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings, Brain, Bell, Sparkles, Zap, Volume2,
  Shield, Database, Download,
  Upload, Trash2, Save, RotateCcw, CheckCircle, AlertCircle, Info
} from 'lucide-react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

interface AISettings {
  // General Settings
  aiName: string
  responseStyle: 'concise' | 'detailed' | 'conversational'
  proactiveInsights: boolean
  learningMode: boolean
  
  // Notification Settings
  dailySummary: boolean
  dailySummaryTime: string
  goalReminders: boolean
  anomalyAlerts: boolean
  insightNotifications: boolean
  
  // Voice Settings
  voiceEnabled: boolean
  voiceSpeed: number
  voiceVolume: number
  wakeWord: string
  
  // Privacy Settings
  dataSharing: boolean
  analyticsEnabled: boolean
  conversationHistory: boolean
  autoDelete: boolean
  retentionDays: number
  
  // Personalization
  focusAreas: string[]
  priorityDomains: string[]
  tone: 'professional' | 'friendly' | 'casual'
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Advanced
  modelVersion: 'gpt-4' | 'gpt-3.5' | 'claude-3'
  maxTokens: number
  temperature: number
  contextWindow: number
}

const DEFAULT_SETTINGS: AISettings = {
  aiName: 'AI Assistant',
  responseStyle: 'conversational',
  proactiveInsights: true,
  learningMode: true,
  dailySummary: true,
  dailySummaryTime: '08:00',
  goalReminders: true,
  anomalyAlerts: true,
  insightNotifications: true,
  voiceEnabled: false,
  voiceSpeed: 1.0,
  voiceVolume: 80,
  wakeWord: 'Hey Assistant',
  dataSharing: false,
  analyticsEnabled: true,
  conversationHistory: true,
  autoDelete: false,
  retentionDays: 90,
  focusAreas: ['Financial Health', 'Physical Health', 'Productivity'],
  priorityDomains: ['financial', 'health', 'career'],
  tone: 'friendly',
  expertiseLevel: 'intermediate',
  modelVersion: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  contextWindow: 8000
}

const FOCUS_AREAS = [
  'Financial Health', 'Physical Health', 'Mental Wellness', 'Productivity',
  'Career Growth', 'Relationships', 'Home Management', 'Education'
]

const DOMAIN_OPTIONS = [
  { value: 'financial', label: 'Finance' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'career', label: 'Career' },
  { value: 'home', label: 'Home & Property' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'education', label: 'Education' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'travel', label: 'Travel' }
]

export default function AIAssistantSettingsPage() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load settings from Supabase user_settings
  useEffect(() => {
    (async () => {
      try {
        const settings = await getUserSettings()
        const saved = settings?.aiAssistantSettings
        if (saved && typeof saved === 'object') {
          setSettings({ ...DEFAULT_SETTINGS, ...saved })
        }
      } catch (error) {
        console.error('Failed to load AI assistant settings:', error)
        // Keep default settings on error
      }
    })()
  }, [])

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await updateUserSettings({ aiAssistantSettings: settings })
      setSaveStatus('saved')
      setHasChanges(false)
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e) {
      setSaveStatus('error')
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS)
      setHasChanges(true)
      setSaveStatus('idle')
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ai-assistant-settings.json'
    link.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setSettings({ ...DEFAULT_SETTINGS, ...imported })
        setHasChanges(true)
        alert('Settings imported successfully!')
      } catch (error) {
        alert('Failed to import settings. Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Settings className="h-10 w-10 text-purple-600" />
            AI Assistant Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Customize your AI assistant's behavior, personality, and capabilities
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? (
                  <>Saving...</>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <Brain className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Volume2 className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="personalization">
            <Sparkles className="h-4 w-4 mr-2" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Configure your AI assistant's name and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai-name">AI Assistant Name</Label>
                <Input
                  id="ai-name"
                  value={settings.aiName}
                  onChange={(e) => updateSetting('aiName', e.target.value)}
                  placeholder="e.g., Alex, Jarvis, Friday"
                />
                <p className="text-xs text-muted-foreground">
                  Give your AI assistant a personal name
                </p>
              </div>

              <div className="space-y-2">
                <Label>Response Style</Label>
                <Select
                  value={settings.responseStyle}
                  onValueChange={(value: any) => updateSetting('responseStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise - Short and to the point</SelectItem>
                    <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                    <SelectItem value="conversational">Conversational - Natural dialogue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Proactive Insights</Label>
                  <p className="text-xs text-muted-foreground">
                    AI will automatically share discoveries and suggestions
                  </p>
                </div>
                <Switch
                  checked={settings.proactiveInsights}
                  onCheckedChange={(checked) => updateSetting('proactiveInsights', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Learning Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    AI learns from your preferences and adapts over time
                  </p>
                </div>
                <Switch
                  checked={settings.learningMode}
                  onCheckedChange={(checked) => updateSetting('learningMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose when and how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive a daily overview of your data and insights
                  </p>
                </div>
                <Switch
                  checked={settings.dailySummary}
                  onCheckedChange={(checked) => updateSetting('dailySummary', checked)}
                />
              </div>

              {settings.dailySummary && (
                <div className="space-y-2 pl-6 border-l-2 border-purple-200">
                  <Label>Daily Summary Time</Label>
                  <Input
                    type="time"
                    value={settings.dailySummaryTime}
                    onChange={(e) => updateSetting('dailySummaryTime', e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Goal Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about goal progress and upcoming milestones
                  </p>
                </div>
                <Switch
                  checked={settings.goalReminders}
                  onCheckedChange={(checked) => updateSetting('goalReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Anomaly Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when unusual patterns or data points are detected
                  </p>
                </div>
                <Switch
                  checked={settings.anomalyAlerts}
                  onCheckedChange={(checked) => updateSetting('anomalyAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Insight Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when AI discovers new insights about your data
                  </p>
                </div>
                <Switch
                  checked={settings.insightNotifications}
                  onCheckedChange={(checked) => updateSetting('insightNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VOICE TAB */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Interaction</CardTitle>
              <CardDescription>Configure voice input and output settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Voice Responses</Label>
                  <p className="text-xs text-muted-foreground">
                    AI can read responses aloud using text-to-speech
                  </p>
                </div>
                <Switch
                  checked={settings.voiceEnabled}
                  onCheckedChange={(checked) => updateSetting('voiceEnabled', checked)}
                />
              </div>

              {settings.voiceEnabled && (
                <>
                  <div className="space-y-3">
                    <Label>Voice Speed: {settings.voiceSpeed}x</Label>
                    <Slider
                      value={[settings.voiceSpeed]}
                      onValueChange={([value]) => updateSetting('voiceSpeed', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Slower (0.5x)</span>
                      <span>Faster (2.0x)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Voice Volume: {settings.voiceVolume}%</Label>
                    <Slider
                      value={[settings.voiceVolume]}
                      onValueChange={([value]) => updateSetting('voiceVolume', value)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Wake Word</Label>
                <Input
                  value={settings.wakeWord}
                  onChange={(e) => updateSetting('wakeWord', e.target.value)}
                  placeholder="e.g., Hey Assistant"
                />
                <p className="text-xs text-muted-foreground">
                  Say this phrase to activate voice mode
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Voice Features Coming Soon</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Advanced voice interaction features including wake word detection and natural speech are in development.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY TAB */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Control how your data is used and stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Conversation History</Label>
                  <p className="text-xs text-muted-foreground">
                    Save chat conversations for context and future reference
                  </p>
                </div>
                <Switch
                  checked={settings.conversationHistory}
                  onCheckedChange={(checked) => updateSetting('conversationHistory', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Analytics</Label>
                  <p className="text-xs text-muted-foreground">
                    Help improve AI by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Data Sharing</Label>
                  <p className="text-xs text-muted-foreground">
                    Share data with third-party services for enhanced features
                  </p>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) => updateSetting('dataSharing', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-Delete Old Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically delete old conversations and insights
                  </p>
                </div>
                <Switch
                  checked={settings.autoDelete}
                  onCheckedChange={(checked) => updateSetting('autoDelete', checked)}
                />
              </div>

              {settings.autoDelete && (
                <div className="space-y-2 pl-6 border-l-2 border-purple-200">
                  <Label>Retention Period: {settings.retentionDays} days</Label>
                  <Slider
                    value={[settings.retentionDays]}
                    onValueChange={([value]) => updateSetting('retentionDays', value)}
                    min={7}
                    max={365}
                    step={7}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>7 days</span>
                    <span>365 days</span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">Danger Zone</p>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All AI Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERSONALIZATION TAB */}
        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personality & Focus</CardTitle>
              <CardDescription>Customize AI's personality and areas of focus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Communication Tone</Label>
                <Select
                  value={settings.tone}
                  onValueChange={(value: any) => updateSetting('tone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional - Formal and business-like</SelectItem>
                    <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
                    <SelectItem value="casual">Casual - Relaxed and informal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Your Expertise Level</Label>
                <Select
                  value={settings.expertiseLevel}
                  onValueChange={(value: any) => updateSetting('expertiseLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Explain concepts simply</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Balanced detail</SelectItem>
                    <SelectItem value="advanced">Advanced - Technical details</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Focus Areas</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select areas where you want AI to focus its insights
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_AREAS.map((area) => (
                    <Badge
                      key={area}
                      variant={settings.focusAreas.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => {
                        const newFocusAreas = settings.focusAreas.includes(area)
                          ? settings.focusAreas.filter(a => a !== area)
                          : [...settings.focusAreas, area]
                        updateSetting('focusAreas', newFocusAreas)
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Priority Domains</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Which life domains should AI analyze most frequently?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DOMAIN_OPTIONS.map((domain) => (
                    <Badge
                      key={domain.value}
                      variant={settings.priorityDomains.includes(domain.value) ? 'default' : 'outline'}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => {
                        const newDomains = settings.priorityDomains.includes(domain.value)
                          ? settings.priorityDomains.filter(d => d !== domain.value)
                          : [...settings.priorityDomains, domain.value]
                        updateSetting('priorityDomains', newDomains)
                      }}
                    >
                      {domain.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVANCED TAB */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Fine-tune AI model parameters and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  value={settings.modelVersion}
                  onValueChange={(value: any) => updateSetting('modelVersion', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 - Most capable, slower</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo - Fast and efficient</SelectItem>
                    <SelectItem value="claude-3">Claude 3 - Advanced reasoning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Temperature: {settings.temperature}</Label>
                <p className="text-xs text-muted-foreground">
                  Higher values make responses more creative, lower values more focused
                </p>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused (0)</span>
                  <span>Creative (1)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Max Response Length: {settings.maxTokens} tokens</Label>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([value]) => updateSetting('maxTokens', value)}
                  min={500}
                  max={4000}
                  step={500}
                />
              </div>

              <div className="space-y-3">
                <Label>Context Window: {settings.contextWindow} tokens</Label>
                <p className="text-xs text-muted-foreground">
                  How much conversation history to include in each request
                </p>
                <Slider
                  value={[settings.contextWindow]}
                  onValueChange={([value]) => updateSetting('contextWindow', value)}
                  min={2000}
                  max={16000}
                  step={2000}
                />
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">Advanced Settings</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Changing these settings may affect AI performance and response quality. Only modify if you understand the implications.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AI Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">1,247</p>
              <p className="text-sm text-muted-foreground">Total Conversations</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">438</p>
              <p className="text-sm text-muted-foreground">Insights Generated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">92%</p>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">23</p>
              <p className="text-sm text-muted-foreground">Days Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}









