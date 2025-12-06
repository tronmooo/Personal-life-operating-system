'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search, Filter, FileText, Calendar, DollarSign, Target,
  Home, Heart, Briefcase, GraduationCap, X, Clock, Tag
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

const DOMAIN_ICONS: Record<string, any> = {
  financial: DollarSign,
  health: Heart,
  career: Briefcase,
  home: Home,
  education: GraduationCap,
  tasks: FileText,
  bills: DollarSign,
  goals: Target,
  events: Calendar,
}

interface SearchResult {
  id: string
  type: string
  domain: string
  title: string
  description?: string
  date?: string
  amount?: number
  tags?: string[]
  data: any
}

export function GlobalSearch() {
  const { data, tasks, bills, events } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load recent searches from user settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user-settings', { credentials: 'include' })
        const json = res.ok ? await res.json() : { settings: {} }
        const rs = json?.settings?.search?.recent || []
        setRecentSearches(rs)
      } catch (error) {
        console.error('Failed to load recent searches:', error)
        // Continue with empty recent searches
      }
    })()
  }, [])

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const saveRecentSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ search: { recent: updated } })
      })
    } catch (error) {
      console.error('Failed to save recent search:', error)
      // Non-critical, search history persisted locally
    }
  }

  const searchAllData = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchLower = searchQuery.toLowerCase()
    const allResults: SearchResult[] = []

    // Search domains from DataProvider
    const domains = ['financial', 'health', 'career', 'home', 'education', 'personal'] as const
    domains.forEach(domain => {
      const items = (data[domain] || []) as any[]
      items.forEach((item: any) => {
        const searchableText = JSON.stringify(item).toLowerCase()
        if (searchableText.includes(searchLower)) {
          allResults.push({
            id: item.id || Math.random().toString(),
            type: 'domain',
            domain,
            title: item.title || item.name || 'Untitled',
            description: item.description || item.notes,
            date: item.date || item.createdAt,
            tags: item.tags,
            data: item,
          })
        }
      })
    })

    // Search tasks from provider
    tasks.forEach((task: any) => {
      if (task.title?.toLowerCase().includes(searchLower)) {
        allResults.push({
          id: task.id,
          type: 'task',
          domain: 'tasks',
          title: task.title,
          date: task.dueDate,
          data: task,
        })
      }
    })

    // Search bills from provider
    bills.forEach((bill: any) => {
      const searchableText = `${bill.name} ${bill.category} ${bill.notes}`.toLowerCase()
      if (searchableText.includes(searchLower)) {
        allResults.push({
          id: bill.id,
          type: 'bill',
          domain: 'bills',
          title: bill.name,
          amount: bill.amount,
          date: bill.dueDate,
          data: bill,
        })
      }
    })

    // Search goals from domain data if present
    const goals = (data.financial || []).filter((i: any) => i.metadata?.itemType === 'goal')
    goals.forEach((goal: any) => {
      if (goal.title?.toLowerCase().includes(searchLower)) {
        allResults.push({
          id: goal.id,
          type: 'goal',
          domain: 'goals',
          title: goal.title,
          description: goal.description,
          data: goal,
        })
      }
    })

    // Search events from provider
    events.forEach((event: any) => {
      const searchableText = `${event.title} ${event.description} ${event.location}`.toLowerCase()
      if (searchableText.includes(searchLower)) {
        allResults.push({
          id: event.id,
          type: 'event',
          domain: 'events',
          title: event.title,
          description: event.description,
          date: event.date,
          data: event,
        })
      }
    })

    // Search documents across domains using DataProvider
    const documents: any[] = [
      ...(data.documents || []),
      ...(data.insurance || []).filter((d: any) => d.metadata?.documentUrl || d.metadata?.documentType),
      ...(data.home || []).filter((d: any) => d.metadata?.documentUrl || d.metadata?.documentType)
    ]
    documents.forEach((doc: any) => {
      const searchableText = `${doc.name} ${doc.type} ${doc.ocrText || ''}`.toLowerCase()
      if (searchableText.includes(searchLower)) {
        allResults.push({
          id: doc.id,
          type: 'document',
          domain: 'documents',
          title: doc.name || doc.title,
          description: doc.type || doc.metadata?.documentType,
          data: doc,
        })
      }
    })

    setResults(allResults)
    setIsSearching(false)
    saveRecentSearch(searchQuery)
  }, [recentSearches])

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchAllData(query)
    }, 300)
    return () => clearTimeout(debounce)
  }, [query, searchAllData])

  const filteredResults = results.filter(result => {
    if (filterDomain !== 'all' && result.domain !== filterDomain) return false
    if (filterType !== 'all' && result.type !== filterType) return false
    return true
  })

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.domain]) acc[result.domain] = []
    acc[result.domain].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const clearRecentSearches = async () => {
    setRecentSearches([])
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ search: { recent: [] } })
      })
    } catch (error) {
      console.error('Failed to clear recent searches:', error)
      // Non-critical, searches cleared locally
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full max-w-sm justify-start text-muted-foreground"
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search everything...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search across all your data..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-lg"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setQuery('')
                      setResults([])
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterDomain} onValueChange={setFilterDomain}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="All Domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                    <SelectItem value="goals">Goals</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="domain">Domain Items</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="bill">Bills</SelectItem>
                    <SelectItem value="goal">Goals</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="secondary" className="ml-auto">
                  {filteredResults.length} results
                </Badge>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {!query && recentSearches.length > 0 && (
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
                    <Button variant="ghost" size="sm" onClick={clearRecentSearches}>
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(search)}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              )}

              {query && filteredResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              )}

              {filteredResults.length > 0 && (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All ({filteredResults.length})</TabsTrigger>
                    {Object.entries(groupedResults).map(([domain, items]) => (
                      <TabsTrigger key={domain} value={domain}>
                        {domain} ({items.length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="space-y-2">
                    {filteredResults.map((result) => (
                      <SearchResultCard key={result.id} result={result} />
                    ))}
                  </TabsContent>

                  {Object.entries(groupedResults).map(([domain, items]) => (
                    <TabsContent key={domain} value={domain} className="space-y-2">
                      {items.map((result) => (
                        <SearchResultCard key={result.id} result={result} />
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const Icon = DOMAIN_ICONS[result.domain] || FileText

  return (
    <Card className="hover:border-primary cursor-pointer transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{result.title}</h4>
              {result.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {result.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {result.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {result.domain}
                </Badge>
                {result.date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {result.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {result.amount && (
            <div className="text-lg font-bold text-primary">
              ${result.amount.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}






























