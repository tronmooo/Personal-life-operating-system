'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Helper hook to get authenticated user
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, supabase }
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type UserProfile = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  city: string | null
  state: string | null
  country: string | null
  timezone: string
  website_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  github_url: string | null
  portfolio_url: string | null
  current_title: string | null
  current_company: string | null
  industry: string | null
  years_of_experience: number
  preferences: ProfilePreferences
  created_at: string
  updated_at: string
}

export type ProfilePreferences = {
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    billReminders: boolean
    taskReminders: boolean
    weeklyDigest: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections'
    showEmail: boolean
    showPhone: boolean
    activityTracking: boolean
    shareAnalytics: boolean
  }
}

export type WorkExperience = {
  id: string
  user_id: string
  company: string
  position: string
  location: string | null
  employment_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | 'remote' | null
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  achievements: string[] | null
  salary: number | null
  salary_currency: string
  skills_used: string[] | null
  company_logo_url: string | null
  company_website: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type UserSkill = {
  id: string
  user_id: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'tools' | 'certifications' | 'other'
  proficiency: number
  years_experience: number | null
  certified: boolean
  certification_name: string | null
  certification_issuer: string | null
  certification_date: string | null
  certification_expiry: string | null
  certification_url: string | null
  endorsement_count: number
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CareerGoal = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: 'promotion' | 'skill' | 'salary' | 'education' | 'networking' | 'project' | 'certification' | 'other'
  target_date: string | null
  progress: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  milestones: CareerGoalMilestone[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_public: boolean
  started_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CareerGoalMilestone = {
  id: string
  title: string
  completed: boolean
  dueDate?: string
}

export type Achievement = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: 'promotion' | 'award' | 'project' | 'certification' | 'publication' | 'patent' | 'speaking' | 'other'
  date_achieved: string | null
  issuer: string | null
  certificate_url: string | null
  credential_id: string | null
  is_featured: boolean
  is_public: boolean
  evidence_urls: string[] | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type EducationHistory = {
  id: string
  user_id: string
  institution: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  grade: string | null
  grade_scale: string | null
  activities: string | null
  description: string | null
  institution_logo_url: string | null
  diploma_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SalaryHistory = {
  id: string
  user_id: string
  work_experience_id: string | null
  amount: number
  currency: string
  effective_date: string
  salary_type: 'base' | 'total' | 'bonus' | 'equity'
  notes: string | null
  created_at: string
}

export type ConnectedAccount = {
  id: string
  user_id: string
  provider: 'google' | 'github' | 'linkedin' | 'microsoft' | 'apple' | 'twitter' | 'facebook'
  provider_account_id: string | null
  email: string | null
  name: string | null
  avatar_url: string | null
  scopes: string[] | null
  is_active: boolean
  connected_at: string
  last_used_at: string | null
  metadata: Record<string, unknown>
}

// =====================================================
// USER PROFILE HOOK
// =====================================================

export function useUserProfile() {
  const { supabase, user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile exists, create one
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || null,
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
              avatar_url: user.user_metadata?.avatar_url || null
            })
            .select()
            .single()

          if (createError) throw createError
          setProfile(newProfile)
        } else {
          throw fetchError
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setProfile(data)
      toast.success('Profile updated successfully')
      return data
    } catch (err) {
      toast.error('Failed to update profile')
      throw err
    }
  }

  const updatePreferences = async (preferences: Partial<ProfilePreferences>) => {
    if (!user || !profile) return

    const updatedPreferences = {
      ...profile.preferences,
      ...preferences
    }

    return updateProfile({ preferences: updatedPreferences })
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile
  }
}

// =====================================================
// WORK EXPERIENCE HOOK
// =====================================================

export function useWorkExperiences() {
  const { supabase, user } = useAuth()
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchExperiences = useCallback(async () => {
    if (!user) {
      setExperiences([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (fetchError) throw fetchError
      setExperiences(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching work experiences:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchExperiences()
  }, [fetchExperiences])

  const createExperience = async (experience: Omit<WorkExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('work_experiences')
        .insert({ ...experience, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setExperiences(prev => [data, ...prev])
      toast.success('Work experience added')
      return data
    } catch (err) {
      toast.error('Failed to add work experience')
      throw err
    }
  }

  const updateExperience = async (id: string, updates: Partial<WorkExperience>) => {
    if (!user) return

    try {
      const { data, error: updateError } = await supabase
        .from('work_experiences')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setExperiences(prev => prev.map(exp => exp.id === id ? data : exp))
      toast.success('Work experience updated')
      return data
    } catch (err) {
      toast.error('Failed to update work experience')
      throw err
    }
  }

  const deleteExperience = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('work_experiences')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setExperiences(prev => prev.filter(exp => exp.id !== id))
      toast.success('Work experience deleted')
    } catch (err) {
      toast.error('Failed to delete work experience')
      throw err
    }
  }

  // Calculate total years of experience
  const totalYearsExperience = experiences.reduce((total, exp) => {
    const start = new Date(exp.start_date)
    const end = exp.is_current ? new Date() : new Date(exp.end_date || new Date())
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return total + years
  }, 0)

  return {
    experiences,
    loading,
    error,
    createExperience,
    updateExperience,
    deleteExperience,
    refetch: fetchExperiences,
    totalYearsExperience: Math.round(totalYearsExperience * 10) / 10
  }
}

// =====================================================
// USER SKILLS HOOK
// =====================================================

export function useUserSkills() {
  const { supabase, user } = useAuth()
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSkills = useCallback(async () => {
    if (!user) {
      setSkills([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('proficiency', { ascending: false })

      if (fetchError) throw fetchError
      setSkills(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching skills:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const createSkill = async (skill: Omit<UserSkill, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('user_skills')
        .insert({ ...skill, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setSkills(prev => [...prev, data].sort((a, b) => b.proficiency - a.proficiency))
      toast.success('Skill added')
      return data
    } catch (err) {
      toast.error('Failed to add skill')
      throw err
    }
  }

  const updateSkill = async (id: string, updates: Partial<UserSkill>) => {
    if (!user) return

    try {
      const { data, error: updateError } = await supabase
        .from('user_skills')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setSkills(prev => prev.map(skill => skill.id === id ? data : skill))
      toast.success('Skill updated')
      return data
    } catch (err) {
      toast.error('Failed to update skill')
      throw err
    }
  }

  const deleteSkill = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setSkills(prev => prev.filter(skill => skill.id !== id))
      toast.success('Skill deleted')
    } catch (err) {
      toast.error('Failed to delete skill')
      throw err
    }
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(skill)
    return acc
  }, {} as Record<string, UserSkill[]>)

  // Calculate average proficiency
  const avgProficiency = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length)
    : 0

  return {
    skills,
    skillsByCategory,
    avgProficiency,
    loading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
    refetch: fetchSkills
  }
}

// =====================================================
// CAREER GOALS HOOK
// =====================================================

export function useCareerGoals() {
  const { supabase, user } = useAuth()
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('career_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setGoals(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching career goals:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const createGoal = async (goal: Omit<CareerGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('career_goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setGoals(prev => [data, ...prev])
      toast.success('Career goal added')
      return data
    } catch (err) {
      toast.error('Failed to add career goal')
      throw err
    }
  }

  const updateGoal = async (id: string, updates: Partial<CareerGoal>) => {
    if (!user) return

    try {
      const { data, error: updateError } = await supabase
        .from('career_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setGoals(prev => prev.map(goal => goal.id === id ? data : goal))
      toast.success('Career goal updated')
      return data
    } catch (err) {
      toast.error('Failed to update career goal')
      throw err
    }
  }

  const deleteGoal = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('career_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setGoals(prev => prev.filter(goal => goal.id !== id))
      toast.success('Career goal deleted')
    } catch (err) {
      toast.error('Failed to delete career goal')
      throw err
    }
  }

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    )

    // Recalculate progress based on milestones
    const completedCount = updatedMilestones.filter(m => m.completed).length
    const progress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : goal.progress

    return updateGoal(goalId, { milestones: updatedMilestones, progress })
  }

  // Filter goals by status
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    refetch: fetchGoals
  }
}

// =====================================================
// ACHIEVEMENTS HOOK
// =====================================================

export function useAchievements() {
  const { supabase, user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('date_achieved', { ascending: false })

      if (fetchError) throw fetchError
      setAchievements(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching achievements:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  const createAchievement = async (achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('achievements')
        .insert({ ...achievement, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setAchievements(prev => [data, ...prev])
      toast.success('Achievement added')
      return data
    } catch (err) {
      toast.error('Failed to add achievement')
      throw err
    }
  }

  const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
    if (!user) return

    try {
      const { data, error: updateError } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setAchievements(prev => prev.map(ach => ach.id === id ? data : ach))
      toast.success('Achievement updated')
      return data
    } catch (err) {
      toast.error('Failed to update achievement')
      throw err
    }
  }

  const deleteAchievement = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setAchievements(prev => prev.filter(ach => ach.id !== id))
      toast.success('Achievement deleted')
    } catch (err) {
      toast.error('Failed to delete achievement')
      throw err
    }
  }

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, ach) => {
    const category = ach.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(ach)
    return acc
  }, {} as Record<string, Achievement[]>)

  return {
    achievements,
    achievementsByCategory,
    loading,
    error,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    refetch: fetchAchievements
  }
}

// =====================================================
// EDUCATION HISTORY HOOK
// =====================================================

export function useEducationHistory() {
  const { supabase, user } = useAuth()
  const [education, setEducation] = useState<EducationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEducation = useCallback(async () => {
    if (!user) {
      setEducation([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('education_history')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (fetchError) throw fetchError
      setEducation(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching education history:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchEducation()
  }, [fetchEducation])

  const createEducation = async (edu: Omit<EducationHistory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('education_history')
        .insert({ ...edu, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setEducation(prev => [data, ...prev])
      toast.success('Education added')
      return data
    } catch (err) {
      toast.error('Failed to add education')
      throw err
    }
  }

  const updateEducation = async (id: string, updates: Partial<EducationHistory>) => {
    if (!user) return

    try {
      const { data, error: updateError } = await supabase
        .from('education_history')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setEducation(prev => prev.map(edu => edu.id === id ? data : edu))
      toast.success('Education updated')
      return data
    } catch (err) {
      toast.error('Failed to update education')
      throw err
    }
  }

  const deleteEducation = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('education_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setEducation(prev => prev.filter(edu => edu.id !== id))
      toast.success('Education deleted')
    } catch (err) {
      toast.error('Failed to delete education')
      throw err
    }
  }

  return {
    education,
    loading,
    error,
    createEducation,
    updateEducation,
    deleteEducation,
    refetch: fetchEducation
  }
}

// =====================================================
// SALARY HISTORY HOOK
// =====================================================

export function useSalaryHistory() {
  const { supabase, user } = useAuth()
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSalaryHistory = useCallback(async () => {
    if (!user) {
      setSalaryHistory([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('salary_history')
        .select('*')
        .eq('user_id', user.id)
        .order('effective_date', { ascending: true })

      if (fetchError) throw fetchError
      setSalaryHistory(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching salary history:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchSalaryHistory()
  }, [fetchSalaryHistory])

  const addSalaryEntry = async (entry: Omit<SalaryHistory, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return

    try {
      const { data, error: createError } = await supabase
        .from('salary_history')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      setSalaryHistory(prev => [...prev, data].sort((a, b) => 
        new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
      ))
      toast.success('Salary entry added')
      return data
    } catch (err) {
      toast.error('Failed to add salary entry')
      throw err
    }
  }

  const deleteSalaryEntry = async (id: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('salary_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      setSalaryHistory(prev => prev.filter(entry => entry.id !== id))
      toast.success('Salary entry deleted')
    } catch (err) {
      toast.error('Failed to delete salary entry')
      throw err
    }
  }

  // Format for chart data
  const chartData = salaryHistory.map(entry => ({
    date: entry.effective_date,
    year: new Date(entry.effective_date).getFullYear(),
    amount: entry.amount,
    type: entry.salary_type
  }))

  return {
    salaryHistory,
    chartData,
    loading,
    error,
    addSalaryEntry,
    deleteSalaryEntry,
    refetch: fetchSalaryHistory
  }
}

// =====================================================
// CONNECTED ACCOUNTS HOOK
// =====================================================

export function useConnectedAccounts() {
  const { supabase, user } = useAuth()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('connected_accounts')
        .select('id, user_id, provider, provider_account_id, email, name, avatar_url, scopes, is_active, connected_at, last_used_at, metadata')
        .eq('user_id', user.id)

      if (fetchError) throw fetchError
      setAccounts(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching connected accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const disconnectAccount = async (provider: string) => {
    if (!user) return

    try {
      const { error: deleteError } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (deleteError) throw deleteError
      setAccounts(prev => prev.filter(acc => acc.provider !== provider))
      toast.success(`Disconnected ${provider}`)
    } catch (err) {
      toast.error(`Failed to disconnect ${provider}`)
      throw err
    }
  }

  return {
    accounts,
    loading,
    error,
    disconnectAccount,
    refetch: fetchAccounts
  }
}

// =====================================================
// DATA EXPORT HOOK
// =====================================================

export function useDataExport() {
  const { supabase, user } = useAuth()
  const [exporting, setExporting] = useState(false)

  const requestExport = async () => {
    if (!user) return

    try {
      setExporting(true)
      
      // Create export request record
      const { data: request, error: requestError } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: user.id,
          request_type: 'export',
          status: 'pending'
        })
        .select()
        .single()

      if (requestError) throw requestError

      // In a real implementation, this would trigger a background job
      // For now, we'll collect data directly
      const [
        { data: profile },
        { data: workExp },
        { data: skills },
        { data: goals },
        { data: achievements },
        { data: education }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id),
        supabase.from('work_experiences').select('*').eq('user_id', user.id),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('career_goals').select('*').eq('user_id', user.id),
        supabase.from('achievements').select('*').eq('user_id', user.id),
        supabase.from('education_history').select('*').eq('user_id', user.id)
      ])

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile?.[0] || null,
        work_experiences: workExp || [],
        skills: skills || [],
        career_goals: goals || [],
        achievements: achievements || [],
        education: education || []
      }

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lifehub-profile-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update request status
      await supabase
        .from('data_export_requests')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', request.id)

      toast.success('Data exported successfully')
    } catch (err) {
      toast.error('Failed to export data')
      throw err
    } finally {
      setExporting(false)
    }
  }

  const requestDeletion = async () => {
    if (!user) return

    try {
      const { error: requestError } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: user.id,
          request_type: 'delete',
          status: 'pending'
        })

      if (requestError) throw requestError
      toast.success('Data deletion request submitted. You will be contacted shortly.')
    } catch (err) {
      toast.error('Failed to submit deletion request')
      throw err
    }
  }

  return {
    exporting,
    requestExport,
    requestDeletion
  }
}

