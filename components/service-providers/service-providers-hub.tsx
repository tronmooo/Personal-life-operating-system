'use client'

import { useMemo, useState } from 'react'
import {
  useServiceProviders,
  ProviderCategory,
  ServiceProvider,
  ServicePayment,
  ServiceDocument,
} from '@/lib/hooks/use-service-providers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutGrid,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Wifi,
  Zap,
  Monitor,
  CreditCard,
  FileText,
  Upload,
  Search,
  PlusCircle,
  Eye,
  Download,
} from 'lucide-react'
import { AddProviderDialog } from './add-provider-dialog'
import { UploadDocumentDialog } from './upload-document-dialog'

const CATEGORY_CONFIG: Record<
  ProviderCategory,
  { label: string; icon: React.ElementType; color: string; bg: string; bar: string }
> = {
  insurance: { label: 'Insurance', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20', bar: 'bg-blue-500' },
  utilities: { label: 'Utilities', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20', bar: 'bg-amber-500' },
  telecom: { label: 'Telecom', icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/20', bar: 'bg-purple-500' },
  financial: { label: 'Financial', icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/20', bar: 'bg-green-500' },
  subscriptions: { label: 'Subscriptions', icon: Monitor, color: 'text-pink-400', bg: 'bg-pink-500/20', bar: 'bg-pink-500' },
  other: { label: 'Other', icon: LayoutGrid, color: 'text-slate-400', bg: 'bg-slate-500/20', bar: 'bg-slate-500' },
}

const cardClass = 'bg-[#0d1525] border border-slate-800/70 rounded-2xl shadow-lg shadow-black/30'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function daysUntil(dueDate: string) {
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

  const tabButton = (tab: typeof activeTab, label: string) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        activeTab === tab
          ? 'bg-[#1d2b48] text-white shadow-inner shadow-black/20'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6 text-white">
      <header className="bg-[#0f172a] border border-slate-800/70 rounded-3xl p-6 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_15px_40px_rgba(59,130,246,0.35)]">
              <LayoutGrid className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Service Providers</h1>
              <p className="text-slate-400 text-sm">Track all your services in one place</p>
            </div>
          </div>
          <Button
            onClick={() => setAddProviderOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-[0_12px_32px_rgba(59,130,246,0.35)] gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add Provider
          </Button>
        </div>

        <div className="flex gap-2 mt-5">
          {tabButton('dashboard', 'Dashboard')}
          {tabButton('providers', 'Providers')}
          {tabButton('payments', 'Payments')}
          {tabButton('documents', 'Documents')}
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <DashboardSection analytics={analytics} analyticsLoading={analyticsLoading} />
      )}
      {activeTab === 'providers' && <ProvidersSection providers={providers} />}
      {activeTab === 'payments' && (
        <PaymentsSection payments={payments} onMarkPaid={markPaymentPaid} providers={providers} />
      )}
      {activeTab === 'documents' && (
        <DocumentsSection
          documents={documents}
          onUploadClick={() => setUploadDocOpen(true)}
          onDelete={deleteDocument}
        />
      )}

      <AddProviderDialog open={addProviderOpen} onOpenChange={setAddProviderOpen} onSubmit={createProvider} />
      <UploadDocumentDialog
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
        providers={providers}
        onSubmit={createDocument}
      />
    </div>
  )
}

// DASHBOARD
function DashboardSection({
  analytics,
  analyticsLoading,
}: {
  analytics: ReturnType<typeof useServiceProviders>['analytics']
  analyticsLoading: boolean
}) {
  if (analyticsLoading) {
    return <LoadingSkeleton />
  }

  // Default analytics for unauthenticated users or empty state
  const safeAnalytics = analytics || {
    monthly_total: 0,
    active_providers: 0,
    pending_payments: 0,
    expiring_soon: 0,
    spending_by_category: [],
    upcoming_payments: [],
  }

  const maxCategory = Math.max(...safeAnalytics.spending_by_category.map((c) => c.amount), 1)

  return (
    <div className="space-y-4">
      <Card className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm">Monthly Total</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(safeAnalytics.monthly_total)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm">Active Providers</p>
            <p className="text-3xl font-bold mt-1">{safeAnalytics.active_providers}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </Card>

      <Card className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm">Pending Payments</p>
            <p className="text-3xl font-bold mt-1">{safeAnalytics.pending_payments}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-300" />
          </div>
        </div>
      </Card>

      <Card className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm">Expiring Soon</p>
            <p className="text-3xl font-bold mt-1">{safeAnalytics.expiring_soon}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>
        </div>
      </Card>

      <Card className={`${cardClass} p-6 space-y-5`}>
        <h2 className="text-lg font-semibold">Monthly Spending by Category</h2>
        <div className="space-y-4">
          {safeAnalytics.spending_by_category.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat.category]
            const Icon = cfg.icon
            const pct = (cat.amount / maxCategory) * 100
            return (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className="text-slate-200">{cfg.label}</span>
                    <span className="text-slate-500 text-sm">({cat.count})</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                  <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {safeAnalytics.spending_by_category.length === 0 && (
            <p className="text-slate-500 text-center py-4">No spending data yet</p>
          )}
        </div>
      </Card>

      <Card className={`${cardClass} p-6 space-y-3`}>
        <h2 className="text-lg font-semibold">Upcoming Payments</h2>
        {safeAnalytics.upcoming_payments.length === 0 && (
          <p className="text-slate-500 text-center py-6">No upcoming payments</p>
        )}
        {safeAnalytics.upcoming_payments.slice(0, 5).map((payment) => {
          const delta = daysUntil(payment.due_date)
          return (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 rounded-xl bg-[#0b1321] border border-slate-800/60"
            >
              <div>
                <p className="font-semibold">{payment.provider_name}</p>
                <p className="text-sm text-slate-400">Due {payment.due_date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                <p
                  className={`text-sm ${
                    delta < 0 ? 'text-rose-400' : delta <= 7 ? 'text-amber-300' : 'text-slate-400'
                  }`}
                >
                  {delta} days
                </p>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// PROVIDERS
function ProvidersSection({ providers }: { providers: ServiceProvider[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProviderCategory | 'all'>('all')

  const filtered = providers.filter((p) => {
    const matchesSearch =
      p.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      p.subcategory?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || p.category === filter
    return matchesSearch && matchesFilter
  })

  const categories: (ProviderCategory | 'all')[] = [
    'all',
    'insurance',
    'utilities',
    'telecom',
    'financial',
    'subscriptions',
    'other',
  ]

  const nextDue = (billingDay: number | null) => {
    if (!billingDay) return null
    const today = new Date()
    const next = new Date(today.getFullYear(), today.getMonth(), billingDay)
    if (next < today) next.setMonth(next.getMonth() + 1)
    return next.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-5">
      <Card className={`${cardClass} p-5 space-y-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0b1321] border border-slate-800/70 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#1d2b48] text-white border border-blue-500/40'
                  : 'bg-[#0b1321] text-slate-300 border border-slate-800 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map((p) => {
          const cfg = CATEGORY_CONFIG[p.category]
          const Icon = cfg.icon
          const due = nextDue(p.billing_day)
          return (
            <Card key={p.id} className={`${cardClass} p-6`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{p.provider_name}</p>
                    <p className="text-slate-400 text-sm">{p.subcategory || cfg.label}</p>
                  </div>
                </div>
                {p.auto_pay_enabled && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">Auto-pay</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-slate-300">
                <div>
                  <p className="text-slate-500">Monthly</p>
                  <p className="font-semibold text-white">{formatCurrency(p.monthly_amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Billing Day</p>
                  <p className="text-white">{p.billing_day ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment Due</p>
                  <p className="text-amber-300">{due || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Account</p>
                  <p className="text-slate-300">{p.account_number || '—'}</p>
                </div>
              </div>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card className={`${cardClass} p-10 text-center space-y-3`}>
            <LayoutGrid className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No providers yet</p>
            <p className="text-slate-500 text-sm">Add your first service provider to get started.</p>
            <div className="pt-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4">Add Provider</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// PAYMENTS
function PaymentsSection({
  payments,
  onMarkPaid,
  providers,
}: {
  payments: ServicePayment[]
  onMarkPaid: (id: string) => Promise<void>
  providers: ServiceProvider[]
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const filtered = payments.filter((p) => (filter === 'all' ? true : p.status === filter))

  const pendingTotal = useMemo(
    () => payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    [payments],
  )
  const paidTotal = useMemo(
    () => payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    [payments],
  )

  const statusBadge = (status: ServicePayment['status']) =>
    status === 'paid'
      ? 'bg-green-500/20 text-green-300 border-green-500/30'
      : status === 'overdue'
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : 'bg-amber-500/20 text-amber-200 border-amber-500/30'

  const providerName = (providerId: string) =>
    providers.find((p) => p.id === providerId)?.provider_name ?? 'Unknown provider'

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Card className={`${cardClass} p-5`}>
          <p className="text-slate-300 text-sm">Pending Total</p>
          <p className="text-3xl font-bold text-amber-300">{formatCurrency(pendingTotal)}</p>
        </Card>
        <Card className={`${cardClass} p-5`}>
          <p className="text-slate-300 text-sm">Paid This Month</p>
          <p className="text-3xl font-bold text-green-300">{formatCurrency(paidTotal)}</p>
        </Card>
        <Card className={`${cardClass} p-5`}>
          <p className="text-slate-300 text-sm">Total Transactions</p>
          <p className="text-3xl font-bold">{payments.length}</p>
        </Card>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold capitalize ${
              filter === f
                ? 'bg-[#1d2b48] text-white border border-blue-500/40'
                : 'bg-[#0b1321] text-slate-300 border border-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/70 text-slate-400">
                <th className="p-4 text-left font-semibold">Provider</th>
                <th className="p-4 text-left font-semibold">Due Date</th>
                <th className="p-4 text-left font-semibold">Amount</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/40 last:border-0">
                  <td className="p-4">
                    <p className="font-semibold text-white">{p.provider_name || providerName(p.provider_id)}</p>
                    <p className="text-slate-500 text-xs">{p.subcategory}</p>
                  </td>
                  <td className="p-4 text-white">{p.due_date}</td>
                  <td className="p-4 text-white font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="p-4">
                    <Badge className={statusBadge(p.status)}>
                      <span className="flex items-center gap-1">
                        {p.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="p-4">
                    {p.status === 'pending' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarkPaid(p.id)}
                        className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <span className="text-slate-500 text-xs">Paid {p.paid_date}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">No payments found for this filter.</div>
        )}
      </Card>
    </div>
  )
}

// DOCUMENTS
function DocumentsSection({
  documents,
  onUploadClick,
  onDelete,
}: {
  documents: ServiceDocument[]
  onUploadClick: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<'all' | 'contract' | 'policy' | 'bill'>('all')

  const filtered = documents.filter((d) => (filter === 'all' ? true : d.document_type === filter))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'contract', 'policy', 'bill'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === f
                  ? 'bg-[#1d2b48] text-white border border-blue-500/40'
                  : 'bg-[#0b1321] text-slate-300 border border-slate-800'
              }`}
            >
              {f === 'all' ? 'All Documents' : f === 'contract' ? 'Contracts' : f === 'policy' ? 'Policies' : 'Bills'}
            </button>
          ))}
        </div>
        <Button
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 px-4 py-2 rounded-xl"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="space-y-4">
        {filtered.map((doc) => {
          const delta = doc.expiry_date ? daysUntil(doc.expiry_date) : null
          return (
            <Card key={doc.id} className={`${cardClass} p-6`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-lg">{doc.document_name}</p>
                  <p className="text-slate-400 text-sm">{doc.provider_name}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                    <span>Uploaded {doc.upload_date}</span>
                    {doc.expiry_date && (
                      <span className="text-amber-300">
                        Expires {doc.expiry_date} {delta !== null ? `(${delta} days)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/70 text-sm">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                  onClick={() => onDelete(doc.id)}
                >
                  Delete
                </Button>
                {doc.file_url && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 gap-1"
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
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 gap-1"
                      asChild
                    >
                      <a href={doc.file_url} download>
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card className={`${cardClass} p-10 text-center space-y-3`}>
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No documents found</p>
            <p className="text-slate-500 text-sm">Upload a document to get started.</p>
            <Button onClick={onUploadClick} className="bg-blue-600 hover:bg-blue-700 text-white px-4">
              Upload Document
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

// LOADING
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>
    </div>
  )
}
