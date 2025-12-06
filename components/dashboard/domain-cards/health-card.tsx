/**
 * Health Card for Command Center Dashboard
 * Displays health vitals and quick stats
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Heart, Activity, TrendingUp, ArrowRight, Pill } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

export function HealthCard() {
  const router = useRouter()
  const { items: healthEntries, loading } = useDomainCRUD('health')

  // Get latest vitals
  const latestBP = useMemo(() => 
    healthEntries.find(e => e.metadata?.logType === 'blood_pressure'),
    [healthEntries]
  )
  
  const latestWeight = useMemo(() =>
    healthEntries.find(e => e.metadata?.logType === 'weight'),
    [healthEntries]
  )
  
  const latestHR = useMemo(() =>
    healthEntries.find(e => e.metadata?.logType === 'heart_rate'),
    [healthEntries]
  )

  // Get medications
  const medications = useMemo(() => 
    healthEntries.filter(e => e.metadata?.logType === 'medication'),
    [healthEntries]
  )

  const todaysMeds = medications.slice(0, 5)
  const medsTaken = todaysMeds.filter(m => m.metadata?.taken).length

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Heart className="w-5 h-5 text-red-600" />
          </div>
            <div>
              <CardTitle>Health & Wellness</CardTitle>
              <CardDescription>Track your health journey</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/health')}
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-gray-600">BP</span>
                </div>
                <p className="text-lg font-bold text-red-900 dark:text-red-100">
                  {latestBP ? `${latestBP.metadata.systolic}/${latestBP.metadata.diastolic}` : '--/--'}
                </p>
            </div>

              <div className="p-3 bg-pink-50 dark:bg-pink-950 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span className="text-xs font-medium text-gray-600">HR</span>
                </div>
                <p className="text-lg font-bold text-pink-900 dark:text-pink-100">
                  {latestHR ? `${latestHR.metadata.heartRate || latestHR.metadata.bpm}` : '--'} bpm
                </p>
              </div>
            </div>

            {/* Weight Trend */}
            {latestWeight && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div>
                  <p className="text-xs font-medium text-gray-600">Weight</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {String(latestWeight.metadata?.weight ?? '')} lbs
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  On Track
                </Badge>
              </div>
            )}

            {/* Medications */}
            {todaysMeds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Medications Today</p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                      {medsTaken} of {todaysMeds.length} taken
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12">
                  <svg className="transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-current text-purple-200"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-current text-purple-600"
                      strokeWidth="3"
                      strokeDasharray={`${(medsTaken / todaysMeds.length) * 100}, 100`}
                    />
                  </svg>
        </div>
            </div>
          )}

            {/* Quick Action */}
            <Button
              onClick={() => router.push('/health')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Open Health Hub
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
