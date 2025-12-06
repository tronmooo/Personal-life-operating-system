'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileCheck } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface EligibilityResult {
  program: string
  eligible: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  nextSteps: string[]
  requiredDocuments: string[]
  estimatedBenefit?: string
}

export function EligibilityChecker() {
  const [programType, setProgramType] = useState<string>('')
  const [annualIncome, setAnnualIncome] = useState<string>('')
  const [householdSize, setHouseholdSize] = useState<string>('')
  const [state, setState] = useState<string>('')
  const [results, setResults] = useState<EligibilityResult[]>([])
  
  const { loading, requestAI } = useAITool()

  const handleCheck = async () => {
    if (!programType || !annualIncome) return

    const prompt = `Check eligibility for ${programType} with:
- Annual Income: $${annualIncome}
- Household Size: ${householdSize || 1}
- State: ${state || 'Not specified'}

Analyze eligibility for relevant programs and provide:
- Program name
- Eligibility status (eligible/not eligible/maybe)
- Confidence level
- Reasoning
- Next steps to apply
- Required documents
- Estimated benefit amount if applicable

Return JSON array:
[
  {
    "program": "...",
    "eligible": true/false,
    "confidence": "high/medium/low",
    "reasoning": "...",
    "nextSteps": ["...", "..."],
    "requiredDocuments": ["...", "..."],
    "estimatedBenefit": "..."
  }
]

Provide at least 3-5 relevant programs.`

    try {
      const result = await requestAI(prompt, {
        systemPrompt: 'You are a benefits counselor expert. Help people understand their eligibility for government programs and benefits.',
        temperature: 0.4
      })

      const jsonMatch = result.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        setResults(data)
      }
    } catch (error) {
      console.error('Eligibility check failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-purple-500" />
            Eligibility Checker AI
          </CardTitle>
          <CardDescription>
            Check your eligibility for government programs, benefits, tax credits, and financial aid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Program Type</Label>
              <Select value={programType} onValueChange={setProgramType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snap">Food Assistance (SNAP)</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="chip">Children's Health Insurance (CHIP)</SelectItem>
                  <SelectItem value="tanf">Temporary Assistance (TANF)</SelectItem>
                  <SelectItem value="wic">WIC (Women, Infants, Children)</SelectItem>
                  <SelectItem value="liheap">Energy Assistance (LIHEAP)</SelectItem>
                  <SelectItem value="housing">Housing Assistance</SelectItem>
                  <SelectItem value="tax-credits">Tax Credits (EITC, CTC)</SelectItem>
                  <SelectItem value="ssi">Supplemental Security Income (SSI)</SelectItem>
                  <SelectItem value="ssdi">Social Security Disability (SSDI)</SelectItem>
                  <SelectItem value="unemployment">Unemployment Benefits</SelectItem>
                  <SelectItem value="student-aid">Student Financial Aid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Annual Household Income</Label>
              <Input 
                type="number"
                placeholder="50000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Household Size</Label>
              <Select value={householdSize} onValueChange={setHouseholdSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select household size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2">2 people</SelectItem>
                  <SelectItem value="3">3 people</SelectItem>
                  <SelectItem value="4">4 people</SelectItem>
                  <SelectItem value="5">5 people</SelectItem>
                  <SelectItem value="6">6+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State (Optional)</Label>
              <Input 
                placeholder="e.g. California, TX"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCheck} disabled={loading || !programType || !annualIncome} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Eligibility...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Check Eligibility
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={`${
              result.eligible 
                ? 'border-green-200 bg-green-50 dark:bg-green-950' 
                : 'border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {result.eligible ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    {result.program}
                  </span>
                  <Badge variant={result.eligible ? 'default' : 'secondary'} className={result.eligible ? 'bg-green-500' : ''}>
                    {result.eligible ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Confidence: {result.confidence}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Reasoning:</p>
                  <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                </div>

                {result.estimatedBenefit && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-semibold">Estimated Benefit:</p>
                    <p className="text-lg font-bold text-blue-600">{result.estimatedBenefit}</p>
                  </div>
                )}

                {result.eligible && result.nextSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Next Steps:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      {result.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.eligible && result.requiredDocuments.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Required Documents:</p>
                    <ul className="space-y-1">
                      {result.requiredDocuments.map((doc, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}






