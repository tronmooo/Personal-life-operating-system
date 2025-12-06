'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Upload, DollarSign, Heart, Car, FileText, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: 'Add Item',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => router.push('/domains')
    },
    {
      icon: <Upload className="w-4 h-4" />,
      label: 'Upload Doc',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/documents/new')
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Finance',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/domains/financial')
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: 'Health',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => router.push('/domains/health')
    },
    {
      icon: <Car className="w-4 h-4" />,
      label: 'Vehicle',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => router.push('/domains/vehicles')
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Documents',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: () => router.push('/documents')
    }
  ]

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <span className="text-lg">Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              className={`${action.color} text-white flex items-center justify-center gap-2 h-14`}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



