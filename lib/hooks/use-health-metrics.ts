import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface HealthMetric {
  id: string
  metricType: string
  recordedAt: string
  value: number | null
  secondaryValue: number | null
  unit: string | null
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface CreateHealthMetricInput {
  metricType: string
  recordedAt: string
  value?: number | null
  secondaryValue?: number | null
  unit?: string | null
  notes?: string | null
  metadata?: Record<string, any>
}

interface UpdateHealthMetricInput {
  id: string
  metricType?: string
  recordedAt?: string
  value?: number | null
  secondaryValue?: number | null
  unit?: string | null
  notes?: string | null
  metadata?: Record<string, any>
}

function mapRowToMetric(row: any): HealthMetric {
  return {
    id: row.id,
    metricType: row.metric_type,
    recordedAt: row.recorded_at,
    value: row.value ?? null,
    secondaryValue: row.secondary_value ?? null,
    unit: row.unit ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useHealthMetrics() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    // 🔧 FIX: Get current user and filter by user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.warn('⚠️ Not authenticated, cannot load health metrics')
      setMetrics([])
      setIsLoading(false)
      return
    }

    console.log(`📊 Fetching health metrics for user: ${user.id}`)
    
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', user.id) // 🔧 FIX: Filter by current user
      .order('recorded_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to load health metrics:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
      setError(error.message)
      setMetrics([])
    } else {
      console.log(`✅ Loaded ${data?.length || 0} health metrics`)
      setMetrics((data ?? []).map(mapRowToMetric))
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const addMetric = useCallback(
    async (input: CreateHealthMetricInput) => {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const metadata = {
        category: 'metric',
        ...(input.metadata ?? {}),
        ...(input.notes ? { notes: input.notes } : {}),
      }

      const { data, error } = await supabase
        .from('health_metrics')
        .insert({
          user_id: user.id,
          metric_type: input.metricType,
          recorded_at: input.recordedAt,
          value: input.value ?? null,
          secondary_value: input.secondaryValue ?? null,
          unit: input.unit ?? null,
          metadata,
        })
        .select('*')
        .single()

      if (error) {
        console.error('Failed to create health metric:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
        setError(error.message)
        throw error
      }

      const metric = mapRowToMetric(data)
      setMetrics(prev => [metric, ...prev])
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('health-data-updated', {
          detail: { action: 'add', entry: metric },
        }))
      }
      return metric
    },
    [supabase]
  )

  const updateMetric = useCallback(
    async (input: UpdateHealthMetricInput) => {
      setError(null)
      const updates: Record<string, any> = {}
      if (input.metricType !== undefined) updates.metric_type = input.metricType
      if (input.recordedAt !== undefined) updates.recorded_at = input.recordedAt
      if (input.value !== undefined) updates.value = input.value
      if (input.secondaryValue !== undefined) updates.secondary_value = input.secondaryValue
      if (input.unit !== undefined) updates.unit = input.unit
      if (input.metadata !== undefined || input.notes !== undefined) {
        updates.metadata = {
          category: 'metric',
          ...(input.metadata ?? {}),
          ...(input.notes ? { notes: input.notes } : {}),
        }
      }

      const { data, error } = await supabase
        .from('health_metrics')
        .update(updates)
        .eq('id', input.id)
        .select('*')
        .single()

      if (error) {
        console.error('Failed to update health metric:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
        setError(error.message)
        throw error
      }

      const metric = mapRowToMetric(data)
      setMetrics(prev => prev.map(item => (item.id === metric.id ? metric : item)))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('health-data-updated', {
          detail: { action: 'update', entry: metric },
        }))
      }
      return metric
    },
    [supabase]
  )

  const deleteMetric = useCallback(
    async (id: string) => {
      setError(null)
      
      // 🔧 FIX: Get current user for safety check
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Not authenticated - cannot delete metric')
      }
      
      console.log(`🗑️ Deleting health metric ${id} for user ${user.id}`)
      
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // 🔧 FIX: Explicit user_id check for safety

      if (error) {
        console.error('❌ Failed to delete health metric:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
        setError(error.message)
        throw error
      }

      console.log(`✅ Deleted health metric ${id}`)
      setMetrics(prev => prev.filter(item => item.id !== id))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('health-data-updated', {
          detail: { action: 'delete', id },
        }))
      }
    },
    [supabase]
  )

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
    addMetric,
    updateMetric,
    deleteMetric,
  }
}
