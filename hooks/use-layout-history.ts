/**
 * Undo/Redo Hook for Dashboard Layouts
 * Tracks layout history and provides undo/redo functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/lib/types/dashboard-layout-types'

interface HistoryState {
  past: DashboardLayout[]
  present: DashboardLayout | null
  future: DashboardLayout[]
}

interface HistoryEntry {
  layout: DashboardLayout
  timestamp: Date
  action: string
}

const MAX_HISTORY = 20
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function useLayoutHistory(initialLayout: DashboardLayout | null, onSave?: (layout: DashboardLayout) => void) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialLayout,
    future: [],
  })

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const hasUnsavedChangesRef = useRef(false)

  // Initialize with current layout
  useEffect(() => {
    if (initialLayout && !history.present) {
      setHistory({
        past: [],
        present: initialLayout,
        future: [],
      })
    }
  }, [initialLayout])

  // Auto-save timer
  useEffect(() => {
    if (onSave && history.present) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        if (hasUnsavedChangesRef.current) {
          console.log('🔄 Auto-saving layout...')
          onSave(history.present!)
          hasUnsavedChangesRef.current = false
        }
      }, AUTO_SAVE_INTERVAL)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [history.present, onSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redo()
      }

      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (onSave && history.present) {
          onSave(history.present)
          hasUnsavedChangesRef.current = false
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history, onSave])

  /**
   * Update layout and add to history
   */
  const updateLayout = useCallback((newLayout: DashboardLayout, action: string = 'Update layout') => {
    setHistory(prev => {
      if (!prev.present) return prev

      // Limit history size
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY)

      return {
        past: newPast,
        present: newLayout,
        future: [], // Clear future when making new changes
      }
    })

    // Add to history entries
    setHistoryEntries(prev => {
      const newEntry: HistoryEntry = {
        layout: newLayout,
        timestamp: new Date(),
        action,
      }
      return [newEntry, ...prev].slice(0, MAX_HISTORY)
    })

    hasUnsavedChangesRef.current = true
  }, [])

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) {
        console.log('⚠️ Nothing to undo')
        return prev
      }

      const newPast = [...prev.past]
      const newPresent = newPast.pop()!
      const newFuture = prev.present ? [prev.present, ...prev.future] : prev.future

      console.log('↶ Undo')
      hasUnsavedChangesRef.current = true

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      }
    })
  }, [])

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) {
        console.log('⚠️ Nothing to redo')
        return prev
      }

      const newFuture = [...prev.future]
      const newPresent = newFuture.shift()!
      const newPast = prev.present ? [...prev.past, prev.present] : prev.past

      console.log('↷ Redo')
      hasUnsavedChangesRef.current = true

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      }
    })
  }, [])

  /**
   * Jump to specific history point
   */
  const jumpToHistory = useCallback((index: number) => {
    const entry = historyEntries[index]
    if (!entry) return

    setHistory(prev => ({
      past: prev.present ? [...prev.past, prev.present] : prev.past,
      present: entry.layout,
      future: [],
    }))

    hasUnsavedChangesRef.current = true
  }, [historyEntries])

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }))
    setHistoryEntries([])
    hasUnsavedChangesRef.current = false
  }, [])

  /**
   * Save current state
   */
  const save = useCallback(() => {
    if (onSave && history.present) {
      onSave(history.present)
      hasUnsavedChangesRef.current = false
    }
  }, [onSave, history.present])

  return {
    layout: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    hasUnsavedChanges: hasUnsavedChangesRef.current,
    historyEntries,
    updateLayout,
    undo,
    redo,
    jumpToHistory,
    clearHistory,
    save,
  }
}


























