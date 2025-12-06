/**
 * Example: Using DocumentUpload with Google Drive
 * 
 * This component demonstrates how to use the updated DocumentUpload
 * component with Google Drive integration
 */

'use client'

import { DocumentUpload } from '@/components/ui/document-upload'
import { useGoogleDrive } from '@/hooks/use-google-drive'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, FolderOpen } from 'lucide-react'

export function DriveUploadExample() {
  const [selectedDomain, setSelectedDomain] = useState('insurance')
  
  // You can also use the hook directly for more control
  const { files, listFiles, isAuthenticated } = useGoogleDrive(selectedDomain)

  useEffect(() => {
    if (isAuthenticated) {
      listFiles()
    }
  }, [isAuthenticated, listFiles])

  return (
    <div className="space-y-6">
      {/* Example 1: Simple Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Document Upload</CardTitle>
          <CardDescription>
            Automatically organized in Google Drive under LifeHub/{selectedDomain}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload 
            domain={selectedDomain}
            enableOCR={true}
            onUploadComplete={(fileId) => {
              console.log('File uploaded with ID:', fileId)
              // Optionally refresh your data or show a success message
            }}
          />
        </CardContent>
      </Card>

      {/* Example 2: With Domain Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Upload to Specific Domain</CardTitle>
          <CardDescription>
            Choose which folder to upload to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['insurance', 'vehicles', 'health', 'home', 'pets'].map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedDomain === domain
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />
                {domain.charAt(0).toUpperCase() + domain.slice(1)}
              </button>
            ))}
          </div>

          <DocumentUpload 
            domain={selectedDomain}
            label={`Upload to ${selectedDomain}`}
            enableOCR={true}
          />
        </CardContent>
      </Card>

      {/* Example 3: Linked to Record */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Linked to Record</CardTitle>
          <CardDescription>
            Associate uploaded documents with specific records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload 
            domain="insurance"
            recordId="policy-abc-123" // Links document to this policy
            label="Insurance Policy Documents"
            enableOCR={true}
            onUploadComplete={(fileId) => {
              // Save fileId to your policy record
              console.log('Document linked to policy-abc-123:', fileId)
            }}
          />
        </CardContent>
      </Card>

      {/* Example 4: Using the Hook Directly */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced: Using useGoogleDrive Hook</CardTitle>
          <CardDescription>
            For custom upload UI or additional features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {isAuthenticated 
                ? `You have ${files.length} documents in ${selectedDomain}`
                : 'Sign in with Google to view documents'}
            </p>
            
            {files.slice(0, 3).map((file) => (
              <div key={file.id} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="flex-1">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(file.modifiedTime).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Usage in your domain pages:
 * 
 * // In app/domains/insurance/page.tsx
 * import { DocumentUpload } from '@/components/ui/document-upload'
 * 
 * <DocumentUpload 
 *   domain="insurance"
 *   recordId={policyId}
 *   enableOCR={true}
 * />
 * 
 * // In app/domains/vehicles/page.tsx
 * import { DocumentUpload } from '@/components/ui/document-upload'
 * 
 * <DocumentUpload 
 *   domain="vehicles"
 *   recordId={vehicleId}
 *   enableOCR={true}
 * />
 */
































