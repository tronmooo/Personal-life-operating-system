'use client'

import { useState } from 'react'
import { CallTaskComposer } from '@/components/personal-assistant/call-task-composer'
import { CallTaskList } from '@/components/personal-assistant/call-task-list'
import { CallTaskDetail } from '@/components/personal-assistant/call-task-detail'
import { CallSessionDetail } from '@/components/personal-assistant/call-session-detail'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, List, Plus } from 'lucide-react'

type View = 'list' | 'detail' | 'session' | 'create'

export default function PersonalAssistantPage() {
  const [view, setView] = useState<View>('list')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTaskClick = (task: any) => {
    setSelectedTaskId(task.id)
    setView('detail')
  }

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setView('session')
  }

  const handleTaskCreated = (task: any) => {
    setRefreshKey(prev => prev + 1)
    setSelectedTaskId(task.id)
    setView('detail')
  }

  const handleBack = () => {
    setView('list')
    setSelectedTaskId(null)
    setSelectedSessionId(null)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Phone className="h-8 w-8" />
          Personal AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Your AI-powered calling assistant that makes phone calls on your behalf
        </p>
      </div>

      {/* Main Content */}
      {view === 'list' && (
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <CallTaskList 
              key={refreshKey}
              onTaskClick={handleTaskClick}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <CallTaskComposer onTaskCreated={handleTaskCreated} />
          </TabsContent>
        </Tabs>
      )}

      {view === 'detail' && selectedTaskId && (
        <CallTaskDetail 
          taskId={selectedTaskId}
          onSessionClick={handleSessionClick}
          onBack={handleBack}
        />
      )}

      {view === 'session' && selectedSessionId && (
        <CallSessionDetail 
          sessionId={selectedSessionId}
          onBack={() => {
            setView('detail')
            setSelectedSessionId(null)
          }}
        />
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
          <CardDescription>
            Your personal AI calling assistant automates phone calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Tell the AI what you need in natural language</li>
            <li>The AI plans the call and asks clarifying questions if needed</li>
            <li>Click "Start Call" when ready and the AI makes the phone call</li>
            <li>The AI handles the entire conversation professionally</li>
            <li>View the transcript and extracted data (prices, appointments, etc.)</li>
            <li>Get notified when tasks are complete or need your attention</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
























