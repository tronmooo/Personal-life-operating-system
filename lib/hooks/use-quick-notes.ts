'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSafeBrowserClient } from '@/lib/supabase/safe-client'
import { toast } from '@/lib/utils/toast'

export type QuickNoteType = 'note' | 'idea' | 'list'

export interface ListItem {
  text: string
  completed: boolean
}

export interface QuickNote {
  id: string
  user_id: string
  type: QuickNoteType
  content: string
  title: string | null
  items: ListItem[]
  created_at: string
  updated_at: string
}

export interface CreateQuickNoteInput {
  type: QuickNoteType
  content?: string
  title?: string
  items?: ListItem[]
}

export interface UpdateQuickNoteInput {
  content?: string
  title?: string
  items?: ListItem[]
}

/**
 * Hook for CRUD operations on the quick_notes table
 */
export function useQuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Get the Supabase client
  const getClient = useCallback(() => {
    return createSafeBrowserClient()
  }, [])

  // Check auth and fetch notes on mount
  useEffect(() => {
    const init = async () => {
      const supabase = getClient()
      if (!supabase) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        await fetchNotes()
      } else {
        setLoading(false)
      }
    }

    init()
  }, [getClient])

  /**
   * Fetch all quick notes for the current user
   */
  const fetchNotes = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('quick_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Parse items JSON for list types
      const parsedNotes = (data || []).map((note: any) => ({
        ...note,
        items: Array.isArray(note.items) ? note.items : []
      }))

      setNotes(parsedNotes)
    } catch (err: any) {
      console.error('Error fetching quick notes:', err)
      setError(err.message || 'Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }, [getClient])

  /**
   * Create a new quick note
   */
  const create = useCallback(async (input: CreateQuickNoteInput): Promise<QuickNote | null> => {
    const supabase = getClient()
    if (!supabase) {
      toast.warning('Sign In Required', 'Please sign in to save notes')
      return null
    }

    // Check if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.warning('Sign In Required', 'Please sign in to save notes')
      return null
    }

    try {
      const { data, error: createError } = await supabase
        .from('quick_notes')
        .insert({
          user_id: user.id,
          type: input.type,
          content: input.content || '',
          title: input.title || null,
          items: input.items || []
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      const newNote = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      }

      setNotes(prev => [newNote, ...prev])
      toast.success('Saved!', `${input.type.charAt(0).toUpperCase() + input.type.slice(1)} has been saved`)
      return newNote
    } catch (err: any) {
      console.error('Error creating quick note:', err)
      toast.error('Failed to save', err.message || 'Unknown error')
      return null
    }
  }, [getClient])

  /**
   * Update an existing quick note
   */
  const update = useCallback(async (id: string, input: UpdateQuickNoteInput): Promise<QuickNote | null> => {
    const supabase = getClient()
    if (!supabase) {
      toast.warning('Sign In Required', 'Please sign in to update notes')
      return null
    }

    try {
      const updateData: any = {}
      if (input.content !== undefined) updateData.content = input.content
      if (input.title !== undefined) updateData.title = input.title
      if (input.items !== undefined) updateData.items = input.items

      const { data, error: updateError } = await supabase
        .from('quick_notes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedNote = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      }

      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n))
      return updatedNote
    } catch (err: any) {
      console.error('Error updating quick note:', err)
      toast.error('Failed to update', err.message || 'Unknown error')
      return null
    }
  }, [getClient])

  /**
   * Delete a quick note
   */
  const remove = useCallback(async (id: string, skipConfirm = false): Promise<boolean> => {
    const supabase = getClient()
    if (!supabase) {
      toast.warning('Sign In Required', 'Please sign in to delete notes')
      return false
    }

    if (!skipConfirm) {
      const confirmed = typeof window !== 'undefined' && 
        window.confirm('Are you sure you want to delete this? This action cannot be undone.')
      if (!confirmed) return false
    }

    try {
      const { error: deleteError } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Deleted', 'Item has been removed')
      return true
    } catch (err: any) {
      console.error('Error deleting quick note:', err)
      toast.error('Failed to delete', err.message || 'Unknown error')
      return false
    }
  }, [getClient])

  /**
   * Toggle list item completion
   */
  const toggleListItem = useCallback(async (noteId: string, itemIndex: number): Promise<boolean> => {
    const note = notes.find(n => n.id === noteId)
    if (!note || note.type !== 'list') return false

    const updatedItems = [...note.items]
    if (updatedItems[itemIndex]) {
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        completed: !updatedItems[itemIndex].completed
      }
    }

    const result = await update(noteId, { items: updatedItems })
    return !!result
  }, [notes, update])

  /**
   * Add item to a list
   */
  const addListItem = useCallback(async (noteId: string, text: string): Promise<boolean> => {
    const note = notes.find(n => n.id === noteId)
    if (!note || note.type !== 'list') return false

    const updatedItems = [...note.items, { text, completed: false }]
    const result = await update(noteId, { items: updatedItems })
    return !!result
  }, [notes, update])

  /**
   * Remove item from a list
   */
  const removeListItem = useCallback(async (noteId: string, itemIndex: number): Promise<boolean> => {
    const note = notes.find(n => n.id === noteId)
    if (!note || note.type !== 'list') return false

    const updatedItems = note.items.filter((_, i) => i !== itemIndex)
    const result = await update(noteId, { items: updatedItems })
    return !!result
  }, [notes, update])

  // Filter helpers
  const noteItems = notes.filter(n => n.type === 'note')
  const ideaItems = notes.filter(n => n.type === 'idea')
  const listItems = notes.filter(n => n.type === 'list')

  return {
    // All notes
    notes,
    
    // Filtered by type
    noteItems,
    ideaItems,
    listItems,
    
    // Count
    count: notes.length,
    
    // State
    loading,
    error,
    isAuthenticated: isAuthenticated ?? false,
    
    // Actions
    fetchNotes,
    create,
    update,
    remove,
    
    // List-specific actions
    toggleListItem,
    addListItem,
    removeListItem,
  }
}


