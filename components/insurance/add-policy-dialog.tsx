'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Camera, Sparkles } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { useInsurance } from '@/lib/hooks/use-insurance'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPolicyDialog({ open, onOpenChange }: Props) {
  const [formData, setFormData] = useState({
    type: 'Health',
    provider: '',
    policyNumber: '',
    premium: '',
    frequency: 'Monthly',
    coverage: '',
    validUntil: '',
    phone: '',
    email: '',
    nextPayment: ''
  })
  const [documentPhoto, setDocumentPhoto] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addPolicy } = useInsurance()

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      setDocumentPhoto(dataUrl)

      try {
        // Perform OCR
        const result = await Tesseract.recognize(dataUrl, 'eng')
        const text = result.data.text.toLowerCase()
        
        // Extract policy information
        console.log('OCR Text:', text)
        
        // Extract policy number (look for patterns like HC-2024-001, POL123456, etc.)
        const policyMatch = text.match(/(?:policy|pol|number|#|no\.?)\s*:?\s*([a-z0-9\-]+)/i)
        if (policyMatch && !formData.policyNumber) {
          setFormData(prev => ({ ...prev, policyNumber: policyMatch[1].toUpperCase() }))
        }

        // Extract provider name (common insurance providers)
        const providers = ['blue cross', 'aetna', 'cigna', 'united', 'anthem', 'kaiser', 'humana', 'state farm', 'geico', 'allstate', 'progressive']
        for (const provider of providers) {
          if (text.includes(provider)) {
            setFormData(prev => ({ ...prev, provider: provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
            break
          }
        }

        // Extract premium amount (look for dollar amounts)
        const premiumMatch = text.match(/\$\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/i)
        if (premiumMatch && !formData.premium) {
          setFormData(prev => ({ ...prev, premium: premiumMatch[1].replace(/,/g, '') }))
        }

        // Extract coverage amount (larger numbers)
        const coverageMatch = text.match(/(?:coverage|limit)\s*:?\s*\$\s*(\d{1,3}(?:,\d{3})*)/i)
        if (coverageMatch && !formData.coverage) {
          setFormData(prev => ({ ...prev, coverage: coverageMatch[1].replace(/,/g, '') }))
        }

        // Extract phone number
        const phoneMatch = text.match(/(?:phone|tel|call)\s*:?\s*(\d{1}-?\d{3}-?\d{3}-?\d{4})/i)
        if (phoneMatch && !formData.phone) {
          setFormData(prev => ({ ...prev, phone: phoneMatch[1] }))
        }

        // Extract email
        const emailMatch = text.match(/([a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,})/i)
        if (emailMatch && !formData.email) {
          setFormData(prev => ({ ...prev, email: emailMatch[1] }))
        }

        // Extract expiration/valid until date
        const dateMatch = text.match(/(?:expires?|valid|until|expir[ey])\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i)
        if (dateMatch && !formData.validUntil) {
          // Convert to YYYY-MM-DD format
          const dateParts = dateMatch[1].split(/[-/]/)
          let year, month, day
          
          if (dateParts[2].length === 4) {
            // MM/DD/YYYY or DD/MM/YYYY format
            month = dateParts[0].padStart(2, '0')
            day = dateParts[1].padStart(2, '0')
            year = dateParts[2]
          } else {
            // MM/DD/YY format
            month = dateParts[0].padStart(2, '0')
            day = dateParts[1].padStart(2, '0')
            year = '20' + dateParts[2]
          }
          
          setFormData(prev => ({ ...prev, validUntil: `${year}-${month}-${day}` }))
        }

        alert('Document scanned! Extracted data has been filled in. Please review and correct any errors.')
      } catch (error) {
        console.error('OCR Error:', error)
        alert('Could not extract text from image. Please fill in manually.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.provider || !formData.policyNumber || !formData.premium || !formData.validUntil) {
      alert('Please fill in provider, policy number, premium, and expiration date')
      return
    }

    await addPolicy({
      provider: formData.provider,
      policy_number: formData.policyNumber,
      type: formData.type,
      premium: parseFloat(formData.premium),
      starts_on: null,
      ends_on: formData.validUntil,
      coverage: formData.coverage ? { amount: parseFloat(formData.coverage) } : {},
      metadata: {
        frequency: formData.frequency,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        documentPhoto: documentPhoto || undefined,
        nextPayment: formData.nextPayment || undefined,
        status: 'Active'
      }
    })

    // Reset form
    setFormData({
      type: 'Health',
      provider: '',
      policyNumber: '',
      premium: '',
      frequency: 'Monthly',
      coverage: '',
      validUntil: '',
      phone: '',
      email: '',
      nextPayment: ''
    })
    setDocumentPhoto('')

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Add Insurance Policy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Photo Capture */}
          <div className="border-2 border-dashed rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
            <Label className="mb-3 block font-bold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Insurance Document (Recommended)
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Take a photo of your insurance card or policy document. We'll automatically extract the information!
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isProcessing ? 'Scanning Document...' : 'Take Photo & Auto-Fill'}
            </Button>
            {documentPhoto && (
              <div className="mt-4">
                <img src={documentPhoto} alt="Insurance Document" className="w-full rounded-lg max-h-48 object-contain border" />
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Photo saved! Data extracted and filled below.
                </p>
              </div>
            )}
          </div>

          {/* Policy Type */}
          <div>
            <Label>Insurance Type *</Label>
            <select
              className="w-full border rounded-lg p-3 bg-background mt-1"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Health">Health Insurance</option>
              <option value="Auto">Auto Insurance</option>
              <option value="Home">Home/Renters Insurance</option>
              <option value="Life">Life Insurance</option>
              <option value="Dental">Dental Insurance</option>
              <option value="Vision">Vision Insurance</option>
              <option value="Pet">Pet Insurance</option>
              <option value="Disability">Disability Insurance</option>
              <option value="Umbrella">Umbrella Insurance</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider */}
            <div>
              <Label>Insurance Provider *</Label>
              <Input
                placeholder="Blue Cross, Geico, etc."
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Policy Number */}
            <div>
              <Label>Policy Number *</Label>
              <Input
                placeholder="HC-2024-001"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Premium */}
            <div>
              <Label>Premium Amount *</Label>
              <Input
                type="number"
                placeholder="450"
                value={formData.premium}
                onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Frequency */}
            <div>
              <Label>Payment Frequency *</Label>
              <select
                className="w-full border rounded-lg p-3 bg-background mt-1"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>

            {/* Coverage */}
            <div>
              <Label>Coverage Amount</Label>
              <Input
                type="number"
                placeholder="500000"
                value={formData.coverage}
                onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valid Until */}
            <div>
              <Label>Valid Until / Expiration Date *</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Next Payment */}
            <div>
              <Label>Next Payment Date</Label>
              <Input
                type="date"
                value={formData.nextPayment}
                onChange={(e) => setFormData({ ...formData, nextPayment: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <Label>Provider Phone</Label>
              <Input
                type="tel"
                placeholder="1-800-555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label>Provider Email</Label>
              <Input
                type="email"
                placeholder="support@provider.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Add Policy
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

