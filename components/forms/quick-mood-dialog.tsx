'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { useMoods } from '@/lib/hooks/use-moods'

interface QuickMoodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickMoodDialog({ open, onOpenChange }: QuickMoodDialogProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const { add } = useMoods()

  const moodOptions = [
    { value: 1, label: '😢 Very Bad', emoji: '😢', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
    { value: 2, label: '😕 Bad', emoji: '😕', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
    { value: 3, label: '😐 Okay', emoji: '😐', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
    { value: 4, label: '😊 Good', emoji: '😊', color: 'bg-lime-100 hover:bg-lime-200 border-lime-300' },
    { value: 5, label: '😄 Great', emoji: '😄', color: 'bg-green-100 hover:bg-green-200 border-green-300' }
  ]

  const handleMoodSelect = async (moodValue: number) => {
    setSelectedMood(moodValue)
    const moodOption = moodOptions.find(m => m.value === moodValue)

    await add({
      logged_at: new Date().toISOString(),
      score: moodValue,
      note: `Mood logged: ${moodOption?.emoji} ${moodOption?.label} (${format(new Date(), 'yyyy-MM-dd')})`,
      tags: ['mood']
    })

    setTimeout(() => {
      onOpenChange(false)
      setSelectedMood(null)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            😊 How are you feeling?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Select your current mood (1-5)
          </p>

          <div className="grid grid-cols-1 gap-3">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant="outline"
                size="lg"
                className={`${mood.color} transition-all ${
                  selectedMood === mood.value ? 'ring-2 ring-offset-2' : ''
                }`}
                onClick={() => handleMoodSelect(mood.value)}
              >
                <span className="text-3xl mr-3">{mood.emoji}</span>
                <span className="text-lg font-medium">{mood.label}</span>
              </Button>
            ))}
          </div>

          {selectedMood && (
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Mood logged successfully!
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
