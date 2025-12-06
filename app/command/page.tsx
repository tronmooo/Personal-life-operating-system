'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Database, RefreshCw, CheckCircle, AlertCircle, DollarSign, Heart, BookOpen, Home } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface DashboardData {
  financial: {
    totalAssets: number
    monthlyIncome: number
    monthlyExpenses: number
    netWorth: number
  }
  health: {
    latestVitals: any
    totalEntries: number
    activeMedications: number
  }
  education: {
    activeCourses: number
    completedCourses: number
    totalCertifications: number
  }
  home: {
    totalAppliances: number
    activeWarranties: number
    upcomingMaintenance: number
  }
  domains: Record<string, any[]>
  timestamp: string
}

export default function CommandCenterPage() {
  const { getData } = useData()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get data from all domains
      const domains = ['financial', 'health', 'education', 'home', 'digital', 'vehicles', 'nutrition', 'relationships']
      const domainData: Record<string, any[]> = {}
      
      domains.forEach(domain => {
        domainData[domain] = getData(domain as any)
      })

      // Calculate financial summary
      const financialData = domainData.financial || []
      const financialSummary = {
        totalAssets: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netWorth: 0
      }

      // Calculate health summary
      const healthData = domainData.health || []
      const healthSummary = {
        latestVitals: null,
        totalEntries: healthData.filter(item => item.metadata?.type === 'vitals').length,
        activeMedications: 0
      }

      const vitals = healthData.filter(item => item.metadata?.type === 'vitals')
      if (vitals.length > 0) {
        healthSummary.latestVitals = vitals[0].metadata
      }

      // Calculate education summary
      const educationData = domainData.education || []
      const educationSummary = {
        activeCourses: educationData.filter(item => item.metadata?.status === 'Active').length,
        completedCourses: educationData.filter(item => item.metadata?.status === 'Completed').length,
        totalCertifications: educationData.filter(item => item.metadata?.type === 'certification').length
      }

      // Calculate home summary
      const homeData = domainData.home || []
      const homeSummary = {
        totalAppliances: homeData.filter(item => item.metadata?.type === 'appliance').length,
        activeWarranties: homeData.filter(item => 
          item.metadata?.type === 'warranty' && 
          new Date(item.metadata?.expiryDate || '2099-12-31') > new Date()
        ).length,
        upcomingMaintenance: 0
      }

      setDashboardData({
        financial: financialSummary,
        health: healthSummary,
        education: educationSummary,
        home: homeSummary,
        domains: domainData,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-lg">Loading Command Center...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Data</h3>
                  <p className="text-red-600 dark:text-red-300">{error}</p>
                </div>
              </div>
              <Button 
                onClick={loadDashboardData}
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Command Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Centralized dashboard for all your life domains
          </p>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            <span className="text-sm text-gray-500">
              Last updated: {new Date(dashboardData?.timestamp || '').toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Worth</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${dashboardData?.financial.netWorth.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Health Entries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.health.totalEntries || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.education.activeCourses || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Appliances</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.home.totalAppliances || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(dashboardData?.domains || {}).map(([domain, items]) => (
            <Card key={domain}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  {domain.charAt(0).toUpperCase() + domain.slice(1)} Domain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Items:</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Last Updated:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {items.length > 0 ? new Date(items[0].createdAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center">
          <Button onClick={loadDashboardData} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  )
}





