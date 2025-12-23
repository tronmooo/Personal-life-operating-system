'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AIConciergeInterface } from '@/components/ai-concierge-interface'

interface AIConciergePopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIConciergePopup({ open, onOpenChange }: AIConciergePopupProps) {
  // #region agent log
  useEffect(() => {
    if (open) {
      console.log('🔍 [DEBUG-POPUP] AI Concierge popup OPENED');
    }
  }, [open]);
  // #endregion
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-[98vw] sm:w-[95vw] h-[95vh] sm:h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0f1729] border border-purple-500/30 rounded-xl"
        aria-describedby="ai-concierge-description"
      >
        <span id="ai-concierge-description" className="sr-only">AI Concierge assistant for making calls and managing tasks</span>
        <AIConciergeInterface />
      </DialogContent>
    </Dialog>
  )
}
