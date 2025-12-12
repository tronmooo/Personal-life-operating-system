import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface InsurancePolicyInput {
  provider: string
  policy_number: string
  type?: string | null
  premium?: number | null
  starts_on?: string | null
  ends_on?: string | null
  coverage?: Record<string, any>
  metadata?: Record<string, any>
}

export interface InsurancePolicyRow extends InsurancePolicyInput { id: string }

export interface InsuranceClaimInput {
  policy_id: string
  status?: string | null
  amount?: number | null
  filed_on: string
  resolved_on?: string | null
  details?: Record<string, any>
}

export interface InsuranceClaimRow extends InsuranceClaimInput { id: string }

export function useInsurance() {
  const supabase = createClientComponentClient()
  const [policies, setPolicies] = useState<InsurancePolicyRow[]>([])
  const [claims, setClaims] = useState<InsuranceClaimRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('⚠️ Not authenticated, cannot load insurance data')
        setPolicies([])
        setClaims([])
        return
      }

      console.log(`📊 Fetching insurance data for user: ${user.id}`)

      const [policiesRes, claimsRes] = await Promise.all([
        supabase.from('insurance_policies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('insurance_claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (policiesRes.error) throw policiesRes.error
      if (claimsRes.error) throw claimsRes.error

      console.log(`✅ Loaded ${policiesRes.data?.length || 0} insurance policies, ${claimsRes.data?.length || 0} claims`)
      
      setPolicies((policiesRes.data || []) as InsurancePolicyRow[])
      setClaims((claimsRes.data || []) as InsuranceClaimRow[])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ Failed to load insurance data:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to load insurance data')
      setPolicies([])
      setClaims([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const addPolicy = useCallback(async (input: InsurancePolicyInput) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('insurance_policies')
        .insert({ user_id: user.id, ...input })
        .select('*')
        .single()
      if (error) throw error
      setPolicies(prev => [data as InsurancePolicyRow, ...prev])
      return data as InsurancePolicyRow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to add policy:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to add policy')
      throw err
    }
  }, [supabase])

  const updatePolicy = useCallback(async (id: string, input: Partial<InsurancePolicyInput>) => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('insurance_policies')
        .update(input)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      setPolicies(prev => prev.map(p => p.id === id ? (data as InsurancePolicyRow) : p))
      return data as InsurancePolicyRow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to update policy:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to update policy')
      throw err
    }
  }, [supabase])

  const deletePolicy = useCallback(async (id: string) => {
    setError(null)
    try {
      // 🔧 FIX: Get current user for safety check
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Not authenticated - cannot delete policy')
      }
      
      console.log(`🗑️ Deleting insurance policy ${id} for user ${user.id}`)
      
      const { error } = await supabase
        .from('insurance_policies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // 🔧 FIX: Explicit user_id check for safety
        
      if (error) throw error
      
      console.log(`✅ Deleted insurance policy ${id}`)
      setPolicies(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ Failed to delete policy:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to delete policy')
      throw err
    }
  }, [supabase])

  const addClaim = useCallback(async (input: InsuranceClaimInput) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({ user_id: user.id, ...input })
        .select('*')
        .single()
      if (error) throw error
      setClaims(prev => [data as InsuranceClaimRow, ...prev])
      return data as InsuranceClaimRow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to add claim:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to add claim')
      throw err
    }
  }, [supabase])

  const updateClaim = useCallback(async (id: string, input: Partial<InsuranceClaimInput>) => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .update(input)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      setClaims(prev => prev.map(c => c.id === id ? (data as InsuranceClaimRow) : c))
      return data as InsuranceClaimRow
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to update claim:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to update claim')
      throw err
    }
  }, [supabase])

  const deleteClaim = useCallback(async (id: string) => {
    setError(null)
    try {
      // 🔧 FIX: Get current user for safety check
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Not authenticated - cannot delete claim')
      }
      
      console.log(`🗑️ Deleting insurance claim ${id} for user ${user.id}`)
      
      const { error } = await supabase
        .from('insurance_claims')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // 🔧 FIX: Explicit user_id check for safety
        
      if (error) throw error
      
      console.log(`✅ Deleted insurance claim ${id}`)
      setClaims(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('❌ Failed to delete claim:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to delete claim')
      throw err
    }
  }, [supabase])

  const policyIdToPolicy = useMemo(() => {
    const map = new Map<string, InsurancePolicyRow>()
    policies.forEach(p => map.set(p.id, p))
    return map
  }, [policies])

  return { policies, claims, loading, error, reload: load, addPolicy, updatePolicy, deletePolicy, addClaim, updateClaim, deleteClaim, policyIdToPolicy }
}









