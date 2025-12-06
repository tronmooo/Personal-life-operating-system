/**
 * OpenAI Function Calling Schema for Document Retrieval
 * Enables AI assistants to search and retrieve user documents
 */

import { Domain } from '@/types/domains'

export const RETRIEVE_DOCUMENTS_FUNCTION = {
  name: 'retrieve_documents',
  description: `Search and retrieve user documents by name, type, or content. Use this function when the user asks to "pull up", "show", "open", "find", or "display" documents. The function performs exact substring matching across document names, domains, types, and extracted text.`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: `Search query containing one or more document identifiers. Examples:
- "insurance ID" - finds documents with "insurance" AND "ID" in the name/type
- "registration" - finds documents with "registration" in the name
- "insurance ID, registration" - finds documents matching either term
- "vehicle registration and insurance" - finds documents matching these terms
The search is case-insensitive and matches substrings exactly.`,
      },
      domain: {
        type: 'string',
        enum: [
          'financial',
          'health',
          'insurance',
          'home',
          'vehicles',
          'appliances',
          'pets',
          'education',
          'relationships',
          'digital',
          'mindfulness',
          'fitness',
          'nutrition',
          'skills',
          'hobbies',
          'subscriptions',
          'legal',
          'career',
          'donations',
          'travel',
          'miscellaneous',
        ] as Domain[],
        description: 'Optional: filter results to a specific domain/category. Infer from context if possible.',
      },
    },
    required: ['query'],
  },
} as const

export type RetrieveDocumentsParams = {
  query: string
  domain?: Domain
}

export type RetrieveDocumentsResult = {
  success: boolean
  documents: any[]
  count: number
  message: string
  query: string
}

/**
 * Execute document retrieval
 * This function is called by AI assistants to search for documents
 */
export async function retrieveDocuments(
  params: RetrieveDocumentsParams
): Promise<RetrieveDocumentsResult> {
  try {
    const { query, domain } = params

    // Build search URL
    const searchUrl = new URL('/api/documents/search', window.location.origin)
    searchUrl.searchParams.set('q', query)
    if (domain) {
      // API accepts both 'category' and 'domain', prefer 'category'
      searchUrl.searchParams.set('category', domain)
    }

    // Fetch results
    const response = await fetch(searchUrl.toString())
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Format result message
    let message = ''
    const items = Array.isArray(data.documents) ? data.documents : (Array.isArray(data.results) ? data.results : [])
    if (data.count === 0 || items.length === 0) {
      message = `I couldn't find any documents matching "${query}".${domain ? ` I searched in the ${domain} domain.` : ''}`
    } else if (data.count === 1) {
      const d0 = items[0]
      message = `I found 1 document: "${d0.document_name || d0.name || d0.file_name}". Opening it now...`
    } else {
      const docNames = items
        .slice(0, 3)
        .map((doc: any) => doc.document_name || doc.name || doc.file_name)
        .join('", "')
      const moreCount = data.count - 3
      message = `I found ${data.count} documents: "${docNames}"${moreCount > 0 ? ` and ${moreCount} more` : ''}. Opening them now...`
    }

    return {
      success: true,
      documents: items,
      count: data.count ?? items.length,
      message,
      query: data.query ?? query,
    }
  } catch (error: any) {
    console.error('❌ Document retrieval error:', error)
    return {
      success: false,
      documents: [],
      count: 0,
      message: `Sorry, I encountered an error while searching for documents: ${error.message}`,
      query: params.query,
    }
  }
}

/**
 * Format function for VAPI (voice AI) integration
 * Returns the function definition in VAPI-compatible format
 */
export function getVAPIDocumentRetrievalFunction() {
  return {
    type: 'function',
    function: {
      name: RETRIEVE_DOCUMENTS_FUNCTION.name,
      description: RETRIEVE_DOCUMENTS_FUNCTION.description,
      parameters: RETRIEVE_DOCUMENTS_FUNCTION.parameters,
    },
  }
}

/**
 * Format function for OpenAI Chat Completion
 * Returns the function definition in OpenAI-compatible format
 */
export function getOpenAIDocumentRetrievalFunction() {
  return {
    type: 'function' as const,
    function: {
      name: RETRIEVE_DOCUMENTS_FUNCTION.name,
      description: RETRIEVE_DOCUMENTS_FUNCTION.description,
      parameters: RETRIEVE_DOCUMENTS_FUNCTION.parameters,
    },
  }
}










