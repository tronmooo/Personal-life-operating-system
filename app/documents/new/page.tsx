'use client'

import { NextGenDocumentManager } from '@/components/documents/next-gen-document-manager'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewDocumentPage() {
  const router = useRouter()

  const handleDocumentSaved = (document: any) => {
    console.log('Document saved:', document)
    // Redirect to the domain or documents page
    if (document.domain) {
      router.push(`/domains/${document.domain}`)
    } else {
      router.push('/documents')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Next-Gen Document Manager</h1>
          <p className="text-muted-foreground mt-2">
            Upload a photo, PDF, or manually enter document information. AI will automatically categorize and extract data.
          </p>
        </div>
      </div>

      {/* Document Manager */}
      <NextGenDocumentManager 
        onDocumentSaved={handleDocumentSaved}
        onCancel={handleCancel}
      />

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            The intelligent document management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-2xl">📸</span>
                1. Capture or Upload
              </div>
              <p className="text-sm text-muted-foreground">
                Take a photo, upload a PDF, or manually enter document information
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                2. AI Analysis
              </div>
              <p className="text-sm text-muted-foreground">
                AI automatically detects document type and extracts key information (policy numbers, dates, amounts)
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-2xl">✅</span>
                3. Auto-Categorize
              </div>
              <p className="text-sm text-muted-foreground">
                Documents are automatically routed to the correct domain (Insurance, Health, Financial, etc.)
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Supported Document Types:</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                🏥 Insurance Cards
              </span>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                🧾 Receipts
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                💊 Prescriptions
              </span>
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                🚗 Vehicle Docs
              </span>
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                📄 Bills/Invoices
              </span>
              <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-1 rounded">
                🏥 Medical Records
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




















