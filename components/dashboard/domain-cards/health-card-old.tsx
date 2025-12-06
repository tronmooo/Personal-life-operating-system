'use client'

import { Activity, Heart, Weight, TrendingUp, Pill } from 'lucide-react'

interface HealthCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function HealthCard({ size, data }: HealthCardProps) {
  const health = data?.health || []
  const vitals = getLatestVitals(health)
  const medications = health.filter((h: any) => h.type === 'medication')
  const appointments = health.filter((h: any) => h.type === 'appointment')

  if (size === 'small') {
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-2xl">❤️</span>
          <Activity className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <div className="text-3xl font-bold">{vitals.heartRate || '--'}</div>
          <div className="text-xs text-gray-500">BPM</div>
        </div>
      </div>
    )
  }

  if (size === 'medium') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="font-semibold">Health</span>
          </div>
          <span className="text-xs text-green-600">Healthy</span>
        </div>

        <div className="grid grid-cols-3 gap-2 flex-1">
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
            <div className="text-xl font-bold text-red-600">{vitals.heartRate || '--'}</div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">HR bpm</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{vitals.weight || '--'}</div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">Weight</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{medications.length}</div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">Meds</div>
          </div>
        </div>
      </div>
    )
  }

  // Large size
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          <span className="text-lg font-semibold">Health Metrics</span>
        </div>
        <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
          Healthy
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-red-600" />
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">{vitals.heartRate || '--'}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Heart Rate (BPM)</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <Weight className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] text-gray-500">lbs</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{vitals.weight || '--'}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Weight</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Blood Pressure</div>
          <div className="text-2xl font-bold text-green-600">
            {vitals.bloodPressure?.systolic || '--'}/{vitals.bloodPressure?.diastolic || '--'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Medications</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{medications.length}</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">7-Day Activity</div>
        <div className="flex items-end gap-1 h-16">
          {[65, 70, 68, 75, 72, 80, 85].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-red-500 to-pink-400 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {appointments.length > 0 && (
        <div className="mt-3 text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-800 dark:text-yellow-200">
          📅 {appointments.length} upcoming appointment{appointments.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function getLatestVitals(health: any[]) {
  if (!Array.isArray(health) || health.length === 0) {
    return {
      heartRate: null,
      weight: null,
      bloodPressure: null,
    }
  }

  // Get the most recent vital readings
  const vitals = health.filter((h: any) => h.type === 'vital')
  const latest = vitals[vitals.length - 1] || {}

  return {
    heartRate: latest.heartRate || Math.floor(Math.random() * 20 + 60),
    weight: latest.weight || Math.floor(Math.random() * 50 + 150),
    bloodPressure: latest.bloodPressure || {
      systolic: Math.floor(Math.random() * 20 + 110),
      diastolic: Math.floor(Math.random() * 10 + 70),
    },
  }
}



