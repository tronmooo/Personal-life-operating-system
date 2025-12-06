'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MindfulnessJournal } from './mindfulness/mindfulness-journal'
import { BreathingExercises } from './mindfulness/breathing-exercises'
import { BookOpen, Wind, Activity } from 'lucide-react'
import { DomainQuickLog } from './domain-quick-log'

interface MindfulnessLogWrapperProps {
  domainId: string
}

export function MindfulnessLogWrapper({ domainId }: MindfulnessLogWrapperProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="journal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="breathing" className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Breathing Exercises
          </TabsTrigger>
          <TabsTrigger value="quick-log" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Other Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <MindfulnessJournal />
        </TabsContent>

        <TabsContent value="breathing" className="mt-6">
          <BreathingExercises />
        </TabsContent>

        <TabsContent value="quick-log" className="mt-6">
          <DomainQuickLog domainId={domainId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}







