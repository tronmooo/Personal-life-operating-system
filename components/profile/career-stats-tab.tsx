'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { 
  Plus, Trash2, Briefcase, Star, Award, TrendingUp, 
  MapPin, Calendar, DollarSign, Target, Trophy, Building2, 
  Code, Users, Languages, Wrench, ChevronRight, Loader2
} from 'lucide-react'
import {
  useWorkExperiences,
  useUserSkills,
  useCareerGoals,
  useAchievements,
  useSalaryHistory,
  type WorkExperience,
  type UserSkill,
  type CareerGoal,
  type Achievement,
  type CareerGoalMilestone
} from '@/lib/hooks/use-profile'

const SKILL_CATEGORY_ICONS = {
  technical: Code,
  soft: Users,
  language: Languages,
  tools: Wrench,
  certifications: Award,
  other: Star
}

const SKILL_CATEGORY_COLORS = {
  technical: '#3b82f6',
  soft: '#10b981',
  language: '#f59e0b',
  tools: '#8b5cf6',
  certifications: '#ec4899',
  other: '#64748b'
}

const ACHIEVEMENT_TYPE_COLORS = {
  promotion: '#10b981',
  award: '#f59e0b',
  project: '#3b82f6',
  certification: '#8b5cf6',
  publication: '#ec4899',
  patent: '#06b6d4',
  speaking: '#f97316',
  other: '#64748b'
}

