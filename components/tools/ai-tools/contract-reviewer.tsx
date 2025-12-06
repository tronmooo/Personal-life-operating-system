'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, AlertTriangle, CheckCircle, Info, Upload, Loader2, Camera, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface Finding {
  type: 'risk' | 'positive' | 'info'
  level: 'high' | 'medium' | 'low'
  title: string
  description: string
}

interface KeyTerm {
  term: string
  value: string
}

interface ContractAnalysis {
  id: string
  filename: string
  findings: Finding[]
  keyTerms: KeyTerm[]
  summary?: string
  analyzedAt: string
}

export function ContractReviewer() {
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<ContractAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (file: File) => {
    setAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'contract')
      
      const response = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze contract')
      }
      
      const result = await response.json()
      const extractedData = result.data || {}
      
      // Extract findings from AI analysis
      const findings: Finding[] = []
      const keyTerms: KeyTerm[] = []
      
      // Process risks from AI response
      if (extractedData.risks && Array.isArray(extractedData.risks)) {
        extractedData.risks.forEach((risk: string) => {
          findings.push({
            type: 'risk',
            level: risk.toLowerCase().includes('auto') || risk.toLowerCase().includes('penalty') ? 'high' : 'medium',
            title: risk.split(':')[0] || 'Risk Identified',
            description: risk
          })
        })
      }
      
      // Process key terms
      if (extractedData.key_terms && Array.isArray(extractedData.key_terms)) {
        extractedData.key_terms.forEach((term: string) => {
          const parts = term.split(':')
          keyTerms.push({
            term: parts[0]?.trim() || 'Term',
            value: parts[1]?.trim() || term
          })
        })
      }
      
      // Process other extracted fields as key terms
      const termFields = ['contract_type', 'effective_date', 'end_date', 'payment_terms', 'parties']
      termFields.forEach(field => {
        if (extractedData[field]) {
          const formattedLabel = field
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          let value = extractedData[field]
          if (Array.isArray(value)) {
            value = value.join(', ')
          }
          
          keyTerms.push({
            term: formattedLabel,
            value: String(value)
          })
        }
      })
      
      // Process obligations as positive/info findings
      if (extractedData.obligations && Array.isArray(extractedData.obligations)) {
        extractedData.obligations.forEach((obligation: string) => {
          findings.push({
            type: 'info',
            level: 'low',
            title: 'Obligation',
            description: obligation
          })
        })
      }
      
      // Add positive finding if we have termination rights or favorable terms
      if (result.text?.toLowerCase().includes('termination') || result.text?.toLowerCase().includes('cancel')) {
        findings.push({
          type: 'positive',
          level: 'low',
          title: 'Termination Rights',
          description: 'Contract appears to include termination provisions'
        })
      }
      
      if (findings.length === 0 && keyTerms.length === 0) {
        throw new Error('Could not extract contract details. Please try a clearer image.')
      }
      
      const analysis: ContractAnalysis = {
        id: Date.now().toString(),
        filename: file.name,
        findings,
        keyTerms,
        summary: extractedData.summary || result.text?.substring(0, 200) || '',
        analyzedAt: new Date().toISOString()
      }
      
      setCurrentAnalysis(analysis)
      setAnalyses([analysis, ...analyses])
      
      toast({
        title: 'Contract Analyzed!',
        description: `Found ${findings.length} findings and ${keyTerms.length} key terms`
      })
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze contract.',
        variant: 'destructive'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    e.target.value = ''
  }

  const deleteAnalysis = (id: string) => {
    setAnalyses(analyses.filter(a => a.id !== id))
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(null)
    }
    toast({
      title: 'Removed',
      description: 'Contract analysis removed.'
    })
  }

  const highRiskCount = currentAnalysis?.findings.filter(f => f.type === 'risk' && f.level === 'high').length || 0
  const mediumRiskCount = currentAnalysis?.findings.filter(f => f.type === 'risk' && f.level === 'medium').length || 0
  const positiveCount = currentAnalysis?.findings.filter(f => f.type === 'positive' || f.type === 'info').length || 0

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">⚖️</span>
          Contract Reviewer AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload contracts and AI will identify risks, obligations, and key terms
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Contract */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Upload Contract for AI Review</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload an image or PDF of a contract. AI will analyze all clauses and terms.
          </p>
          <Button onClick={handleUploadClick} disabled={analyzing} size="lg">
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Contract...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Contract
              </>
            )}
          </Button>
        </div>

        {currentAnalysis && (
          <>
            {/* Contract Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="font-semibold">{currentAnalysis.filename}</div>
                  <div className="text-sm text-muted-foreground">
                    Analyzed {new Date(currentAnalysis.analyzedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteAnalysis(currentAnalysis.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            {/* Risk Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center border-2 border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg text-center border-2 border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{mediumRiskCount}</div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{positiveCount}</div>
                <div className="text-xs text-muted-foreground">Info/Favorable</div>
              </div>
            </div>

            {/* Key Findings */}
            {currentAnalysis.findings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Key Findings & Risks
                </h3>
                <div className="space-y-3">
                  {currentAnalysis.findings.map((finding, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        finding.level === 'high'
                          ? 'bg-red-50 dark:bg-red-950 border-red-500'
                          : finding.level === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
                          : finding.type === 'positive'
                          ? 'bg-green-50 dark:bg-green-950 border-green-500'
                          : 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {finding.type === 'risk' ? (
                          <AlertTriangle
                            className={`h-5 w-5 mt-0.5 ${
                              finding.level === 'high' ? 'text-red-600' : 'text-yellow-600'
                            }`}
                          />
                        ) : finding.type === 'positive' ? (
                          <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                        ) : (
                          <Info className="h-5 w-5 mt-0.5 text-blue-600" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{finding.title}</span>
                            <Badge
                              variant={
                                finding.level === 'high'
                                  ? 'destructive'
                                  : finding.level === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {finding.level} {finding.type === 'risk' ? 'risk' : 'priority'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{finding.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Terms */}
            {currentAnalysis.keyTerms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">📋 Key Contract Terms</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left p-3 font-semibold">Term</th>
                        <th className="text-left p-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnalysis.keyTerms.map((term, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3 font-medium">{term.term}</td>
                          <td className="p-3">{term.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Previous Analyses */}
        {analyses.length > 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Previous Analyses</h3>
            <div className="space-y-2">
              {analyses.filter(a => a.id !== currentAnalysis?.id).map(analysis => (
                <div key={analysis.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{analysis.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.findings.length} findings • {new Date(analysis.analyzedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentAnalysis(analysis)}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAnalysis(analysis.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentAnalysis && analyses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No contracts analyzed yet. Upload a contract to get started!</p>
          </div>
        )}

        {/* Features */}
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">⚖️ AI Review Capabilities (GPT-4 Vision):</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li>• Clause identification</li>
            <li>• Risk assessment</li>
            <li>• Obligation extraction</li>
            <li>• Key term detection</li>
            <li>• Party identification</li>
            <li>• Date extraction</li>
            <li>• Payment term analysis</li>
            <li>• Plain language summaries</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}































