'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Sparkles } from 'lucide-react'
import Tesseract from 'tesseract.js'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Props {
  policyId?: string
  onCancel: () => void
  onSuccess: () => void
}

export function AddPolicyForm({ policyId, onCancel, onSuccess }: Props) {
  const { addData, updateData, getData } = useData()
  const [formData, setFormData] = useState({
    type: '',
    provider: '',
    policyNumber: '',
    premium: '',
    frequency: 'Monthly',
    coverage: '',
    startDate: '',
    endDate: '',
    phone: '',
    email: ''
  })
  const [documentPhoto, setDocumentPhoto] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [ocrText, setOcrText] = useState<string>('')

  // Load existing policy data if editing
  useEffect(() => {
    if (policyId) {
      const rawInsuranceData = getData('insurance') as any
      // Handle both flat array and { items: [...] } structure
      let insuranceData: any[] = []
      if (Array.isArray(rawInsuranceData)) {
        insuranceData = rawInsuranceData
      } else if (rawInsuranceData && Array.isArray(rawInsuranceData.items)) {
        insuranceData = rawInsuranceData.items
      }
      
      const policy = insuranceData.find(item => item.id === policyId)
      
      if (policy) {
        // Handle both old metadata structure and new scanned document structure
        const metadata = policy.metadata || {}
        setFormData({
          type: metadata.type || policy.coverageType || '',
          provider: metadata.provider || policy.provider || '',
          policyNumber: metadata.policyNumber || policy.policyNumber || '',
          premium: metadata.premium?.toString() || metadata.monthlyPremium?.toString() || '',
          frequency: metadata.frequency || 'Monthly',
          coverage: metadata.coverage?.toString() || '',
          startDate: metadata.startDate || policy.effectiveDate || '',
          endDate: metadata.validUntil || policy.expirationDate || '',
          phone: metadata.phone || '',
          email: metadata.email || ''
        })
      }
    }
  }, [policyId, getData])

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCapturedFile(file)

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      setDocumentPhoto(dataUrl)

      try {
        // Only OCR images; PDFs will be handled in Drive or skipped
        let text = ''
        if (!file.type.toLowerCase().includes('pdf')) {
          const result = await Tesseract.recognize(dataUrl, 'eng')
          text = result.data.text.toLowerCase()
          setOcrText(result.data.text)
          console.log('OCR Text:', text)
        }
        
        // Extract policy number
        const policyMatch = text.match(/(?:policy|pol|number|#|no\.?)\s*:?\s*([a-z0-9\-]+)/i)
        if (policyMatch && !formData.policyNumber) {
          setFormData(prev => ({ ...prev, policyNumber: policyMatch[1].toUpperCase() }))
        }

        // Extract provider
        const providers = ['blue cross', 'aetna', 'cigna', 'united', 'anthem', 'kaiser', 'humana', 'state farm', 'geico', 'allstate', 'progressive']
        for (const provider of providers) {
          if (text.includes(provider)) {
            setFormData(prev => ({ ...prev, provider: provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
            break
          }
        }

        // Extract premium
        const premiumMatch = text.match(/\$\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/i)
        if (premiumMatch && !formData.premium) {
          setFormData(prev => ({ ...prev, premium: premiumMatch[1].replace(/,/g, '') }))
        }

        // Extract coverage
        const coverageMatch = text.match(/(?:coverage|limit)\s*:?\s*\$\s*(\d{1,3}(?:,\d{3})*)/i)
        if (coverageMatch && !formData.coverage) {
          setFormData(prev => ({ ...prev, coverage: coverageMatch[1].replace(/,/g, '') }))
        }

        // Extract phone
        const phoneMatch = text.match(/(?:phone|tel|call)\s*:?\s*(\d{1}-?\d{3}-?\d{3}-?\d{4})/i)
        if (phoneMatch && !formData.phone) {
          setFormData(prev => ({ ...prev, phone: phoneMatch[1] }))
        }

        // Extract email
        const emailMatch = text.match(/([a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,})/i)
        if (emailMatch && !formData.email) {
          setFormData(prev => ({ ...prev, email: emailMatch[1] }))
        }

        // Extract dates
        const dateMatch = text.match(/(?:expires?|valid|until)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i)
        if (dateMatch && !formData.endDate) {
          const dateParts = dateMatch[1].split(/[-/]/)
          let year, month, day
          
          if (dateParts[2].length === 4) {
            month = dateParts[0].padStart(2, '0')
            day = dateParts[1].padStart(2, '0')
            year = dateParts[2]
          } else {
            month = dateParts[0].padStart(2, '0')
            day = dateParts[1].padStart(2, '0')
            year = '20' + dateParts[2]
          }
          
          setFormData(prev => ({ ...prev, endDate: `${year}-${month}-${day}` }))
        }

        alert('Document scanned! Please review and complete the form.')
      } catch (error) {
        console.error('OCR Error:', error)
        alert('Could not extract text. Please fill in manually.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.provider || !formData.policyNumber || !formData.premium || !formData.endDate) {
      alert('Please fill in type, provider, policy number, premium, and end date')
      return
    }

    // Calculate monthly premium
    const premiumValue = parseFloat(formData.premium)
    const frequency = formData.frequency as 'Monthly' | 'Quarterly' | 'Annually'
    const monthlyPremium = frequency === 'Monthly' ? premiumValue : 
                          frequency === 'Quarterly' ? premiumValue / 3 : 
                          premiumValue / 12

    // Pre-generate id so we can attach Drive upload to this policy
    const newPolicyId = policyId || crypto.randomUUID()

    const policyData = {
      id: newPolicyId,
      title: `${formData.type} Insurance - ${formData.provider}`,
      description: `Policy #${formData.policyNumber} - ${formData.provider}`,
      metadata: {
        itemType: 'policy',
        type: formData.type.toLowerCase(), // 'health', 'auto', 'home', 'life'
        provider: formData.provider,
        policyNumber: formData.policyNumber,
        premium: premiumValue,
        monthlyPremium, // For Command Center display
        frequency: formData.frequency,
        coverage: parseFloat(formData.coverage) || 0,
        validUntil: formData.endDate,
        expiryDate: formData.endDate, // Also add as expiryDate for critical alerts
        startDate: formData.startDate,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        status: 'Active',
        documentPhoto: documentPhoto || undefined
      }
    }

    // Save or update to database via DataProvider
    if (policyId) {
      // Update existing policy
      await updateData('insurance', policyId, policyData)
      console.log('✅ Insurance policy updated in database')
    } else {
      // Add new policy
      await addData('insurance', policyData)
      console.log('✅ Insurance policy saved to database')
      
      // If a file was selected, upload it to Google Drive and link it
      try {
        if (capturedFile) {
          const fd = new FormData()
          fd.append('file', capturedFile)
          fd.append('domain', 'insurance')
          fd.append('recordId', newPolicyId)
          if (ocrText) fd.append('extractedText', ocrText)

          const resp = await fetch('/api/drive/upload', { 
            method: 'POST', 
            credentials: 'include',
            body: fd 
          })
          if (!resp.ok) {
            const j = await resp.json().catch(() => ({}))
            console.error('Drive upload failed:', j)
            alert(`Upload failed: ${j.error || 'Unknown error'}`)
          } else {
            console.log('📤 Policy document uploaded to Google Drive')
          }
        }
      } catch (err) {
        console.error('Drive upload error:', err)
      }

      // Create expiration reminder (only for new policies)
      const expiryDate = new Date(formData.endDate)
      const today = new Date()
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        // Persist alert to insurance domain as an alert item
        await addData('insurance' as any, {
          title: `${formData.type} Insurance Expiring Soon`,
          description: `Policy ${formData.policyNumber} expires on ${expiryDate.toLocaleDateString()}`,
          metadata: {
            itemType: 'alert',
            type: 'insurance_expiry',
            policyId: newPolicyId,
            policyNumber: formData.policyNumber,
            expiryDate: formData.endDate,
            priority: 'high'
          }
        })
      }
    }
    
    onSuccess()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold mb-8">{policyId ? 'Edit Policy' : 'New Policy'}</h2>

        <div className="space-y-6">
          {/* Document Upload (PDF or Photo) */}
          <div className="border-2 border-dashed rounded-2xl p-6 bg-blue-50 dark:bg-blue-900/20">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-6 text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              {isProcessing ? 'Processing Document...' : 'Upload Document (PDF or Photo)'}
            </Button>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Upload insurance card (PDF, JPG, PNG) - Text will be extracted automatically
            </p>
            {documentPhoto && (
              <div className="mt-4">
                <img src={documentPhoto} alt="Insurance Document" className="w-full rounded-lg max-h-48 object-contain" />
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Document uploaded! Data extracted below.
                </p>
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <Label className="text-lg mb-2 block">Type</Label>
            <select
              className="w-full border-2 rounded-xl p-4 text-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 dark:bg-gray-800"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select type</option>
              <option value="Health">Health Insurance</option>
              <option value="Auto">Auto Insurance</option>
              <option value="Home">Home/Renters Insurance</option>
              <option value="Life">Life Insurance</option>
              <option value="Dental">Dental Insurance</option>
              <option value="Vision">Vision Insurance</option>
              <option value="Pet">Pet Insurance</option>
            </select>
          </div>

          {/* Provider */}
          <div>
            <Label className="text-lg mb-2 block">Provider</Label>
            <Input
              placeholder="Insurance provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Policy Number */}
          <div>
            <Label className="text-lg mb-2 block">Policy Number</Label>
            <Input
              placeholder="Policy number"
              value={formData.policyNumber}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Premium Amount */}
          <div>
            <Label className="text-lg mb-2 block">Premium Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.premium}
              onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-lg mb-2 block">Frequency</Label>
            <select
              className="w-full border-2 rounded-xl p-4 text-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 dark:bg-gray-800"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>

          {/* Coverage Amount */}
          <div>
            <Label className="text-lg mb-2 block">Coverage Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.coverage}
              onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Start Date */}
          <div>
            <Label className="text-lg mb-2 block">Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* End Date */}
          <div>
            <Label className="text-lg mb-2 block">End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <Label className="text-lg mb-2 block">Contact Phone</Label>
            <Input
              placeholder="Contact number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-lg mb-2 block">Email</Label>
            <Input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl"
            >
              Add Policy
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

