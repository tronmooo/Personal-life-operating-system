'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Book, Sparkles } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface JournalEntryDialogProps {
  open: boolean
  onClose: () => void
}

export function JournalEntryDialog({ open, onClose }: JournalEntryDialogProps) {
  const { addData } = useData()
  const [entry, setEntry] = useState('')
  const [title, setTitle] = useState('')

  const handleSave = () => {
    if (!entry.trim()) return

    const journalData = {
      id: `journal-${Date.now()}`,
      title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
      description: entry,
      type: 'journal-entry',
      metadata: {
        type: 'journal',
        logType: 'journal-entry',
        content: entry,
        wordCount: entry.split(/\s+/).length,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addData('mindfulness', journalData)
    
    setEntry('')
    setTitle('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            New Journal Entry
          </DialogTitle>
          <DialogDescription>
            Write about your day, thoughts, or feelings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Title (Optional)</Label>
            <input
              type="text"
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              placeholder="Give your entry a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Journal Entry</Label>
            <Textarea
              placeholder="What's on your mind?..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="min-h-[300px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {entry.split(/\s+/).filter(w => w).length} words
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!entry.trim()}>
            <Sparkles className="h-4 w-4 mr-2" />
            Save Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}






















