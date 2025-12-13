'use client'

import { useState } from 'react'
import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Pause,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCategoryColor } from '@/lib/utils/subscription-colors'
import { format } from 'date-fns'

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'software', label: 'Software' },
  { value: 'ai_tools', label: 'AI Tools' },
  { value: 'cloud_storage', label: 'Cloud Storage' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'gaming', label: 'Gaming' },
]

const STATUS_ICONS = {
  active: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  trial: <Clock className="w-4 h-4 text-blue-400" />,
  paused: <Pause className="w-4 h-4 text-yellow-400" />,
  cancelled: <XCircle className="w-4 h-4 text-red-400" />,
}

export function DigitalLifeSubscriptions() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { subscriptions, loading, deleteSubscription } = useSubscriptions({
    category: category !== 'all' ? category : undefined,
    search: search || undefined
  })

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSubscription(deleteId)
      setDeleteId(null)
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return <SubscriptionsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriptions..."
              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                variant={category === cat.value ? 'default' : 'outline'}
                className={
                  category === cat.value
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">
              {search || category !== 'all'
                ? 'No subscriptions found matching your filters'
                : 'No subscriptions yet. Add your first subscription to get started!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">
                    Service
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">
                    Cost
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">
                    Frequency
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">
                    Next Due
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {subscriptions.map((sub) => {
                  const daysUntil = getDaysUntilDue(sub.next_due_date)
                  
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-900/30 transition-colors"
                    >
                      {/* Service */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: sub.icon_color || getCategoryColor(sub.category)
                            }}
                          >
                            {sub.icon_letter || sub.service_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {sub.service_name}
                            </p>
                            <p className="text-sm text-slate-400 capitalize">
                              {sub.category.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-white">
                            {formatCurrency(sub.cost)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatCurrency(sub.cost)}/{sub.frequency === 'monthly' ? 'mo' : sub.frequency}
                          </p>
                        </div>
                      </td>

                      {/* Frequency */}
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className="capitalize bg-slate-900/50 border-slate-700 text-slate-300"
                        >
                          {sub.frequency}
                        </Badge>
                      </td>

                      {/* Next Due */}
                      <td className="p-4">
                        <div>
                          <p className="text-white">
                            {format(new Date(sub.next_due_date), 'MMM d, yyyy')}
                          </p>
                          <p className={`text-xs font-medium ${
                            daysUntil <= 3 ? 'text-orange-400' :
                            daysUntil <= 7 ? 'text-yellow-400' :
                            'text-slate-400'
                          }`}>
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`capitalize flex items-center gap-1 w-fit ${
                            sub.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            sub.status === 'trial' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            sub.status === 'paused' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                            'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {STATUS_ICONS[sub.status as keyof typeof STATUS_ICONS]}
                          {sub.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-slate-800 border-slate-700"
                          >
                            <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {sub.account_url && (
                              <DropdownMenuItem
                                className="text-slate-300 hover:bg-slate-700"
                                onClick={() => window.open(sub.account_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Visit Website
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteId(sub.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      </Card>
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}





