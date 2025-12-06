'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Upload, AlertCircle } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function DataExportImport() {
  const { data } = useData()
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lifehub-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate data structure
        if (typeof importedData !== 'object' || importedData === null) {
          throw new Error('Invalid data format')
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          throw new Error('You must be logged in to import data.')
        }

        const domains = Array.from(new Set(Object.keys(importedData || {})))

        if (domains.length === 0) {
          setImportSuccess(true)
          return
        }

        const replacements: Record<string, any>[] = []

        domains.forEach(domain => {
          const entries = Array.isArray(importedData[domain]) ? importedData[domain] : []
          entries.forEach((entry: any) => {
            const normalizedId =
              typeof entry.id === 'string' && entry.id.trim().length > 0
                ? entry.id
                : (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null)

            if (!normalizedId) return

            replacements.push({
              id: normalizedId,
              user_id: user.id,
              domain: String(domain),
              title: typeof entry.title === 'string' && entry.title.trim().length > 0 ? entry.title : 'Untitled',
              description: entry.description ?? null,
              metadata: typeof entry.metadata === 'object' && entry.metadata !== null ? entry.metadata : {},
              created_at: entry.createdAt ?? new Date().toISOString(),
              updated_at: entry.updatedAt ?? new Date().toISOString(),
            })
          })
        })

        if (domains.length > 0) {
          const { error: deleteError } = await supabase
            .from('domain_entries')
            .delete()
            .in('domain', domains)

          if (deleteError) {
            throw new Error(deleteError.message)
          }
        }

        if (replacements.length > 0) {
          const { error: upsertError } = await supabase
            .from('domain_entries')
            .upsert(replacements, { onConflict: 'id' })

          if (upsertError) {
            throw new Error(upsertError.message)
          }
        }

        setImportSuccess(true)
        setTimeout(() => window.location.reload(), 1500)
      } catch (error) {
        console.error('Import failed:', error)
        const message = error instanceof Error ? error.message : 'Failed to import data.'
        setImportError(message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download a backup of all your LifeHub data as a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Restore your data from a previously exported backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Warning: Importing data will replace all your current data. Make sure to export your current data first if you want to keep it.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Data</DialogTitle>
                <DialogDescription>
                  Select a backup file to restore your data
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {importError && (
                  <div className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{importError}</p>
                  </div>
                )}

                {importSuccess && (
                  <div className="flex items-start space-x-2 text-sm text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Data imported successfully! Refreshing...</p>
                  </div>
                )}

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a .json backup file
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setImportError(null)
                  setImportSuccess(false)
                }}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}



