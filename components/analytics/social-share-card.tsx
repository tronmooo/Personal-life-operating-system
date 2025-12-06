'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Twitter, Linkedin, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface SocialShareCardProps {
  overallScore: number
  financialHealth: number
  activeDomains: number
  productivity: number
}

export function SocialShareCard({
  overallScore,
  financialHealth,
  activeDomains,
  productivity,
}: SocialShareCardProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateShareText = () => {
    return `I achieved a ${overallScore} Life Score on LifeHub! 🎯

🏆 Financial Health: ${financialHealth}/100
⚖️ Life Balance: ${activeDomains}/21 domains active
💪 Productivity: ${productivity}%

Managing my life holistically with @LifeHubApp`
  }

  const generatePrivacyFriendlyText = () => {
    const tier = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Growing'
    return `I'm tracking ${activeDomains} life domains on LifeHub! 📊

My holistic life management is at "${tier}" level. 

Taking control of my financial, health, and personal goals all in one place! 🚀`
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(generatePrivacyFriendlyText())
    const url = encodeURIComponent('https://lifehub.app')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const shareToLinkedIn = () => {
    const url = encodeURIComponent('https://lifehub.app')
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText())
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Share text copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const generateShareImage = async () => {
    try {
      // This would generate a beautiful share image
      // For now, we'll use a simple canvas approach
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 630
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#7c3aed')
      gradient.addColorStop(1, '#3b82f6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 72px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('My LifeHub Analytics', canvas.width / 2, 150)

      // Score
      ctx.font = 'bold 120px sans-serif'
      ctx.fillText(`${overallScore}`, canvas.width / 2, 300)
      
      ctx.font = '36px sans-serif'
      ctx.fillText('Overall Life Score', canvas.width / 2, 350)

      // Metrics
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'left'
      const metrics = [
        `🏆 Financial Health: ${financialHealth}/100`,
        `⚖️ Active Domains: ${activeDomains}/21`,
        `💪 Productivity: ${productivity}%`,
      ]

      let y = 450
      metrics.forEach(metric => {
        ctx.fillText(metric, 100, y)
        y += 60
      })

      // Convert to blob and download
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'lifehub-achievement.png'
          link.click()
          URL.revokeObjectURL(url)
          
          toast({
            title: 'Image Downloaded',
            description: 'Share your achievement!',
          })
        }
      })
    } catch (error) {
      console.error('Failed to generate share image:', error)
      toast({
        title: 'Failed to generate image',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-purple-600" />
          Share Your Achievement
        </CardTitle>
        <CardDescription>
          Celebrate your progress (privacy-safe)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border">
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold">{overallScore}</div>
            <div className="text-sm text-muted-foreground">Life Score</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div>
                <div className="font-bold">{financialHealth}</div>
                <div className="text-muted-foreground">Financial</div>
              </div>
              <div>
                <div className="font-bold">{activeDomains}/21</div>
                <div className="text-muted-foreground">Domains</div>
              </div>
              <div>
                <div className="font-bold">{productivity}%</div>
                <div className="text-muted-foreground">Productive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={shareToTwitter}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            onClick={shareToLinkedIn}
            className="flex items-center gap-2"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Text
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={generateShareImage}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Save Image
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 No personal data is shared - only your progress metrics
        </p>
      </CardContent>
    </Card>
  )
}

