'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Copy, RefreshCw, CheckCircle, Shield, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

export function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generatePassword = () => {
    let charset = ''
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers) charset += '0123456789'
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (charset === '') {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one character type.',
        variant: 'destructive'
      })
      return
    }

    let newPassword = ''
    const cryptoObj = window.crypto || (window as any).msCrypto
    const array = new Uint32Array(length)
    cryptoObj.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length]
    }

    setPassword(newPassword)
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!password) {
      toast({
        title: 'No Password',
        description: 'Generate a password first!',
        variant: 'destructive'
      })
      return
    }

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Password copied to clipboard.'
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy password.',
        variant: 'destructive'
      })
    }
  }

  const getStrength = () => {
    if (!password) return { level: 'None', color: 'gray', score: 0 }
    
    let score = 0
    if (password.length >= 12) score += 25
    if (password.length >= 16) score += 25
    if (/[a-z]/.test(password)) score += 10
    if (/[A-Z]/.test(password)) score += 10
    if (/[0-9]/.test(password)) score += 15
    if (/[^a-zA-Z0-9]/.test(password)) score += 15

    if (score >= 80) return { level: 'Very Strong', color: 'green', score }
    if (score >= 60) return { level: 'Strong', color: 'blue', score }
    if (score >= 40) return { level: 'Medium', color: 'yellow', score }
    return { level: 'Weak', color: 'red', score }
  }

  const strength = getStrength()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">🔐</span>
          Secure Password Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate cryptographically secure passwords with custom requirements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Display */}
        <div>
          <Label className="text-lg mb-2 block">Generated Password</Label>
          <div className="relative">
            <Input
              value={password}
              readOnly
              placeholder="Click Generate to create password"
              className="font-mono text-lg pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                disabled={!password}
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={generatePassword}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Strength Meter */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password Strength</Label>
              <Badge variant={
                strength.color === 'green' ? 'default' :
                strength.color === 'blue' ? 'secondary' :
                strength.color === 'yellow' ? 'outline' : 'destructive'
              }>
                {strength.level}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  strength.color === 'green' ? 'bg-green-500' :
                  strength.color === 'blue' ? 'bg-blue-500' :
                  strength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Length Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Password Length</Label>
            <Badge variant="outline">{length} characters</Badge>
          </div>
          <Slider
            value={[length]}
            onValueChange={(value) => setLength(value[0])}
            min={8}
            max={64}
            step={1}
            className="w-full"
          />
        </div>

        {/* Character Options */}
        <div className="space-y-4">
          <Label className="text-lg">Character Types</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="uppercase" className="cursor-pointer">Uppercase Letters (A-Z)</Label>
            </div>
            <Switch
              id="uppercase"
              checked={includeUppercase}
              onCheckedChange={setIncludeUppercase}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="lowercase" className="cursor-pointer">Lowercase Letters (a-z)</Label>
            </div>
            <Switch
              id="lowercase"
              checked={includeLowercase}
              onCheckedChange={setIncludeLowercase}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="numbers" className="cursor-pointer">Numbers (0-9)</Label>
            </div>
            <Switch
              id="numbers"
              checked={includeNumbers}
              onCheckedChange={setIncludeNumbers}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="symbols" className="cursor-pointer">Symbols (!@#$...)</Label>
            </div>
            <Switch
              id="symbols"
              checked={includeSymbols}
              onCheckedChange={setIncludeSymbols}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generatePassword} size="lg" className="w-full">
          <Shield className="h-5 w-5 mr-2" />
          Generate Secure Password
        </Button>

        {/* Security Tips */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Security Tips:
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Use a different password for each account</li>
            <li>• Enable two-factor authentication when available</li>
            <li>• Use a password manager to store passwords securely</li>
            <li>• Never share passwords via email or text</li>
            <li>• Change passwords regularly (every 3-6 months)</li>
            <li>• Avoid using personal information in passwords</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {length}
            </div>
            <div className="text-xs text-muted-foreground">Characters</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {[includeUppercase, includeLowercase, includeNumbers, includeSymbols].filter(Boolean).length}
            </div>
            <div className="text-xs text-muted-foreground">Char Types</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.pow(2, length * 3).toExponential(2)}
            </div>
            <div className="text-xs text-muted-foreground">Combinations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
