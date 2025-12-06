import { useCallback } from 'react'
import { useDomainEntries } from './use-domain-entries'
import { toast } from '@/lib/utils/toast'
import type { Domain, DomainData } from '@/types/domains'

/**
 * Standardized hook for domain CRUD operations with consistent UX
 * 
 * This hook wraps use-domain-entries with:
 * - Consistent error handling
 * - User feedback via toast notifications
 * - Delete confirmation dialogs
 * - Loading states
 * 
 * @example
 * ```typescript
 * function VehicleManager() {
 *   const { items, create, update, remove, loading } = useDomainCRUD('vehicles')
 *   
 *   const handleAdd = async () => {
 *     await create({ title: 'My Car', metadata: { make: 'Toyota' } })
 *   }
 *   
 *   if (loading) return <LoadingSpinner />
 *   return <DataTable items={items} onDelete={remove} />
 * }
 * ```
 */
export function useDomainCRUD(domain: Domain) {
  const { 
    entries, 
    isLoading, 
    error, 
    createEntry, 
    updateEntry, 
    deleteEntry,
    fetchEntries 
  } = useDomainEntries(domain)

  /**
   * Create a new domain entry with error handling and user feedback
   * @param data - Partial domain data (title, description, metadata)
   * @returns Created entry or throws error
   */
  const create = useCallback(async (data: Partial<DomainData>) => {
    try {
      const result = await createEntry({
        title: data.title || 'Untitled',
        domain,
        description: data.description,
        metadata: data.metadata,
        id: data.id,
      })
      
      toast.success('Created successfully', `${result.title} has been added`)
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      toast.error('Failed to create', errorMessage)
      throw err
    }
  }, [createEntry, domain])

  /**
   * Update an existing domain entry with error handling and user feedback
   * @param id - Entry ID to update
   * @param data - Partial update data
   * @returns Updated entry or throws error
   */
  const update = useCallback(async (id: string, data: Partial<DomainData>) => {
    try {
      const result = await updateEntry({ id, ...data })
      toast.success('Updated successfully', 'Your changes have been saved')
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      toast.error('Failed to update', errorMessage)
      throw err
    }
  }, [updateEntry])

  /**
   * Delete a domain entry with optional confirmation dialog
   * @param id - Entry ID to delete
   * @param skipConfirm - Skip confirmation dialog (default: false)
   * @returns true if deleted, false if cancelled
   */
  const remove = useCallback(async (id: string, skipConfirm = false) => {
    // Show confirmation dialog unless explicitly skipped
    if (!skipConfirm) {
      const confirmed = typeof window !== 'undefined' && 
        window.confirm('Are you sure you want to delete this item? This action cannot be undone.')
      
      if (!confirmed) {
        return false
      }
    }
    
    try {
      await deleteEntry(id)
      toast.success('Deleted successfully', 'Item has been removed')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      toast.error('Failed to delete', errorMessage)
      throw err
    }
  }, [deleteEntry])

  /**
   * Refresh domain entries from Supabase
   * Useful for manually refreshing data after external changes
   */
  const refresh = useCallback(async () => {
    try {
      await fetchEntries()
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      toast.error('Failed to refresh', errorMessage)
    }
  }, [fetchEntries])

  /**
   * Delete multiple entries at once with confirmation
   * @param ids - Array of entry IDs to delete
   * @param skipConfirm - Skip confirmation dialog (default: false)
   * @returns Number of successfully deleted entries
   */
  const removeMany = useCallback(async (ids: string[], skipConfirm = false) => {
    if (ids.length === 0) return 0

    // Show confirmation dialog unless explicitly skipped
    if (!skipConfirm) {
      const confirmed = typeof window !== 'undefined' && 
        window.confirm(`Are you sure you want to delete ${ids.length} item(s)? This action cannot be undone.`)
      
      if (!confirmed) {
        return 0
      }
    }

    let successCount = 0
    let errorCount = 0

    for (const id of ids) {
      try {
        await deleteEntry(id)
        successCount++
      } catch (err) {
        console.error(`Failed to delete entry ${id}:`, err)
        errorCount++
      }
    }

    if (successCount > 0) {
      toast.success(
        'Deleted successfully', 
        `${successCount} item(s) removed${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      )
    }

    if (errorCount > 0 && successCount === 0) {
      toast.error('Delete failed', `Failed to delete ${errorCount} item(s)`)
    }

    return successCount
  }, [deleteEntry])

  return {
    // Data
    items: entries,
    loading: isLoading,
    error,
    
    // Actions with consistent UX
    create,
    update,
    remove,
    removeMany,
    refresh,
  }
}

/**
 * Type definitions for the hook return value
 * Useful for component prop typing
 */
export type DomainCRUDActions = ReturnType<typeof useDomainCRUD>



