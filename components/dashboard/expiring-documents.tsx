'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useState } from 'react'
import { DocumentsManager } from './documents-manager'

export function ExpiringDocuments() {
  const { documents } = useData()
  const [showAll, setShowAll] = useState(false)

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)

  const expiringDocs = documents
    .filter(doc => {
      if (!doc.expiryDate) return false
      const expiryDate = new Date(doc.expiryDate)
      return expiryDate >= today && expiryDate <= sixtyDaysFromNow
    })
    .map(doc => {
      const expiryDate = new Date(doc.expiryDate!)
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { ...doc, daysUntil, expiryDate }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const displayDocs = showAll ? expiringDocs : expiringDocs.slice(0, 4)

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 0) return 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800'
    if (daysUntil <= 7) return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
    if (daysUntil <= 30) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
  }

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 0) return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Expired</Badge>
    if (daysUntil <= 7) return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Urgent</Badge>
    if (daysUntil <= 30) return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Soon</Badge>
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Upcoming</Badge>
  }

  const getDaysText = (daysUntil: number) => {
    if (daysUntil <= 0) return `Expired ${Math.abs(daysUntil)} days ago`
    if (daysUntil === 1) return 'Expires tomorrow'
    if (daysUntil <= 7) return `Expires in ${daysUntil} days`
    return `Expires in ${daysUntil} days`
  }

  const [documentsOpen, setDocumentsOpen] = useState(false)

  return (
    <>
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setDocumentsOpen(true)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Expiring Documents
          </CardTitle>
          <Badge variant={expiringDocs.length > 0 ? "destructive" : "secondary"} className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {expiringDocs.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringDocs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20 text-green-500" />
            <p className="text-sm">All documents are up to date!</p>
            <p className="text-xs mt-1">No documents expiring in the next 60 days</p>
          </div>
        ) : (
          <>
            {displayDocs.map(doc => (
              <div 
                key={doc.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getUrgencyColor(doc.daysUntil)}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getUrgencyBadge(doc.daysUntil)}
                      <span className="text-xs text-muted-foreground">
                        {doc.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className={`text-sm font-bold ${doc.daysUntil <= 0 ? 'text-red-600' : doc.daysUntil <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                    {doc.daysUntil <= 0 ? '!' : doc.daysUntil}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.daysUntil <= 0 ? 'days ago' : 'days'}
                  </p>
                </div>
              </div>
            ))}

            {!showAll && expiringDocs.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAll(true)
                }}
              >
                View All {expiringDocs.length} Expiring Documents
              </Button>
            )}

            {showAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAll(false)
                }}
              >
                Show Less
              </Button>
            )}

            <div className="pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setDocumentsOpen(true)
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Manage All Documents
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    <DocumentsManager open={documentsOpen} onClose={() => setDocumentsOpen(false)} onOpenOCR={() => {}} />
    </>
  )
}

