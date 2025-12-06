'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Activity, Heart, Droplet, Footprints, Moon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO } from 'date-fns'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Textarea } from '@/components/ui/textarea'

export function MetricsTab() {
  const { healthData, addHealthMetric, deleteHealthMetric } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedMetricType, setSelectedMetricType] = useState('weight')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // New metric form state
  const [newMetric, setNewMetric] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: 0,
    bodyFat: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    heartRate: 0,
    bloodGlucose: 0,
    sleepHours: 0,
    sleepQuality: 0,
    energyLevel: 0,
    mood: 0,
    waterIntake: 0,
    steps: 0,
    activeMinutes: 0,
    caloriesBurned: 0,
    notes: ''
  })

  const handleAddMetric = () => {
    addHealthMetric(newMetric)
    setAddDialogOpen(false)
    setNewMetric({
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: 0,
      bodyFat: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      heartRate: 0,
      bloodGlucose: 0,
      sleepHours: 0,
      sleepQuality: 0,
      energyLevel: 0,
      mood: 0,
      waterIntake: 0,
      steps: 0,
      activeMinutes: 0,
      caloriesBurned: 0,
      notes: ''
    })
  }

  const handleDeleteMetric = (id: string) => {
    deleteHealthMetric(id)
  }

  // Get recent data for charts
  const recentMetrics = healthData.metrics
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)
    .reverse()

  const weightData = recentMetrics.filter(m => m.weight).map(m => ({
    date: format(parseISO(m.date), 'MMM dd'),
    value: m.weight
  }))

  const bpData = recentMetrics.filter(m => m.bloodPressureSystolic).map(m => ({
    date: format(parseISO(m.date), 'MMM dd'),
    systolic: m.bloodPressureSystolic,
    diastolic: m.bloodPressureDiastolic
  }))

  const sleepData = recentMetrics.filter(m => m.sleepHours).map(m => ({
    date: format(parseISO(m.date), 'MMM dd'),
    hours: m.sleepHours,
    quality: m.sleepQuality || 0
  }))

  const stepsData = recentMetrics.filter(m => m.steps).map(m => ({
    date: format(parseISO(m.date), 'MMM dd'),
    steps: m.steps
  }))

  // Latest metrics
  const latestMetric = healthData.metrics[healthData.metrics.length - 1]

  return (
    <div className="space-y-6">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Metrics
        </Button>
      </div>

      {/* Today's Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Vitals</CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Weight</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.weight || '--'} <span className="text-sm font-normal">lbs</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Blood Pressure</span>
              </div>
              <p className="text-2xl font-bold">
                {latestMetric?.bloodPressureSystolic && latestMetric?.bloodPressureDiastolic
                  ? `${latestMetric.bloodPressureSystolic}/${latestMetric.bloodPressureDiastolic}`
                  : '--'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Heart Rate</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.heartRate || '--'} <span className="text-sm font-normal">bpm</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Moon className="h-4 w-4" />
                <span className="text-sm">Sleep</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.sleepHours || '--'} <span className="text-sm font-normal">hrs</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Footprints className="h-4 w-4" />
                <span className="text-sm">Steps</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.steps?.toLocaleString() || '--'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplet className="h-4 w-4" />
                <span className="text-sm">Water</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.waterIntake || '--'} <span className="text-sm font-normal">oz</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Active Time</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.activeMinutes || '--'} <span className="text-sm font-normal">min</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">😊 Mood</span>
              </div>
              <p className="text-2xl font-bold">{latestMetric?.mood || '--'}/10</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tracking Tabs */}
      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Weight Tab */}
        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight Tracking</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Weight (lbs)" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="text-xl font-bold">{weightData[weightData.length - 1]?.value} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Starting</p>
                      <p className="text-xl font-bold">{weightData[0]?.value} lbs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Change</p>
                      <p className="text-xl font-bold">
                        {((weightData[weightData.length - 1]?.value || 0) - (weightData[0]?.value || 0)).toFixed(1)} lbs
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No weight data recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blood Pressure Tab */}
        <TabsContent value="bp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {bpData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={bpData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[60, 160]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                      <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Latest Reading</p>
                      <p className="text-xl font-bold">
                        {bpData[bpData.length - 1]?.systolic}/{bpData[bpData.length - 1]?.diastolic} mmHg
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="text-xl font-bold text-green-600">Normal</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No blood pressure data recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sleep Tab */}
        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Analysis</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {sleepData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 12]} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#6366f1" name="Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Night</p>
                      <p className="text-xl font-bold">{sleepData[sleepData.length - 1]?.hours} hrs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg This Week</p>
                      <p className="text-xl font-bold">
                        {(sleepData.slice(-7).reduce((sum, d) => sum + (d.hours || 0), 0) / Math.min(7, sleepData.length)).toFixed(1)} hrs
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quality</p>
                      <p className="text-xl font-bold">
                        {sleepData[sleepData.length - 1]?.quality || 0}/10
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No sleep data recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Daily steps - Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {stepsData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stepsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="steps" fill="#10b981" name="Steps" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Today</p>
                      <p className="text-xl font-bold">{(stepsData[stepsData.length - 1]?.steps || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Daily Avg</p>
                      <p className="text-xl font-bold">
                        {Math.round(stepsData.reduce((sum, d) => sum + (d.steps || 0), 0) / stepsData.length).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Best Day</p>
                      <p className="text-xl font-bold">
                        {Math.max(...stepsData.map(d => d.steps || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No activity data recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* All Metrics List with Delete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            All Metrics History
            <Badge variant="secondary">{healthData.metrics.length} entries</Badge>
          </CardTitle>
          <CardDescription>View and manage all your health metric entries</CardDescription>
        </CardHeader>
        <CardContent>
          {healthData.metrics.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {healthData.metrics
                .sort((a: any, b: any) => new Date(b.recordedAt || b.date).getTime() - new Date(a.recordedAt || a.date).getTime())
                .map((metric: any) => {
                  const metricDate = metric.recordedAt || metric.date
                  const dateDisplay = metricDate ? format(parseISO(metricDate), 'MMM dd, yyyy h:mm a') : 'Unknown date'
                  
                  // Build metric display
                  const metricParts: string[] = []
                  if (metric.weight) metricParts.push(`Weight: ${metric.weight} lbs`)
                  if (metric.bloodPressureSystolic && metric.bloodPressureDiastolic) {
                    metricParts.push(`BP: ${metric.bloodPressureSystolic}/${metric.bloodPressureDiastolic} mmHg`)
                  }
                  if (metric.systolic && metric.diastolic) {
                    metricParts.push(`BP: ${metric.systolic}/${metric.diastolic} mmHg`)
                  }
                  if (metric.heartRate) metricParts.push(`HR: ${metric.heartRate} bpm`)
                  if (metric.value && metric.metricType === 'heart-rate') metricParts.push(`HR: ${metric.value} bpm`)
                  if (metric.value && metric.metricType === 'weight') metricParts.push(`Weight: ${metric.value} lbs`)
                  if (metric.bloodGlucose) metricParts.push(`Glucose: ${metric.bloodGlucose} mg/dL`)
                  if (metric.sleepHours) metricParts.push(`Sleep: ${metric.sleepHours} hrs`)
                  if (metric.steps) metricParts.push(`Steps: ${metric.steps.toLocaleString()}`)
                  if (metric.waterIntake) metricParts.push(`Water: ${metric.waterIntake} oz`)
                  if (metric.activeMinutes) metricParts.push(`Active: ${metric.activeMinutes} min`)
                  if (metric.mood) metricParts.push(`Mood: ${metric.mood}/10`)
                  
                  const metricDisplay = metricParts.length > 0 ? metricParts.join(' • ') : 'No data'
                  
                  return (
                    <div key={metric.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {dateDisplay}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">
                          {metricDisplay}
                        </div>
                        {metric.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {metric.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                        onClick={() => setDeleteConfirmId(metric.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No metrics recorded yet. Click "Log Metrics" to add your first entry.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Metric?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this health metric? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteMetric(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Metric Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Health Metrics</DialogTitle>
            <DialogDescription>
              Record your health measurements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newMetric.date}
                onChange={(e) => setNewMetric({ ...newMetric, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="172.5"
                  value={newMetric.weight || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat %</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  step="0.1"
                  placeholder="18.5"
                  value={newMetric.bodyFat || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, bodyFat: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic">Blood Pressure - Systolic</Label>
                <Input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  value={newMetric.bloodPressureSystolic || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, bloodPressureSystolic: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Blood Pressure - Diastolic</Label>
                <Input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  value={newMetric.bloodPressureDiastolic || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, bloodPressureDiastolic: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="70"
                  value={newMetric.heartRate || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, heartRate: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGlucose">Blood Glucose (mg/dL)</Label>
                <Input
                  id="bloodGlucose"
                  type="number"
                  placeholder="100"
                  value={newMetric.bloodGlucose || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, bloodGlucose: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleepHours">Sleep Hours</Label>
                <Input
                  id="sleepHours"
                  type="number"
                  step="0.5"
                  placeholder="7.5"
                  value={newMetric.sleepHours || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, sleepHours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleepQuality">Sleep Quality (1-10)</Label>
                <Input
                  id="sleepQuality"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="8"
                  value={newMetric.sleepQuality || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, sleepQuality: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="steps">Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  placeholder="10000"
                  value={newMetric.steps || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, steps: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activeMinutes">Active Minutes</Label>
                <Input
                  id="activeMinutes"
                  type="number"
                  placeholder="30"
                  value={newMetric.activeMinutes || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, activeMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waterIntake">Water Intake (oz)</Label>
                <Input
                  id="waterIntake"
                  type="number"
                  placeholder="64"
                  value={newMetric.waterIntake || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, waterIntake: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood (1-10)</Label>
                <Input
                  id="mood"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="7"
                  value={newMetric.mood || ''}
                  onChange={(e) => setNewMetric({ ...newMetric, mood: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={newMetric.notes}
                onChange={(e) => setNewMetric({ ...newMetric, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMetric}>
              Save Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

