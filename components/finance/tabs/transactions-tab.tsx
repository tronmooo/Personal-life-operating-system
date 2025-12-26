// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useFinance } from '@/lib/providers/finance-provider'
import { Plus, Search, Download, Filter, Building2, RefreshCw, Calendar, List, LayoutGrid, ChevronDown, ChevronUp, X, Edit, Trash2 } from 'lucide-react'
import { formatCurrencyDetailed } from '@/lib/utils/finance-utils'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TRANSACTION_CATEGORY_LABELS } from '@/types/finance'
import { TransactionDialog } from '../dialogs/transaction-dialog'
import { RecurringTransactionDialog } from '../dialogs/recurring-transaction-dialog'
import { cn } from '@/lib/utils'

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'
type ViewMode = 'table' | 'cards'

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

export function TransactionsTab() {
  const { transactions, recurringTransactions, accounts, transactionsLoading, refreshAll } = useFinance()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        // Search filter
        const matchesSearch = searchQuery === '' || 
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.merchant && t.merchant.toLowerCase().includes(searchQuery.toLowerCase()))
        
        // Type filter
        const matchesType = typeFilter === 'all' || t.type === typeFilter
        
        // Category filter
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
        
        // Time filter
        let matchesTime = true
        if (timeFilter !== 'all') {
          const transactionDate = parseISO(t.date)
          switch (timeFilter) {
            case 'today':
              matchesTime = isToday(transactionDate)
              break
            case 'yesterday':
              matchesTime = isYesterday(transactionDate)
              break
            case 'week':
              matchesTime = isThisWeek(transactionDate)
              break
            case 'month':
              matchesTime = isThisMonth(transactionDate)
              break
          }
        }
        
        return matchesSearch && matchesType && matchesCategory && matchesTime
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      })
  }, [transactions, searchQuery, typeFilter, categoryFilter, timeFilter, sortDirection])
  
  // Calculate totals for filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netAmount = totalIncome - totalExpenses

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category))
    return Array.from(cats).sort()
  }, [transactions])
  
  return (
    <div className="space-y-6">
      {/* Bank Account Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Bank Account Integration</CardTitle>
          </div>
          <CardDescription>Connect your bank accounts to automatically import transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border-2 border-dashed border-muted">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Bank Connection via Plaid</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Plaid uses bank-level encryption to securely connect to over 12,000 financial institutions. Your credentials are never stored on our servers.
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Automatic transaction imports - no manual entry</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Real-time account balances and updates</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Smart categorization based on merchant data</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Detect duplicate transactions automatically</span>
                </div>
              </div>
              <Button size="lg" className="mt-4">
                <Building2 className="mr-2 h-4 w-4" />
                Connect Bank Account with Plaid
              </Button>
              <p className="text-xs text-muted-foreground">
                By connecting, you agree to Plaid's{' '}
                <a href="https://plaid.com/legal" target="_blank" rel="noopener" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recurring Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <CardTitle>Recurring Transactions</CardTitle>
            </div>
            <CardDescription>Automate your regular income and expenses</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refreshAll()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate
            </Button>
            <Button onClick={() => setRecurringDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recurringTransactions && recurringTransactions.length > 0 ? (
            <div className="space-y-2">
              {recurringTransactions.map((rt) => (
                <div key={rt.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{rt.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rt.frequency} • Next: {format(new Date(rt.next_due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${rt.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {rt.type === 'income' ? '+' : '-'}{formatCurrencyDetailed(Number(rt.amount))}
                    </p>
                    <Badge variant="secondary" className="text-xs">{rt.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No recurring transactions yet. Add one to automate your finances!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Log and track all your financial transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            {TIME_FILTERS.map(filter => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter.value)}
                className={cn(
                  "transition-all",
                  timeFilter === filter.value && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="p-2"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-muted")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setTransactionDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <Card className="p-4 bg-muted/50">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Type</p>
                  <div className="flex gap-2">
                    {['all', 'income', 'expense', 'transfer'].map(type => (
                      <Button
                        key={type}
                        variant={typeFilter === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter(type)}
                      >
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                {categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Category</p>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {TRANSACTION_CATEGORY_LABELS[cat] || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Dialogs */}
          <TransactionDialog 
            open={transactionDialogOpen} 
            onOpenChange={setTransactionDialogOpen} 
          />
          <RecurringTransactionDialog 
            open={recurringDialogOpen} 
            onOpenChange={setRecurringDialogOpen}
            onSuccess={refreshAll}
          />
          
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted">
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-xl font-bold text-green-600">{formatCurrencyDetailed(totalIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-xl font-bold text-red-600">{formatCurrencyDetailed(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net</p>
              <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netAmount >= 0 ? '+' : ''}{formatCurrencyDetailed(netAmount)}
              </p>
            </div>
          </div>
          
          {/* Display - Table or Cards */}
          {viewMode === 'table' ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery || timeFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all'
                          ? 'No transactions match your filters. Try adjusting your search.'
                          : 'No transactions found. Add your first transaction to get started.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.slice(0, 50).map((transaction) => {
                      const account = accounts.find(a => a.id === transaction.account_id)
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              {transaction.merchant && (
                                <p className="text-xs text-muted-foreground">{transaction.merchant}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{account?.name || '-'}</TableCell>
                          <TableCell className={`text-right font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrencyDetailed(Number(transaction.amount))}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactionsLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {searchQuery || timeFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No transactions match your filters. Try adjusting your search.'
                    : 'No transactions found. Add your first transaction to get started.'}
                </div>
              ) : (
                filteredTransactions.slice(0, 50).map((transaction) => {
                  const account = accounts.find(a => a.id === transaction.account_id)
                  return (
                    <Card key={transaction.id} className={cn(
                      "overflow-hidden",
                      transaction.type === 'income' 
                        ? "border-l-4 border-l-green-500" 
                        : "border-l-4 border-l-red-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                          <span className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrencyDetailed(Number(transaction.amount))}
                          </span>
                        </div>
                        <p className="font-semibold mb-1">{transaction.description}</p>
                        {transaction.merchant && (
                          <p className="text-sm text-muted-foreground mb-2">{transaction.merchant}</p>
                        )}
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          <Badge variant="outline" className="text-xs">
                            {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category}
                          </Badge>
                        </div>
                        {account && (
                          <p className="text-xs text-muted-foreground mt-2">{account.name}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
