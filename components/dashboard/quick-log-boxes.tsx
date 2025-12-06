'use client'

import { Button } from '@/components/ui/button'
import { Heart, Book, Activity, Target } from 'lucide-react'

interface QuickLogBoxesProps {
  onAddData: () => void
}

export function QuickLogBoxes({ onAddData }: QuickLogBoxesProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button 
        onClick={onAddData}
        variant="outline" 
        size="sm" 
        className="h-16 flex flex-col items-center justify-center gap-1"
      >
        <Heart className="h-4 w-4 text-red-500" />
        <span className="text-xs">Vitals</span>
      </Button>
      <Button 
        onClick={onAddData}
        variant="outline" 
        size="sm" 
        className="h-16 flex flex-col items-center justify-center gap-1"
      >
        <Book className="h-4 w-4 text-green-500" />
        <span className="text-xs">Nutrition</span>
      </Button>
      <Button 
        onClick={onAddData}
        variant="outline" 
        size="sm" 
        className="h-16 flex flex-col items-center justify-center gap-1"
      >
        <Activity className="h-4 w-4 text-blue-500" />
        <span className="text-xs">Workout</span>
      </Button>
      <Button 
        onClick={onAddData}
        variant="outline" 
        size="sm" 
        className="h-16 flex flex-col items-center justify-center gap-1"
      >
        <Target className="h-4 w-4 text-purple-500" />
        <span className="text-xs">Health</span>
      </Button>
    </div>
  )
}
