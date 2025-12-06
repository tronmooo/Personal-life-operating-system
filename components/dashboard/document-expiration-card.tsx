'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileWarning, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useMemo } from 'react'
import { differenceInDays, parseISO, format, isPast } from 'date-fns'

interface ExpiringDoc {
  title: string
  domain: string
  expirationDate: Date
  daysUntil: number
  status: 'expired' | 'urgent' | 'warning' | 'ok'
}

export function DocumentExpirationCard() {
  const { data, documents } = useData()

  const expiringItems = useMemo(() => {
    const items: ExpiringDoc[] = []
    const now = new Date()

    // Check domain entries with expiration dates
    Object.entries(data).forEach(([domain, entries]) => {
      entries.forEach((entry: any) => {
        const expDate = 
          entry.expirationDate ||
          entry.expiration_date ||
          entry.metadata?.expirationDate ||
          entry.metadata?.expiration_date

        if (expDate) {
          const expirationDate = new Date(expDate)
          const daysUntil = differenceInDays(expirationDate, now)
          
          // Only show items expiring in next 90 days or already expired
          if (daysUntil <= 90) {
            let status: 'expired' | 'urgent' | 'warning' | 'ok' = 'ok'
            if (daysUntil < 0) status = 'expired'
            else if (daysUntil <= 14) status = 'urgent'
            else if (daysUntil <= 30) status = 'warning'

            items.push({
              title: entry.title || entry.name || 'Untitled',
              domain,
              expirationDate,
              daysUntil,
              status
            })
          }
        }
      })
    })

    // Check documents with expiration
    documents.forEach((doc: any) => {
      if (doc.expirationDate || doc.expiration_date) {
        const expDate = doc.expirationDate || doc.expiration_date
        const expirationDate = new Date(expDate)
        const daysUntil = differenceInDays(expirationDate, now)
        
        if (daysUntil <= 90) {
          let status: 'expired' | 'urgent' | 'warning' | 'ok' = 'ok'
          if (daysUntil < 0) status = 'expired'
          else if (daysUntil <= 14) status = 'urgent'
          else if (daysUntil <= 30) status = 'warning'

          items.push({
            title: doc.title || doc.name || 'Document',
            domain: doc.category || 'documents',
            expirationDate,
            daysUntil,
            status
          })
        }
      }
    })

    return items
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5)
  }, [data, documents])

  const statusCounts = useMemo(() => {
    const counts = { expired: 0, urgent: 0, warning: 0, ok: 0 }
    expiringItems.forEach(item => counts[item.status]++)
    return counts
  }, [expiringItems])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-500 text-white'
      case 'urgent': return 'bg-orange-500 text-white'
      case 'warning': return 'bg-yellow-500 text-white'
      default: return 'bg-green-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4" />
      case 'urgent': return <FileWarning className="w-4 h-4" />
      case 'warning': return <Clock className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const getStatusLabel = (item: ExpiringDoc) => {
    if (item.daysUntil < 0) return `${Math.abs(item.daysUntil)}d ago`
    if (item.daysUntil === 0) return 'Today'
    if (item.daysUntil === 1) return 'Tomorrow'
    return `${item.daysUntil}d`
  }

  return (
    <Card className="border-2 border-rose-200 dark:border-rose-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-rose-500" />
            <span className="text-lg">Expiring Soon</span>
          </div>
          <div className="flex gap-1">
            {statusCounts.expired > 0 && (
              <Badge variant="destructive" className="text-xs">
                {statusCounts.expired}
              </Badge>
            )}
            {statusCounts.urgent > 0 && (
              <Badge className="bg-orange-500 text-xs">
                {statusCounts.urgent}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expiringItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-500">All documents up to date! 🎉</p>
            <p className="text-xs text-gray-400 mt-1">Nothing expiring in next 90 days</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expiringItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  item.status === 'expired'
                    ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
                    : item.status === 'urgent'
                    ? 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-800'
                    : item.status === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`flex-shrink-0 ${
                      item.status === 'expired' ? 'text-red-600' :
                      item.status === 'urgent' ? 'text-orange-600' :
                      item.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.domain}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Exp: {format(item.expirationDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(item.status)} text-xs font-bold flex-shrink-0`}
                  >
                    {getStatusLabel(item)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



