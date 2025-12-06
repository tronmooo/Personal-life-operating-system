import { useState } from 'react'
import { Domain } from '@/types/domains'

export interface DocumentSearchResult {
  results: any[]
  query: string
  searchTerms: string[]
  count: number
  domain: string | null
}

export function useDocumentRetrieval() {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchDocuments = async (
    query: string,
    domain?: Domain
  ): Promise<DocumentSearchResult | null> => {
    setIsSearching(true)
    setError(null)

    try {
      const searchUrl = new URL('/api/documents/search', window.location.origin)
      searchUrl.searchParams.set('q', query)
      if (domain) {
        searchUrl.searchParams.set('domain', domain)
      }

      const response = await fetch(searchUrl.toString())

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data: DocumentSearchResult = await response.json()
      return data
    } catch (err: any) {
      console.error('Document search error:', err)
      setError(err.message || 'Failed to search documents')
      return null
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchDocuments,
    isSearching,
    error,
  }
}




















