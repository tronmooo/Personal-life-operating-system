'use client'

import { useState, useEffect } from 'react'
import { DomainDocumentsManager } from '@/components/domain-documents-manager'
import { SmartDocument } from '@/types/documents'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function DomainDocumentsPage({ params }: { params: Promise<{ domainId: string }> }) {
  const resolvedParams = await params
  const domain = resolvedParams.domainId
  
  return <DomainDocumentsPageClient domain={domain} />
}

function DomainDocumentsPageClient({ domain }: { domain: string }) {
  const [documents, setDocuments] = useState<SmartDocument[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Load documents from Supabase filtered by domain
  useEffect(() => {
    loadDocuments()
  }, [domain])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDocuments([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', domain)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
      } else {
        // Map Supabase documents to SmartDocument format
        const mappedDocs: SmartDocument[] = (data || []).map((doc: any) => ({
          id: doc.id,
          name: doc.document_name || doc.file_name,
          type: doc.document_type || doc.mime_type,
          size: doc.file_size,
          data: doc.file_data || '',
          uploadedAt: doc.created_at,
          url: doc.file_url || doc.file_path,
          domain: doc.domain,
          tags: doc.tags || [],
          metadata: doc.metadata || {},
          ocrProcessed: doc.ocr_processed || false,
          ocrText: doc.ocr_text || '',
          ocrConfidence: doc.ocr_confidence || 0,
          extractedData: doc.extracted_data || {
            expirationDate: doc.expiration_date,
            renewalDate: doc.renewal_date,
            policyNumber: doc.policy_number,
            accountNumber: doc.account_number,
            amount: doc.amount,
            documentType: doc.document_type
          },
          notes: doc.notes || '',
          reminderCreated: doc.reminder_created || false,
          reminderId: doc.reminder_id || undefined
        }))
        setDocuments(mappedDocs)
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentAdded = (doc: SmartDocument) => {
    setDocuments(prev => [doc, ...prev])
  }

  const handleDocumentDeleted = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button and Breadcrumb Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/domains" className="hover:text-foreground">
            Domains
          </Link>
          <span>/</span>
          <Link href={`/domains/${domain}`} className="hover:text-foreground capitalize">
            {domain}
          </Link>
          <span>/</span>
          <span className="text-foreground">Documents</span>
        </div>
        <Link href={`/domains/${domain}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to {domain.charAt(0).toUpperCase() + domain.slice(1)}
          </Button>
        </Link>
      </div>

      {/* Documents Manager */}
      <DomainDocumentsManager
        domain={domain}
        documents={documents}
        onDocumentAdded={handleDocumentAdded}
        onDocumentDeleted={handleDocumentDeleted}
      />
    </div>
  )
}







