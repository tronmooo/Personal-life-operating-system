'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Search, Filter, Calendar, ChevronDown, ChevronUp, LayoutGrid, List, X } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO, startOfDay, subDays } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { normalizeMetadata } from '@/lib/utils/normalize-metadata'
import { cn } from '@/lib/utils'

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'
type ViewMode = 'list' | 'cards'

interface VitalEntry {
  id: string
  date: string
  bloodPressure?: { systolic: number; diastolic: number }
  heartRate?: number
  weight?: number
  glucose?: number
  type?: string
  createdAt?: string
}

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

export function VitalsTab() {
  const { getData, addData, deleteData, reloadDomain } = useData()
  
  // State for filtering and view mode
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Get vitals from DataProvider
  const healthData = getData('health')

  // Filter vitals entries (handles both nested and flat metadata)
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

  const vitals: VitalEntry[] = vitalsEntries
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

      // Determine entry type
      let entryType = 'vitals'
      if (bloodPressure) entryType = 'blood_pressure'
      else if (meta.heartRate || meta.hr || meta.bpm) entryType = 'heart_rate'
      else if (weight) entryType = 'weight'
      else if (glucose) entryType = 'glucose'

      return {
        id: item.id,
        date: meta.date || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        bloodPressure,
        heartRate: meta.heartRate || meta.hr || meta.bpm,
        weight,
        glucose,
        type: entryType,
        createdAt: item.createdAt
      }
    })
    .filter(v => v.bloodPressure || v.heartRate || v.weight || v.glucose)

  // Apply filters
  const filteredVitals = useMemo(() => {
    return vitals
      .filter(entry => {
        // Time filter
        const entryDate = parseISO(entry.createdAt || entry.date)
        const today = startOfDay(new Date())
        
        switch (timeFilter) {
          case 'today':
            if (!isToday(entryDate)) return false
            break
          case 'yesterday':
            if (!isYesterday(entryDate)) return false
            break
          case 'week':
            if (!isThisWeek(entryDate)) return false
            break
          case 'month':
            if (!isThisMonth(entryDate)) return false
            break
        }

        // Type filter
        if (typeFilter !== 'all' && entry.type !== typeFilter) return false

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const dateStr = entry.date?.toLowerCase() || ''
          const bpStr = entry.bloodPressure ? `${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}` : ''
          const hrStr = entry.heartRate ? `${entry.heartRate} bpm` : ''
          const weightStr = entry.weight ? `${entry.weight} lbs` : ''
          const glucoseStr = entry.glucose ? `${entry.glucose} mg/dl` : ''
          
          if (!dateStr.includes(query) && 
              !bpStr.includes(query) && 
              !hrStr.includes(query) && 
              !weightStr.includes(query) &&
              !glucoseStr.includes(query)) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime()
        const dateB = new Date(b.createdAt || b.date).getTime()
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      })
  }, [vitals, timeFilter, typeFilter, searchQuery, sortDirection])

  // Sleep entries
  const sleepEntries = (healthData || [])
    .filter((item: any) => {
      const m = normalizeMetadata(item) as any
      return (m.type || '').toLowerCase() === 'sleep'
    })
    .map((item: any) => {
      const m = normalizeMetadata(item) as any
      const minutes: number = parseInt(String(m.durationMinutes || 0), 10) || 0
      return {
        id: item.id,
        date: (m.date as string) || item.createdAt?.split('T')[0],
        minutes,
        quality: parseInt(String(m.quality || 0), 10) || 0,
      }
    })
    .sort((a: any, b: any) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  // Summary stats
  const summary = useMemo(() => {
    const filtered = filteredVitals
    const bpEntries = filtered.filter(v => v.bloodPressure)
    const hrEntries = filtered.filter(v => v.heartRate)
    const weightEntries = filtered.filter(v => v.weight)
    const glucoseEntries = filtered.filter(v => v.glucose)

    return {
      total: filtered.length,
      avgBP: bpEntries.length > 0 ? {
        systolic: Math.round(bpEntries.reduce((sum, v) => sum + (v.bloodPressure?.systolic || 0), 0) / bpEntries.length),
        diastolic: Math.round(bpEntries.reduce((sum, v) => sum + (v.bloodPressure?.diastolic || 0), 0) / bpEntries.length)
      } : null,
      avgHR: hrEntries.length > 0 ? Math.round(hrEntries.reduce((sum, v) => sum + (v.heartRate || 0), 0) / hrEntries.length) : null,
      latestWeight: weightEntries.length > 0 ? weightEntries[0].weight : null,
      avgGlucose: glucoseEntries.length > 0 ? Math.round(glucoseEntries.reduce((sum, v) => sum + (v.glucose || 0), 0) / glucoseEntries.length) : null,
    }
  }, [filteredVitals])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<VitalEntry>>({
    date: new Date().toISOString().split('T')[0]
  })

  // Sleep tracking state
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [sleepDate, setSleepDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [sleepHours, setSleepHours] = useState<string>('8')
  const [sleepMinutes, setSleepMinutes] = useState<string>('0')
  const [sleepQuality, setSleepQuality] = useState<string>('3')

  const handleAdd = async () => {
    const date = formData.date || new Date().toISOString().split('T')[0]
    const entriesToAdd = []
    
    if (formData.bloodPressure && (formData.bloodPressure.systolic > 0 || formData.bloodPressure.diastolic > 0)) {
      entriesToAdd.push({
        title: `Blood Pressure: ${formData.bloodPressure.systolic}/${formData.bloodPressure.diastolic}`,
        description: `BP reading for ${date}`,
        metadata: {
          logType: 'blood_pressure',
          systolic: formData.bloodPressure.systolic,
          diastolic: formData.bloodPressure.diastolic,
          date
        }
      })
    }
    
    if (formData.heartRate && formData.heartRate > 0) {
      entriesToAdd.push({
        title: `Heart Rate: ${formData.heartRate} bpm`,
        description: `HR reading for ${date}`,
        metadata: {
          logType: 'heart_rate',
          heartRate: formData.heartRate,
          bpm: formData.heartRate,
          date
        }
      })
    }
    
    if (formData.weight && formData.weight > 0) {
      entriesToAdd.push({
        title: `Weight: ${formData.weight} lbs`,
        description: `Weight check for ${date}`,
        metadata: {
          logType: 'weight',
          weight: formData.weight,
          date
        }
      })
    }
    
    if (formData.glucose && formData.glucose > 0) {
      entriesToAdd.push({
        title: `Blood Sugar: ${formData.glucose} mg/dL`,
        description: `Glucose reading for ${date}`,
        metadata: {
          logType: 'glucose',
          glucose: formData.glucose,
          date
        }
      })
    }
    
    for (const entry of entriesToAdd) {
      await addData('health', entry)
    }
    
    setFormData({ date: new Date().toISOString().split('T')[0] })
    setShowAddForm(false)
    try { 
      await reloadDomain('health' as any) 
    } catch (error) {
      console.error('Failed to reload health domain after adding vitals:', error)
    }
  }

  const handleAddSleep = async () => {
    const hours = parseInt(sleepHours || '0', 10)
    const minutes = parseInt(sleepMinutes || '0', 10)
    const totalMinutes = Math.max(0, hours * 60 + minutes)
    const quality = Math.min(5, Math.max(1, parseInt(sleepQuality || '3', 10)))

    await addData('health', {
      title: `Sleep ${hours}h ${minutes}m`,
      description: `Sleep for ${sleepDate}`,
      metadata: {
        type: 'sleep',
        date: sleepDate,
        durationMinutes: totalMinutes,
        quality,
      }
    })

    setSleepDate(new Date().toISOString().split('T')[0])
    setSleepHours('8')
    setSleepMinutes('0')
    setSleepQuality('3')
    setShowSleepForm(false)
    try {
      await reloadDomain('health' as any)
    } catch (e) {
      console.error('Failed to reload health domain after adding sleep:', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vitals entry?')) return
    
    try {
      await deleteData('health', id)
      await reloadDomain('health' as any)
    } catch (error) {
      console.error('Error during delete:', error)
      alert(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure': return '💗'
      case 'heart_rate': return '❤️'
      case 'weight': return '⚖️'
      case 'glucose': return '🩸'
      default: return '📊'
    }
  }

  const getEntryLabel = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'Blood Pressure'
      case 'heart_rate': return 'Heart Rate'
      case 'weight': return 'Weight'
      case 'glucose': return 'Glucose'
      default: return 'Vitals'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Vitals & Health</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowSleepForm(!showSleepForm)} variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Log Sleep
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Vitals
          </Button>
        </div>
      </div>

      {/* Time Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">View:</span>
          {TIME_FILTERS.map(filter => (
            <Button
              key={filter.value}
              variant={timeFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(filter.value)}
              className={cn(
                "transition-all",
                timeFilter === filter.value && "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Search and Additional Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="p-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-muted")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <Label className="text-sm mb-2 block">Type</Label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'blood_pressure', 'heart_rate', 'weight', 'glucose'].map(type => (
                    <Button
                      key={type}
                      variant={typeFilter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTypeFilter(type)}
                    >
                      {type === 'all' ? 'All' : getEntryLabel(type)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {filteredVitals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </Card>
          {summary.avgBP && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Avg Blood Pressure</p>
              <p className="text-2xl font-bold text-red-500">{summary.avgBP.systolic}/{summary.avgBP.diastolic}</p>
            </Card>
          )}
          {summary.avgHR && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
              <p className="text-2xl font-bold text-pink-500">{summary.avgHR} bpm</p>
            </Card>
          )}
          {summary.latestWeight && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Latest Weight</p>
              <p className="text-2xl font-bold text-green-500">{summary.latestWeight} lbs</p>
            </Card>
          )}
        </div>
      )}

      {/* Sleep Form */}
      {showSleepForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Log Sleep</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)} />
              </div>
              <div>
                <Label>Hours</Label>
                <Input type="number" min="0" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input type="number" min="0" max="59" value={sleepMinutes} onChange={(e) => setSleepMinutes(e.target.value)} />
              </div>
              <div>
                <Label>Quality (1-5)</Label>
                <Input type="number" min="1" max="5" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddSleep} className="bg-purple-600 hover:bg-purple-700">Save</Button>
              <Button variant="outline" onClick={() => setShowSleepForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Vitals Form */}
      {showAddForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Add Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Blood Pressure (Systolic/Diastolic)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="120"
                    min="0"
                    value={formData.bloodPressure?.systolic || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined
                      setFormData({
                        ...formData,
                        bloodPressure: val ? {
                          systolic: val,
                          diastolic: formData.bloodPressure?.diastolic || 0
                        } : undefined
                      })
                    }}
                  />
                  <span className="flex items-center">/</span>
                  <Input
                    type="number"
                    placeholder="80"
                    min="0"
                    value={formData.bloodPressure?.diastolic || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined
                      setFormData({
                        ...formData,
                        bloodPressure: val ? {
                          systolic: formData.bloodPressure?.systolic || 0,
                          diastolic: val
                        } : undefined
                      })
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  min="0"
                  value={formData.heartRate || ''}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  placeholder="165"
                  min="0"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Glucose (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="95"
                  value={formData.glucose || ''}
                  onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                Add Entry
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vitals Display */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Vital Entries</h3>
            <p className="text-sm text-muted-foreground">Quick access to delete recent entries</p>
          </div>
          
          {filteredVitals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery || timeFilter !== 'all' || typeFilter !== 'all' 
                ? 'No vitals match your filters. Try adjusting your search.'
                : 'No vitals recorded yet. Add your first entry!'}
            </p>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredVitals.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getEntryIcon(entry.type || 'vitals')}</span>
                    <div>
                      <p className="font-semibold text-white">
                        {entry.bloodPressure 
                          ? `Blood Pressure: ${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}`
                          : entry.heartRate 
                            ? `Heart Rate: ${entry.heartRate} bpm`
                            : entry.weight 
                              ? `Weight: ${entry.weight} lbs`
                              : entry.glucose 
                                ? `Blood Sugar: ${entry.glucose} mg/dL`
                                : 'Vitals Entry'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {entry.createdAt 
                          ? format(new Date(entry.createdAt), 'MMM d, yyyy - h:mm a')
                          : entry.date}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVitals.map((entry) => (
                <Card key={entry.id} className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{getEntryIcon(entry.type || 'vitals')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950 -mt-1 -mr-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="font-semibold text-white text-lg mb-1">
                      {entry.bloodPressure 
                        ? `${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}`
                        : entry.heartRate 
                          ? `${entry.heartRate} bpm`
                          : entry.weight 
                            ? `${entry.weight} lbs`
                            : entry.glucose 
                              ? `${entry.glucose} mg/dL`
                              : '-'}
                    </p>
                    <Badge variant="secondary" className="mb-2">
                      {getEntryLabel(entry.type || 'vitals')}
                    </Badge>
                    <p className="text-sm text-slate-400">
                      {entry.createdAt 
                        ? format(new Date(entry.createdAt), 'MMM d, yyyy')
                        : entry.date}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Table */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Sleep History</h3>
          {sleepEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sleep logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DATE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DURATION</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">QUALITY</th>
                  </tr>
                </thead>
                <tbody>
                  {sleepEntries.map((entry: any) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{String(entry.date)}</td>
                      <td className="p-3">{`${Math.floor(entry.minutes / 60)}h ${entry.minutes % 60}m`}</td>
                      <td className="p-3">{entry.quality || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
