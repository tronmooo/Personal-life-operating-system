'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  AlertTriangle, CheckCircle, Target, Heart, DollarSign, Shield, 
  TrendingUp, Zap, Plus, Book, Activity, FileText
} from 'lucide-react'
import { AddDataDialog } from '../add-data-dialog'

export function CommandCenter() {
  const { data } = useData()
  const [addDataOpen, setAddDataOpen] = useState(false)

  // Calculate stats
  const domains = Object.keys(data)
  const stats = {
    activeDomains: domains.length,
    totalItems: Object.values(data).reduce((total, domainData) => total + domainData.length, 0),
    addedToday: Object.values(data).reduce((total, domainData) => {
      const today = new Date().toDateString()
      return total + domainData.filter(item => new Date(item.createdAt).toDateString() === today).length
    }, 0),
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Priority-focused life overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {stats.activeDomains} domains active
          </Badge>
          <Button onClick={() => setAddDataOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </div>
      </div>

      {/* Top Row - Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Alerts Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alerts
              </div>
              <Badge variant="destructive" className="text-xs">3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span className="text-xs">Car Insurance Exp...</span>
                </div>
                <Badge variant="outline" className="text-xs text-red-600">3d left</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span className="text-xs">Doctor Appointment</span>
                </div>
                <Badge variant="outline" className="text-xs text-red-600">2d left</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tasks
              </div>
              <Badge variant="secondary" className="text-xs">2</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-xs">Review budget</span>
                <span className="text-xs text-muted-foreground ml-auto">10:00 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked className="rounded" />
                <span className="text-xs line-through text-muted-foreground">Team meeting prep</span>
                <span className="text-xs text-muted-foreground ml-auto">2:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-xs">Grocery shopping</span>
                <span className="text-xs text-muted-foreground ml-auto">6:00 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Habits
              </div>
              <Badge variant="secondary" className="text-xs">1/3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-xs">Morning workout</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-xs">Read 30 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">Meditation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-pink-500" />
              Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">M T W T F S S</div>
              <div className="grid grid-cols-7 gap-1 text-lg">
                <span>😢</span><span>😐</span><span>😐</span><span>😐</span><span>😊</span><span>😊</span><span>😊</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-lg">
                <span>😊</span><span>😊</span><span>😊</span><span>😊</span><span>😊</span><span>😊</span><span>😊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Health
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">87%</div>
                <div className="text-xs text-muted-foreground">156 items</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Steps</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">8.9K</div>
                <div className="text-xs text-green-600">+12%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Heart Rate</span>
                  <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="text-lg font-bold">72 BPM</div>
                <div className="text-xs text-gray-500">stable</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sleep</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">7.2h</div>
                <div className="text-xs text-green-600">+5%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weight</span>
                  <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                </div>
                <div className="text-lg font-bold">165.2 lbs</div>
                <div className="text-xs text-red-600">-2%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Finance
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">92%</div>
                <div className="text-xs text-muted-foreground">89 items</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">$12.4K</div>
                <div className="text-xs text-green-600">+8%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Income</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">$5.6K</div>
                <div className="text-xs text-green-600">+15%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expenses</span>
                  <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                </div>
                <div className="text-lg font-bold">$3.7K</div>
                <div className="text-xs text-red-600">-3%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Savings</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">$1.9K</div>
                <div className="text-xs text-green-600">+22%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Career
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">78%</div>
                <div className="text-xs text-muted-foreground">67 items</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Projects</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">12</div>
                <div className="text-xs text-green-600">+20%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skills</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">87%</div>
                <div className="text-xs text-green-600">+5%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Goals</span>
                  <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="text-lg font-bold">8/10</div>
                <div className="text-xs text-gray-500">stable</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-lg font-bold">234</div>
                <div className="text-xs text-green-600">+12%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Fast access to common tasks and data entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => setAddDataOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs">Log Health</span>
            </Button>
            <Button 
              onClick={() => setAddDataOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs">Add Expense</span>
            </Button>
            <Button 
              onClick={() => setAddDataOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Set Goal</span>
            </Button>
            <Button 
              onClick={() => setAddDataOpen(true)}
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-1"
            >
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-xs">Add Note</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Data Dialog */}
      <AddDataDialog open={addDataOpen} onClose={() => setAddDataOpen(false)} />
    </div>
  )
}
