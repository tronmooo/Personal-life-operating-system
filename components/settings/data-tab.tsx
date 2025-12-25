'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  HardDrive,
  Shield,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { cn } from '@/lib/utils'

interface DataStats {
  domainEntries: number
  documents: number
  tasks: number
  habits: number
  bills: number
  notifications: number
  dashboardLayouts: number
  pets: number
  relationships: number
  totalRecords: number
}

interface DomainCount {
  domain: string
  count: number
}

export function DataTab() {
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DataStats | null>(null)
  const [domainCounts, setDomainCounts] = useState<DomainCount[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  useEffect(() => {
    loadDataStats()
  }, [])

  const loadDataStats = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Parallel queries for all data counts
      const [
        domainEntriesRes,
        documentsRes,
        tasksRes,
        habitsRes,
        billsRes,
        notificationsRes,
        layoutsRes,
        petsRes,
        relationshipsRes,
        domainGroupRes,
      ] = await Promise.all([
        supabase.from('domain_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('dashboard_layouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('relationships').select('id', { count: 'exact', head: true }).eq('userId', user.id),
        supabase.from('domain_entries').select('domain').eq('user_id', user.id),
      ])

      const domainEntries = domainEntriesRes.count || 0
      const documents = documentsRes.count || 0
      const tasks = tasksRes.count || 0
      const habits = habitsRes.count || 0
      const bills = billsRes.count || 0
      const notifications = notificationsRes.count || 0
      const dashboardLayouts = layoutsRes.count || 0
      const pets = petsRes.count || 0
      const relationships = relationshipsRes.count || 0

      setStats({
        domainEntries,
        documents,
        tasks,
        habits,
        bills,
        notifications,
        dashboardLayouts,
        pets,
        relationships,
        totalRecords: domainEntries + documents + tasks + habits + bills + notifications + pets + relationships,
      })

      // Process domain counts
      const domainData = domainGroupRes.data || []
      const countMap = domainData.reduce((acc: Record<string, number>, item: any) => {
        acc[item.domain] = (acc[item.domain] || 0) + 1
        return acc
      }, {})
      
      const counts = Object.entries(countMap)
        .map(([domain, count]) => ({ domain, count: count as number }))
        .sort((a, b) => b.count - a.count)
      
      setDomainCounts(counts)

    } catch (error) {
      console.error('Failed to load data stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch all user data
      const [
        domainEntriesRes,
        documentsRes,
        tasksRes,
        habitsRes,
        billsRes,
        petsRes,
        relationshipsRes,
        userSettingsRes,
      ] = await Promise.all([
        supabase.from('domain_entries').select('*').eq('user_id', user.id),
        supabase.from('documents').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('bills').select('*').eq('user_id', user.id),
        supabase.from('pets').select('*').eq('user_id', user.id),
        supabase.from('relationships').select('*').eq('userId', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        data: {
          domainEntries: domainEntriesRes.data || [],
          documents: documentsRes.data || [],
          tasks: tasksRes.data || [],
          habits: habitsRes.data || [],
          bills: billsRes.data || [],
          pets: petsRes.data || [],
          relationships: relationshipsRes.data || [],
          userSettings: userSettingsRes.data || [],
        }
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2)
        filename = `lifehub-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        // CSV - flatten domain entries
        const rows: any[] = []
        exportData.data.domainEntries.forEach((entry: any) => {
          rows.push({
            id: entry.id,
            domain: entry.domain,
            title: entry.title,
            description: entry.description,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            metadata: JSON.stringify(entry.metadata),
          })
        })
        
        if (rows.length > 0) {
          const headers = Object.keys(rows[0])
          content = [
            headers.join(','),
            ...rows.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
          ].join('\n')
        } else {
          content = 'No data to export'
        }
        filename = `lifehub-export-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setLastBackup(new Date().toISOString())

    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const deleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE') return

    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete all user data in order (respecting foreign keys)
      await Promise.all([
        supabase.from('domain_entries').delete().eq('user_id', user.id),
        supabase.from('tasks').delete().eq('user_id', user.id),
        supabase.from('habits').delete().eq('user_id', user.id),
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('notifications').delete().eq('user_id', user.id),
        supabase.from('documents').delete().eq('user_id', user.id),
      ])

      // Reload stats
      await loadDataStats()
      setShowDeleteConfirm(false)
      setDeleteConfirmation('')
      
      alert('All your data has been deleted successfully.')
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete data. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Overview */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Overview
          </CardTitle>
          <CardDescription>Summary of your stored data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Records */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold">{stats?.totalRecords.toLocaleString()}</p>
              </div>
              <HardDrive className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          {/* Data Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DataStat label="Domain Entries" value={stats?.domainEntries || 0} color="purple" />
            <DataStat label="Documents" value={stats?.documents || 0} color="green" />
            <DataStat label="Tasks" value={stats?.tasks || 0} color="blue" />
            <DataStat label="Habits" value={stats?.habits || 0} color="orange" />
            <DataStat label="Bills" value={stats?.bills || 0} color="red" />
            <DataStat label="Notifications" value={stats?.notifications || 0} color="yellow" />
            <DataStat label="Pets" value={stats?.pets || 0} color="pink" />
            <DataStat label="Relationships" value={stats?.relationships || 0} color="teal" />
          </div>

          {/* Domain Distribution */}
          {domainCounts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Domain Distribution</Label>
              <div className="space-y-2">
                {domainCounts.slice(0, 6).map((dc) => (
                  <div key={dc.domain} className="flex items-center gap-3">
                    <span className="w-24 text-sm capitalize truncate">{dc.domain}</span>
                    <div className="flex-1">
                      <Progress 
                        value={(dc.count / (stats?.domainEntries || 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                    <span className="w-12 text-sm text-right text-muted-foreground">{dc.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={loadDataStats} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Stats
          </Button>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Export Data
          </CardTitle>
          <CardDescription>Download a copy of all your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => exportData('json')}
              disabled={isExporting}
              className="h-auto py-4 flex-col gap-2"
              variant="outline"
            >
              <FileJson className="w-8 h-8" />
              <div>
                <p className="font-medium">Export JSON</p>
                <p className="text-xs text-muted-foreground">Complete data backup</p>
              </div>
            </Button>
            <Button
              onClick={() => exportData('csv')}
              disabled={isExporting}
              className="h-auto py-4 flex-col gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="w-8 h-8" />
              <div>
                <p className="font-medium">Export CSV</p>
                <p className="text-xs text-muted-foreground">Spreadsheet format</p>
              </div>
            </Button>
          </div>

          {isExporting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing export...
            </div>
          )}

          {lastBackup && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Last backup: {new Date(lastBackup).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Privacy & Security
          </CardTitle>
          <CardDescription>Your data is encrypted and secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">End-to-End Encryption</p>
                <p className="text-xs text-muted-foreground">All data is encrypted in transit and at rest</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">Row-Level Security</p>
                <p className="text-xs text-muted-foreground">Only you can access your data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">GDPR Compliant</p>
                <p className="text-xs text-muted-foreground">Full data portability and deletion rights</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions - proceed with caution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All My Data
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This will permanently delete all your domain entries, documents, tasks, habits, bills, 
                    and notifications. Your account and settings will remain intact.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Type DELETE to confirm:</Label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg bg-white dark:bg-gray-900"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmation('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteAllData}
                  disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Everything
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for data stats
function DataStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  }

  return (
    <div className={cn("p-3 rounded-lg text-center", colorClasses[color] || colorClasses.blue)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}














