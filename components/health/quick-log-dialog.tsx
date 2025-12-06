/**
 * Quick Log Dialog
 * Fast entry for daily health tracking
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Activity, Heart, Droplet, Weight, Moon, Smile, AlertCircle, Loader2 } from 'lucide-react'

interface QuickLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickLogDialog({ open, onOpenChange }: QuickLogDialogProps) {
  const { create } = useDomainCRUD('health')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('weight')

  // Form states
  const [weight, setWeight] = useState('')
  const [bpSystolic, setBpSystolic] = useState('')
  const [bpDiastolic, setBpDiastolic] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [glucose, setGlucose] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [mood, setMood] = useState('')
  const [notes, setNotes] = useState('')
  const [dateTime, setDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  )

  async function handleSave() {
    try {
      setSaving(true)
      
      const baseData = {
        domain: 'health',
      }

      if (activeTab === 'weight' && weight) {
        await create({
          ...baseData,
          title: `Weight: ${weight} lbs`,
          metadata: {
            logType: 'weight',
            weight: parseFloat(weight),
            notes,
          },
        })
      } else if (activeTab === 'bp' && bpSystolic && bpDiastolic) {
        await create({
          ...baseData,
          title: `Blood Pressure: ${bpSystolic}/${bpDiastolic}`,
          metadata: {
            logType: 'blood_pressure',
            systolic: parseInt(bpSystolic),
            diastolic: parseInt(bpDiastolic),
            notes,
          },
        })
      } else if (activeTab === 'hr' && heartRate) {
        await create({
          ...baseData,
          title: `Heart Rate: ${heartRate} bpm`,
          metadata: {
            logType: 'heart_rate',
            heartRate: parseInt(heartRate),
            bpm: parseInt(heartRate),
            notes,
          },
        })
      } else if (activeTab === 'glucose' && glucose) {
        await create({
          ...baseData,
          title: `Blood Sugar: ${glucose} mg/dL`,
          metadata: {
            logType: 'glucose',
            glucose: parseInt(glucose),
            notes,
          },
        })
      } else if (activeTab === 'sleep' && sleepHours) {
        await create({
          ...baseData,
          title: `Sleep: ${sleepHours} hours`,
          metadata: {
            logType: 'sleep',
            sleepHours: parseFloat(sleepHours),
            sleepQuality: 'Good',
            notes,
          },
        })
      }

      // Reset form
      setWeight('')
      setBpSystolic('')
      setBpDiastolic('')
      setHeartRate('')
      setGlucose('')
      setSleepHours('')
      setMood('')
      setNotes('')
      setDateTime(new Date().toISOString().slice(0, 16))
      
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Log</DialogTitle>
          <DialogDescription>Fast entry for daily health tracking</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="weight" className="flex flex-col py-3">
              <Weight className="w-4 h-4 mb-1" />
              <span className="text-xs">Weight</span>
            </TabsTrigger>
            <TabsTrigger value="bp" className="flex flex-col py-3">
              <Activity className="w-4 h-4 mb-1" />
              <span className="text-xs">BP</span>
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex flex-col py-3">
              <Heart className="w-4 h-4 mb-1" />
              <span className="text-xs">HR</span>
            </TabsTrigger>
            <TabsTrigger value="glucose" className="flex flex-col py-3">
              <Droplet className="w-4 h-4 mb-1" />
              <span className="text-xs">Glucose</span>
            </TabsTrigger>
            <TabsTrigger value="sleep" className="flex flex-col py-3">
              <Moon className="w-4 h-4 mb-1" />
              <span className="text-xs">Sleep</span>
            </TabsTrigger>
          </TabsList>

          {/* Weight */}
          <TabsContent value="weight" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  placeholder="165"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 text-lg"
                />
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <span className="text-sm font-medium">lbs</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Blood Pressure */}
          <TabsContent value="bp" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic</Label>
                <Input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Diastolic</Label>
                <Input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
          </TabsContent>

          {/* Heart Rate */}
          <TabsContent value="hr" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hr">Heart Rate</Label>
              <div className="flex gap-2">
                <Input
                  id="hr"
                  type="number"
                  placeholder="72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="flex-1 text-lg"
                />
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <span className="text-sm font-medium">bpm</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Blood Glucose */}
          <TabsContent value="glucose" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="glucose">Blood Sugar</Label>
              <div className="flex gap-2">
                <Input
                  id="glucose"
                  type="number"
                  placeholder="95"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="flex-1 text-lg"
                />
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <span className="text-sm font-medium">mg/dL</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sleep */}
          <TabsContent value="sleep" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sleep">Sleep Duration</Label>
              <div className="flex gap-2">
                <Input
                  id="sleep"
                  type="number"
                  step="0.5"
                  placeholder="7.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="flex-1 text-lg"
                />
                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <span className="text-sm font-medium">hours</span>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Common Fields */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="datetime">Date & Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Entry</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

