'use client'

import { useState } from 'react'
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LegalDashboard } from '@/components/legal/legal-dashboard'
import { AddDocumentForm } from '@/components/legal/add-document-form'

export default function LegalPage() {
  const router = useRouter()
  const [view, setView] = useState<'dashboard' | 'addDocument'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      {view === 'dashboard' && (
        <div className="bg-gray-900 text-white p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/domains')} className="p-2 hover:bg-gray-800 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Legal Document Manager</h1>
                  <p className="text-sm text-gray-400">Track documents, expirations, and contacts</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setView('addDocument')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + New Document
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {view === 'dashboard' && <LegalDashboard onAddDocument={() => setView('addDocument')} />}
        {view === 'addDocument' && <AddDocumentForm onCancel={() => setView('dashboard')} onSuccess={() => setView('dashboard')} />}
      </div>
    </div>
  )
}

