'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Camera, Sparkles, Upload } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { differenceInDays } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Props {
  onCancel: () => void
  onSuccess: () => void
}

export function AddDocumentForm({ onCancel, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    issueDate: '',
    expirationDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  })
  const [documentPhoto, setDocumentPhoto] = useState<string>('')
  const [extractedText, setExtractedText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addData } = useData()

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      setDocumentPhoto(dataUrl)

      try {
        const result = await Tesseract.recognize(dataUrl, 'eng')
        const text = result.data.text
        setExtractedText(text)
        
        console.log('OCR Text:', text)
        
        // Smart extraction based on document type patterns
        const textLower = text.toLowerCase()

        // Detect document type
        if (!formData.type) {
          if (textLower.includes('passport') || textLower.includes('travel document')) {
            setFormData(prev => ({ ...prev, type: 'Passport' }))
          } else if (textLower.includes('driver') || textLower.includes('licence') || textLower.includes('license')) {
            setFormData(prev => ({ ...prev, type: 'Drivers License' }))
          } else if (textLower.includes('birth certificate')) {
            setFormData(prev => ({ ...prev, type: 'Birth Certificate' }))
          } else if (textLower.includes('marriage')) {
            setFormData(prev => ({ ...prev, type: 'Marriage Certificate' }))
          } else if (textLower.includes('visa')) {
            setFormData(prev => ({ ...prev, type: 'Visa' }))
          } else if (textLower.includes('deed')) {
            setFormData(prev => ({ ...prev, type: 'Deed' }))
          } else if (textLower.includes('will') || textLower.includes('testament')) {
            setFormData(prev => ({ ...prev, type: 'Will' }))
          } else if (textLower.includes('contract')) {
            setFormData(prev => ({ ...prev, type: 'Contract' }))
          }
        }

        // Extract name (look for common patterns)
        const nameMatch = text.match(/(?:name|surname|given\s+name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i)
        if (nameMatch && !formData.name) {
          setFormData(prev => ({ ...prev, name: nameMatch[1].trim() }))
        }

        // Extract dates - comprehensive patterns for driver's licenses
        // Driver's license date patterns:
        // - EXP 01/15/28, EXP: 01-15-2028
        // - 4d EXP 01/15/28 (AAMVA format)
        // - EXPIRES: 01/15/2028
        // - Various formats: MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY
        const expirationPatterns = [
          // Explicit expiration labels
          /(?:exp(?:ir(?:y|ation)?)?|4d\.?\s*exp)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
          /(?:expires?|valid\s+(?:until|thru|through))[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
          // Date after EXP keyword on same line
          /EXP[^\d]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
          // AAMVA field 4d (expiration date on licenses)
          /4d[:\s\.]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
        ]

        // Try explicit expiration patterns first
        let foundExpiration = false
        for (const pattern of expirationPatterns) {
          const matches = text.matchAll(pattern)
          for (const match of matches) {
            const dateStr = match[1]
            const parsed = parseDateString(dateStr)
            if (parsed && !formData.expirationDate) {
              const daysFromNow = differenceInDays(new Date(parsed), new Date())
              // Expiration should be in the future (or recently past)
              if (daysFromNow > -365 && daysFromNow < 5000) {
                setFormData(prev => ({ ...prev, expirationDate: parsed }))
                foundExpiration = true
                break
              }
            }
          }
          if (foundExpiration) break
        }

        // If no explicit expiration found, look for any future date
        if (!foundExpiration) {
          const genericDatePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g
          const matches = text.matchAll(genericDatePattern)
          const futureDates: { date: string; daysFromNow: number }[] = []
          
          for (const match of matches) {
            const dateStr = match[1]
            const parsed = parseDateString(dateStr)
            if (parsed) {
              const daysFromNow = differenceInDays(new Date(parsed), new Date())
              if (daysFromNow > 0 && daysFromNow < 5000) {
                futureDates.push({ date: parsed, daysFromNow })
              }
            }
          }
          
          // Use the furthest future date as expiration (most likely for licenses)
          if (futureDates.length > 0 && !formData.expirationDate) {
            const furthestDate = futureDates.reduce((a, b) => 
              a.daysFromNow > b.daysFromNow ? a : b
            )
            setFormData(prev => ({ ...prev, expirationDate: furthestDate.date }))
          }
        }

        // Helper function to parse various date formats
        function parseDateString(dateStr: string): string | null {
          const parts = dateStr.split(/[-/]/)
          if (parts.length !== 3) return null
          
          let year: string, month: string, day: string
          
          // Determine format based on part lengths and values
          if (parts[2].length === 4) {
            // MM/DD/YYYY or DD/MM/YYYY
            month = parts[0].padStart(2, '0')
            day = parts[1].padStart(2, '0')
            year = parts[2]
          } else if (parts[0].length === 4) {
            // YYYY/MM/DD
            year = parts[0]
            month = parts[1].padStart(2, '0')
            day = parts[2].padStart(2, '0')
          } else {
            // MM/DD/YY - assume 2000s for years < 50, 1900s otherwise
            month = parts[0].padStart(2, '0')
            day = parts[1].padStart(2, '0')
            const shortYear = parseInt(parts[2])
            year = shortYear < 50 ? '20' + parts[2].padStart(2, '0') : '19' + parts[2].padStart(2, '0')
          }
          
          // Validate month and day
          const monthNum = parseInt(month)
          const dayNum = parseInt(day)
          if (monthNum < 1 || monthNum > 12) return null
          if (dayNum < 1 || dayNum > 31) return null
          
          return `${year}-${month}-${day}`
        }

        // Extract document number for name if specific document
        const docNumberMatch = text.match(/(?:No|#|Number)[:\s]*([A-Z0-9\-]+)/i)
        if (docNumberMatch && !formData.name) {
          setFormData(prev => ({ ...prev, name: `${formData.type || 'Document'} ${docNumberMatch[1]}` }))
        }

        // Extract phone number
        const phoneMatch = text.match(/(?:\+?1[-.]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i)
        if (phoneMatch && !formData.contactPhone) {
          setFormData(prev => ({ ...prev, contactPhone: phoneMatch[0] }))
        }

        // Extract email
        const emailMatch = text.match(/([a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,})/i)
        if (emailMatch && !formData.contactEmail) {
          setFormData(prev => ({ ...prev, contactEmail: emailMatch[1] }))
        }

        alert('Document scanned successfully! Please review the extracted information.')
      } catch (error) {
        console.error('OCR Error:', error)
        alert('Could not extract text from document. Please fill in manually.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.name || !formData.expirationDate) {
      alert('Please fill in document type, name/description, and expiration date')
      return
    }

    await addData('insurance', {
      title: `${formData.type} - ${formData.name}`,
      description: formData.notes,
      metadata: {
        type: 'document',
        documentType: formData.type,
        name: formData.name,
        issueDate: formData.issueDate,
        expirationDate: formData.expirationDate,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        notes: formData.notes || undefined,
        documentPhoto: documentPhoto || undefined,
        extractedText: extractedText || undefined
      }
    })
    
    console.log('✅ Legal document saved to DataProvider')
    
    // Create expiration reminder if within 30 days
    const daysUntilExpiry = differenceInDays(new Date(formData.expirationDate), new Date())
    
    if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
      await addData('legal' as any, {
        title: `${formData.type} Expiring Soon`,
        description: `Your ${formData.type} (${formData.name}) expires on ${new Date(formData.expirationDate).toLocaleDateString()}`,
        metadata: {
          itemType: 'alert',
          type: 'legal_expiry',
          expirationDate: formData.expirationDate,
          priority: 'high'
        }
      })
    }
    onSuccess()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold mb-8">New Legal Document</h2>

        <div className="space-y-6">
          {/* Photo/PDF Upload */}
          <div className="border-2 border-dashed rounded-2xl p-8 bg-blue-50 dark:bg-blue-900/20 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Upload Document</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Take a photo or upload PDF - We'll extract dates, names, and other info automatically!
            </p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isProcessing ? 'Scanning...' : 'Scan Document'}
            </Button>
            {documentPhoto && (
              <div className="mt-4">
                <img src={documentPhoto} alt="Document" className="w-full rounded-lg max-h-48 object-contain border" />
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 justify-center">
                  <Sparkles className="w-3 h-3" />
                  Document captured! Data extracted below. (Saved as PDF)
                </p>
              </div>
            )}
          </div>

          {/* Manual Entry Option */}
          <div className="text-center text-gray-600 dark:text-gray-400">
            <span>— or enter manually —</span>
          </div>

          {/* Document Type */}
          <div>
            <Label className="text-lg mb-2 block">Document Type *</Label>
            <select
              className="w-full border-2 rounded-xl p-4 text-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select type</option>
              <option value="Drivers License">Driver's License</option>
              <option value="Passport">Passport</option>
              <option value="Birth Certificate">Birth Certificate</option>
              <option value="Marriage Certificate">Marriage Certificate</option>
              <option value="Deed">Deed</option>
              <option value="Will">Will</option>
              <option value="Power of Attorney">Power of Attorney</option>
              <option value="Contract">Contract</option>
              <option value="License">License</option>
              <option value="Visa">Visa</option>
              <option value="ID Card">ID Card</option>
              <option value="Social Security Card">Social Security Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Name/Description */}
          <div>
            <Label className="text-lg mb-2 block">Name / Description *</Label>
            <Input
              placeholder="Property Lease Agreement, John's Passport, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg"
            />
          </div>

          {/* Issue Date */}
          <div>
            <Label className="text-lg mb-2 block">Issue Date</Label>
            <Input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <Label className="text-lg mb-2 block">Expiration Date *</Label>
            <Input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">You'll be notified 30 days before expiration</p>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Contact Information (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  placeholder="John Smith"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john.smith@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-lg mb-2 block">Notes</Label>
            <Textarea
              placeholder="Annual renewal required, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="border-2 rounded-xl p-4 text-lg resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl"
            >
              Add Document
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 py-6 text-lg rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

