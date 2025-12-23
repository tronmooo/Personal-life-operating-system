'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Plus, Eye, Edit, Trash2, Download, Calendar, FileText, Target, Clock, BookOpen, Plane, GraduationCap, User as UserIcon, ArrowLeft, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DocumentUpload } from '@/components/ui/document-upload'
import { CareerStatsTab } from '@/components/profile/career-stats-tab'
import { LearningProgressionTab } from '@/components/profile/learning-progression-tab'
import { TimeManagementTab } from '@/components/profile/time-management-tab'
import { ProfileSettingsTab } from '@/components/profile/profile-settings-tab'

type Goal = { 
  id: string
  title: string
  category: 'Personal'|'Professional'|'Fitness'|'Learning'
  due: string
  progress: number 
}

type Doc = {
  id: string
  title: string
  type: 'Travel'|'Concert'|'Insurance'
  date: string
  details: string
}

type Diploma = {
  id: string
  title: string
  issuer: string
  date: string
  skills: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  
  // --- Mock Data ---
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'g1', title: 'Run a Marathon', category: 'Fitness', due: '2024-06-14', progress: 30 },
    { id: 'g2', title: 'Learn Spanish B1 level', category: 'Learning', due: '2024-08-01', progress: 45 },
    { id: 'g3', title: 'Finish TypeScript Course', category: 'Professional', due: '2025-11-30', progress: 70 },
  ])

  const [documents, setDocuments] = useState<Doc[]>([
    { id: 'd1', title: 'Japan Flight Tickets', type: 'Travel', date: '2024-05-19', details: 'Flight from NYC to Tokyo' },
    { id: 'd2', title: 'Coldplay Concert', type: 'Concert', date: '2024-04-14', details: 'Madison Square Garden' },
    { id: 'd3', title: 'Annual Insurance', type: 'Insurance', date: '2024-03-01', details: 'Health & Auto' },
  ])

  const [diplomas, setDiplomas] = useState<Diploma[]>([
    { id: 'dip1', title: 'Google Project Management', issuer: 'Coursera', date: '2023-10-14', skills: ['Project Management', 'Agile', 'Leadership'] },
  ])

  const timeData = [
    { name: 'Work', hours: 42, fill: '#3b82f6' },
    { name: 'Learning', hours: 8, fill: '#06b6d4' },
    { name: 'Health', hours: 5, fill: '#8b5cf6' },
    { name: 'Social', hours: 10, fill: '#ec4899' },
    { name: 'Entertainment', hours: 7, fill: '#60a5fa' },
  ]

  const learningData = [
    { name: 'Books', value: 7 },
    { name: 'Courses', value: 3 },
    { name: 'Certs', value: 1 },
  ]

  const focusTimeData = [
    { week: 'Week 1', hours: 12 },
    { week: 'Week 2', hours: 15 },
    { week: 'Week 3', hours: 10 },
    { week: 'Week 4', hours: 18 },
  ]

  const COLORS = ['#60a5fa', '#34d399', '#f59e0b']

  const goalsByCategory = useMemo(() => {
    return [
      { name: 'Personal', count: goals.filter(g => g.category === 'Personal').length },
      { name: 'Professional', count: goals.filter(g => g.category === 'Professional').length },
      { name: 'Fitness', count: goals.filter(g => g.category === 'Fitness').length },
      { name: 'Learning', count: goals.filter(g => g.category === 'Learning').length },
    ]
  }, [goals])

  const [newGoal, setNewGoal] = useState<{ title: string; category: Goal['category']; due: string }>({ 
    title: '', 
    category: 'Personal', 
    due: '' 
  })
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addDocOpen, setAddDocOpen] = useState(false)
  const [addDiplomaOpen, setAddDiplomaOpen] = useState(false)

  const addGoal = (): void => {
    if (!newGoal.title) return
    setGoals([
      { 
        id: String(Date.now()), 
        title: newGoal.title, 
        category: newGoal.category, 
        due: newGoal.due || '', 
        progress: 0 
      }, 
      ...goals
    ])
    setNewGoal({ title: '', category: 'Personal', due: '' })
    setAddGoalOpen(false)
  }

  const deleteGoal = (id: string) => {
    if (confirm('Delete this goal?')) setGoals(goals.filter(g => g.id !== id))
  }

  const deleteDoc = (id: string) => {
    if (confirm('Delete this document?')) setDocuments(documents.filter(d => d.id !== id))
  }

  const deleteDiploma = (id: string) => {
    if (confirm('Delete this diploma?')) setDiplomas(diplomas.filter(d => d.id !== id))
  }

  const [activeTab, setActiveTab] = useState('goals')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/settings')}
            className="mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">Comprehensive tracking for goals, time, learning, career, documents, and more</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 md:max-w-full overflow-x-auto bg-white dark:bg-slate-900 p-1 rounded-xl">
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Time</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Career</span>
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="diplomas" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Diplomas</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddGoalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Add Goal
              </Button>
            </div>

            <div className="grid gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="border-l-4 border-l-blue-600 bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold">{goal.title}</h3>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                          {goal.category}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="mb-3">
                      <Progress value={goal.progress} className="h-3" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Deadline: {new Date(goal.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="font-bold">{goal.progress}% complete</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Time Management Tab */}
          <TabsContent value="time" className="mt-6">
            <TimeManagementTab />
          </TabsContent>

          {/* Learning Progression Tab */}
          <TabsContent value="learning" className="mt-6">
            <LearningProgressionTab />
          </TabsContent>

          {/* Career Stats Tab */}
          <TabsContent value="career" className="mt-6">
            <CareerStatsTab />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="travel" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddDocOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Add Document
              </Button>
            </div>

            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-l-4 border-l-blue-600 bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block mb-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                          {doc.type}
                        </span>
                        <h3 className="text-xl font-bold mb-2">{doc.title}</h3>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(doc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{doc.details}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Diplomas Tab */}
          <TabsContent value="diplomas" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddDiplomaOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Add Diploma
              </Button>
            </div>

            <div className="grid gap-4">
              {diplomas.map((diploma) => (
                <Card key={diploma.id} className="border-l-4 border-l-indigo-600 bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{diploma.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-semibold">Issuer:</span> {diploma.issuer}
                        </p>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(diploma.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {diploma.skills.map((skill) => (
                            <span key={skill} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDiploma(diploma.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="mt-6">
            <ProfileSettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Quick Add Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="goalTitle">Goal Title</Label>
              <Input
                id="goalTitle"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={newGoal.due}
                onChange={(e) => setNewGoal({ ...newGoal, due: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
                className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-slate-800"
              >
                <option value="Personal">Personal</option>
                <option value="Professional">Professional</option>
                <option value="Fitness">Fitness</option>
                <option value="Learning">Learning</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>Cancel</Button>
            <Button onClick={addGoal} className="bg-blue-600 hover:bg-blue-700">Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload travel documents, concert tickets, insurance PDFs, etc. with OCR extraction
            </p>
            <DocumentUpload
              domain="personal"
              enableOCR={true}
              label="Upload Document"
              onUploadComplete={(fileId, extractedMetadata) => {
                console.log('Document uploaded:', fileId, extractedMetadata)
                alert('Document uploaded successfully!')
                setAddDocOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Diploma Dialog */}
      <Dialog open={addDiplomaOpen} onOpenChange={setAddDiplomaOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Diploma / Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload diplomas, certifications, or course completion certificates with OCR extraction
            </p>
            <DocumentUpload
              domain="education"
              enableOCR={true}
              label="Upload Diploma"
              onUploadComplete={(fileId, extractedMetadata) => {
                console.log('Diploma uploaded:', fileId, extractedMetadata)
                alert('Diploma uploaded successfully!')
                setAddDiplomaOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
