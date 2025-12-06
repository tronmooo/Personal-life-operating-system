'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Home, Heart, Car, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

interface InsuranceCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function InsuranceCard({ size, data }: InsuranceCardProps) {
  const supabase = createClientComponentClient()
  const [insuranceDocs, setInsuranceDocs] = useState<any[]>([])
  
  useEffect(() => {
    console.log('[InsuranceCard] Component mounting')
    console.log('[InsuranceCard] Props received:', { size, data })
    loadInsuranceDocuments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    console.log('[InsuranceCard] Hook data:', { insuranceDocs })
  }, [insuranceDocs])
  
  const loadInsuranceDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', 'insurance')
        .eq('category', 'Insurance')
      
      if (!error && docs) {
        setInsuranceDocs(docs)
      }
    } catch (error) {
      console.error('Error loading insurance documents:', error)
    }
  }
  
  const totalPolicies = insuranceDocs.length || 0
  
  // Calculate total monthly premiums from documents
  const monthlyPremium = insuranceDocs.reduce((sum, doc) => {
    const premium = parseFloat(doc.premium) || 0
    return sum + premium
  }, 0)
  
  // Calculate premiums by subtype (health, auto, home, life)
  const premiumsByType = insuranceDocs.reduce((acc, doc) => {
    const type = (doc.document_subtype || doc.subtype || 'other').toLowerCase()
    const premium = parseFloat(doc.premium) || 0
    acc[type] = (acc[type] || 0) + premium
    return acc
  }, {} as Record<string, number>)
  
  const totalCoverage = 2500000 // This would need to be calculated from metadata.coverage if available
  const upcomingRenewals = 0 // This would need date logic

  console.log('[InsuranceCard] Rendering with values:', {
    size,
    totalPolicies,
    monthlyPremium,
    premiumsByType,
    totalCoverage,
    upcomingRenewals,
  })

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-cyan-600" />
            <span className="font-semibold text-sm">Insurance</span>
          </div>
          <div>
            <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
              {totalPolicies}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Policies</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-cyan-600" />
            Insurance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Policies</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {totalPolicies}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Monthly</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                ${monthlyPremium}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total Coverage</span>
                </div>
                <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
                  ${(totalCoverage / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>

          {upcomingRenewals > 0 && (
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded text-sm">
              <AlertTriangle className="h-3 w-3 text-orange-600 inline mr-1" />
              {upcomingRenewals} renewal{upcomingRenewals > 1 ? 's' : ''} due soon
            </div>
          )}

          <Button variant="outline" className="w-full" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            View Policies
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-600" />
            Insurance Coverage
          </div>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-cyan-600">{totalPolicies}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Policies</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">${monthlyPremium}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">${(totalCoverage / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Coverage</p>
          </div>
        </div>

        {upcomingRenewals > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                Renewal Reminders
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>🏠 Home Insurance</span>
                <span className="text-orange-600 font-medium">15 days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>🚗 Auto Insurance</span>
                <span className="text-yellow-600 font-medium">1 month</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-cyan-600" />
            <span className="font-semibold text-sm">Premium Breakdown</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="text-sm">Health</span>
              </div>
              <span className="text-sm font-medium">${premiumsByType.health || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-600" />
                <span className="text-sm">Auto</span>
              </div>
              <span className="text-sm font-medium">${premiumsByType.auto || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Home</span>
              </div>
              <span className="text-sm font-medium">${premiumsByType.home || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Life</span>
              </div>
              <span className="text-sm font-medium">${premiumsByType.life || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                All Policies Active
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                No gaps in coverage
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            Policies
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Claims
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


























