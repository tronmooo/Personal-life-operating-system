'use client'

import { useState, useCallback } from 'react'

/**
 * Hook for optimistic UI updates when deleting items
 * Provides instant feedback by removing the item immediately,
 * then handles async deletion with rollback on error
 */
export function useOptimisticDelete<T extends { id: string }>() {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const handleDelete = useCallback(
    async (
      id: string,
      items: T[],
      setItems: React.Dispatch<React.SetStateAction<T[]>>,
      deleteAction: (id: string) => Promise<void>,
      onRollback?: () => void
    ) => {
      // 1. Mark as deleting
      setDeletingIds(prev => new Set(prev).add(id))
      
      // 2. Optimistic UI update - remove immediately
      setItems(prev => prev.filter(item => item.id !== id))
      
      try {
        // 3. Perform actual deletion
        await deleteAction(id)
        console.log('✅ Item deleted successfully:', id)
      } catch (error) {
        console.error('❌ Failed to delete item:', error)
        // 4. Rollback on error
        if (onRollback) {
          onRollback()
        }
      } finally {
        // 5. Clean up deleting state
        setDeletingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    },
    []
  )

  const isDeleting = useCallback(
    (id: string) => deletingIds.has(id),
    [deletingIds]
  )

  return {
    deletingIds,
    handleDelete,
    isDeleting,
  }
}

/**
 * Render props for a delete button with loading state
 * Use this to show a spinner when deleting
 */
export function DeleteButtonContent({ 
  isDeleting, 
  icon: Icon, 
  size = 'w-5 h-5' 
}: { 
  isDeleting: boolean
  icon: React.ComponentType<{ className?: string }>
  size?: string
}) {
  if (isDeleting) {
    return (
      <div 
        className={`${size} border-2 border-red-600 border-t-transparent rounded-full animate-spin`} 
      />
    )
  }

  return <Icon className={size} />
}


