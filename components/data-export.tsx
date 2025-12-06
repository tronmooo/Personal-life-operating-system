'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useToast } from '@/components/ui/use-toast'
import {
  Download, FileJson, FileText, Database,
  CheckCircle, Calendar, Package
} from 'lucide-react'
import { format } from 'date-fns'

export function DataExport() {
  const { data } = useData()
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportAsJSON = () => {
    setIsExporting(true)
    try {
      // Build export purely from DataProvider
      const allData: any = {
        domains: data,
      }

      const dataStr = JSON.stringify(allData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lifehub-complete-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Success handled by component state
    } catch (error) {
      console.error('Export error:', error)
      alert('Export Failed: There was an error exporting your data.')
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  const exportAsCSV = (domain: string) => {
    setIsExporting(true)
    try {
      const domainData = data[domain as keyof typeof data]
      if (!Array.isArray(domainData) || domainData.length === 0) {
        alert(`No data found for ${domain} domain.`)
        setIsExporting(false)
        return
      }

      // Get all unique keys from metadata
      const allKeys = new Set<string>()
      domainData.forEach(item => {
        if (item.metadata) {
          Object.keys(item.metadata).forEach(key => allKeys.add(key))
        }
      })

      // Create CSV header
      const headers = ['ID', 'Title', 'Created At', 'Updated At', ...Array.from(allKeys)]
      const csvRows = [headers.join(',')]

      // Add data rows
      domainData.forEach(item => {
        const row = [
          item.id,
          `"${(item.title || '').replace(/"/g, '""')}"`,
          item.createdAt,
          item.updatedAt,
          ...Array.from(allKeys).map(key => {
            const value = item.metadata?.[key] || ''
            return `"${String(value).replace(/"/g, '""')}"`
          })
        ]
        csvRows.push(row.join(','))
      })

      const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(csvBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lifehub-${domain}-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Success - CSV downloaded
    } catch (error) {
      console.error('CSV export error:', error)
      alert('Export Failed: There was an error exporting to CSV.')
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  const exportAllAsCSV = () => {
    setIsExporting(true)
    try {
      const domains = Object.keys(data).filter(key => 
        Array.isArray(data[key as keyof typeof data]) && 
        (data[key as keyof typeof data] as any[]).length > 0
      )

      if (domains.length === 0) {
        alert('No data available to export.')
        setIsExporting(false)
        return
      }

      domains.forEach((domain, index) => {
        setTimeout(() => {
          exportAsCSV(domain)
        }, index * 500) // Stagger exports to avoid browser blocking
      })
      
      // Success - All CSV files downloaded
    } catch (error) {
      console.error('Batch export error:', error)
      alert('Export Failed: There was an error exporting all data.')
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  // Calculate stats
  const totalItems = Object.values(data).reduce((sum, items) => 
    sum + (Array.isArray(items) ? items.length : 0), 0
  )

  const activeDomains = Object.entries(data).filter(([_, items]) => 
    Array.isArray(items) && items.length > 0
  ).length

  const dataSize = new Blob([JSON.stringify(data)]).size
  const dataSizeKB = (dataSize / 1024).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-blue-500" />
          Data Export
        </h2>
        <p className="text-muted-foreground mt-1">
          Download your data in various formats for backup or analysis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">across all domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              Active Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeDomains}</div>
            <p className="text-xs text-muted-foreground">with data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileJson className="h-4 w-4 text-purple-500" />
              Data Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dataSizeKB} KB</div>
            <p className="text-xs text-muted-foreground">total storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-blue-500" />
              Complete Backup (JSON)
            </CardTitle>
            <CardDescription>
              Download all your data in JSON format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>All domains included</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Complete metadata</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Preserves data structure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Can be re-imported</span>
              </div>
            </div>
            <Button 
              onClick={exportAsJSON}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download JSON Backup'}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Recommended for complete backups
            </div>
          </CardContent>
        </Card>

        {/* CSV Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Spreadsheet Format (CSV)
            </CardTitle>
            <CardDescription>
              Export for Excel, Google Sheets, or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Works with Excel/Sheets</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Easy to analyze</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Domain-specific files</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Human-readable</span>
              </div>
            </div>
            <Button 
              onClick={exportAllAsCSV}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download All as CSV'}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Creates separate files per domain
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Domain Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Export by Domain</CardTitle>
          <CardDescription>Download data for specific life domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data)
              .filter(([_, items]) => Array.isArray(items) && items.length > 0)
              .map(([domain, items]) => (
                <Button
                  key={domain}
                  variant="outline"
                  onClick={() => exportAsCSV(domain)}
                  disabled={isExporting}
                  className="justify-between"
                >
                  <span className="capitalize">{domain}</span>
                  <Badge variant="secondary">
                    {(items as any[]).length} items
                  </Badge>
                </Button>
              ))}
          </div>
          {activeDomains === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No data to export yet. Start adding items to your domains!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <div className="font-medium text-blue-700 dark:text-blue-300">
                Backup Best Practices
              </div>
              <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                <li>• Export your data regularly (weekly or monthly)</li>
                <li>• Store backups in multiple secure locations</li>
                <li>• JSON format preserves all data and can be re-imported</li>
                <li>• CSV format is best for analysis in spreadsheet applications</li>
                <li>• Filename includes current date for easy version tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







