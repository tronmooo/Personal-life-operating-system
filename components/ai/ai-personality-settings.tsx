'use client'

/**
 * AI Personality Settings Component
 * Allows users to customize their AI assistant's personality and behavior
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAIPersonality } from '@/lib/hooks/use-enhanced-ai'
import { 
  Sparkles, 
  User, 
  Briefcase, 
  Heart, 
  Zap, 
  MessageSquare,
  Settings2,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  AIPersonality, 
  AIVoiceStyle, 
  AIPersonalityTrait,
  PERSONALITY_PRESETS 
} from '@/lib/ai/enhanced-ai-personality'

// Preset icons
const presetIcons: Record<string, React.ReactNode> = {
  'productivity-coach': <Zap className="h-5 w-5" />,
  'wellness-guide': <Heart className="h-5 w-5" />,
  'finance-advisor': <Briefcase className="h-5 w-5" />,
  'life-organizer': <Settings2 className="h-5 w-5" />,
  'minimal-assistant': <MessageSquare className="h-5 w-5" />
}

export function AIPersonalitySettings() {
  const { 
    personality, 
    presets, 
    updatePersonality, 
    applyPreset, 
    loading 
  } = useAIPersonality()
  
  const [saving, setSaving] = useState(false)
  const [localPersonality, setLocalPersonality] = useState<Partial<AIPersonality>>({})

  const handleApplyPreset = async (presetId: string) => {
    setSaving(true)
    try {
      await applyPreset(presetId)
      toast.success(`Applied ${presetId.replace('-', ' ')} preset!`)
    } catch (error) {
      toast.error('Failed to apply preset')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveChanges = async () => {
    if (Object.keys(localPersonality).length === 0) return
    
    setSaving(true)
    try {
      await updatePersonality(localPersonality)
      setLocalPersonality({})
      toast.success('AI personality updated!')
    } catch (error) {
      toast.error('Failed to update personality')
    } finally {
      setSaving(false)
    }
  }

  const updateLocal = (key: keyof AIPersonality, value: any) => {
    setLocalPersonality(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const currentPersonality = { ...personality, ...localPersonality } as AIPersonality

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Personality Settings
        </CardTitle>
        <CardDescription>
          Customize how your AI assistant communicates with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets">
          <TabsList className="mb-4">
            <TabsTrigger value="presets">Quick Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom Settings</TabsTrigger>
          </TabsList>

          {/* PRESETS TAB */}
          <TabsContent value="presets" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a personality preset that matches your preferences:
            </p>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={saving}
                  className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                    personality?.name === PERSONALITY_PRESETS[preset.id]?.name 
                      ? 'border-primary bg-primary/5' 
                      : ''
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {presetIcons[preset.id]}
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    {personality?.name === PERSONALITY_PRESETS[preset.id]?.name && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* CUSTOM TAB */}
          <TabsContent value="custom" className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="ai-name">Assistant Name</Label>
              <Input
                id="ai-name"
                value={currentPersonality.name || ''}
                onChange={(e) => updateLocal('name', e.target.value)}
                placeholder="LifeHub AI"
              />
            </div>

            {/* Voice Style */}
            <div className="space-y-3">
              <Label>Communication Style</Label>
              <RadioGroup
                value={currentPersonality.voiceStyle}
                onValueChange={(value) => updateLocal('voiceStyle', value as AIVoiceStyle)}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'casual', label: 'Casual', desc: 'Friendly & relaxed' },
                  { value: 'professional', label: 'Professional', desc: 'Formal & precise' },
                  { value: 'motivational', label: 'Motivational', desc: 'Encouraging & positive' },
                  { value: 'nurturing', label: 'Nurturing', desc: 'Warm & supportive' },
                  { value: 'analytical', label: 'Analytical', desc: 'Data-driven & logical' },
                  { value: 'minimal', label: 'Minimal', desc: 'Brief & efficient' }
                ].map((style) => (
                  <Label
                    key={style.value}
                    htmlFor={style.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent ${
                      currentPersonality.voiceStyle === style.value ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <RadioGroupItem value={style.value} id={style.value} />
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-muted-foreground">{style.desc}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Verbosity */}
            <div className="space-y-3">
              <Label>Response Length</Label>
              <RadioGroup
                value={currentPersonality.verbosity || 'balanced'}
                onValueChange={(value) => updateLocal('verbosity', value)}
                className="flex gap-4"
              >
                {[
                  { value: 'concise', label: 'Concise' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'detailed', label: 'Detailed' }
                ].map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`verbosity-${opt.value}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-accent ${
                      currentPersonality.verbosity === opt.value ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`verbosity-${opt.value}`} />
                    {opt.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Encouragement Level */}
            <div className="space-y-3">
              <Label>Encouragement Level</Label>
              <RadioGroup
                value={currentPersonality.encouragementLevel || 'medium'}
                onValueChange={(value) => updateLocal('encouragementLevel', value)}
                className="flex gap-4"
              >
                {[
                  { value: 'high', label: '🎉 High' },
                  { value: 'medium', label: '👍 Medium' },
                  { value: 'low', label: '👌 Low' },
                  { value: 'none', label: '⏸️ None' }
                ].map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`enc-${opt.value}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-accent ${
                      currentPersonality.encouragementLevel === opt.value ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`enc-${opt.value}`} />
                    {opt.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Emojis</Label>
                  <p className="text-sm text-muted-foreground">Add emojis to responses</p>
                </div>
                <Switch
                  checked={currentPersonality.useEmoji}
                  onCheckedChange={(checked) => updateLocal('useEmoji', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Suggest Follow-ups</Label>
                  <p className="text-sm text-muted-foreground">Offer next steps after commands</p>
                </div>
                <Switch
                  checked={currentPersonality.suggestFollowUps}
                  onCheckedChange={(checked) => updateLocal('suggestFollowUps', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include Reasoning</Label>
                  <p className="text-sm text-muted-foreground">Explain why actions were taken</p>
                </div>
                <Switch
                  checked={currentPersonality.includeReasonings}
                  onCheckedChange={(checked) => updateLocal('includeReasonings', checked)}
                />
              </div>
            </div>

            {/* Proactivity */}
            <div className="space-y-3">
              <Label>Proactivity Level</Label>
              <p className="text-sm text-muted-foreground">
                How often should the AI offer unsolicited insights?
              </p>
              <RadioGroup
                value={currentPersonality.proactivity || 'medium'}
                onValueChange={(value) => updateLocal('proactivity', value)}
                className="flex gap-4"
              >
                {[
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                  { value: 'ask-only', label: 'Ask Only' }
                ].map((opt) => (
                  <Label
                    key={opt.value}
                    htmlFor={`proact-${opt.value}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-accent ${
                      currentPersonality.proactivity === opt.value ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`proact-${opt.value}`} />
                    {opt.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Save Button */}
            {Object.keys(localPersonality).length > 0 && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveChanges} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AIPersonalitySettings



