'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/lib/providers/data-provider'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'

export default function DebugSubscriptionsPage() {
  const { data, isLoading: dataProviderLoading, isLoaded } = useData()
  const { entries: digitalEntries, isLoading: hookLoading } = useDomainEntries('digital')
  const [apiData, setApiData] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug/subscriptions')
      .then(res => res.json())
      .then(data => {
        setApiData(data)
        setApiLoading(false)
      })
      .catch(err => {
        console.error('API error:', err)
        setApiLoading(false)
      })
  }, [])

  return (
    <div className="p-8 space-y-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold">🔍 Subscription Debug Page</h1>
      
      {/* DataProvider Data */}
      <section className="bg-slate-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">1. DataProvider (useData)</h2>
        <p className="text-sm text-slate-400 mb-2">
          Loading: {dataProviderLoading ? 'Yes' : 'No'} | Loaded: {isLoaded ? 'Yes' : 'No'}
        </p>
        <div className="bg-slate-700 p-3 rounded text-sm">
          <p><strong>data.digital length:</strong> {data.digital?.length ?? 'undefined'}</p>
          <p><strong>All domains:</strong> {Object.keys(data).join(', ') || 'none'}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-cyan-400">Show data.digital entries</summary>
            <pre className="mt-2 text-xs overflow-auto max-h-64">
              {JSON.stringify(data.digital?.slice(0, 5).map(e => ({
                id: e.id,
                title: e.title,
                type: e.metadata?.type,
                monthlyCost: e.metadata?.monthlyCost,
                metadataKeys: Object.keys(e.metadata || {})
              })), null, 2)}
            </pre>
          </details>
        </div>
      </section>

      {/* useDomainEntries Hook */}
      <section className="bg-slate-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">2. useDomainEntries('digital')</h2>
        <p className="text-sm text-slate-400 mb-2">Loading: {hookLoading ? 'Yes' : 'No'}</p>
        <div className="bg-slate-700 p-3 rounded text-sm">
          <p><strong>entries length:</strong> {digitalEntries?.length ?? 'undefined'}</p>
          <p><strong>Subscriptions (type='subscription'):</strong> {digitalEntries?.filter(e => e.metadata?.type === 'subscription').length ?? 0}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-cyan-400">Show digitalEntries</summary>
            <pre className="mt-2 text-xs overflow-auto max-h-64">
              {JSON.stringify(digitalEntries?.slice(0, 5).map(e => ({
                id: e.id,
                title: e.title,
                type: e.metadata?.type,
                monthlyCost: e.metadata?.monthlyCost,
                metadataKeys: Object.keys(e.metadata || {})
              })), null, 2)}
            </pre>
          </details>
        </div>
      </section>

      {/* API Data */}
      <section className="bg-slate-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">3. API /api/debug/subscriptions</h2>
        <p className="text-sm text-slate-400 mb-2">Loading: {apiLoading ? 'Yes' : 'No'}</p>
        <div className="bg-slate-700 p-3 rounded text-sm">
          {apiData ? (
            <>
              <p><strong>subscriptions table:</strong> {apiData.subscriptionsTable?.count ?? 0} entries</p>
              <p><strong>domain_entries (digital):</strong> {apiData.domainEntriesDigital?.count ?? 0} entries</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-cyan-400">Show full API response</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-96">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <p>Loading API data...</p>
          )}
        </div>
      </section>

      {/* Comparison Summary */}
      <section className="bg-green-900 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">📊 Comparison Summary</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-green-700">
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Digital Count</th>
              <th className="text-left p-2">Subscription Count</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-green-800">
              <td className="p-2">DataProvider (data.digital)</td>
              <td className="p-2">{data.digital?.length ?? 0}</td>
              <td className="p-2">{data.digital?.filter(e => e.metadata?.type === 'subscription').length ?? 0}</td>
            </tr>
            <tr className="border-b border-green-800">
              <td className="p-2">useDomainEntries('digital')</td>
              <td className="p-2">{digitalEntries?.length ?? 0}</td>
              <td className="p-2">{digitalEntries?.filter(e => e.metadata?.type === 'subscription').length ?? 0}</td>
            </tr>
            <tr className="border-b border-green-800">
              <td className="p-2">API: subscriptions table</td>
              <td className="p-2">-</td>
              <td className="p-2">{apiData?.subscriptionsTable?.count ?? 0}</td>
            </tr>
            <tr>
              <td className="p-2">API: domain_entries (digital)</td>
              <td className="p-2">{apiData?.domainEntriesDigital?.count ?? 0}</td>
              <td className="p-2">{apiData?.domainEntriesDigital?.data?.filter((e: any) => e.type === 'subscription').length ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}


