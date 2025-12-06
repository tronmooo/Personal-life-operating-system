'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Laptop, CreditCard, Globe, HardDrive, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SubscriptionsTab } from '@/components/digital/subscriptions-tab'
import { AccountsTab } from '@/components/digital/accounts-tab'
import { DomainsTab } from '@/components/digital/domains-tab'
import { AssetsTab } from '@/components/digital/assets-tab'

export default function DigitalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'accounts' | 'domains' | 'assets'>('subscriptions')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/domains')}
          className="mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gray-500 rounded-lg">
            <Laptop className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Digital Life</h1>
        </div>
        <p className="text-muted-foreground">Subscriptions, accounts, and digital assets</p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeTab === 'subscriptions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('subscriptions')}
          className="flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Subscriptions
        </Button>
        <Button
          variant={activeTab === 'accounts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('accounts')}
          className="flex items-center gap-2"
        >
          <Laptop className="w-4 h-4" />
          Accounts
        </Button>
        <Button
          variant={activeTab === 'domains' ? 'default' : 'outline'}
          onClick={() => setActiveTab('domains')}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          Domains
        </Button>
        <Button
          variant={activeTab === 'assets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('assets')}
          className="flex items-center gap-2"
        >
          <HardDrive className="w-4 h-4" />
          Digital Assets
        </Button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'domains' && <DomainsTab />}
        {activeTab === 'assets' && <AssetsTab />}
      </div>
    </div>
  )
}

