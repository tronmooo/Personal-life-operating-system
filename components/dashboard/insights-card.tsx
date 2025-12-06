'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Insight = {
  id: string
  type: string
  title: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  created_at: string
  dismissed: boolean
}

const priorityColor: Record<string, string> = {
  critical: 'bg-red-600/20 text-red-400 border-red-600',
  high: 'bg-orange-600/20 text-orange-400 border-orange-600',
  medium: 'bg-blue-600/20 text-blue-400 border-blue-600',
  low: 'bg-green-600/20 text-green-400 border-green-600',
}

export function InsightsCard() {
  const supabase = createClientComponentClient()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setInsights([]); return }
        const { data, error } = await supabase
          .from('insights')
          .select('*')
          .eq('user_id', user.id)
          .eq('dismissed', false)
          .order('priority', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(10)
        if (error) throw error
        setInsights((data || []).slice(0, 5) as any)
      } catch {
        setInsights([])
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [supabase])

  const dismiss = async (id: string) => {
    try {
      await supabase.from('insights').update({ dismissed: true }).eq('id', id)
      setInsights(prev => prev.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to dismiss insight:', error)
      // Remove from UI anyway for better UX
      setInsights(prev => prev.filter(i => i.id !== id))
    }
  }

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">Weekly Insights</span>
            <Badge variant="secondary">AI</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500 py-2">Loading...</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No insights yet</p>
        ) : (
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-start justify-between">
                <div className="pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={priorityColor[i.priority] || priorityColor.medium}>{i.type}</Badge>
                    <span className="text-sm font-medium">{i.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{i.message}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => dismiss(i.id)}>Dismiss</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


