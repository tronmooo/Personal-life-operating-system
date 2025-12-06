'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Plus, Trash2, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Application {
  id: string
  title: string
  type: string
  status: 'submitted' | 'under-review' | 'approved' | 'rejected' | 'pending-info'
  submittedDate: string
  lastUpdate: string
  notes?: string
  documents?: string[]
}

const STATUS_CONFIG = {
  'submitted': { label: 'Submitted', color: 'bg-blue-500', icon: FileText },
  'under-review': { label: 'Under Review', color: 'bg-yellow-500', icon: Clock },
  'approved': { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  'rejected': { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  'pending-info': { label: 'Pending Information', color: 'bg-orange-500', icon: Clock }
}

export function StatusTracker() {
  const [applications, setApplications] = useState<Application[]>([])
  const [newApplication, setNewApplication] = useState({
    title: '',
    type: 'job',
    status: 'submitted' as Application['status'],
    notes: ''
  })

  const addApplication = () => {
    if (!newApplication.title) return

    const application: Application = {
      id: Date.now().toString(),
      title: newApplication.title,
      type: newApplication.type,
      status: newApplication.status,
      submittedDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      notes: newApplication.notes,
      documents: []
    }

    setApplications([application, ...applications])
    setNewApplication({
      title: '',
      type: 'job',
      status: 'submitted',
      notes: ''
    })
  }

  const updateStatus = (id: string, status: Application['status']) => {
    setApplications(apps => apps.map(app => 
      app.id === id 
        ? { ...app, status, lastUpdate: new Date().toISOString() }
        : app
    ))
  }

  const removeApplication = (id: string) => {
    setApplications(apps => apps.filter(app => app.id !== id))
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            Application Status Tracker
          </CardTitle>
          <CardDescription>
            Track the status of job applications, loan requests, permits, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Application Title</Label>
              <Input 
                placeholder="e.g. Software Engineer at Google"
                value={newApplication.title}
                onChange={(e) => setNewApplication({ ...newApplication, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newApplication.type} onValueChange={(val) => setNewApplication({ ...newApplication, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job Application</SelectItem>
                    <SelectItem value="loan">Loan Application</SelectItem>
                    <SelectItem value="credit-card">Credit Card Application</SelectItem>
                    <SelectItem value="permit">Permit/License</SelectItem>
                    <SelectItem value="visa">Visa/Immigration</SelectItem>
                    <SelectItem value="college">College Application</SelectItem>
                    <SelectItem value="grant">Grant/Funding</SelectItem>
                    <SelectItem value="insurance">Insurance Claim</SelectItem>
                    <SelectItem value="benefits">Benefits Application</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select value={newApplication.status} onValueChange={(val) => setNewApplication({ ...newApplication, status: val as Application['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="pending-info">Pending Information</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Additional details, contact info, etc..."
                value={newApplication.notes}
                onChange={(e) => setNewApplication({ ...newApplication, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <Button onClick={addApplication} disabled={!newApplication.title} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </CardContent>
      </Card>

      {applications.length > 0 && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <div key={key} className="text-center">
                    <div className={`${config.color} text-white rounded-lg p-4 mb-2`}>
                      <p className="text-3xl font-bold">{statusCounts[key] || 0}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {applications.map((app) => {
              const StatusIcon = STATUS_CONFIG[app.status].icon
              return (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{app.title}</h4>
                          <Badge variant="outline">{app.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Submitted: {new Date(app.submittedDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Last updated: {new Date(app.lastUpdate).toLocaleDateString()}</span>
                        </div>
                        {app.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{app.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeApplication(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Update Status:</Label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                          const Icon = config.icon
                          return (
                            <Button
                              key={key}
                              variant={app.status === key ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateStatus(app.id, key as Application['status'])}
                              className={app.status === key ? config.color : ''}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {config.label}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {applications.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No applications tracked yet. Add your first application above!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}






