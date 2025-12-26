'use client'

import { useState, useMemo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Loader2, Calendar, Filter, LayoutGrid, List, 
  Search, X, ChevronDown, ChevronUp, Clock, SortAsc, SortDesc,
  CalendarDays, CalendarRange, CalendarCheck, History
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, startOfWeek, startOfMonth, parseISO, isSameDay, addDays, subDays, isAfter, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'
type ViewMode = 'grid' | 'list' | 'calendar'
type SortOrder = 'newest' | 'oldest' | 'alphabetical'

interface EntryItem {
  id: string
  title: string
  description?: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface UniversalEntriesViewProps {
  entries: EntryItem[]
  isLoading?: boolean
  domainName: string
  domainColor: string
  onAdd?: () => void
  onEdit?: (item: EntryItem) => void
  onDelete?: (id: string) => void
  deletingIds?: Set<string>
  // Custom render functions
  renderCard?: (item: EntryItem) => ReactNode
  renderListItem?: (item: EntryItem) => ReactNode
  // Field customization
  primaryField?: string
  secondaryField?: string
  dateField?: string
  // Additional filters
  additionalFilters?: { key: string; label: string; options: string[] }[]
  emptyStateMessage?: string
  addButtonLabel?: string
}

export function UniversalEntriesView({
  entries,
  isLoading = false,
  domainName,
  domainColor,
  onAdd,
  onEdit,
  onDelete,
  deletingIds = new Set(),
  renderCard,
  renderListItem,
  primaryField,
  secondaryField,
  dateField = 'createdAt',
  additionalFilters = [],
  emptyStateMessage,
  addButtonLabel,
}: UniversalEntriesViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today', 'yesterday', 'week', 'month', 'older']))

  // Get date from entry
  const getEntryDate = (entry: EntryItem): Date => {
    // Check metadata first for date fields
    if (entry.metadata) {
      if (entry.metadata.date) return parseISO(entry.metadata.date)
      if (entry.metadata.loggedAt) return parseISO(entry.metadata.loggedAt)
      if (entry.metadata.timestamp) return parseISO(entry.metadata.timestamp)
      if (entry.metadata.time && entry.metadata.date) {
        return parseISO(`${entry.metadata.date}T${entry.metadata.time}`)
      }
    }
    return parseISO(entry.createdAt || entry.updatedAt)
  }

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries]
    
    // Time filter
    const now = new Date()
    result = result.filter(entry => {
      const entryDate = getEntryDate(entry)
      switch (timeFilter) {
        case 'today':
          return isToday(entryDate)
        case 'yesterday':
          return isYesterday(entryDate)
        case 'week':
          return isThisWeek(entryDate, { weekStartsOn: 0 })
        case 'month':
          return isThisMonth(entryDate)
        default:
          return true
      }
    })

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(entry => {
        const titleMatch = entry.title?.toLowerCase().includes(query)
        const descMatch = entry.description?.toLowerCase().includes(query)
        const metadataMatch = Object.values(entry.metadata || {}).some(
          val => String(val).toLowerCase().includes(query)
        )
        return titleMatch || descMatch || metadataMatch
      })
    }

    // Additional filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(entry => {
          const entryValue = entry.metadata?.[key]
          return String(entryValue).toLowerCase() === value.toLowerCase()
        })
      }
    })

    // Sort
    result.sort((a, b) => {
      const dateA = getEntryDate(a)
      const dateB = getEntryDate(b)
      
      switch (sortOrder) {
        case 'newest':
          return dateB.getTime() - dateA.getTime()
        case 'oldest':
          return dateA.getTime() - dateB.getTime()
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '')
        default:
          return dateB.getTime() - dateA.getTime()
      }
    })

    return result
  }, [entries, timeFilter, searchQuery, sortOrder, activeFilters])

  // Group entries by date for calendar/list view
  const groupedEntries = useMemo(() => {
    const groups: Record<string, EntryItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      month: [],
      older: []
    }

    filteredEntries.forEach(entry => {
      const entryDate = getEntryDate(entry)
      if (isToday(entryDate)) {
        groups.today.push(entry)
      } else if (isYesterday(entryDate)) {
        groups.yesterday.push(entry)
      } else if (isThisWeek(entryDate, { weekStartsOn: 0 })) {
        groups.week.push(entry)
      } else if (isThisMonth(entryDate)) {
        groups.month.push(entry)
      } else {
        groups.older.push(entry)
      }
    })

    return groups
  }, [filteredEntries])

  // Stats
  const stats = useMemo(() => {
    const today = filteredEntries.filter(e => isToday(getEntryDate(e))).length
    const week = filteredEntries.filter(e => isThisWeek(getEntryDate(e), { weekStartsOn: 0 })).length
    const month = filteredEntries.filter(e => isThisMonth(getEntryDate(e))).length
    return { today, week, month, total: filteredEntries.length }
  }, [filteredEntries])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setTimeFilter('all')
    setActiveFilters({})
  }

  const hasActiveFilters = searchQuery || timeFilter !== 'all' || Object.keys(activeFilters).length > 0

  // Default card renderer
  const defaultRenderCard = (item: EntryItem) => {
    const entryDate = getEntryDate(item)
    const displayValue = primaryField && item.metadata?.[primaryField] 
      ? item.metadata[primaryField]
      : item.title

    return (
      <Card key={item.id} className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{displayValue}</CardTitle>
              {item.description && (
                <CardDescription className="mt-1 line-clamp-2 text-xs">
                  {item.description}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingIds.has(item.id)}
                >
                  {deletingIds.has(item.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1.5">
            {/* Show up to 4 metadata fields */}
            {Object.entries(item.metadata || {})
              .filter(([key]) => !['id', 'userId', 'user_id', 'created_at', 'updated_at', 'domain'].includes(key))
              .slice(0, 4)
              .map(([key, value]) => {
                if (!value || value === '' || value === 0) return null
                return (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                    </span>
                    <span className="font-medium text-right truncate max-w-[60%]">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </span>
                  </div>
                )
              })}
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(entryDate, 'MMM d, yyyy h:mm a')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default list item renderer
  const defaultRenderListItem = (item: EntryItem) => {
    const entryDate = getEntryDate(item)
    const displayValue = primaryField && item.metadata?.[primaryField]
      ? item.metadata[primaryField]
      : item.title

    return (
      <div 
        key={item.id}
        className="group flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all"
      >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0", domainColor)}>
          {String(displayValue).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{displayValue}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(entryDate, 'MMM d')}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
                disabled={deletingIds.has(item.id)}
              >
                {deletingIds.has(item.id) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render group section
  const renderGroup = (groupKey: string, label: string, icon: ReactNode, items: EntryItem[]) => {
    if (items.length === 0) return null
    const isExpanded = expandedGroups.has(groupKey)

    return (
      <div key={groupKey} className="space-y-2">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          {icon}
          <span className="font-semibold">{label}</span>
          <Badge variant="secondary" className="ml-auto mr-2">{items.length}</Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {isExpanded && (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" 
              : "space-y-2"
          )}>
            {items.map(item => (
              viewMode === 'grid' 
                ? (renderCard || defaultRenderCard)(item)
                : (renderListItem || defaultRenderListItem)(item)
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Loading {domainName.toLowerCase()} entries...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onAdd && (
          <Button onClick={onAdd} className={cn("gap-2", domainColor.replace('bg-', 'bg-').replace('-500', '-600').replace('-600', '-600'))}>
            <Plus className="h-4 w-4" />
            {addButtonLabel || `Add ${domainName}`}
          </Button>
        )}

        {/* Time Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm text-muted-foreground mr-1">View:</span>
          {[
            { key: 'today', label: 'Today', icon: <CalendarDays className="h-3.5 w-3.5 mr-1" /> },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week', label: 'This Week', icon: <CalendarRange className="h-3.5 w-3.5 mr-1" /> },
            { key: 'month', label: 'This Month', icon: <CalendarCheck className="h-3.5 w-3.5 mr-1" /> },
            { key: 'all', label: 'All Time', icon: <History className="h-3.5 w-3.5 mr-1" /> },
          ].map(({ key, label, icon }) => (
            <Button
              key={key}
              variant={timeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(key as TimeFilter)}
              className="h-8 text-xs"
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${domainName.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'alphabetical' : 'newest')}
            className="gap-1 h-9"
          >
            {sortOrder === 'newest' && <SortDesc className="h-4 w-4" />}
            {sortOrder === 'oldest' && <SortAsc className="h-4 w-4" />}
            {sortOrder === 'alphabetical' && <span className="text-xs">A-Z</span>}
            <span className="text-xs capitalize hidden sm:inline">{sortOrder}</span>
          </Button>

          {/* Filters Button */}
          {additionalFilters.length > 0 && (
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 h-9"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {Object.keys(activeFilters).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {Object.keys(activeFilters).length}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Additional Filters Panel */}
      {showFilters && additionalFilters.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {additionalFilters.map(filter => (
              <div key={filter.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
                <select
                  value={activeFilters[filter.key] || 'all'}
                  onChange={(e) => setActiveFilters(prev => ({
                    ...prev,
                    [filter.key]: e.target.value === 'all' ? '' : e.target.value
                  }))}
                  className="h-8 px-2 text-sm border rounded-md bg-background"
                >
                  <option value="all">All</option>
                  {filter.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="self-end h-8">
                <X className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-xs">
          <CalendarDays className="h-3 w-3 mr-1" />
          Today: {stats.today}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <CalendarRange className="h-3 w-3 mr-1" />
          This Week: {stats.week}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <CalendarCheck className="h-3 w-3 mr-1" />
          This Month: {stats.month}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <History className="h-3 w-3 mr-1" />
          Total: {stats.total}
        </Badge>
      </div>

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className={cn("h-16 w-16 rounded-xl opacity-20 mb-4", domainColor)} />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? 'No matching entries' : `No ${domainName.toLowerCase()} entries yet`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query'
                : emptyStateMessage || `Get started by adding your first ${domainName.toLowerCase()} entry`
              }
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            ) : onAdd && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {addButtonLabel || `Add First Entry`}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'calendar' ? (
        // Calendar/grouped view
        <div className="space-y-4">
          {renderGroup('today', 'Today', <CalendarDays className="h-4 w-4 text-green-500" />, groupedEntries.today)}
          {renderGroup('yesterday', 'Yesterday', <Calendar className="h-4 w-4 text-blue-500" />, groupedEntries.yesterday)}
          {renderGroup('week', 'Earlier This Week', <CalendarRange className="h-4 w-4 text-purple-500" />, groupedEntries.week)}
          {renderGroup('month', 'Earlier This Month', <CalendarCheck className="h-4 w-4 text-orange-500" />, groupedEntries.month)}
          {renderGroup('older', 'Older', <History className="h-4 w-4 text-gray-500" />, groupedEntries.older)}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map(item => (renderCard || defaultRenderCard)(item))}
        </div>
      ) : (
        // List view
        <div className="space-y-2">
          {filteredEntries.map(item => (renderListItem || defaultRenderListItem)(item))}
        </div>
      )}
    </div>
  )
}

