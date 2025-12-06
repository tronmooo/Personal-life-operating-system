'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare, Calendar, DollarSign, FileText, Target, Camera, Zap } from 'lucide-react'

interface QuickAddButtonProps {
  onAddTask: () => void
  onAddHabit: () => void
  onAddBill: () => void
  onAddEvent: () => void
  onAddDocument: () => void
  onScanDocument: () => void
}

export function QuickAddButton({
  onAddTask,
  onAddHabit,
  onAddBill,
  onAddEvent,
  onAddDocument,
  onScanDocument,
}: QuickAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const quickActions = [
    {
      icon: CheckSquare,
      label: 'Add Task',
      description: 'Create a new to-do item',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      onClick: () => {
        onAddTask()
        setIsOpen(false)
      },
    },
    {
      icon: Target,
      label: 'Add Habit',
      description: 'Track a new daily habit',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      onClick: () => {
        onAddHabit()
        setIsOpen(false)
      },
    },
    {
      icon: DollarSign,
      label: 'Add Bill',
      description: 'Record a bill payment',
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
      onClick: () => {
        onAddBill()
        setIsOpen(false)
      },
    },
    {
      icon: Calendar,
      label: 'Add Event',
      description: 'Schedule a new event',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      onClick: () => {
        onAddEvent()
        setIsOpen(false)
      },
    },
    {
      icon: FileText,
      label: 'Add Document',
      description: 'Add a document reference',
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
      onClick: () => {
        onAddDocument()
        setIsOpen(false)
      },
    },
    {
      icon: Camera,
      label: 'Scan Document',
      description: 'Use OCR to scan a document',
      color: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
      onClick: () => {
        onScanDocument()
        setIsOpen(false)
      },
    },
  ]

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 active:scale-95 group"
        aria-label="Quick Add"
      >
        <Plus className="h-8 w-8 mx-auto transition-transform group-hover:rotate-90" />
      </button>

      {/* Quick Add Menu Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Add
            </DialogTitle>
            <DialogDescription>
              Choose what you'd like to add to your life hub
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`flex flex-col items-start p-4 rounded-lg border-2 border-transparent ${action.color} transition-all hover:border-current hover:shadow-lg group`}
                >
                  <Icon className="h-8 w-8 mb-3 transition-transform group-hover:scale-110" />
                  <h3 className="font-semibold text-lg mb-1">{action.label}</h3>
                  <p className="text-sm opacity-75">{action.description}</p>
                </button>
              )
            })}
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                Cmd
              </kbd>
              {' + '}
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                N
              </kbd>
              {' '}
              to open Quick Add anywhere
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}








