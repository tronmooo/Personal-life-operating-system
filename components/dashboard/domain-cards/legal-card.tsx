'use client'

import { useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scale, FileText, AlertCircle, CheckCircle, Clock, FolderOpen } from 'lucide-react'

interface LegalCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function LegalCard({ size, data }: LegalCardProps) {
  const legalData = data?.legal || {}
  const totalDocuments = legalData.documents?.length || 18
  const activeMatters = legalData.activeMatters || 2
  const upcomingDeadlines = legalData.upcomingDeadlines || 3
  const lastReviewed = legalData.lastReviewed || '2 months ago'

  useEffect(() => {
    console.log('[LegalCard] Component mounting')
    console.log('[LegalCard] Props received:', { size, data })
    console.log('[LegalCard] Hook data:', { legalData })
  }, [size, data, legalData])

  console.log('[LegalCard] Rendering with values:', {
    size,
    totalDocuments,
    activeMatters,
    upcomingDeadlines,
    lastReviewed,
  })

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-sm">Legal</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {totalDocuments}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-amber-600" />
            Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Documents</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {totalDocuments}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {activeMatters}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Deadlines</span>
                </div>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {upcomingDeadlines}
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            View Documents
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-600" />
            Legal Documents
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{totalDocuments}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Docs</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600">{activeMatters}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{upcomingDeadlines}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Deadlines</p>
          </div>
        </div>

        {upcomingDeadlines > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-sm text-red-900 dark:text-red-100">
                Urgent Deadlines
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>📄 Contract Renewal</span>
                <span className="text-red-600 font-medium">3 days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>📝 Tax Filing</span>
                <span className="text-orange-600 font-medium">2 weeks</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>⚖️ Court Appearance</span>
                <span className="text-yellow-600 font-medium">1 month</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm">Document Categories</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span>📋 Contracts</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span>🏛️ Legal Agreements</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span>📑 Tax Documents</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span>🔐 Wills & Trusts</span>
              <span className="font-medium">2</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                All Documents Backed Up
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Last reviewed {lastReviewed}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Browse
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Reminders
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


























