'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Undo2, Redo2, Save, History, Clock, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface HistoryEntry {
  layout: any
  timestamp: Date
  action: string
}

interface LayoutHistoryProps {
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean
  historyEntries: HistoryEntry[]
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onJumpToHistory: (index: number) => void
  onClearHistory: () => void
}

export function LayoutHistory({
  canUndo,
  canRedo,
  hasUnsavedChanges,
  historyEntries,
  onUndo,
  onRedo,
  onSave,
  onJumpToHistory,
  onClearHistory,
}: LayoutHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600" />
          Layout History
        </CardTitle>
        <CardDescription>Undo, redo, or restore previous versions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px]"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
            <span className="ml-1 text-xs text-gray-500">(⌘Z)</span>
          </Button>

          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px]"
          >
            <Redo2 className="h-4 w-4 mr-2" />
            Redo
            <span className="ml-1 text-xs text-gray-500">(⌘Y)</span>
          </Button>

          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            size="sm"
            className={`flex-1 min-w-[120px] ${
              hasUnsavedChanges
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
            {hasUnsavedChanges && <span className="ml-1">*</span>}
          </Button>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
              ⚠️ You have unsaved changes
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Changes are auto-saved every 30 seconds, or press ⌘S to save manually
            </p>
          </div>
        )}

        {/* History Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">History Timeline</h4>
            {historyEntries.length > 0 && (
              <Button
                onClick={onClearHistory}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {historyEntries.length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No history yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Make changes to start tracking history
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {historyEntries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() => onJumpToHistory(index)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      {entry.layout?.layout_config?.cards?.filter((c: any) => c.visible).length || 0} cards
                    </span>
                    <span>•</span>
                    <span>
                      {entry.layout?.layout_name || 'Unnamed'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            ⌨️ Keyboard Shortcuts
          </p>
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex justify-between">
              <span>Undo</span>
              <kbd className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">⌘Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <kbd className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">⌘Y</kbd>
            </div>
            <div className="flex justify-between">
              <span>Save</span>
              <kbd className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">⌘S</kbd>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-2xl font-bold text-purple-600">{historyEntries.length}</p>
            <p className="text-xs text-gray-500">History Points</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-2xl font-bold text-blue-600">{canUndo ? '✓' : '✗'}</p>
            <p className="text-xs text-gray-500">Can Undo</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-2xl font-bold text-green-600">{canRedo ? '✓' : '✗'}</p>
            <p className="text-xs text-gray-500">Can Redo</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


























