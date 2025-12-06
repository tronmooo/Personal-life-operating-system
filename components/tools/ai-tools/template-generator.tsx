'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Copy, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function TemplateGenerator() {
  const { toast } = useToast()
  const [templateType, setTemplateType] = useState<'resignation' | 'offer' | 'invoice' | 'proposal' | 'report'>('resignation')
  const [companyName, setCompanyName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [template, setTemplate] = useState('')

  const templates = {
    resignation: `[Your Name]
[Your Address]
[City, State ZIP]
[Date]

${recipientName || '[Manager Name]'}
${companyName || '[Company Name]'}
[Company Address]

Dear ${recipientName || '[Manager Name]'},

I am writing to formally notify you of my resignation from my position as [Your Title] at ${companyName || '[Company Name]'}. My last day of work will be [Date - typically 2 weeks from today].

I have greatly appreciated the opportunities I have had during my time with the company, particularly [mention specific experiences, projects, or skills gained]. Working with the team has been a valuable experience that I will carry forward in my career.

During my remaining time, I am committed to ensuring a smooth transition. I will complete [mention any ongoing projects] and am happy to assist in training my replacement or documenting my current responsibilities.

Thank you for the support and opportunities you have provided me during my tenure. I wish you and the company continued success.

Sincerely,
[Your Name]`,

    offer: `${companyName || '[Company Name]'}
[Company Address]
[Date]

${recipientName || '[Candidate Name]'}
[Candidate Address]

Dear ${recipientName || '[Candidate Name]'},

We are pleased to offer you the position of [Job Title] at ${companyName || '[Company Name]'}. We believe your skills and experience will be a valuable addition to our team.

Position Details:
• Title: [Job Title]
• Department: [Department]
• Start Date: [Date]
• Salary: $[Amount] per year
• Benefits: [Health insurance, 401(k), PTO, etc.]
• Reports To: [Manager Name]

This offer is contingent upon [background check, references, etc.]. Please review the attached employee handbook for full details on company policies and benefits.

To accept this offer, please sign and return this letter by [Date]. If you have any questions, please don't hesitate to contact me.

We look forward to having you join our team!

Best regards,
[Your Name]
[Your Title]
${companyName || '[Company Name]'}`,

    invoice: `${companyName || '[Your Company Name]'}
[Your Address]
[Contact Information]

INVOICE

Invoice #: [Invoice Number]
Date: ${new Date().toLocaleDateString()}
Due Date: [Due Date]

Bill To:
${recipientName || '[Client Name]'}
[Client Company]
[Client Address]

Description                                    Quantity    Rate        Amount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Service/Product Description]                 [Qty]       $[Rate]     $[Amount]
[Service/Product Description]                 [Qty]       $[Rate]     $[Amount]

                                                           Subtotal:   $[Amount]
                                                           Tax (${0}%):   $[Amount]
                                                           ━━━━━━━━━━━━━━━━━━
                                                           TOTAL:      $[Amount]

Payment Terms: Net 30
Payment Methods: [Bank transfer, Check, Credit Card]

Thank you for your business!

Questions? Contact: [Your Email] | [Your Phone]`,

    proposal: `PROJECT PROPOSAL

From: ${companyName || '[Your Company]'}
To: ${recipientName || '[Client Name]'}
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
[Brief overview of the project and its objectives]

PROJECT OBJECTIVES
• [Objective 1]
• [Objective 2]
• [Objective 3]

SCOPE OF WORK
1. [Phase 1]: [Description]
2. [Phase 2]: [Description]
3. [Phase 3]: [Description]

DELIVERABLES
• [Deliverable 1]
• [Deliverable 2]
• [Deliverable 3]

TIMELINE
Phase 1: [Date Range] - [Duration]
Phase 2: [Date Range] - [Duration]
Phase 3: [Date Range] - [Duration]

INVESTMENT
Phase 1: $[Amount]
Phase 2: $[Amount]
Phase 3: $[Amount]
━━━━━━━━━━━━━━━━━━━
Total Investment: $[Amount]

TERMS & CONDITIONS
• Payment schedule: [Details]
• Cancellation policy: [Details]
• Intellectual property: [Details]

NEXT STEPS
1. Review and approve proposal
2. Sign agreement
3. Project kickoff meeting

Thank you for considering our proposal. We look forward to working with you!

Best regards,
[Your Name]
${companyName || '[Your Company]'}`,

    report: `${companyName || '[Company Name]'}
${templateType.toUpperCase()} REPORT

Prepared by: [Your Name]
Date: ${new Date().toLocaleDateString()}
Report Period: [Start Date] - [End Date]

EXECUTIVE SUMMARY
[Brief overview of key findings and recommendations]

KEY METRICS
• Metric 1: [Value] ([Change] from previous period)
• Metric 2: [Value] ([Change] from previous period)
• Metric 3: [Value] ([Change] from previous period)

ANALYSIS
[Detailed analysis of the data and trends]

FINDINGS
1. [Finding 1]
   - Supporting data: [Details]
   - Impact: [Description]

2. [Finding 2]
   - Supporting data: [Details]
   - Impact: [Description]

3. [Finding 3]
   - Supporting data: [Details]
   - Impact: [Description]

RECOMMENDATIONS
1. [Recommendation 1]
   - Expected outcome: [Description]
   - Timeline: [Duration]

2. [Recommendation 2]
   - Expected outcome: [Description]
   - Timeline: [Duration]

CONCLUSION
[Summary and next steps]

Prepared by: [Your Name], [Your Title]
Contact: [Your Email] | [Your Phone]`
  }

  const generateTemplate = () => {
    setGenerating(true)
    setTimeout(() => {
      setTemplate(templates[templateType])
      setGenerating(false)
    }, 1000)
  }

  const copyTemplate = () => {
    navigator.clipboard.writeText(template)
    toast({ title: 'Copied!', description: 'Template copied to clipboard' })
  }

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateType}-template.txt`
    a.click()
    toast({ title: 'Downloaded!', description: 'Template downloaded successfully' })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Template Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Generate professional document templates for common business needs.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resignation">Resignation Letter</SelectItem>
                  <SelectItem value="offer">Job Offer Letter</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="proposal">Project Proposal</SelectItem>
                  <SelectItem value="report">Business Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Name (if applicable)</Label>
              <Input
                id="recipient"
                placeholder="John Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <Button onClick={generateTemplate} className="w-full" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Template'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {template && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Template</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyTemplate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-[600px] overflow-y-auto">
              {template}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Note:</strong> Fill in the bracketed placeholders [...] with your specific information before using.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
