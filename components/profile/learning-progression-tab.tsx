'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Plus, Edit, Trash2, BookOpen, GraduationCap, FileText, Award, Clock, TrendingUp, Calendar, Link as LinkIcon, CheckCircle2, PlayCircle, PauseCircle } from 'lucide-react'

type Course = {
  id: string
  title: string
  platform: string
  instructor: string
  category: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Paused'
  progress: number
  startDate?: string
  completionDate?: string
  certificateUrl?: string
  totalHours: number
  hoursCompleted: number
  rating?: number
  notes: string
}

type Certification = {
  id: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
  skills: string[]
  status: 'Active' | 'Expired' | 'In Progress'
}

type LearningGoal = {
  id: string
  title: string
  description: string
  targetDate: string
  progress: number
  category: string
  milestones: { id: string; title: string; completed: boolean }[]
}

type StudySession = {
  id: string
  date: string
  topic: string
  duration: number // in minutes
  notes: string
  completed: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export function LearningProgressionTab() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      title: 'Advanced React Patterns',
      platform: 'Udemy',
      instructor: 'Kent C. Dodds',
      category: 'Web Development',
      status: 'In Progress',
      progress: 65,
      startDate: '2025-09-01',
      totalHours: 40,
      hoursCompleted: 26,
      rating: 5,
      notes: 'Great course on React patterns and performance optimization'
    },
    {
      id: '2',
      title: 'Machine Learning Fundamentals',
      platform: 'Coursera',
      instructor: 'Andrew Ng',
      category: 'Data Science',
      status: 'Completed',
      progress: 100,
      startDate: '2025-06-15',
      completionDate: '2025-08-30',
      certificateUrl: '#',
      totalHours: 60,
      hoursCompleted: 60,
      rating: 5,
      notes: 'Excellent foundation in ML concepts'
    }
  ])

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2024-03-15',
      expiryDate: '2027-03-15',
      credentialId: 'AWS-SA-12345',
      credentialUrl: 'https://aws.amazon.com/certification/',
      skills: ['Cloud Architecture', 'AWS Services', 'Security', 'Scalability'],
      status: 'Active'
    },
    {
      id: '2',
      name: 'Google Cloud Professional',
      issuer: 'Google Cloud',
      issueDate: '2024-06-20',
      expiryDate: '2026-06-20',
      skills: ['GCP', 'Kubernetes', 'Cloud Infrastructure'],
      status: 'Active'
    }
  ])

  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([
    {
      id: '1',
      title: 'Master Full-Stack Development',
      description: 'Become proficient in modern full-stack technologies',
      targetDate: '2026-12-31',
      progress: 45,
      category: 'Web Development',
      milestones: [
        { id: 'm1', title: 'Complete React Advanced Course', completed: true },
        { id: 'm2', title: 'Build 3 Full-Stack Projects', completed: false },
        { id: 'm3', title: 'Learn GraphQL', completed: false }
      ]
    }
  ])

  const [studySessions, setStudySessions] = useState<StudySession[]>([
    { id: '1', date: '2025-10-20', topic: 'React Hooks Deep Dive', duration: 120, notes: 'Studied useReducer and custom hooks', completed: true },
    { id: '2', date: '2025-10-19', topic: 'Machine Learning Algorithms', duration: 90, notes: 'Reviewed classification algorithms', completed: true },
    { id: '3', date: '2025-10-18', topic: 'System Design Patterns', duration: 150, notes: 'Microservices architecture', completed: true }
  ])

  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const [addCertOpen, setAddCertOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addSessionOpen, setAddSessionOpen] = useState(false)

  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    platform: '',
    instructor: '',
    category: '',
    status: 'Not Started',
    progress: 0,
    totalHours: 0,
    hoursCompleted: 0,
    notes: ''
  })

  const [newCert, setNewCert] = useState<Partial<Certification>>({
    name: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    skills: [],
    status: 'Active'
  })

  const [newGoal, setNewGoal] = useState<Partial<LearningGoal>>({
    title: '',
    description: '',
    targetDate: '',
    progress: 0,
    category: '',
    milestones: []
  })

  const [newSession, setNewSession] = useState<Partial<StudySession>>({
    date: new Date().toISOString().split('T')[0],
    topic: '',
    duration: 60,
    notes: '',
    completed: false
  })

  // Calculate stats
  const totalCourses = courses.length
  const completedCourses = courses.filter(c => c.status === 'Completed').length
  const inProgressCourses = courses.filter(c => c.status === 'In Progress').length
  const totalHoursStudied = courses.reduce((sum, c) => sum + c.hoursCompleted, 0)
  const activeCertifications = certifications.filter(c => c.status === 'Active').length
  const totalStudySessionsThisWeek = studySessions.filter(s => {
    const sessionDate = new Date(s.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return sessionDate >= weekAgo
  }).length
  const weeklyStudyMinutes = studySessions
    .filter(s => {
      const sessionDate = new Date(s.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return sessionDate >= weekAgo
    })
    .reduce((sum, s) => sum + s.duration, 0)

  // Chart data
  const courseStatusData = [
    { name: 'Completed', value: completedCourses, fill: '#10b981' },
    { name: 'In Progress', value: inProgressCourses, fill: '#3b82f6' },
    { name: 'Not Started', value: courses.filter(c => c.status === 'Not Started').length, fill: '#94a3b8' },
    { name: 'Paused', value: courses.filter(c => c.status === 'Paused').length, fill: '#f59e0b' }
  ].filter(item => item.value > 0)

  const learningTrendData = studySessions
    .slice(-7)
    .reverse()
    .map(session => ({
      date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: session.duration
    }))

  const categoryData = courses.reduce((acc, course) => {
    const existing = acc.find(item => item.category === course.category)
    if (existing) {
      existing.count++
    } else {
      acc.push({ category: course.category, count: 1 })
    }
    return acc
  }, [] as { category: string; count: number }[])

  const addCourse = () => {
    if (!newCourse.title) return
    const course: Course = {
      id: Date.now().toString(),
      title: newCourse.title,
      platform: newCourse.platform || '',
      instructor: newCourse.instructor || '',
      category: newCourse.category || 'General',
      status: newCourse.status || 'Not Started',
      progress: newCourse.progress || 0,
      startDate: newCourse.startDate,
      completionDate: newCourse.completionDate,
      certificateUrl: newCourse.certificateUrl,
      totalHours: newCourse.totalHours || 0,
      hoursCompleted: newCourse.hoursCompleted || 0,
      rating: newCourse.rating,
      notes: newCourse.notes || ''
    }
    setCourses([course, ...courses])
    setNewCourse({ title: '', platform: '', instructor: '', category: '', status: 'Not Started', progress: 0, totalHours: 0, hoursCompleted: 0, notes: '' })
    setAddCourseOpen(false)
  }

  const addCertification = () => {
    if (!newCert.name) return
    const cert: Certification = {
      id: Date.now().toString(),
      name: newCert.name,
      issuer: newCert.issuer || '',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate,
      credentialId: newCert.credentialId,
      credentialUrl: newCert.credentialUrl,
      skills: newCert.skills || [],
      status: newCert.status || 'Active'
    }
    setCertifications([cert, ...certifications])
    setNewCert({ name: '', issuer: '', issueDate: new Date().toISOString().split('T')[0], skills: [], status: 'Active' })
    setAddCertOpen(false)
  }

  const addGoal = () => {
    if (!newGoal.title) return
    const goal: LearningGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description || '',
      targetDate: newGoal.targetDate || '',
      progress: newGoal.progress || 0,
      category: newGoal.category || 'General',
      milestones: newGoal.milestones || []
    }
    setLearningGoals([...learningGoals, goal])
    setNewGoal({ title: '', description: '', targetDate: '', progress: 0, category: '', milestones: [] })
    setAddGoalOpen(false)
  }

  const addStudySession = () => {
    if (!newSession.topic) return
    const session: StudySession = {
      id: Date.now().toString(),
      date: newSession.date || new Date().toISOString().split('T')[0],
      topic: newSession.topic,
      duration: newSession.duration || 60,
      notes: newSession.notes || '',
      completed: true
    }
    setStudySessions([session, ...studySessions])
    setNewSession({ date: new Date().toISOString().split('T')[0], topic: '', duration: 60, notes: '', completed: false })
    setAddSessionOpen(false)
  }

  const updateCourseProgress = (courseId: string, newProgress: number) => {
    setCourses(courses.map(c => c.id === courseId ? { ...c, progress: newProgress, hoursCompleted: Math.round((newProgress / 100) * c.totalHours) } : c))
  }

  return (
    <div className="space-y-6">
      {/* Learning Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalCourses}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{completedCourses} completed</p>
              </div>
              <BookOpen className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Certifications</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{activeCertifications}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Active</p>
              </div>
              <Award className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Study Hours</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{totalHoursStudied}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Total logged</p>
              </div>
              <Clock className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">This Week</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{(weeklyStudyMinutes / 60).toFixed(1)}h</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{totalStudySessionsThisWeek} sessions</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Time Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={learningTrendData}>
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Courses
          </CardTitle>
          <Button onClick={() => setAddCourseOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Course
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{course.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      course.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      course.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      course.status === 'Paused' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">{course.platform}</span>
                    {course.instructor && <span>Instructor: {course.instructor}</span>}
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                      {course.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {course.hoursCompleted} / {course.totalHours} hours completed
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCourses(courses.filter(c => c.id !== course.id))}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-bold">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={course.progress}
                  onChange={(e) => updateCourseProgress(course.id, parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              {course.notes && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border-l-2 border-l-blue-500">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{course.notes}</p>
                </div>
              )}

              {course.certificateUrl && (
                <div className="mt-2">
                  <a href={course.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    <Award className="w-4 h-4" />
                    View Certificate
                  </a>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Certifications & Credentials
          </CardTitle>
          <Button onClick={() => setAddCertOpen(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Certification
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        cert.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        cert.status === 'Expired' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{cert.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{cert.issuer}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <p>Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      {cert.expiryDate && (
                        <p>Expires: {new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      )}
                      {cert.credentialId && <p>ID: {cert.credentialId}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCertifications(certifications.filter(c => c.id !== cert.id))}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                {cert.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cert.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                    <LinkIcon className="w-4 h-4" />
                    View Credential
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Learning Goals
          </CardTitle>
          <Button onClick={() => setAddGoalOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {learningGoals.map((goal) => (
            <div key={goal.id} className="border-l-4 border-l-indigo-600 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-r-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{goal.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                      {goal.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setLearningGoals(learningGoals.filter(g => g.id !== goal.id))}>
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

              {goal.milestones.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Milestones:</p>
                  <div className="space-y-1">
                    {goal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 ${milestone.completed ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Study Sessions Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Study Sessions
          </CardTitle>
          <Button onClick={() => setAddSessionOpen(true)} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Log Session
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {studySessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{session.topic}</h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration: {session.duration} minutes</p>
                  {session.notes && <p className="text-sm text-gray-700 dark:text-gray-300">{session.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setStudySessions(studySessions.filter(s => s.id !== session.id))}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Course Title *</Label>
              <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g., Advanced React Patterns" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform</Label>
                <Input value={newCourse.platform} onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })} placeholder="e.g., Udemy, Coursera" />
              </div>
              <div>
                <Label>Instructor</Label>
                <Input value={newCourse.instructor} onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={newCourse.category} onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })} placeholder="e.g., Web Development" />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={newCourse.status}
                  onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value as Course['status'] })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Hours</Label>
                <Input type="number" value={newCourse.totalHours} onChange={(e) => setNewCourse({ ...newCourse, totalHours: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Progress: {newCourse.progress}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newCourse.progress}
                  onChange={(e) => setNewCourse({ ...newCourse, progress: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newCourse.notes} onChange={(e) => setNewCourse({ ...newCourse, notes: e.target.value })} rows={3} placeholder="Course notes, key learnings, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCourseOpen(false)}>Cancel</Button>
            <Button onClick={addCourse} className="bg-blue-600 hover:bg-blue-700">Add Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={addCertOpen} onOpenChange={setAddCertOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Certification Name *</Label>
              <Input value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} placeholder="e.g., AWS Certified Solutions Architect" />
            </div>
            <div>
              <Label>Issuing Organization</Label>
              <Input value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} placeholder="e.g., Amazon Web Services" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={newCert.issueDate} onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={newCert.expiryDate} onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Credential ID</Label>
              <Input value={newCert.credentialId} onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })} />
            </div>
            <div>
              <Label>Credential URL</Label>
              <Input value={newCert.credentialUrl} onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCertOpen(false)}>Cancel</Button>
            <Button onClick={addCertification} className="bg-purple-600 hover:bg-purple-700">Add Certification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Learning Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Goal Title *</Label>
              <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g., Master Full-Stack Development" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} placeholder="e.g., Web Development" />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Progress: {newGoal.progress}%</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={newGoal.progress}
                onChange={(e) => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>Cancel</Button>
            <Button onClick={addGoal} className="bg-indigo-600 hover:bg-indigo-700">Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Study Session Dialog */}
      <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Topic *</Label>
              <Input value={newSession.topic} onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })} placeholder="What did you study?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={newSession.date} onChange={(e) => setNewSession({ ...newSession, date: e.target.value })} />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" value={newSession.duration} onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newSession.notes} onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })} rows={3} placeholder="What did you learn? Key takeaways?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSessionOpen(false)}>Cancel</Button>
            <Button onClick={addStudySession} className="bg-green-600 hover:bg-green-700">Log Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



