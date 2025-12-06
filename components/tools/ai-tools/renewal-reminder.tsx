'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCcw, Plus, Trash2, Bell, Calendar, AlertTriangle } from 'lucide-react'

interface Renewal {
  id: string
  name: string
  type: string
  renewalDate: string
  cost?: number
  autoRenew: boolean
  reminderDays: number
  daysUntil: number
  notes?: string
}

export function RenewalReminder() {
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [newRenewal, setNewRenewal] = useState({
    name: '',
    type: 'subscription',
    renewalDate: '',
    cost: '',
    autoRenew: true,
    reminderDays: 7,
    notes: ''
  })

  useEffect(() => {
    // Calculate days until renewal
    const updated = renewals.map(r => ({
      ...r,
      daysUntil: Math.ceil((new Date(r.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    setRenewals(updated)
  }, [])

  const addRenewal = () => {
    if (!newRenewal.name || !newRenewal.renewalDate) return

    const daysUntil = Math.ceil((new Date(newRenewal.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const renewal: Renewal = {
      id: Date.now().toString(),
      name: newRenewal.name,
      type: newRenewal.type,
      renewalDate: newRenewal.renewalDate,
      cost: newRenewal.cost ? parseFloat(newRenewal.cost) : undefined,
      autoRenew: newRenewal.autoRenew,
      reminderDays: newRenewal.reminderDays,
      daysUntil,
      notes: newRenewal.notes
    }

    setRenewals([...renewals, renewal].sort((a, b) => a.daysUntil - b.daysUntil))
    setNewRenewal({
      name: '',
      type: 'subscription',
      renewalDate: '',
      cost: '',
      autoRenew: true,
      reminderDays: 7,
      notes: ''
    })
  }

  const removeRenewal = (id: string) => {
    setRenewals(renewals.filter(r => r.id !== id))
  }

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'bg-gray-500'
    if (daysUntil <= 7) return 'bg-red-500'
    if (daysUntil <= 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const upcomingRenewals = renewals.filter(r => r.daysUntil >= 0)
  const pastRenewals = renewals.filter(r => r.daysUntil < 0)

  const totalAnnualCost = renewals
    .filter(r => r.daysUntil >= 0 && r.cost)
    .reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="h-6 w-6 text-blue-500" />
            Renewal Reminder System
          </CardTitle>
          <CardDescription>
            Track licenses, subscriptions, warranties, and other renewals in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input 
                  placeholder="e.g. Netflix Subscription"
                  value={newRenewal.name}
                  onChange={(e) => setNewRenewal({ ...newRenewal, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newRenewal.type} onValueChange={(val) => setNewRenewal({ ...newRenewal, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="domain">Domain Registration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Renewal Date</Label>
                <Input 
                  type="date"
                  value={newRenewal.renewalDate}
                  onChange={(e) => setNewRenewal({ ...newRenewal, renewalDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Cost (Optional)</Label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={newRenewal.cost}
                  onChange={(e) => setNewRenewal({ ...newRenewal, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input 
                placeholder="Additional details..."
                value={newRenewal.notes}
                onChange={(e) => setNewRenewal({ ...newRenewal, notes: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addRenewal} disabled={!newRenewal.name || !newRenewal.renewalDate} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Renewal
          </Button>
        </CardContent>
      </Card>

      {totalAnnualCost > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Annual Renewal Cost</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${totalAnnualCost.toLocaleString()}
                </p>
              </div>
              <RefreshCcw className="h-12 w-12 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingRenewals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Upcoming Renewals</h3>
          {upcomingRenewals.map((renewal) => (
            <Card key={renewal.id} className={`border-l-4 ${
              renewal.daysUntil <= 7 ? 'border-l-red-500' :
              renewal.daysUntil <= 30 ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{renewal.name}</h4>
                      <Badge variant="outline">{renewal.type}</Badge>
                      {renewal.autoRenew && (
                        <Badge variant="secondary">Auto-Renew</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(renewal.renewalDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bell className="h-4 w-4" />
                        {renewal.daysUntil === 0 ? 'Today!' : 
                         renewal.daysUntil === 1 ? 'Tomorrow' :
                         `${renewal.daysUntil} days`}
                      </div>
                      {renewal.cost && (
                        <div className="font-semibold text-foreground">
                          ${renewal.cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {renewal.notes && (
                      <p className="text-sm text-muted-foreground">{renewal.notes}</p>
                    )}

                    {renewal.daysUntil <= renewal.reminderDays && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Renewal reminder!</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRenewal(renewal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pastRenewals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Past Due</h3>
          {pastRenewals.map((renewal) => (
            <Card key={renewal.id} className="opacity-50 border-red-300">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{renewal.name}</h4>
                    <p className="text-sm text-red-600 font-semibold">
                      {Math.abs(renewal.daysUntil)} days overdue
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRenewal(renewal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {renewals.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <RefreshCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No renewals tracked yet. Add your first renewal above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}






