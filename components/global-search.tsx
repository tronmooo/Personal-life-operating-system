'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DOMAIN_CONFIGS } from '@/types/domains'
import { Search, FileText, CheckSquare, Target, DollarSign, Calendar, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: 'domain' | 'task' | 'habit' | 'bill' | 'document' | 'event'
  id: string
  title: string
  description?: string
  category?: string
  link: string
  icon: any
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { data, tasks, habits, bills, documents, events } = useData()
  const router = useRouter()

  const allData = useMemo(() => {
    const results: SearchResult[] = []

    // Domain items
    Object.entries(data).forEach(([domainKey, items]) => {
      // Ensure items is an array before iterating
      if (Array.isArray(items)) {
        items.forEach(item => {
          results.push({
            type: 'domain',
            id: item.id,
            title: item.title,
            description: item.description,
            category: DOMAIN_CONFIGS[domainKey as keyof typeof DOMAIN_CONFIGS]?.name || domainKey,
            link: `/domains/${domainKey}`,
            icon: FileText,
          })
        })
      }
    })

    // Tasks
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          category: task.category || 'Task',
          link: '/',
          icon: CheckSquare,
        })
      })
    }

    // Habits
    if (Array.isArray(habits)) {
      habits.forEach(habit => {
        results.push({
          type: 'habit',
          id: habit.id,
          title: habit.name,
          category: 'Habit',
          link: '/',
          icon: Target,
        })
      })
    }

    // Bills
    if (Array.isArray(bills)) {
      bills.forEach(bill => {
        results.push({
          type: 'bill',
          id: bill.id,
          title: bill.title,
          description: `$${bill.amount.toFixed(2)}`,
          category: bill.category,
          link: '/',
          icon: DollarSign,
        })
      })
    }

    // Documents
    if (Array.isArray(documents)) {
      documents.forEach(doc => {
        results.push({
          type: 'document',
          id: doc.id,
          title: doc.title,
          category: doc.category,
          link: '/',
          icon: FileText,
        })
      })
    }

    // Events
    if (Array.isArray(events)) {
      events.forEach(event => {
        results.push({
          type: 'event',
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.type,
          link: '/',
          icon: Calendar,
        })
      })
    }

    return results
  }, [data, tasks, habits, bills, documents, events])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    
    // Debounce search
    const timer = setTimeout(() => {
      const lowerQuery = query.toLowerCase()
      const filtered = allData.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(lowerQuery)
        const descMatch = item.description?.toLowerCase().includes(lowerQuery)
        const categoryMatch = item.category?.toLowerCase().includes(lowerQuery)
        return titleMatch || descMatch || categoryMatch
      })

      setResults(filtered.slice(0, 20)) // Limit to 20 results
      setIsSearching(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, allData])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link)
    onClose()
    setQuery('')
  }

  const getTypeColor = (type: SearchResult['type']) => {
    const colors = {
      domain: 'text-blue-600 bg-blue-50',
      task: 'text-green-600 bg-green-50',
      habit: 'text-purple-600 bg-purple-50',
      bill: 'text-yellow-600 bg-yellow-50',
      document: 'text-indigo-600 bg-indigo-50',
      event: 'text-pink-600 bg-pink-50',
    }
    return colors[type]
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything... (tasks, habits, bills, documents, events, domains)"
            className="flex-1 outline-none text-sm"
            autoFocus
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query && results.length === 0 && !isSearching && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 hover:bg-accent transition-colors text-left flex items-center gap-3"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">{result.title}</h4>
                        {result.category && (
                          <span className="text-xs text-muted-foreground">• {result.category}</span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                  </button>
                )
              })}
            </div>
          )}

          {!query && (
            <div className="py-12 px-4 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm mb-2">Start typing to search across all your data</p>
              <p className="text-xs">Tasks • Habits • Bills • Documents • Events • Domains</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>{results.length > 0 ? `${results.length} results` : 'Search tip: Try searching by title, description, or category'}</span>
          <div className="flex gap-2">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}








