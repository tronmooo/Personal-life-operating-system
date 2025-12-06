'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { 
  Link2, CheckCircle2, XCircle, Loader2, RefreshCw, 
  ExternalLink, Search, Star, Zap, AlertTriangle 
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ConnectionsContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('financial')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'connected') {
      console.log('Successfully connected!')
    }
    if (error) {
      console.error('Connection failed:', error)
    }
  }, [searchParams])

  // Sample integrations data
  const integrations = {
    financial: [
      { id: 'plaid', name: 'Plaid', description: 'Connect bank accounts', connected: false, tier: 1 },
      { id: 'stripe', name: 'Stripe', description: 'Payment processing', connected: false, tier: 2 },
    ],
    calendar: [
      { id: 'google-calendar', name: 'Google Calendar', description: 'Sync events', connected: true, tier: 1 },
      { id: 'outlook', name: 'Outlook Calendar', description: 'Microsoft calendar sync', connected: false, tier: 2 },
    ],
    storage: [
      { id: 'google-drive', name: 'Google Drive', description: 'Cloud storage', connected: true, tier: 1 },
      { id: 'dropbox', name: 'Dropbox', description: 'File sync', connected: false, tier: 2 },
    ],
    communication: [
      { id: 'gmail', name: 'Gmail', description: 'Email integration', connected: true, tier: 1 },
      { id: 'twilio', name: 'Twilio', description: 'SMS & calls', connected: false, tier: 2 },
    ],
  }

  const tabs = [
    { id: 'financial', label: 'Financial' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'storage', label: 'Storage' },
    { id: 'communication', label: 'Communication' },
  ]

  const currentIntegrations = integrations[activeTab as keyof typeof integrations] || []
  const filteredIntegrations = currentIntegrations.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalConnected = Object.values(integrations).flat().filter(i => i.connected).length
  const totalAvailable = Object.values(integrations).flat().length

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Link2 className="h-6 w-6" />
            </div>
            External Connections
          </h1>
          <p className="text-gray-500 mt-2">
            Connect your accounts and automate data sync across domains
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 font-semibold">
            {totalConnected} Connected
          </span>
          <button 
            onClick={() => setLoading(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{totalConnected}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Essential</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">3</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Auto-Sync</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalConnected}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Available</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{totalAvailable}</p>
        </div>
      </div>

      {/* Setup Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 dark:text-amber-200">Setup Required</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Most integrations require API keys or OAuth credentials. Configure them in your environment.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className={`rounded-lg border p-4 transition-all ${
              integration.connected
                ? 'border-green-400 dark:border-green-600 shadow-md'
                : 'hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{integration.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    integration.tier === 1 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {integration.tier === 1 ? 'Essential' : 'Recommended'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
              {integration.connected && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!integration.connected ? (
                <button className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                  Connect
                </button>
              ) : (
                <>
                  <button className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium hover:bg-gray-200">
                    Sync Now
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200">
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading connections...</div>}>
      <ConnectionsContent />
    </Suspense>
  )
}