export function CareerStatsTab() {
  // Hooks for data from Supabase
  const { 
    experiences, 
    loading: expLoading, 
    createExperience, 
    deleteExperience,
    totalYearsExperience 
  } = useWorkExperiences()
  
  const { 
    skills, 
    skillsByCategory, 
    avgProficiency,
    loading: skillsLoading, 
    createSkill, 
    deleteSkill 
  } = useUserSkills()
  
  const { 
    goals, 
    loading: goalsLoading, 
    createGoal, 
    deleteGoal,
    toggleMilestone 
  } = useCareerGoals()
  
  const { 
    achievements, 
    loading: achievementsLoading, 
    createAchievement, 
    deleteAchievement 
  } = useAchievements()

  const { salaryHistory, chartData: salaryChartData } = useSalaryHistory()

  // Modal states
  const [addExperienceOpen, setAddExperienceOpen] = useState(false)
  const [addSkillOpen, setAddSkillOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addAchievementOpen, setAddAchievementOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    location: '',
    employment_type: 'full-time' as const,
    start_date: '',
    end_date: '',
    is_current: false,
    salary: '',
    salary_currency: 'USD',
    description: '',
    achievements: [] as string[],
    skills_used: [] as string[]
  })

  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'technical' as const,
    proficiency: 50,
    years_experience: 1
  })

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'skill' as const,
    target_date: '',
    progress: 0,
    status: 'active' as const,
    milestones: [] as CareerGoalMilestone[],
    priority: 'medium' as const
  })

  const [newAchievement, setNewAchievement] = useState({
    title: '',
    category: 'award' as const,
    date_achieved: new Date().toISOString().split('T')[0],
    description: '',
    issuer: ''
  })

  const [milestoneInput, setMilestoneInput] = useState('')
  const [achievementInput, setAchievementInput] = useState('')

  // Loading state
  const isLoading = expLoading || skillsLoading || goalsLoading || achievementsLoading

  // Calculate stats
  const skillsMastered = skills.filter(s => s.proficiency >= 80).length

  // Prepare chart data
  const salaryData = experiences
    .filter(exp => exp.salary)
    .map(exp => ({
      position: exp.position.length > 15 ? exp.position.slice(0, 15) + '...' : exp.position,
      salary: exp.salary,
      year: new Date(exp.start_date).getFullYear()
    }))
    .reverse()

  const skillRadarData = ['technical', 'soft', 'language', 'tools'].map(category => {
    const categorySkills = skills.filter(s => s.category === category)
    const avgProf = categorySkills.length > 0
      ? categorySkills.reduce((sum, s) => sum + s.proficiency, 0) / categorySkills.length
      : 0
    return { 
      category: category.charAt(0).toUpperCase() + category.slice(1), 
      proficiency: Math.round(avgProf), 
      fullMark: 100 
    }
  })

  // Handler functions
  const handleAddExperience = async () => {
    if (!newExperience.company || !newExperience.position) return
    setSaving(true)
    try {
      await createExperience({
        company: newExperience.company,
        position: newExperience.position,
        location: newExperience.location || null,
        employment_type: newExperience.employment_type,
        start_date: newExperience.start_date || new Date().toISOString().split('T')[0],
        end_date: newExperience.is_current ? null : (newExperience.end_date || null),
        is_current: newExperience.is_current,
        salary: newExperience.salary ? parseFloat(newExperience.salary) : null,
        salary_currency: newExperience.salary_currency,
        description: newExperience.description || null,
        achievements: newExperience.achievements.length > 0 ? newExperience.achievements : null,
        skills_used: newExperience.skills_used.length > 0 ? newExperience.skills_used : null,
        company_logo_url: null,
        company_website: null,
        metadata: {}
      })
      setNewExperience({
        company: '',
        position: '',
        location: '',
        employment_type: 'full-time',
        start_date: '',
        end_date: '',
        is_current: false,
        salary: '',
        salary_currency: 'USD',
        description: '',
        achievements: [],
        skills_used: []
      })
      setAddExperienceOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.name) return
    setSaving(true)
    try {
      await createSkill({
        name: newSkill.name,
        category: newSkill.category,
        proficiency: newSkill.proficiency,
        years_experience: newSkill.years_experience,
        certified: false,
        certification_name: null,
        certification_issuer: null,
        certification_date: null,
        certification_expiry: null,
        certification_url: null,
        endorsement_count: 0,
        is_featured: false,
        metadata: {}
      })
      setNewSkill({ name: '', category: 'technical', proficiency: 50, years_experience: 1 })
      setAddSkillOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.title) return
    setSaving(true)
    try {
      await createGoal({
        title: newGoal.title,
        description: newGoal.description || null,
        category: newGoal.category,
        target_date: newGoal.target_date || null,
        progress: newGoal.progress,
        status: newGoal.status,
        milestones: newGoal.milestones,
        priority: newGoal.priority,
        is_public: false,
        started_at: new Date().toISOString(),
        completed_at: null,
        metadata: {}
      })
      setNewGoal({
        title: '',
        description: '',
        category: 'skill',
        target_date: '',
        progress: 0,
        status: 'active',
        milestones: [],
        priority: 'medium'
      })
      setAddGoalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAchievement = async () => {
    if (!newAchievement.title) return
    setSaving(true)
    try {
      await createAchievement({
        title: newAchievement.title,
        description: newAchievement.description || null,
        category: newAchievement.category,
        date_achieved: newAchievement.date_achieved || null,
        issuer: newAchievement.issuer || null,
        certificate_url: null,
        credential_id: null,
        is_featured: true,
        is_public: false,
        evidence_urls: null,
        metadata: {}
      })
      setNewAchievement({
        title: '',
        category: 'award',
        date_achieved: new Date().toISOString().split('T')[0],
        description: '',
        issuer: ''
      })
      setAddAchievementOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const addMilestone = () => {
    if (!milestoneInput) return
    const milestone: CareerGoalMilestone = {
      id: Date.now().toString(),
      title: milestoneInput,
      completed: false
    }
    setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, milestone] })
    setMilestoneInput('')
  }

  const addExperienceAchievement = () => {
    if (!achievementInput) return
    setNewExperience({ 
      ...newExperience, 
      achievements: [...newExperience.achievements, achievementInput] 
    })
    setAchievementInput('')
  }

  const formatSalary = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  }

  const formatDateRange = (start: string, end?: string | null, isCurrent?: boolean) => {
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (isCurrent) return `${startDate} - Present`
    if (end) return `${startDate} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    return startDate
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Career Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Experience</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalYearsExperience.toFixed(1)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Years total</p>
              </div>
              <Briefcase className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Skills</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{skills.length}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{skillsMastered} mastered</p>
              </div>
              <Star className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Avg. Proficiency</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{avgProficiency}%</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Across all skills</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Achievements</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{achievements.length}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Career milestones</p>
              </div>
              <Trophy className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Proficiency by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {skills.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Proficiency" dataKey="proficiency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Add skills to see proficiency chart
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Progression</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salaryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salaryData}>
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis 
                    stroke="#94a3b8" 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Salary']}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Line type="monotone" dataKey="salary" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Add work experiences with salary to see progression
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Work Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Work Experience
          </CardTitle>
          <Button onClick={() => setAddExperienceOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {experiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No work experience added yet. Click &ldquo;Add Experience&rdquo; to get started.
            </div>
          ) : (
            experiences.map((exp, index) => (
              <div key={exp.id} className="relative pl-6 pb-6 last:pb-0">
                {index < experiences.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 ${
                  exp.is_current 
                    ? 'bg-green-500 border-green-200 dark:border-green-900' 
                    : 'bg-gray-400 border-gray-200 dark:border-gray-700'
                }`} />
                
                <div className="ml-4 p-4 border rounded-lg bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{exp.position}</h3>
                        {exp.is_current && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold">{exp.company}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {exp.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                        </span>
                        {exp.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatSalary(exp.salary, exp.salary_currency)}/yr
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteExperience(exp.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  
                  {exp.description && (
                    <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm">{exp.description}</p>
                  )}
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Key Achievements:</p>
                      <ul className="space-y-1">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Skills Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Skills Matrix
          </CardTitle>
          <Button onClick={() => setAddSkillOpen(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Skill
          </Button>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No skills added yet. Click &ldquo;Add Skill&rdquo; to get started.
            </div>
          ) : (
            Object.entries(skillsByCategory).map(([category, categorySkills]) => {
              const Icon = SKILL_CATEGORY_ICONS[category as keyof typeof SKILL_CATEGORY_ICONS] || Code
              const color = SKILL_CATEGORY_COLORS[category as keyof typeof SKILL_CATEGORY_COLORS] || '#3b82f6'
              
              return (
                <div key={category} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <h4 className="font-semibold text-lg capitalize">{category} Skills</h4>
                    <span className="text-sm text-gray-500">({categorySkills.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categorySkills.map(skill => (
                      <div key={skill.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{skill.name}</h5>
                            {skill.years_experience && (
                              <span className="text-xs text-gray-500">{skill.years_experience}y</span>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSkill(skill.id)}>
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={skill.proficiency} className="h-2 flex-1" />
                          <span className="text-sm font-semibold" style={{ color }}>{skill.proficiency}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Career Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Career Goals
          </CardTitle>
          <Button onClick={() => setAddGoalOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No career goals added yet. Click &ldquo;Add Goal&rdquo; to get started.
            </div>
          ) : (
            goals.map(goal => (
              <div key={goal.id} className="border-l-4 border-l-indigo-600 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-r-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{goal.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        goal.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        goal.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        goal.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{goal.description}</p>
                    )}
                    {goal.target_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-bold">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-3" />
                </div>

                {goal.milestones && goal.milestones.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Milestones:</p>
                    <div className="space-y-1">
                      {goal.milestones.map(milestone => (
                        <div 
                          key={milestone.id} 
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 p-1 rounded"
                          onClick={() => toggleMilestone(goal.id, milestone.id)}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            milestone.completed ? 'bg-green-500 border-green-500' : 'border-gray-400'
                          }`}>
                            {milestone.completed && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements & Awards
          </CardTitle>
          <Button onClick={() => setAddAchievementOpen(true)} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Add Achievement
          </Button>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No achievements added yet. Click &ldquo;Add Achievement&rdquo; to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg" 
                        style={{ backgroundColor: `${ACHIEVEMENT_TYPE_COLORS[achievement.category] || '#64748b'}20` }}
                      >
                        <Trophy className="w-5 h-5" style={{ color: ACHIEVEMENT_TYPE_COLORS[achievement.category] || '#64748b' }} />
                      </div>
                      <span 
                        className="px-2 py-0.5 text-xs rounded-full font-semibold capitalize"
                        style={{ 
                          backgroundColor: `${ACHIEVEMENT_TYPE_COLORS[achievement.category] || '#64748b'}20`,
                          color: ACHIEVEMENT_TYPE_COLORS[achievement.category] || '#64748b'
                        }}
                      >
                        {achievement.category}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteAchievement(achievement.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{achievement.title}</h3>
                  {achievement.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {achievement.date_achieved && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(achievement.date_achieved).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {achievement.issuer && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {achievement.issuer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Experience Dialog */}
      <Dialog open={addExperienceOpen} onOpenChange={setAddExperienceOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Work Experience</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company *</Label>
                <Input value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <Label>Position *</Label>
                <Input value={newExperience.position} onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })} placeholder="Job title" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={newExperience.location} onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })} placeholder="City, State or Remote" />
              </div>
              <div>
                <Label>Employment Type</Label>
                <select
                  value={newExperience.employment_type}
                  onChange={(e) => setNewExperience({ ...newExperience, employment_type: e.target.value as any })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newExperience.start_date} onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newExperience.end_date} onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })} disabled={newExperience.is_current} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={newExperience.is_current} 
                onChange={(e) => setNewExperience({ ...newExperience, is_current: e.target.checked })}
                className="w-4 h-4"
              />
              <Label>This is my current position</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salary</Label>
                <Input type="number" value={newExperience.salary} onChange={(e) => setNewExperience({ ...newExperience, salary: e.target.value })} placeholder="Annual salary" />
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  value={newExperience.salary_currency}
                  onChange={(e) => setNewExperience({ ...newExperience, salary_currency: e.target.value })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newExperience.description} onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} rows={3} placeholder="Job responsibilities and accomplishments" />
            </div>
            <div>
              <Label>Key Achievements</Label>
              <div className="flex gap-2">
                <Input 
                  value={achievementInput} 
                  onChange={(e) => setAchievementInput(e.target.value)} 
                  placeholder="Add an achievement"
                  onKeyDown={(e) => e.key === 'Enter' && addExperienceAchievement()}
                />
                <Button onClick={addExperienceAchievement} type="button" variant="outline">Add</Button>
              </div>
              {newExperience.achievements.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newExperience.achievements.map((ach, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <ChevronRight className="w-4 h-4 text-green-600" />
                      <span>{ach}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-auto"
                        onClick={() => setNewExperience({ 
                          ...newExperience, 
                          achievements: newExperience.achievements.filter((_, idx) => idx !== i) 
                        })}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExperienceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExperience} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Skill Name *</Label>
              <Input value={newSkill.name} onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g., TypeScript, Leadership" />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
              >
                <option value="technical">Technical</option>
                <option value="soft">Soft Skills</option>
                <option value="language">Language</option>
                <option value="tools">Tools</option>
                <option value="certifications">Certifications</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Proficiency: {newSkill.proficiency}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={newSkill.proficiency}
                onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input type="number" value={newSkill.years_experience} onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSkillOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSkill} className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Career Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Career Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Goal Title *</Label>
              <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g., Become Engineering Manager" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="promotion">Promotion</option>
                  <option value="skill">Skill Development</option>
                  <option value="salary">Salary</option>
                  <option value="education">Education</option>
                  <option value="networking">Networking</option>
                  <option value="project">Project</option>
                  <option value="certification">Certification</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as any })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Target Date</Label>
              <Input type="date" value={newGoal.target_date} onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })} />
            </div>
            <div>
              <Label>Add Milestones</Label>
              <div className="flex gap-2">
                <Input value={milestoneInput} onChange={(e) => setMilestoneInput(e.target.value)} placeholder="Milestone title" onKeyDown={(e) => e.key === 'Enter' && addMilestone()} />
                <Button onClick={addMilestone} type="button" variant="outline">Add</Button>
              </div>
              {newGoal.milestones.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newGoal.milestones.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <span>{i + 1}. {m.title}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-auto"
                        onClick={() => setNewGoal({ ...newGoal, milestones: newGoal.milestones.filter(ms => ms.id !== m.id) })}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGoal} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Achievement Dialog */}
      <Dialog open={addAchievementOpen} onOpenChange={setAddAchievementOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Achievement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Achievement Title *</Label>
              <Input value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} placeholder="e.g., Employee of the Quarter" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <select
                  value={newAchievement.category}
                  onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value as any })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="promotion">Promotion</option>
                  <option value="award">Award</option>
                  <option value="project">Project</option>
                  <option value="certification">Certification</option>
                  <option value="publication">Publication</option>
                  <option value="patent">Patent</option>
                  <option value="speaking">Speaking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={newAchievement.date_achieved} onChange={(e) => setNewAchievement({ ...newAchievement, date_achieved: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Issuer/Company (optional)</Label>
              <Input value={newAchievement.issuer} onChange={(e) => setNewAchievement({ ...newAchievement, issuer: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAchievementOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAchievement} className="bg-orange-600 hover:bg-orange-700" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
