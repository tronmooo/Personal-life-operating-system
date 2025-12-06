'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Heart, TrendingUp, Droplet, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface VitalEntry {
  id: string
  date: string
  bloodPressure?: { systolic: number; diastolic: number }
  heartRate?: number
  weight?: number
  glucose?: number
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string[]
  status: 'Active' | 'Inactive'
}

interface MedicationLog {
  medicationId: string
  date: string
  time: string
  taken: boolean
}

interface Appointment {
  id: string
  title: string
  doctor: string
  date: string
  time: string
}

import { normalizeMetadata, isEntryType } from '@/lib/utils/normalize-metadata'

export function DashboardTab() {
  const { getData, isLoading, isLoaded, reloadDomain } = useData()

  // Get health data from DataProvider
  const healthData = getData('health')
  
  // Force reload on mount to ensure fresh data
  useEffect(() => {
    console.log('🏥 DashboardTab mounted - reloading health domain')
    reloadDomain('health')
  }, [reloadDomain])


  // Extract vitals - EXACT COPY from VitalsTab (working version)
  const vitalsEntries = healthData.filter(item => {
    const meta = normalizeMetadata(item)
    const recordType = (meta.recordType || '').toLowerCase()
    const type = (meta.type || '').toLowerCase()
    const itemType = (meta.itemType || '').toLowerCase()
    const measurementType = (meta.measurement_type || '').toLowerCase()
    
    // Include if it's a vitals or weight entry, or has vital sign data
    const isVitalsType = ['vitals', 'weight', 'vital', 'vitalsigns', 'blood_pressure', 'lab'].some(t => 
      recordType.includes(t) || type.includes(t) || itemType.includes(t) || measurementType.includes(t)
    )
    
    // Also include if it has any vital sign data fields
    const hasVitalData = Boolean(
      meta.bloodPressure || meta.systolic || meta.diastolic || 
      meta.heartRate || meta.hr || meta.bpm ||
      meta.weight || meta.value ||
      meta.glucose || meta.bloodGlucose
    )
    
    return isVitalsType || hasVitalData
  })

  console.log('🏥 Health Data:', healthData.length, 'entries')
  console.log('🏥 Vitals entries found:', vitalsEntries.length)

  const allVitals = vitalsEntries
    .map(item => {
      const meta = normalizeMetadata(item)

      // Handle blood pressure - either as object or separate fields
      let bloodPressure = meta.bloodPressure
      if (!bloodPressure && meta.systolic && meta.diastolic) {
        const systolic = typeof meta.systolic === 'string' ? parseInt(meta.systolic) : meta.systolic
        const diastolic = typeof meta.diastolic === 'string' ? parseInt(meta.diastolic) : meta.diastolic
        if (systolic && diastolic) {
          bloodPressure = { systolic, diastolic }
        }
      }

      // Handle weight - convert string to number
      let weight = meta.weight || meta.value
      if (typeof weight === 'string') {
        weight = parseFloat(weight)
      }

      // Handle glucose
      let glucose = meta.glucose
      if (typeof glucose === 'string') {
        glucose = parseFloat(glucose)
      }

      const mapped = {
        id: item.id,
        date: meta.date || item.createdAt.split('T')[0],
        bloodPressure,
        heartRate: meta.heartRate,
        weight,
        glucose
      }

      return mapped
    })
    .filter(v => v.bloodPressure || v.heartRate || v.weight || v.glucose)  // Only include entries with actual data
    .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  console.log('📊 Final vitals array:', allVitals.length, 'vitals')
  console.log('📊 Latest vitals:', allVitals[0])
  
  // Get most recent value for EACH vital type independently
  const latestBloodPressure = useMemo(() => {
    const entry = allVitals.find(v => v.bloodPressure)
    return entry?.bloodPressure || null
  }, [allVitals])
  
  const latestHeartRate = useMemo(() => {
    const entry = allVitals.find(v => v.heartRate)
    return entry?.heartRate || null
  }, [allVitals])
  
  const latestWeight = useMemo(() => {
    const entry = allVitals.find(v => typeof v.weight === 'number')
    return entry?.weight || null
  }, [allVitals])
  
  const latestGlucose = useMemo(() => {
    const entry = allVitals.find(v => v.glucose)
    return entry?.glucose || null
  }, [allVitals])
  
  // Calculate weight change using entries with weight data
  const weightChange = useMemo(() => {
    const weightsOnly = allVitals.filter(v => typeof v.weight === 'number')
    if (weightsOnly.length >= 2) {
      const currentWeight = weightsOnly[0].weight as number
      const previousWeight = weightsOnly[1].weight as number
      return currentWeight - previousWeight
    }
    return null
  }, [allVitals])
  
  // Debug logging
  useEffect(() => {
    if (healthData.length > 0) {
      console.log('🏥 Health Dashboard - Total health items:', healthData.length)
      console.log('🏥 Health Dashboard - Vitals count:', allVitals.length)
      console.log('🏥 Health Dashboard - Latest BP:', latestBloodPressure)
      console.log('🏥 Health Dashboard - Latest HR:', latestHeartRate)
      console.log('🏥 Health Dashboard - Latest Weight:', latestWeight)
      console.log('🏥 Health Dashboard - Latest Glucose:', latestGlucose)
    }
  }, [healthData.length, allVitals.length, latestBloodPressure, latestHeartRate, latestWeight, latestGlucose])
  
  // Load medications and appointments from DATABASE via DataProvider
  const [showChart, setShowChart] = useState<'bp' | 'hr' | 'weight' | 'glucose' | null>(null)

  // Use useMemo to prevent infinite loops
  const todayMedications = useMemo(() => {
    const meds = healthData
      .filter(item => isEntryType(item, 'medication'))
      .map(item => {
        const meta = normalizeMetadata(item)
        return {
          id: item.id,
          name: meta.name || item.title || '',
          dosage: meta.dosage || '',
          frequency: meta.frequency || '',
          time: meta.time || [],
          status: (meta.status || 'Active') as 'Active' | 'Inactive'
        }
      })
      .filter(m => m.status === 'Active')
    return meds
  }, [healthData])

  const medicationLogs = useMemo(() => {
    const logs = healthData
      .filter(item => isEntryType(item, 'medication-log'))
      .map(item => {
        const meta = normalizeMetadata(item)
        return {
          medicationId: meta.medicationId || '',
          date: meta.date || '',
          time: meta.time || '',
          taken: meta.taken || false
        }
      })
    const today = new Date().toISOString().split('T')[0]
    return logs.filter(l => l.date === today)
  }, [healthData])

  const upcomingAppointments = useMemo(() => {
    const appts = healthData
      .filter(item => isEntryType(item, 'appointment'))
      .map(item => {
        const meta = normalizeMetadata(item)
        return {
          id: item.id,
          title: item.title || meta.title || '',
          doctor: meta.doctor || '',
          date: meta.date || meta.appointmentDate || '',
          time: meta.time || meta.appointmentTime || ''
        }
      })
    const now = new Date()
    return appts
      .filter(a => new Date(a.date + ' ' + a.time) > now)
      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
      .slice(0, 2)
  }, [healthData])

  // Debug logging only
  useEffect(() => {
    console.log('🏥 Loaded from database:', { 
      medications: todayMedications.length, 
      logs: medicationLogs.length, 
      appointments: upcomingAppointments.length 
    })
  }, [todayMedications.length, medicationLogs.length, upcomingAppointments.length])

  const isMedicationTaken = (medId: string, time: string) => {
    return medicationLogs.some(log => log.medicationId === medId && log.time === time && log.taken)
  }

  const getVitalStatus = (value: number, type: 'bp' | 'hr' | 'glucose') => {
    if (type === 'bp') {
      if (value <= 120) return 'Normal'
      if (value <= 139) return 'Elevated'
      return 'High'
    }
    if (type === 'hr') {
      if (value >= 60 && value <= 100) return 'Normal'
      return 'Abnormal'
    }
    if (type === 'glucose') {
      if (value < 100) return 'Normal'
      if (value < 126) return 'Prediabetic'
      return 'High'
    }
    return 'Normal'
  }

  const getChartData = (type: 'bp' | 'hr' | 'weight' | 'glucose') => {
    return allVitals.slice(0, 10).reverse().map(v => ({
      date: v.date,
      value: type === 'bp' ? v.bloodPressure?.systolic :
             type === 'hr' ? v.heartRate :
             type === 'weight' ? v.weight :
             v.glucose
    })).filter(d => d.value !== undefined)
  }

  return (
    <div className="space-y-6">
      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowChart(null)}>
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {showChart === 'bp' && 'Blood Pressure Trend'}
                {showChart === 'hr' && 'Heart Rate Trend'}
                {showChart === 'weight' && 'Weight Trend'}
                {showChart === 'glucose' && 'Glucose Trend'}
              </h3>
              <button onClick={() => setShowChart(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData(showChart)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} name={
                  showChart === 'bp' ? 'Systolic' :
                  showChart === 'hr' ? 'BPM' :
                  showChart === 'weight' ? 'lbs' :
                  'mg/dL'
                } />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <Card 
          className="bg-white dark:bg-gray-900 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowChart('bp')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Blood Pressure</p>
                <p className="text-4xl font-bold mb-1">
                  {latestBloodPressure 
                    ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}`
                    : '--/--'}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {latestBloodPressure 
                    ? getVitalStatus(latestBloodPressure.systolic, 'bp')
                    : 'No data'}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heart Rate */}
        <Card 
          className="bg-white dark:bg-gray-900 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowChart('hr')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Heart Rate</p>
                <p className="text-4xl font-bold mb-1">
                  {latestHeartRate || '--'} <span className="text-lg">bpm</span>
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {latestHeartRate 
                    ? getVitalStatus(latestHeartRate, 'hr')
                    : 'No data'}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight */}
        <Card 
          className="bg-white dark:bg-gray-900 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowChart('weight')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Weight</p>
                <p className="text-4xl font-bold mb-1">
                  {typeof latestWeight === 'number' ? latestWeight : '--'} <span className="text-lg">lbs</span>
                </p>
                {weightChange !== null && (
                  <p className={`text-sm font-medium ${weightChange < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                    {weightChange > 0 ? '+' : ''}{weightChange} lb this week
                  </p>
                )}
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glucose */}
        <Card 
          className="bg-white dark:bg-gray-900 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowChart('glucose')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Glucose</p>
                <p className="text-4xl font-bold mb-1">
                  {latestGlucose || '--'} <span className="text-lg">mg/dL</span>
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {latestGlucose 
                    ? getVitalStatus(latestGlucose, 'glucose')
                    : 'No data'}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Droplet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Medications */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Today's Medications</h2>
          {todayMedications.length === 0 ? (
            <p className="text-gray-500">No medications scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayMedications.map((med) => (
                <div key={med.id}>
                  {(Array.isArray(med.time) ? med.time : []).map((t: string) => {
                    const taken = isMedicationTaken(med.id, t)
                    return (
                      <div
                        key={`${med.id}-${t}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2"
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          taken ? 'bg-blue-600' : 'bg-white dark:bg-gray-700 border-2'
                        }`}>
                          {taken && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${taken ? 'line-through opacity-60' : ''}`}>
                            {String(med.name)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {String(med.dosage)} - {String(t)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          taken 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {taken ? 'Taken' : 'Pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{String(appt.title)}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{String(appt.doctor)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {typeof appt.date === 'string' ? format(new Date(appt.date), 'yyyy-MM-dd') : 'No date'} at {String(appt.time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

