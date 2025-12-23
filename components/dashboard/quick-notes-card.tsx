'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Lightbulb, 
  List, 
  Plus, 
  Trash2, 
  Check,
  StickyNote,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuickNotes, type QuickNoteType, type ListItem } from '@/lib/hooks/use-quick-notes'

type TabType = 'note' | 'idea' | 'list'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ReactNode
  activeColor: string
  buttonColor: string
  borderColor: string
  bgColor: string
}

const TABS: TabConfig[] = [
  {
    id: 'note',
    label: 'Note',
    icon: <FileText className="h-4 w-4" />,
    activeColor: 'bg-blue-500',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'idea',
    label: 'Idea',
    icon: <Lightbulb className="h-4 w-4" />,
    activeColor: 'bg-amber-500',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10'
  },
  {
    id: 'list',
    label: 'List',
    icon: <List className="h-4 w-4" />,
    activeColor: 'bg-emerald-500',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-600',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10'
  }
]

export function QuickNotesCard() {
  const [activeTab, setActiveTab] = useState<TabType>('note')
  const [noteContent, setNoteContent] = useState('')
  const [ideaContent, setIdeaContent] = useState('')
  const [listTitle, setListTitle] = useState('')
  const [listItems, setListItems] = useState<ListItem[]>([{ text: '', completed: false }])
  const [newItemText, setNewItemText] = useState('')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { 
    notes, 
    count,
    loading, 
    create, 
    remove,
    update,
    isAuthenticated 
  } = useQuickNotes()

  const activeConfig = TABS.find(t => t.id === activeTab)!

  // Handle saving based on tab type
  const handleSave = async () => {
    switch (activeTab) {
      case 'note':
        if (!noteContent.trim()) return
        await create({ type: 'note', content: noteContent.trim() })
        setNoteContent('')
        break
      case 'idea':
        if (!ideaContent.trim()) return
        await create({ type: 'idea', content: ideaContent.trim() })
        setIdeaContent('')
        break
      case 'list':
        const validItems = listItems.filter(item => item.text.trim())
        if (validItems.length === 0 && !listTitle.trim()) return
        await create({ 
          type: 'list', 
          title: listTitle.trim() || 'Untitled List',
          items: validItems.length > 0 ? validItems : [{ text: 'Item 1', completed: false }]
        })
        setListTitle('')
        setListItems([{ text: '', completed: false }])
        break
    }
  }

  // Add item to the list being created
  const handleAddItem = () => {
    setListItems([...listItems, { text: '', completed: false }])
    // Focus on the new input after render
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  // Update item text
  const handleItemChange = (index: number, text: string) => {
    const updated = [...listItems]
    updated[index] = { ...updated[index], text }
    setListItems(updated)
  }

  // Remove item from list
  const handleRemoveItem = (index: number) => {
    if (listItems.length > 1) {
      setListItems(listItems.filter((_, i) => i !== index))
    }
  }

  // Delete a saved note
  const handleDelete = async (id: string) => {
    await remove(id, true)
  }

  // Toggle expand/collapse for a list
  const toggleExpanded = (id: string) => {
    setExpandedListId(expandedListId === id ? null : id)
  }

  // Toggle completion of a list item
  const handleToggleListItem = async (noteId: string, itemIndex: number) => {
    const note = notes.find(n => n.id === noteId)
    if (!note || note.type !== 'list' || !note.items) return
    
    const updatedItems = note.items.map((item, idx) => 
      idx === itemIndex ? { ...item, completed: !item.completed } : item
    )
    
    await update(noteId, { items: updatedItems })
  }

  return (
    <Card className="bg-slate-900/95 border-slate-700/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500">
            <StickyNote className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Quick Notes & Lists</CardTitle>
            <CardDescription className="text-slate-400">
              {count} {count === 1 ? 'item' : 'items'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all font-medium',
                activeTab === tab.id
                  ? `${tab.activeColor} text-white`
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card className={cn('border-2 border-dashed', activeConfig.borderColor, activeConfig.bgColor)}>
          <CardContent className="p-4">
            {/* Note Tab */}
            {activeTab === 'note' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Quick Note</span>
                </div>
                <Textarea
                  placeholder="Write your note here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[100px] bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
            )}

            {/* Idea Tab */}
            {activeTab === 'idea' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Lightbulb className="h-5 w-5" />
                  <span className="font-medium">Capture an Idea</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <div className="text-5xl mb-4">💡</div>
                  <Textarea
                    placeholder="What's your brilliant idea?"
                    value={ideaContent}
                    onChange={(e) => setIdeaContent(e.target.value)}
                    className="min-h-[80px] bg-amber-900/20 border-amber-600/30 text-white placeholder:text-amber-400/60 resize-none text-center"
                  />
                </div>
              </div>
            )}

            {/* List Tab */}
            {activeTab === 'list' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <List className="h-5 w-5" />
                  <span className="font-medium">Create a List</span>
                </div>
                <Input
                  placeholder="List title..."
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
                <div className="space-y-2">
                  {listItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox 
                        checked={item.completed}
                        onCheckedChange={(checked) => {
                          const updated = [...listItems]
                          updated[index] = { ...updated[index], completed: !!checked }
                          setListItems(updated)
                        }}
                        className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Input
                        ref={index === listItems.length - 1 ? inputRef : undefined}
                        placeholder={`Item ${index + 1}`}
                        value={item.text}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddItem()
                          }
                        }}
                      />
                      {listItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddItem}
                  className="w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className={cn('w-full', activeConfig.buttonColor, 'text-white font-medium py-6')}
        >
          {activeTab === 'note' && (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </>
          )}
          {activeTab === 'idea' && (
            <>
              <Lightbulb className="h-4 w-4 mr-2" />
              Save Idea
            </>
          )}
          {activeTab === 'list' && (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create List
            </>
          )}
        </Button>

        {/* Saved Items Preview */}
        {notes.length > 0 && (
          <div className="pt-4 border-t border-slate-700 space-y-2">
            <h4 className="text-sm font-medium text-slate-400">Recent</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {notes.slice(0, 5).map((note) => {
                const isExpanded = expandedListId === note.id
                const isList = note.type === 'list'
                
                return (
                  <div 
                    key={note.id}
                    className={cn(
                      'rounded-lg group',
                      note.type === 'note' && 'bg-blue-500/10 border border-blue-500/20',
                      note.type === 'idea' && 'bg-amber-500/10 border border-amber-500/20',
                      note.type === 'list' && 'bg-emerald-500/10 border border-emerald-500/20'
                    )}
                  >
                    {/* Header row - always visible */}
                    <div 
                      className={cn(
                        'p-3 flex items-start justify-between gap-2',
                        isList && 'cursor-pointer hover:bg-white/5 rounded-t-lg transition-colors'
                      )}
                      onClick={isList ? () => toggleExpanded(note.id) : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {note.type === 'note' && <FileText className="h-3 w-3 text-blue-400" />}
                          {note.type === 'idea' && <Lightbulb className="h-3 w-3 text-amber-400" />}
                          {note.type === 'list' && (
                            <>
                              <List className="h-3 w-3 text-emerald-400" />
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-emerald-400" />
                              )}
                            </>
                          )}
                          <span className="text-xs text-slate-500 capitalize">{note.type}</span>
                        </div>
                        {note.type === 'list' ? (
                          <div>
                            <p className="text-sm text-white font-medium truncate">{note.title || 'Untitled List'}</p>
                            <p className="text-xs text-slate-400">
                              {note.items?.filter(i => i.completed).length || 0}/{note.items?.length || 0} completed
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-white truncate">{note.content}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Expanded list items */}
                    {isList && isExpanded && note.items && note.items.length > 0 && (
                      <div className="px-3 pb-3 space-y-1.5 border-t border-emerald-500/20 pt-2">
                        {note.items.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 group/item"
                          >
                            <Checkbox 
                              checked={item.completed}
                              onCheckedChange={() => handleToggleListItem(note.id, idx)}
                              className="border-emerald-500/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <span className={cn(
                              'text-sm flex-1',
                              item.completed 
                                ? 'text-slate-500 line-through' 
                                : 'text-white'
                            )}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notes.length === 0 && !loading && (
          <div className="text-center py-6 text-slate-400">
            <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs">Start adding notes, ideas, or lists above</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

