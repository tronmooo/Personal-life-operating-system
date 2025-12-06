'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { FileText, Edit, Trash2, Calendar, User, AlertTriangle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'

interface Props {
  onAddDocument: () => void
}

interface LegalDocument {
  id: string
  type: string
  name: string
  issueDate: string
  expirationDate: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  documentPhoto?: string
  extractedText?: string
}

export function LegalDashboard({ onAddDocument }: Props) {
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const { getData, deleteData } = useData()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    const handleUpdate = () => loadDocuments()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('legal-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('legal-data-updated', handleUpdate)
    }
  }, [])

  const loadDocuments = () => {
    const legalData = (getData('insurance') || []) as DomainData[]
    const items = legalData
      .filter(item => item.metadata?.type === 'document')
      .map(item => ({
        id: item.id,
        type: String(item.metadata?.documentType || 'Document'),
        name: String(item.metadata?.name || item.title || ''),
        issueDate: String(item.metadata?.issueDate || ''),
        expirationDate: String(item.metadata?.expirationDate || ''),
        contactName: item.metadata?.contactName as string | undefined,
        contactEmail: item.metadata?.contactEmail as string | undefined,
        contactPhone: item.metadata?.contactPhone as string | undefined,
        notes: String(item.metadata?.notes || item.description || ''),
        documentPhoto: item.metadata?.documentPhoto as string | undefined,
        extractedText: item.metadata?.extractedText as string | undefined
      }))
      .sort((a, b) => new Date(String(a.expirationDate)).getTime() - new Date(String(b.expirationDate)).getTime())
    
    setDocuments(items)
    console.log(`📋 Loaded ${items.length} legal documents from DataProvider`)
  }

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    setDocuments(prev => prev.filter(d => d.id !== id))
    
    try {
      await deleteData('insurance', id)
      console.log('✅ Legal document deleted successfully')
    } catch (e) {
      console.error('❌ Failed to delete legal document:', e)
      loadDocuments()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const getExpirationStatus = (expirationDate: string) => {
    const daysLeft = differenceInDays(new Date(expirationDate), new Date())
    
    if (daysLeft < 0) return { color: 'bg-red-100 text-red-700', text: 'Expired', days: Math.abs(daysLeft) }
    if (daysLeft <= 30) return { color: 'bg-yellow-100 text-yellow-700', text: `${daysLeft} days left`, days: daysLeft }
    return { color: 'bg-green-100 text-green-700', text: `${daysLeft} days left`, days: daysLeft }
  }

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Drivers License': '🚗',
      'Passport': '🛂',
      'Birth Certificate': '📄',
      'Marriage Certificate': '💍',
      'Deed': '🏠',
      'Will': '📜',
      'Power of Attorney': '⚖️',
      'Contract': '📝',
      'License': '🎫',
      'Visa': '✈️',
    }
    return icons[type] || '📄'
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-white dark:bg-gray-900">
        {documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No items yet</p>
            <p className="text-sm text-gray-500 mb-6">Get started by adding your first insurance item</p>
            <button
              onClick={onAddDocument}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
            >
              + Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map(doc => {
              const status = getExpirationStatus(doc.expirationDate)
              
              return (
                <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-4xl">{getDocumentIcon(doc.type)}</span>
                        <div>
                          <h3 className="text-2xl font-bold">{doc.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{doc.type}</p>
                        </div>
                      </div>

                      {/* Expiration Status */}
                      {status.days <= 63 && (
                        <div className={`${status.color} rounded-xl p-4 mb-4 flex items-center gap-3`}>
                          <AlertTriangle className="w-5 h-5" />
                          <div>
                            <p className="font-semibold">Expiration Status</p>
                            <p className="text-sm">{status.text}</p>
                          </div>
                        </div>
                      )}

                      {/* Expiration Date */}
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold">Expires: {format(new Date(doc.expirationDate), 'MM/dd/yyyy')}</span>
                      </div>

                      {/* Contact Info */}
                      {(doc.contactName || doc.contactEmail || doc.contactPhone) && (
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            <span className="font-semibold text-sm">Contact</span>
                          </div>
                          {doc.contactName && <p className="text-sm">{doc.contactName}</p>}
                          {doc.contactEmail && <p className="text-sm text-blue-600">{doc.contactEmail}</p>}
                          {doc.contactPhone && <p className="text-sm">{doc.contactPhone}</p>}
                        </div>
                      )}

                      {/* Notes */}
                      {doc.notes && (
                        <div className="text-sm italic text-gray-600 dark:text-gray-400 mt-2">
                          {doc.notes}
                        </div>
                      )}

                      {/* Document Photo */}
                      {doc.documentPhoto && (
                        <details className="mt-4">
                          <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer">
                            View Scanned Document
                          </summary>
                          <img 
                            src={doc.documentPhoto} 
                            alt={doc.name} 
                            className="mt-2 rounded-lg max-h-64 object-contain border"
                          />
                        </details>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                        <Edit className="w-5 h-5 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingIds.has(doc.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingIds.has(doc.id) ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

