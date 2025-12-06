'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Share2, QrCode as QrCodeIcon, Link as LinkIcon, Mail, Wifi, Phone } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

export function QRCodeGenerator() {
  const [qrType, setQrType] = useState<'url' | 'text' | 'email' | 'phone' | 'wifi'>('url')
  const [content, setContent] = useState('')
  const [qrSize, setQrSize] = useState('256')
  const [qrColor, setQrColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [qrGenerated, setQrGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // WiFi specific fields
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState('WPA')

  const qrTypes = [
    { id: 'url', name: 'Website URL', icon: LinkIcon, placeholder: 'https://example.com' },
    { id: 'text', name: 'Plain Text', icon: QrCodeIcon, placeholder: 'Enter any text...' },
    { id: 'email', name: 'Email Address', icon: Mail, placeholder: 'email@example.com' },
    { id: 'phone', name: 'Phone Number', icon: Phone, placeholder: '+1234567890' },
    { id: 'wifi', name: 'WiFi Network', icon: Wifi, placeholder: 'Network SSID' }
  ]

  const getQRContent = () => {
    switch (qrType) {
      case 'email':
        return `mailto:${content}`
      case 'phone':
        return `tel:${content}`
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`
      default:
        return content
    }
  }

  const generateQR = async () => {
    const qrContent = getQRContent()
    
    if (!qrContent.trim() && qrType !== 'wifi') {
      toast({
        title: 'Content Required',
        description: 'Please enter content for the QR code.',
        variant: 'destructive'
      })
      return
    }

    if (qrType === 'wifi' && (!wifiSSID || !wifiPassword)) {
      toast({
        title: 'WiFi Info Required',
        description: 'Please enter WiFi SSID and password.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Generate QR code using an API service
      const size = parseInt(qrSize)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}&color=${qrColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`
      
      setQrGenerated(true)
      
      // Draw to canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          canvas.width = size
          canvas.height = size
          ctx?.drawImage(img, 0, 0, size, size)
        }
        img.src = qrApiUrl
      }

      toast({
        title: 'QR Code Generated!',
        description: 'Your QR code is ready to download or share.'
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const downloadQR = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qrcode-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        
        toast({
          title: 'Downloaded!',
          description: 'QR code saved to your downloads.'
        })
      }
    })
  }

  const shareQR = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], 'qrcode.png', { type: 'image/png' })
          await navigator.share({
            files: [file],
            title: 'QR Code',
            text: 'Check out this QR code!'
          })
        } else {
          toast({
            title: 'Share Not Supported',
            description: 'Your browser doesn\'t support sharing. Try downloading instead.',
            variant: 'destructive'
          })
        }
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const currentType = qrTypes.find(t => t.id === qrType)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">📱</span>
          QR Code Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create custom QR codes for URLs, text, WiFi, and more
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Type Selection */}
        <div>
          <Label className="text-lg mb-3 block">QR Code Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {qrTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setQrType(type.id as any)}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  qrType === type.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-gray-300 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <type.icon className="h-6 w-6 mx-auto mb-1" />
                <div className="font-semibold text-xs">{type.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-lg mb-2 block">Content</Label>
              
              {qrType === 'wifi' ? (
                <div className="space-y-3">
                  <div>
                    <Label>Network Name (SSID)</Label>
                    <Input
                      placeholder="My WiFi Network"
                      value={wifiSSID}
                      onChange={(e) => setWifiSSID(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter WiFi password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Security Type</Label>
                    <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WPA">WPA/WPA2</SelectItem>
                        <SelectItem value="WEP">WEP</SelectItem>
                        <SelectItem value="nopass">None (Open)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : qrType === 'text' ? (
                <Textarea
                  placeholder={currentType?.placeholder}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              ) : (
                <Input
                  placeholder={currentType?.placeholder}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>

            {/* Customization Options */}
            <div className="space-y-3">
              <div>
                <Label>Size</Label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">Small (128px)</SelectItem>
                    <SelectItem value="256">Medium (256px)</SelectItem>
                    <SelectItem value="512">Large (512px)</SelectItem>
                    <SelectItem value="1024">Extra Large (1024px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>QR Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={generateQR} size="lg" className="w-full">
              <QrCodeIcon className="h-5 w-5 mr-2" />
              Generate QR Code
            </Button>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-900">
              {qrGenerated ? (
                <canvas ref={canvasRef} className="max-w-full" />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <QrCodeIcon className="h-24 w-24 mb-4 opacity-20" />
                  <p className="text-sm">Your QR code will appear here</p>
                </div>
              )}
            </div>

            {qrGenerated && (
              <div className="flex gap-2 w-full">
                <Button onClick={downloadQR} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={shareQR} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>✨</span> Features:
          </h4>
          <div className="grid md:grid-cols-2 gap-y-1">
            <div className="text-sm text-muted-foreground">• Multiple QR code types</div>
            <div className="text-sm text-muted-foreground">• Custom colors and sizes</div>
            <div className="text-sm text-muted-foreground">• WiFi network sharing</div>
            <div className="text-sm text-muted-foreground">• High-resolution export</div>
            <div className="text-sm text-muted-foreground">• Instant generation</div>
            <div className="text-sm text-muted-foreground">• Mobile-friendly sharing</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">5</div>
            <div className="text-xs text-muted-foreground">QR Types</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{qrSize}px</div>
            <div className="text-xs text-muted-foreground">Resolution</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">∞</div>
            <div className="text-xs text-muted-foreground">Free Usage</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
