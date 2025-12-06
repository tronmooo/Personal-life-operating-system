'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Routine, RoutineManager } from '@/lib/goals'
import { useRoutines } from '@/lib/hooks/use-routines'
import { Clock, Play, CheckCircle, Plus, Trash2, Sun, Moon, Zap, Loader2 } from 'lucide-react'

export function RoutinesManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { routines, loading, addRoutine, completeRoutine, deleteRoutine, updateRoutine } = useRoutines()
  const [showPresets, setShowPresets] = useState(false)

  const handleCompleteRoutine = async (id: string) => {
    await completeRoutine(id)
  }

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      await deleteRoutine(id)
    }
  }

  const handleAddPreset = async (preset: any) => {
    await addRoutine(preset)
    setShowPresets(false)
  }

  const handleToggleEnabled = async (id: string) => {
    const routine = routines.find(r => r.id === id)
    if (routine) {
      await updateRoutine(id, { enabled: !routine.enabled })
    }
  }

  const todaysRoutines = routines.filter(r => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as Routine['days'][0]
    return r.enabled && r.days.includes(today)
  })

  const morningRoutines = routines.filter(r => r.type === 'morning')
  const eveningRoutines = routines.filter(r => r.type === 'evening')
  const customRoutines = routines.filter(r => r.type === 'custom')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Clock className="h-6 w-6 text-primary" />
            Routine Builder
          </DialogTitle>
          <DialogDescription>
            Build and track your daily routines
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {todaysRoutines.length} routines scheduled for today
            </p>
          </div>
          <Button onClick={() => setShowPresets(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Presets
          </Button>
        </div>

        {/* Today's Routines */}
        {todaysRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Today's Routines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaysRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onComplete={handleCompleteRoutine}
                  onDelete={handleDeleteRoutine}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          </div>
        )}

        {/* Morning Routines */}
        {morningRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              Morning Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {morningRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onComplete={handleCompleteRoutine}
                  onDelete={handleDeleteRoutine}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          </div>
        )}

        {/* Evening Routines */}
        {eveningRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              Evening Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eveningRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onComplete={handleCompleteRoutine}
                  onDelete={handleDeleteRoutine}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Routines */}
        {customRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Custom Routines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onComplete={handleCompleteRoutine}
                  onDelete={handleDeleteRoutine}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading routines...</p>
          </div>
        )}

        {!loading && routines.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="mb-4">No routines yet. Start with a preset!</p>
            <Button onClick={() => setShowPresets(true)}>Browse Presets</Button>
          </div>
        )}

        {/* Presets Dialog */}
        {showPresets && (
          <Dialog open={showPresets} onOpenChange={setShowPresets}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Preset Routines</DialogTitle>
                <DialogDescription>Choose a proven routine to get started</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 mt-4">
                {RoutineManager.getPresetRoutines().map((preset: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{preset.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                        </div>
                        <Button onClick={() => handleAddPreset(preset)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>⏱️ {preset.estimatedDuration} min</span>
                        <span>📅 {preset.days.length} days/week</span>
                        <span>📝 {preset.steps.length} steps</span>
                      </div>
                      <div className="space-y-2">
                        {preset.steps.map((step: any, idx: number) => (
                          <div key={step.id} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            <span>{step.title}</span>
                            {step.duration && (
                              <Badge variant="outline" className="ml-auto">
                                {step.duration}m
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RoutineCard({
  routine,
  onComplete,
  onDelete,
  onToggleEnabled,
}: {
  routine: Routine
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string) => void
}) {
  const getTypeIcon = () => {
    switch (routine.type) {
      case 'morning':
        return <Sun className="h-5 w-5 text-yellow-500" />
      case 'evening':
        return <Moon className="h-5 w-5 text-indigo-500" />
      default:
        return <Zap className="h-5 w-5 text-purple-500" />
    }
  }

  return (
    <Card className={routine.enabled ? '' : 'opacity-50'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <div>
              <CardTitle className="text-base">{routine.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{routine.description}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleEnabled(routine.id)}
            >
              {routine.enabled ? '✓' : '○'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(routine.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span>⏱️ {routine.estimatedDuration} min</span>
          <span>🔄 {routine.completionCount} times</span>
        </div>

        <div className="space-y-2 mb-3">
          {routine.steps.slice(0, 3).map((step: any, idx: number) => (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{idx + 1}.</span>
              <span className="flex-1">{step.title}</span>
              {step.duration && (
                <span className="text-xs text-muted-foreground">{step.duration}m</span>
              )}
            </div>
          ))}
          {routine.steps.length > 3 && (
            <p className="text-xs text-muted-foreground pl-5">
              +{routine.steps.length - 3} more steps
            </p>
          )}
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => onComplete(routine.id)}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Routine
        </Button>
      </CardContent>
    </Card>
  )
}

