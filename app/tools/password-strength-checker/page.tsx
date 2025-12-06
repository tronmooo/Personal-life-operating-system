'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Shield, Check, X, AlertCircle } from 'lucide-react'

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState(0)
  const [feedback, setFeedback] = useState<{
    score: number
    label: string
    color: string
    checks: { text: string; passed: boolean }[]
    suggestions: string[]
  } | null>(null)

  const checkPasswordStrength = (pwd: string) => {
    let score = 0
    const checks = []
    const suggestions = []

    // Length check
    const hasLength = pwd.length >= 12
    checks.push({ text: 'At least 12 characters', passed: hasLength })
    if (hasLength) score += 25
    else suggestions.push('Use at least 12 characters')

    // Uppercase check
    const hasUppercase = /[A-Z]/.test(pwd)
    checks.push({ text: 'Contains uppercase letters', passed: hasUppercase })
    if (hasUppercase) score += 20
    else suggestions.push('Add uppercase letters (A-Z)')

    // Lowercase check
    const hasLowercase = /[a-z]/.test(pwd)
    checks.push({ text: 'Contains lowercase letters', passed: hasLowercase })
    if (hasLowercase) score += 20
    else suggestions.push('Add lowercase letters (a-z)')

    // Number check
    const hasNumbers = /[0-9]/.test(pwd)
    checks.push({ text: 'Contains numbers', passed: hasNumbers })
    if (hasNumbers) score += 15
    else suggestions.push('Add numbers (0-9)')

    // Special character check
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    checks.push({ text: 'Contains special characters', passed: hasSpecial })
    if (hasSpecial) score += 20
    else suggestions.push('Add special characters (!@#$%^&*)')

    // Get label and color
    let label = 'Very Weak'
    let color = 'text-red-600'
    if (score >= 80) {
      label = 'Very Strong'
      color = 'text-green-600'
    } else if (score >= 60) {
      label = 'Strong'
      color = 'text-blue-600'
    } else if (score >= 40) {
      label = 'Moderate'
      color = 'text-yellow-600'
    } else if (score >= 20) {
      label = 'Weak'
      color = 'text-orange-600'
    }

    setStrength(score)
    setFeedback({ score, label, color, checks, suggestions })
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value) {
      checkPasswordStrength(value)
    } else {
      setStrength(0)
      setFeedback(null)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Shield className="mr-3 h-10 w-10 text-primary" />
          Password Strength Checker
        </h1>
        <p className="text-muted-foreground">
          Test your password strength and get suggestions for improvement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Password</CardTitle>
          <CardDescription>Type a password to check its strength</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text"
              placeholder="Enter password to test..."
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Your password is never sent to any server. All checking happens locally in your browser.
            </p>
          </div>

          {feedback && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Strength:</span>
                  <span className={`text-sm font-bold ${feedback.color}`}>
                    {feedback.label} ({feedback.score}/100)
                  </span>
                </div>
                <Progress value={strength} className="h-3" />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Requirements</h3>
                {feedback.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {check.passed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ${check.passed ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {check.text}
                    </span>
                  </div>
                ))}
              </div>

              {feedback.suggestions.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                        Suggestions:
                      </p>
                      <ul className="space-y-1">
                        {feedback.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-yellow-900 dark:text-yellow-300">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {feedback.score >= 80 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-900 dark:text-green-300">
                      <strong>Great password!</strong> This is a very strong password.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Password Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Length Matters:</strong> Longer passwords (12+ characters) are exponentially harder to crack.
          </p>
          <p>
            <strong>Use Variety:</strong> Mix uppercase, lowercase, numbers, and special characters.
          </p>
          <p>
            <strong>Avoid Common Patterns:</strong> Don't use dictionary words, names, or predictable sequences.
          </p>
          <p>
            <strong>Unique Passwords:</strong> Use different passwords for different accounts.
          </p>
          <p>
            <strong>Use a Password Manager:</strong> Let tools generate and store strong passwords for you.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}






