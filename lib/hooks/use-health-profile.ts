/**
 * Health Profile Hook
 * Manages user health profile and demographics
 */

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'

export interface HealthProfile {
  id: string
  user_id: string
  date_of_birth?: string | null
  gender?: string | null
  blood_type?: string | null
  height_cm?: number | null
  height_ft?: number | null
  height_in?: number | null
  target_weight_kg?: number | null
  target_weight_lbs?: number | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relationship?: string | null
  primary_physician?: string | null
  physician_phone?: string | null
  physician_email?: string | null
  medical_record_number?: string | null
  insurance_provider?: string | null
  insurance_policy_number?: string | null
  insurance_group_number?: string | null
  insurance_effective_date?: string | null
  known_allergies?: string[] | null
  chronic_conditions?: string[] | null
  preferred_pharmacy?: string | null
  pharmacy_phone?: string | null
  pharmacy_address?: string | null
  created_at: string
  updated_at: string
}

export function useHealthProfile() {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      setProfile(data)
    } catch (err: any) {
      console.error('Error loading health profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createOrUpdateProfile(data: Partial<HealthProfile>) {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if profile exists
      const { data: existing } = await supabase
        .from('health_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result

      if (existing) {
        // Update existing profile
        const { data: updated, error: updateError } = await supabase
          .from('health_profiles')
          .update(data)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = updated
      } else {
        // Create new profile
        const { data: created, error: createError } = await supabase
          .from('health_profiles')
          .insert({ ...data, user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        result = created
      }

      setProfile(result)
      toast({
        title: 'Success',
        description: 'Health profile saved successfully',
      })
      
      return result
    } catch (err: any) {
      console.error('Error saving health profile:', err)
      setError(err.message)
      toast({
        title: 'Error',
        description: err.message || 'Failed to save health profile',
        variant: 'destructive',
      })
      throw err
    }
  }

  async function deleteProfile() {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: deleteError } = await supabase
        .from('health_profiles')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      setProfile(null)
      toast({
        title: 'Success',
        description: 'Health profile deleted',
      })
    } catch (err: any) {
      console.error('Error deleting health profile:', err)
      setError(err.message)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete health profile',
        variant: 'destructive',
      })
      throw err
    }
  }

  // Calculate age from date of birth
  function getAge(): number | null {
    if (!profile?.date_of_birth) return null
    const dob = new Date(profile.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  return {
    profile,
    loading,
    error,
    createOrUpdateProfile,
    deleteProfile,
    reload: loadProfile,
    age: getAge(),
  }
}

