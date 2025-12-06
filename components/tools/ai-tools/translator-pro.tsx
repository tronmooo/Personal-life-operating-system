'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Languages, ArrowRight, Volume2, Copy, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
]

export function TranslatorPro() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('es')
  const [translating, setTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const translate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: 'Empty Text',
        description: 'Please enter text to translate.',
        variant: 'destructive'
      })
      return
    }

    if (sourceLang === targetLang) {
      toast({
        title: 'Same Language',
        description: 'Source and target languages cannot be the same.',
        variant: 'destructive'
      })
      return
    }

    setTranslating(true)
    try {
      const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang
      const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang

      const response = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'translation',
          data: { 
            text: sourceText,
            from: sourceLangName,
            to: targetLangName
          },
          prompt: `Translate the following text from ${sourceLangName} to ${targetLangName}. Provide ONLY the translation, without any explanations or additional text.\n\nText to translate:\n${sourceText}`
        })
      })

      if (!response.ok) throw new Error('Translation failed')

      const result = await response.json()
      setTranslatedText(result.analysis || 'Translation unavailable')

      toast({
        title: 'Translation Complete!',
        description: `Translated from ${sourceLangName} to ${targetLangName}`
      })
    } catch (error: any) {
      toast({
        title: 'Translation Failed',
        description: error.message || 'Failed to translate text.',
        variant: 'destructive'
      })
    } finally {
      setTranslating(false)
    }
  }

  const swapLanguages = () => {
    const tempLang = sourceLang
    const tempText = sourceText
    setSourceLang(targetLang)
    setTargetLang(tempLang)
    setSourceText(translatedText)
    setTranslatedText(tempText)
  }

  const copyTranslation = async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Translation copied to clipboard.'
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive'
      })
    }
  }

  const speakText = (text: string, lang: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      toast({
        title: 'Speech Failed',
        description: 'Text-to-speech is not available.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">🌐</span>
          AI Translator Pro
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time translation powered by GPT-4 - 100+ languages supported
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div>
            <label className="text-sm font-medium mb-2 block">From</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={swapLanguages}
            className="mt-6"
          >
            <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
          </Button>

          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Translation Areas */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Source Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                {LANGUAGES.find(l => l.code === sourceLang)?.name} Text
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(sourceText, sourceLang)}
                disabled={!sourceText}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {sourceText.length} characters
            </p>
          </div>

          {/* Translated Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                {LANGUAGES.find(l => l.code === targetLang)?.name} Translation
              </label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(translatedText, targetLang)}
                  disabled={!translatedText}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTranslation}
                  disabled={!translatedText}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-3 min-h-[200px]">
              {translatedText ? (
                <p className="text-sm whitespace-pre-wrap">{translatedText}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Translation will appear here...</p>
              )}
            </div>
            {translatedText && (
              <p className="text-xs text-muted-foreground mt-1">
                {translatedText.length} characters
              </p>
            )}
          </div>
        </div>

        {/* Translate Button */}
        <Button
          onClick={translate}
          disabled={translating || !sourceText.trim()}
          size="lg"
          className="w-full"
        >
          <Languages className="h-5 w-5 mr-2" />
          {translating ? 'Translating with AI...' : 'Translate'}
        </Button>

        {/* Quick Translations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { text: 'Hello', emoji: '👋' },
            { text: 'Thank you', emoji: '🙏' },
            { text: 'Good morning', emoji: '☀️' },
            { text: 'How are you?', emoji: '😊' }
          ].map((phrase) => (
            <Button
              key={phrase.text}
              variant="outline"
              size="sm"
              onClick={() => setSourceText(phrase.text)}
            >
              <span className="mr-1">{phrase.emoji}</span>
              {phrase.text}
            </Button>
          ))}
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>✨</span> AI-Powered Features:
          </h4>
          <div className="grid md:grid-cols-2 gap-y-1">
            <div className="text-sm text-muted-foreground">• 🌍 100+ languages</div>
            <div className="text-sm text-muted-foreground">• 🎯 Context-aware translation</div>
            <div className="text-sm text-muted-foreground">• 🗣️ Text-to-speech playback</div>
            <div className="text-sm text-muted-foreground">• 📋 One-click copy</div>
            <div className="text-sm text-muted-foreground">• 🔄 Instant language swap</div>
            <div className="text-sm text-muted-foreground">• 💬 Quick phrase templates</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}














