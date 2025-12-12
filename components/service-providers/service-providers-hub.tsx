'use client'

import { useState } from 'react'
import { useServiceProviders, ProviderCategory, ServiceProvider, ServicePayment, ServiceDocument } from '@/lib/hooks/use-service-providers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  PlusCircle,
  Shield,
  Zap,
  Wifi,
  CreditCard,
  Monitor,
  MoreHorizontal,
  FileText,
  Upload,
  Download,
  Eye
} from 'lucide-react'
import { AddProviderDialog } from './add-provider-dialog'
import { UploadDocumentDialog } from './upload-document-dialog'

// Category configuration - matching the screenshots exactly
const CATEGORY_CONFIG: Record<ProviderCategory, { 
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  barColor: string
}> = {
  insurance: { 
    label: 'Insurance', 
    icon: Shield, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    barColor: 'bg-blue-500'
  },
  utilities: { 
    label: 'Utilities', 
    icon: Zap, 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    barColor: 'bg-orange-500'
  },
  telecom: { 
    label: 'Telecom', 
    icon: Wifi, 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    barColor: 'bg-purple-500'
  },
  financial: { 
    label: 'Financial', 
    icon: CreditCard, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    barColor: 'bg-green-500'
  },
  subscriptions: { 
    label: 'Subscriptions', 
    icon: Monitor, 
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    barColor: 'bg-pink-500'
  },
  other: { 
    label: 'Other', 
    icon: MoreHorizontal, 
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    barColor: 'bg-slate-500'
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function ServiceProvidersHub() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'providers' | 'payments' | 'documents'>('dashboard')
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [uploadDocOpen, setUploadDocOpen] = useState(false)
  
  const {
    providers,
    payments,
    documents,
    analytics,
    loading,
    analyticsLoading,
    createProvider,
    markPaymentPaid,
    createDocument,
    deleteDocument,
  } = useServiceProviders()

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header - Service Providers with Blue Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Service Providers</h1>
            <p className="text-slate-400">Track all your services in one place</p>
          </div>
        </div>
        <Button 
          onClick={() => setAddProviderOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Provider
        </Button>
      </div>

      {/* Tabs - Dashboard | Providers | Payments | Documents */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-4">
        {(['dashboard', 'providers', 'payments', 'documents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab 
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          providers={providers}
        />
      )}
      {activeTab === 'providers' && (
        <ProvidersTab providers={providers} />
      )}
      {activeTab === 'payments' && (
        <PaymentsTab 
          payments={payments}
          onMarkPaid={markPaymentPaid}
        />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab 
          documents={documents}
          providers={providers}
          onUploadClick={() => setUploadDocOpen(true)}
          onDelete={deleteDocument}
        />
      )}

      {/* Dialogs */}
      <AddProviderDialog 
        open={addProviderOpen}
        onOpenChange={setAddProviderOpen}
        onSubmit={createProvider}
      />
      <UploadDocumentDialog
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
        providers={providers}
        onSubmit={createDocument}
      />
    </div>
  )
}

// ============================================================
// DASHBOARD TAB - 4 stat cards + spending by category + upcoming payments
// ============================================================
function DashboardTab({ 
  analytics, 
  analyticsLoading,
  providers
}: { 
  analytics: ReturnType<typeof useServiceProviders>['analytics']
  analyticsLoading: boolean
  providers: ServiceProvider[]
}) {
  if (analyticsLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-24" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const maxCategoryAmount = Math.max(...analytics.spending_by_category.map(c => c.amount), 1)

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Monthly Total</p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(analytics.monthly_total)}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Providers</p>
              <p className="text-3xl font-bold text-white mt-1">
                {analytics.active_providers}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Payments</p>
              <p className="text-3xl font-bold text-white mt-1">
                {analytics.pending_payments}
              </p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Expiring Soon</p>
              <p className="text-3xl font-bold text-white mt-1">
                {analytics.expiring_soon}
              </p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Two column layout: Spending by Category + Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Monthly Spending by Category</h2>
          <div className="space-y-4">
            {analytics.spending_by_category.map((cat) => {
              const config = CATEGORY_CONFIG[cat.category]
              const Icon = config.icon
              const percentage = (cat.amount / maxCategoryAmount) * 100
              
              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-slate-300">{config.label}</span>
                      <span className="text-slate-500 text-sm">({cat.count})</span>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${config.barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            
            {analytics.spending_by_category.length === 0 && (
              <p className="text-slate-400 text-center py-4">No active providers yet</p>
            )}
          </div>
        </Card>

        {/* Upcoming Payments */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Upcoming Payments</h2>
          <div className="space-y-3">
            {analytics.upcoming_payments.slice(0, 5).map((payment) => {
              const daysUntil = getDaysUntilDue(payment.due_date)
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
                >
                  <div>
                    <h3 className="font-semibold text-white">{payment.provider_name}</h3>
                    <p className="text-sm text-slate-400">Due {payment.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(payment.amount)}</p>
                    <p className={`text-sm font-medium ${
                      daysUntil < 0 ? 'text-red-400' :
                      daysUntil <= 3 ? 'text-orange-400' :
                      daysUntil <= 7 ? 'text-yellow-400' :
                      'text-slate-400'
                    }`}>
                      {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {analytics.upcoming_payments.length === 0 && (
              <p className="text-slate-400 text-center py-4">No pending payments</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// PROVIDERS TAB - Search, category filters, provider cards grid
// ============================================================
function ProvidersTab({ providers }: { providers: ServiceProvider[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProviderCategory | 'all'>('all')

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      p.subcategory?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory && p.status === 'active'
  })

  const categories: (ProviderCategory | 'all')[] = ['all', 'insurance', 'utilities', 'telecom', 'financial', 'subscriptions', 'other']

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                categoryFilter === cat
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => {
          const config = CATEGORY_CONFIG[provider.category]
          const Icon = config.icon
          
          return (
            <Card key={provider.id} className="bg-slate-800/50 border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{provider.provider_name}</h3>
                    <p className="text-slate-400 text-sm">{provider.subcategory || config.label}</p>
                  </div>
                </div>
                {provider.auto_pay_enabled && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Auto-pay
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly</span>
                  <span className="text-white font-semibold">{formatCurrency(provider.monthly_amount)}</span>
                </div>
                {provider.billing_day && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Day</span>
                    <span className="text-white">{provider.billing_day}</span>
                  </div>
                )}
              </div>

              {provider.account_number && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <p className="text-slate-500 text-xs">Account: {provider.account_number}</p>
                </div>
              )}
            </Card>
          )
        })}

        {filteredProviders.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No providers found</p>
            <p className="text-slate-500 text-sm">Add a provider to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PAYMENTS TAB - Stats cards, filter tabs, payments table
// ============================================================
function PaymentsTab({ 
  payments,
  onMarkPaid
}: { 
  payments: ServicePayment[]
  onMarkPaid: (id: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <p className="text-slate-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{payments.length}</p>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <p className="text-slate-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{payments.filter(p => p.status === 'pending').length}</p>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <p className="text-slate-400 text-sm">Paid</p>
          <p className="text-2xl font-bold text-green-400">{payments.filter(p => p.status === 'paid').length}</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-slate-400 font-medium">Provider</th>
                <th className="text-left p-4 text-slate-400 font-medium">Due Date</th>
                <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-white">{payment.provider_name}</p>
                      <p className="text-sm text-slate-400">{payment.subcategory}</p>
                    </div>
                  </td>
                  <td className="p-4 text-white">{payment.due_date}</td>
                  <td className="p-4 font-semibold text-white">{formatCurrency(payment.amount)}</td>
                  <td className="p-4">
                    <Badge className={
                      payment.status === 'paid' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }>
                      <span className="flex items-center gap-1">
                        {payment.status === 'paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {payment.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="p-4">
                    {payment.status === 'pending' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarkPaid(payment.id)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <span className="text-slate-500 text-sm">
                        Paid {payment.paid_date}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No payments found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// DOCUMENTS TAB - Filter tabs, upload button, document cards grid
// ============================================================
function DocumentsTab({ 
  documents,
  providers,
  onUploadClick,
  onDelete
}: { 
  documents: ServiceDocument[]
  providers: ServiceProvider[]
  onUploadClick: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'contract' | 'policy' | 'bill'>('all')

  const filteredDocuments = documents.filter(d => {
    if (typeFilter === 'all') return true
    return d.document_type === typeFilter
  })

  return (
    <div className="space-y-6">
      {/* Filter and Upload */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'contract', 'policy', 'bill'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                typeFilter === type
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All Documents' : `${type}s`}
            </button>
          ))}
        </div>
        <Button
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => {
          const daysUntilExpiry = doc.expiry_date ? getDaysUntilDue(doc.expiry_date) : null
          
          return (
            <Card key={doc.id} className="bg-slate-800/50 border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{doc.document_name}</h3>
                  <p className="text-slate-400 text-sm">{doc.provider_name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-500">{doc.upload_date}</span>
                    {doc.expiry_date && (
                      <span className={`font-medium ${
                        daysUntilExpiry !== null && daysUntilExpiry < 30 
                          ? 'text-orange-400' 
                          : 'text-slate-400'
                      }`}>
                        Exp: {doc.expiry_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {doc.file_url && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 flex-1"
                    asChild
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4" />
                      View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 gap-1 flex-1"
                    asChild
                  >
                    <a href={doc.file_url} download>
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </Card>
          )
        })}

        {filteredDocuments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No documents found</p>
            <p className="text-slate-500 text-sm">Upload a document to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// LOADING SKELETON
// ============================================================
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>
    </div>
  )
}
