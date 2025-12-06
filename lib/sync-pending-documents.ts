// Sync pending documents from IndexedDB to Supabase on sign-in

import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

/**
 * Syncs all pending documents from IndexedDB to Supabase
 * Called automatically on sign-in
 */
export async function syncPendingDocuments() {
  const supabase = createClientComponentClient()
  
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ Cannot sync: User not authenticated')
      return { synced: 0, failed: 0 }
    }

    // Get pending documents from IndexedDB
    const pendingDocs = (await idbGet<any[]>('lifehub-documents', [])) || []
    const docsToSync = pendingDocs.filter(doc => doc.pendingSync === true)
    
    if (docsToSync.length === 0) {
      console.log('✅ No pending documents to sync')
      return { synced: 0, failed: 0 }
    }

    console.log(`🔄 Syncing ${docsToSync.length} pending documents to Supabase...`)

    let syncedCount = 0
    let failedCount = 0
    const remainingDocs: any[] = []

    // Sync each document
    for (const doc of docsToSync) {
      try {
        const { error } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            domain_id: doc.domain_id,
            file_path: doc.file_path,
            metadata: doc.metadata,
            ocr_data: doc.ocr_data,
            created_at: doc.uploaded_at
          })

        if (error) {
          console.error(`❌ Failed to sync document ${doc.id}:`, error)
          failedCount++
          // Keep failed documents in IndexedDB for retry
          remainingDocs.push(doc)
        } else {
          console.log(`✅ Synced document ${doc.id}`)
          syncedCount++
        }
      } catch (err) {
        console.error(`❌ Error syncing document ${doc.id}:`, err)
        failedCount++
        remainingDocs.push(doc)
      }
    }

    // Update IndexedDB - remove synced documents, keep failed ones
    const nonPendingDocs = pendingDocs.filter(doc => !doc.pendingSync)
    await idbSet('lifehub-documents', [...nonPendingDocs, ...remainingDocs])

    console.log(`✅ Document sync complete: ${syncedCount} synced, ${failedCount} failed`)
    
    return { synced: syncedCount, failed: failedCount }
  } catch (error) {
    console.error('❌ Error during document sync:', error)
    return { synced: 0, failed: 0, error }
  }
}

/**
 * Sets up automatic document syncing on auth state changes
 * Call this in your root layout or app component
 */
export function setupDocumentSync() {
  if (typeof window === 'undefined') return

  const supabase = createClientComponentClient()
  
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('🔄 User signed in - checking for pending documents...')
      // Small delay to ensure IndexedDB is ready
      setTimeout(() => {
        syncPendingDocuments().then(result => {
          if (result.synced > 0) {
            // Optionally show a toast notification
            console.log(`✅ Synced ${result.synced} document(s) from offline storage`)
          }
        })
      }, 1000)
    }
  })

  // Cleanup on unmount
  return () => {
    subscription.unsubscribe()
  }
}






















