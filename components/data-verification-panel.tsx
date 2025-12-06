'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Trash2,
  Info
} from 'lucide-react'
import { 
  clearAllCache, 
  verifyDataIntegrity, 
  forceSyncFromSupabase,
  downloadDataExport,
  type DataVerificationReport 
} from '@/lib/utils/data-verification'
import { toast } from '@/lib/utils/toast'

export function DataVerificationPanel() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [report, setReport] = useState<DataVerificationReport | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const result = await verifyDataIntegrity()
      setReport(result)
      
      if (result.discrepancies.length === 0) {
        toast.success('Data Verified', 'All data is in sync!')
      } else {
        toast.warning('Discrepancies Found', `Found ${result.discrepancies.length} domain(s) with mismatched data`)
      }
    } catch (error: any) {
      toast.error('Verification Failed', error.message || 'Could not verify data integrity')
      console.error('Verification error:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? The app will reload data from Supabase.')) {
      return
    }

    setIsClearing(true)
    try {
      await clearAllCache()
      toast.success('Cache Cleared', 'All cached data has been removed')
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast.error('Clear Failed', error.message || 'Could not clear cache')
      console.error('Clear cache error:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleForceSync = async () => {
    if (!confirm('Force sync will clear cache and reload all data from Supabase. Continue?')) {
      return
    }

    setIsSyncing(true)
    try {
      await forceSyncFromSupabase()
      toast.success('Syncing...', 'Reloading data from Supabase')
      
      // Reload the page
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast.error('Sync Failed', error.message || 'Could not force sync')
      console.error('Force sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadDataExport()
      toast.success('Export Complete', 'Data has been downloaded as JSON')
    } catch (error: any) {
      toast.error('Export Failed', error.message || 'Could not export data')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Verification & Diagnostics
            </CardTitle>
            <CardDescription>
              Check data integrity, clear cache, and troubleshoot display issues
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950">
            Developer Tool
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-2"
          >
            <Info className="h-4 w-4" />
            {isVerifying ? 'Checking...' : 'Verify Data'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={isClearing}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Force Sync'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>

        {/* Verification Report */}
        {report && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                {report.discrepancies.length === 0 ? (
                  <><CheckCircle className="h-5 w-5 text-green-600" /> All Data Synced</>
                ) : (
                  <><AlertTriangle className="h-5 w-5 text-amber-600" /> Discrepancies Found</>
                )}
              </h4>
              <span className="text-xs text-muted-foreground">
                {new Date(report.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Supabase Entries</div>
                <div className="font-bold text-lg">{report.totalSupabase}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Cached Entries</div>
                <div className="font-bold text-lg">{report.totalIDB}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Cache Size</div>
                <div className="font-bold text-lg">
                  {(report.cacheSizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            {report.discrepancies.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Domains with Mismatches:
                </div>
                <div className="space-y-1">
                  {report.discrepancies.map((disc) => (
                    <div
                      key={disc.domain}
                      className="flex items-center justify-between text-xs p-2 bg-background rounded"
                    >
                      <span className="font-medium capitalize">{disc.domain}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          Supabase: {disc.supabaseCount}
                        </span>
                        <span className="text-muted-foreground">
                          Cache: {disc.idbCount}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Δ {disc.difference}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.discrepancies.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded text-xs">
                <p className="font-semibold mb-1">Recommended Action:</p>
                <p className="text-muted-foreground">
                  Click <strong>"Force Sync"</strong> to clear cache and reload fresh data from Supabase.
                  This will resolve any discrepancies between cached and database data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 mt-4 p-3 bg-muted/50 rounded">
          <p><strong>Verify Data:</strong> Compare Supabase database with local cache</p>
          <p><strong>Clear Cache:</strong> Remove all cached data (forces fresh load)</p>
          <p><strong>Force Sync:</strong> Clear cache + reload from Supabase</p>
          <p><strong>Export Data:</strong> Download all your data as JSON file</p>
        </div>
      </CardContent>
    </Card>
  )
}

