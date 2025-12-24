'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { EnhancedDomainData } from '@/types/enhanced-domains'
import { UploadedDocument } from '@/components/document-uploader'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

// ✅ NO LOCAL STORAGE - All data comes exclusively from Supabase

interface EnhancedDataContextType {
  enhancedData: EnhancedDomainData[]
  addEnhancedItem: (item: Omit<EnhancedDomainData, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEnhancedItem: (id: string, updates: Partial<EnhancedDomainData>) => void
  deleteEnhancedItem: (id: string) => void
  getEnhancedItemsByDomain: (domain: string) => EnhancedDomainData[]
  getEnhancedItemsBySubCategory: (domain: string, subCategory: string) => EnhancedDomainData[]
  addDocumentToItem: (itemId: string, document: Omit<UploadedDocument, 'id' | 'uploadedAt'>) => void
  removeDocumentFromItem: (itemId: string, documentId: string) => void
  updateDocumentNotes: (itemId: string, documentId: string, notes: string) => void
}

const EnhancedDataContext = createContext<EnhancedDataContextType | undefined>(undefined)

export function EnhancedDataProvider({ children }: { children: ReactNode }) {
  const [enhancedData, setEnhancedData] = useState<EnhancedDomainData[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // ✅ Load from Supabase ONLY - No local storage fallback
  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!active) return
      
      // ✅ NO LOCAL STORAGE: If not authenticated, show empty state
      if (!user) {
        console.log('👀 EnhancedDataProvider: Not authenticated - showing empty state')
        setEnhancedData([])
        return
      }

      setUserId(user.id)

      // Load from Supabase
      const { data, error } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', 'enhanced_domain_items')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading enhanced data:', error)
        return
      }

      // Transform Supabase data to expected format
      const transformedData: EnhancedDomainData[] = data.map((entry: any) => ({
        id: entry.id,
        domain: entry.metadata?.originalDomain || 'unknown',
        subCategory: entry.metadata?.subCategory,
        title: entry.title,
        description: entry.description,
        metadata: entry.metadata || {},
        data: entry.metadata?.data || {},
        documents: entry.metadata?.documents || [],
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }))

      if (!active) return
      setEnhancedData(transformedData)
    })()
    return () => { active = false }
  }, [])

  const addEnhancedItem = async (item: Omit<EnhancedDomainData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // ✅ NO LOCAL STORAGE: Require authentication
    if (!user) {
      console.error('❌ Not authenticated - cannot add enhanced item')
      return
    }

    const newItem: EnhancedDomainData = {
      ...item,
      id: `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
    }
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('domain_entries')
      .insert({
        user_id: user.id,
        domain: 'enhanced_domain_items',
        title: item.title,
        description: item.description,
        metadata: {
          originalDomain: item.domain,
          subCategory: item.subCategory,
          data: (item as any).data || {},
          documents: []
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding enhanced item:', error)
      return
    }

    newItem.id = data.id
    setEnhancedData((prev) => [...prev, newItem])
  }

  const updateEnhancedItem = async (id: string, updates: Partial<EnhancedDomainData>) => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // ✅ NO LOCAL STORAGE: Require authentication
    if (!user) {
      console.error('❌ Not authenticated - cannot update enhanced item')
      return
    }

    const updatedItem = enhancedData.find(item => item.id === id)
    if (!updatedItem) return
    
    // Update in Supabase
    const { error } = await supabase
      .from('domain_entries')
      .update({
        title: updates.title ?? updatedItem.title,
        description: updates.description ?? updatedItem.description,
        metadata: {
          originalDomain: updates.domain ?? updatedItem.domain,
          subCategory: updates.subCategory ?? updatedItem.subCategory,
          data: (updates as any).data ?? (updatedItem as any).data ?? {},
          documents: updates.documents ?? updatedItem.documents
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating enhanced item:', error)
      return
    }
    
    setEnhancedData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }

  const deleteEnhancedItem = async (id: string) => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // ✅ NO LOCAL STORAGE: Require authentication
    if (!user) {
      console.error('❌ Not authenticated - cannot delete enhanced item')
      return
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('domain_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting enhanced item:', error)
      return
    }
    
    setEnhancedData((prev) => prev.filter((item) => item.id !== id))
  }

  const getEnhancedItemsByDomain = (domain: string) => {
    return enhancedData.filter((item) => item.domain === domain)
  }

  const getEnhancedItemsBySubCategory = (domain: string, subCategory: string) => {
    return enhancedData.filter(
      (item) => item.domain === domain && item.subCategory === subCategory
    )
  }

  const addDocumentToItem = (
    itemId: string,
    document: Omit<UploadedDocument, 'id' | 'uploadedAt'>
  ) => {
    const newDocument: UploadedDocument = {
      ...document,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date().toISOString(),
    }

    setEnhancedData((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              documents: [...(item.documents || []), newDocument],
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  const removeDocumentFromItem = (itemId: string, documentId: string) => {
    setEnhancedData((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              documents: (item.documents || []).filter((doc) => doc.id !== documentId),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  const updateDocumentNotes = (itemId: string, documentId: string, notes: string) => {
    setEnhancedData((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              documents: (item.documents || []).map((doc) =>
                doc.id === documentId ? { ...doc, notes } : doc
              ),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  return (
    <EnhancedDataContext.Provider
      value={{
        enhancedData,
        addEnhancedItem,
        updateEnhancedItem,
        deleteEnhancedItem,
        getEnhancedItemsByDomain,
        getEnhancedItemsBySubCategory,
        addDocumentToItem,
        removeDocumentFromItem,
        updateDocumentNotes,
      }}
    >
      {children}
    </EnhancedDataContext.Provider>
  )
}

export function useEnhancedData() {
  const context = useContext(EnhancedDataContext)
  if (!context) {
    throw new Error('useEnhancedData must be used within an EnhancedDataProvider')
  }
  return context
}







