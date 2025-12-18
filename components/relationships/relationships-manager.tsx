'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { sanitizeInput, isValidEmail, isValidDate } from '@/lib/validation'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import {
  Heart,
  Search,
  Plus,
  Users,
  Calendar as CalendarIcon,
  Bell,
  Star,
  Gift,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail
} from 'lucide-react'
import { DomainBackButton } from '@/components/ui/domain-back-button'

interface Person {
  id: string
  userId: string
  name: string
  relationship: string
  birthday?: string
  email?: string
  phone?: string
  notes?: string
  lastContact?: string
  isFavorite: boolean
  hobbies?: string
  favoriteThings?: string
  anniversaryDate?: string
  howWeMet?: string
  importantDates?: Array<{ date: string; label: string; type?: string }>
  createdAt: string
  updatedAt: string
}

interface Reminder {
  id: string
  userId: string
  personId: string
  reminderDate: string
  title: string
  notes?: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

type Tab = 'dashboard' | 'calendar' | 'reminders'

export function RelationshipsManager() {
  const { getData, addData, updateData, deleteData, isLoaded } = useData()
  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [people, setPeople] = useState<Person[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [reminderFormData, setReminderFormData] = useState({
    title: '',
    reminderDate: '',
    notes: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    relationship: 'friend',
    birthday: '',
    email: '',
    phone: '',
    notes: '',
    isFavorite: false,
    hobbies: '',
    favoriteThings: '',
    anniversaryDate: '',
    howWeMet: '',
    importantDates: [] as Array<{ date: string; label: string; type?: string }>
  })

  // Wait for DataProvider to be loaded
  useEffect(() => {
    if (isLoaded) {
      loadPeople()
      loadReminders()
    }
  }, [isLoaded])
  
  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => {
      if (isLoaded) loadPeople()
    }
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('relationships-data-updated', handleUpdate as any)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('relationships-data-updated', handleUpdate as any)
    }
  }, [isLoaded])

  const loadPeople = () => {
    try {
      setLoading(true)
      const relationshipsData = (getData('relationships') || []) as any[]
      console.log(`👥 Loading ${relationshipsData.length} relationships from DataProvider`)
      
      // Transform domain entries to Person format
      const transformedPeople: Person[] = relationshipsData
        .map((item: any) => {
          // Handle double-nesting bug
          let m = item?.metadata || {}
          if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
            m = m.metadata
          }
          
          return {
            id: item.id,
            userId: item.user_id || 'unknown',
            name: m.name || item.title || 'Unnamed',
            relationship: m.relationship || 'friend',
            birthday: m.birthday,
            email: m.email,
            phone: m.phone,
            notes: m.notes || item.description,
            lastContact: m.lastContact,
            isFavorite: m.isFavorite || false,
            hobbies: m.hobbies,
            favoriteThings: m.favoriteThings,
            anniversaryDate: m.anniversaryDate,
            howWeMet: m.howWeMet,
            importantDates: m.importantDates || [],
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          } as Person
        })
        .sort((a, b) => {
          // Sort by favorite first, then name
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
          return a.name.localeCompare(b.name)
        })
      
      setPeople(transformedPeople)
    } catch (error) {
      console.error('Error loading people:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Please enter a name')
        return
      }

      // Validate email format if provided
      if (formData.email && !isValidEmail(formData.email)) {
        alert('Please enter a valid email address')
        return
      }

      // Validate dates (birthday, anniversary should not be in future)
      if (formData.birthday && !isValidDate(formData.birthday, false)) {
        alert('Birthday cannot be in the future')
        return
      }

      if (formData.anniversaryDate && !isValidDate(formData.anniversaryDate, false)) {
        alert('Anniversary date cannot be in the future')
        return
      }

      // Sanitize all text inputs to prevent XSS
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        relationship: formData.relationship,
        birthday: formData.birthday || null,
        email: formData.email ? sanitizeInput(formData.email) : null,
        phone: formData.phone ? sanitizeInput(formData.phone) : null,
        notes: formData.notes ? sanitizeInput(formData.notes) : null,
        isFavorite: formData.isFavorite,
        hobbies: formData.hobbies ? sanitizeInput(formData.hobbies) : null,
        favoriteThings: formData.favoriteThings ? sanitizeInput(formData.favoriteThings) : null,
        anniversaryDate: formData.anniversaryDate || null,
        howWeMet: formData.howWeMet ? sanitizeInput(formData.howWeMet) : null,
        importantDates: formData.importantDates.length > 0 ? formData.importantDates : null,
        lastContact: new Date().toISOString()
      }

      // Wait for data to be saved before refreshing
      await addData('relationships', {
        title: sanitizedData.name,
        description: sanitizedData.notes || '',
        metadata: sanitizedData
      })

      // Small delay to ensure Supabase has propagated the changes
      await new Promise(resolve => setTimeout(resolve, 300))
      
      loadPeople()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error adding person:', error)
      alert('Failed to add person')
    }
  }

  const handleEdit = async () => {
    if (!selectedPerson) return

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Please enter a name')
        return
      }

      // Validate email format if provided
      if (formData.email && !isValidEmail(formData.email)) {
        alert('Please enter a valid email address')
        return
      }

      // Validate dates
      if (formData.birthday && !isValidDate(formData.birthday, false)) {
        alert('Birthday cannot be in the future')
        return
      }

      if (formData.anniversaryDate && !isValidDate(formData.anniversaryDate, false)) {
        alert('Anniversary date cannot be in the future')
        return
      }

      const sanitizedData = {
        name: sanitizeInput(formData.name),
        relationship: formData.relationship,
        birthday: formData.birthday || null,
        email: formData.email ? sanitizeInput(formData.email) : null,
        phone: formData.phone ? sanitizeInput(formData.phone) : null,
        notes: formData.notes ? sanitizeInput(formData.notes) : null,
        isFavorite: formData.isFavorite,
        hobbies: formData.hobbies ? sanitizeInput(formData.hobbies) : null,
        favoriteThings: formData.favoriteThings ? sanitizeInput(formData.favoriteThings) : null,
        anniversaryDate: formData.anniversaryDate || null,
        howWeMet: formData.howWeMet ? sanitizeInput(formData.howWeMet) : null,
        importantDates: formData.importantDates.length > 0 ? formData.importantDates : null
      }

      // Wait for data to be saved before refreshing
      await updateData('relationships', selectedPerson.id, {
        title: sanitizedData.name,
        description: sanitizedData.notes || '',
        metadata: sanitizedData
      })

      // Small delay to ensure Supabase has propagated the changes
      await new Promise(resolve => setTimeout(resolve, 300))

      loadPeople()
      setIsEditDialogOpen(false)
      setSelectedPerson(null)
      resetForm()
    } catch (error) {
      console.error('Error updating person:', error)
      alert('Failed to update person')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this person?')) return

    try {
      await deleteData('relationships', id)
      await loadPeople() // Reload to sync with database
    } catch (error) {
      console.error('Error deleting person:', error)
      alert('Failed to delete person')
      loadPeople() // Reload anyway to stay in sync
    }
  }

  const loadReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('relationship_reminders')
        .select('*')
        .eq('userId', user.id)
        .eq('isCompleted', false)
        .order('reminderDate', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
  }

  const openReminderDialog = (person: Person) => {
    setSelectedPerson(person)
    setReminderFormData({
      title: `Reminder for ${person.name}`,
      reminderDate: '',
      notes: ''
    })
    setIsReminderDialogOpen(true)
  }

  const handleAddReminder = async () => {
    if (!selectedPerson) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to add reminders')
        return
      }

      const { error } = await supabase
        .from('relationship_reminders')
        .insert({
          userId: user.id,
          personId: selectedPerson.id,
          title: reminderFormData.title,
          reminderDate: reminderFormData.reminderDate,
          notes: reminderFormData.notes || null,
          isCompleted: false
        })

      if (error) throw error

      await loadReminders()
      setIsReminderDialogOpen(false)
      setSelectedPerson(null)
      setReminderFormData({ title: '', reminderDate: '', notes: '' })
      alert('Reminder added successfully!')
    } catch (error) {
      console.error('Error adding reminder:', error)
      alert('Failed to add reminder')
    }
  }

  const handleCompleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('relationship_reminders')
        .update({ isCompleted: true })
        .eq('id', id)

      if (error) throw error
      await loadReminders()
    } catch (error) {
      console.error('Error completing reminder:', error)
      alert('Failed to complete reminder')
    }
  }

  const toggleFavorite = async (person: Person) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({ isFavorite: !person.isFavorite })
        .eq('id', person.id)

      if (error) throw error
      await loadPeople()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const updateLastContact = async (person: Person) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({ lastContact: new Date().toISOString() })
        .eq('id', person.id)

      if (error) throw error
      await loadPeople()
    } catch (error) {
      console.error('Error updating last contact:', error)
    }
  }

  const openEditDialog = (person: Person) => {
    setSelectedPerson(person)
    setFormData({
      name: person.name,
      relationship: person.relationship,
      birthday: person.birthday || '',
      email: person.email || '',
      phone: person.phone || '',
      notes: person.notes || '',
      isFavorite: person.isFavorite,
      hobbies: person.hobbies || '',
      favoriteThings: person.favoriteThings || '',
      anniversaryDate: person.anniversaryDate || '',
      howWeMet: person.howWeMet || '',
      importantDates: person.importantDates || []
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: 'friend',
      birthday: '',
      email: '',
      phone: '',
      notes: '',
      isFavorite: false,
      hobbies: '',
      favoriteThings: '',
      anniversaryDate: '',
      howWeMet: '',
      importantDates: []
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRelationshipColor = (relationship: string) => {
    const colors: Record<string, string> = {
      'best_friend': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'friend': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'family': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      'partner': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'colleague': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'acquaintance': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'mentor': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    }
    return colors[relationship] || colors['friend']
  }

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      'best_friend': 'Best Friend',
      'friend': 'Friend',
      'family': 'Family',
      'partner': 'Partner',
      'colleague': 'Colleague',
      'acquaintance': 'Acquaintance',
      'mentor': 'Mentor'
    }
    return labels[relationship] || 'Friend'
  }

  const getDaysUntilBirthday = (birthday: string) => {
    if (!birthday) return null
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison
      
      const [year, month, day] = birthday.split('-').map(Number)
      if (!month || !day) return null
      
      // Try this year first
      let birthDate = new Date(today.getFullYear(), month - 1, day)
      birthDate.setHours(0, 0, 0, 0)
      
      // If birthday has passed this year, use next year
      if (birthDate < today) {
        birthDate = new Date(today.getFullYear() + 1, month - 1, day)
        birthDate.setHours(0, 0, 0, 0)
      }
      
      const diffTime = birthDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    } catch (e) {
      console.error('Error calculating days until birthday:', e)
      return null
    }
  }

  const getLastContactText = (lastContact?: string) => {
    if (!lastContact) return 'Never contacted'
    
    const days = Math.floor((new Date().getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const upcomingBirthdays = people
    .filter(p => p.birthday)
    .map(p => ({ ...p, daysUntil: getDaysUntilBirthday(p.birthday!) }))
    .filter(p => p.daysUntil !== null && p.daysUntil <= 30)
    .sort((a, b) => a.daysUntil! - b.daysUntil!)

  // Get all upcoming events (birthdays, anniversaries, important dates)
  const upcomingEvents = people.flatMap(person => {
    const events: Array<{
      id: string
      person: Person
      type: 'birthday' | 'anniversary' | 'important'
      date: string
      label: string
      daysUntil: number | null
    }> = []

    // Add birthday
    if (person.birthday) {
      const daysUntil = getDaysUntilBirthday(person.birthday)
      if (daysUntil !== null && daysUntil <= 90) {
        events.push({
          id: `${person.id}-birthday`,
          person,
          type: 'birthday',
          date: person.birthday,
          label: 'Birthday',
          daysUntil
        })
      }
    }

    // Add anniversary
    if (person.anniversaryDate) {
      const daysUntil = getDaysUntilBirthday(person.anniversaryDate)
      if (daysUntil !== null && daysUntil <= 90) {
        events.push({
          id: `${person.id}-anniversary`,
          person,
          type: 'anniversary',
          date: person.anniversaryDate,
          label: 'Anniversary',
          daysUntil
        })
      }
    }

    // Add important dates
    if (person.importantDates && person.importantDates.length > 0) {
      person.importantDates.forEach((impDate, idx) => {
        const daysUntil = getDaysUntilBirthday(impDate.date)
        if (daysUntil !== null && daysUntil <= 90) {
          events.push({
            id: `${person.id}-important-${idx}`,
            person,
            type: 'important',
            date: impDate.date,
            label: impDate.label,
            daysUntil
          })
        }
      })
    }

    return events
  }).sort((a, b) => a.daysUntil! - b.daysUntil!)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your circle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 md:p-8 rounded-lg min-h-screen">
      {/* Back Button */}
      <DomainBackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Relationships</h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
              Stay connected with the people who matter
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-6 shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Person
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-2 shadow-lg">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl transition-all font-medium text-sm md:text-base ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl transition-all font-medium text-sm md:text-base ${
              activeTab === 'calendar'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl transition-all font-medium text-sm md:text-base ${
              activeTab === 'reminders'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            Reminders
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search your contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 rounded-2xl bg-white dark:bg-gray-800 border-none shadow-lg text-base"
            />
          </div>

          {/* People List */}
          {filteredPeople.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No people found matching your search.' : 'No people in your circle yet.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Person
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPeople.map((person) => {
                const daysUntilBirthday = person.birthday ? getDaysUntilBirthday(person.birthday) : null
                
                return (
                  <Card key={person.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0">
                          {getInitials(person.name)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg md:text-xl font-bold">{person.name}</h3>
                              {person.isFavorite && (
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleFavorite(person)}>
                                  <Star className="w-4 h-4 mr-2" />
                                  {person.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateLastContact(person)}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Mark as Contacted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(person)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReminderDialog(person)}>
                                  <Bell className="w-4 h-4 mr-2" />
                                  Set Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(person.id)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <Badge className={`${getRelationshipColor(person.relationship)} mb-3`}>
                            {getRelationshipLabel(person.relationship)}
                          </Badge>

                          {person.birthday && (
                            <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 mb-2">
                              <Gift className="w-4 h-4" />
                              <span>{new Date(person.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}

                          {person.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {person.notes}
                            </p>
                          )}

                          {daysUntilBirthday !== null && daysUntilBirthday <= 30 && (
                            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-sm font-medium mb-3">
                              {daysUntilBirthday === 0 ? '🎉 Birthday today!' : 
                               daysUntilBirthday === 1 ? '🎂 Birthday tomorrow!' :
                               `🎈 Birthday in ${daysUntilBirthday} days`}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Last contact: {getLastContactText(person.lastContact)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <Card className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Important Dates</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming events in the next 90 days
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const typeColors = {
                    birthday: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200',
                    anniversary: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200',
                    important: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200'
                  }
                  const badgeColors = {
                    birthday: 'bg-purple-600',
                    anniversary: 'bg-pink-600',
                    important: 'bg-blue-600'
                  }
                  const icons = {
                    birthday: '🎂',
                    anniversary: '💖',
                    important: '📅'
                  }

                  return (
                    <div 
                      key={event.id} 
                      className={`flex items-center gap-4 p-4 rounded-2xl border ${typeColors[event.type]}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                        {getInitials(event.person.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.person.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{icons[event.type]}</span>
                          <span>{event.label}</span>
                          <span>•</span>
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <Badge className={`${badgeColors[event.type]} text-white`}>
                        {event.daysUntil === 0 ? 'Today!' : event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil} days`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          {/* Date-Based Reminders */}
          {reminders.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Your Reminders</h2>
                <div className="space-y-4">
                  {reminders.map((reminder) => {
                    const person = people.find(p => p.id === reminder.personId)
                    if (!person) return null

                    const reminderDate = new Date(reminder.reminderDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const remDate = new Date(reminder.reminderDate)
                    remDate.setHours(0, 0, 0, 0)
                    const daysUntil = Math.ceil((remDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    return (
                      <div key={reminder.id} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                          {getInitials(person.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{reminder.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{person.name}</span>
                            <span>•</span>
                            <span>{reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {daysUntil === 0 && <Badge className="bg-red-600 text-white ml-2">Today!</Badge>}
                            {daysUntil < 0 && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                          </div>
                          {reminder.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{reminder.notes}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Reminders */}
          <Card className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Connection Reminders</h2>
              <div className="space-y-4">
                {people
                  .filter(p => {
                    if (!p.lastContact) return true
                    const days = Math.floor((new Date().getTime() - new Date(p.lastContact).getTime()) / (1000 * 60 * 60 * 24))
                    return days >= 7
                  })
                  .slice(0, 10)
                  .map((person) => (
                    <div key={person.id} className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                        {getInitials(person.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{person.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last contacted: {getLastContactText(person.lastContact)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => updateLastContact(person)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Mark Contacted
                      </Button>
                    </div>
                  ))}
                {people.filter(p => {
                  if (!p.lastContact) return true
                  const days = Math.floor((new Date().getTime() - new Date(p.lastContact).getTime()) / (1000 * 60 * 60 * 24))
                  return days >= 7
                }).length === 0 && reminders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    You're all caught up! No reminders at the moment.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedPerson(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Person' : 'Add Person'}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update person details' : 'Add someone special to your circle'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sarah Johnson"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best_friend">Best Friend</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="acquaintance">Acquaintance</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Loves coffee and hiking"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="hobbies">Hobbies & Interests</Label>
              <Textarea
                id="hobbies"
                value={formData.hobbies}
                onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                placeholder="Photography, playing guitar, hiking"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="favoriteThings">Favorite Things</Label>
              <Textarea
                id="favoriteThings"
                value={formData.favoriteThings}
                onChange={(e) => setFormData({ ...formData, favoriteThings: e.target.value })}
                placeholder="Loves coffee, Italian food, mystery novels"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="anniversaryDate">Anniversary Date</Label>
              <Input
                id="anniversaryDate"
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                For partners, or friendship anniversary
              </p>
            </div>

            <div>
              <Label htmlFor="howWeMet">How We Met</Label>
              <Textarea
                id="howWeMet"
                value={formData.howWeMet}
                onChange={(e) => setFormData({ ...formData, howWeMet: e.target.value })}
                placeholder="We met at a conference in 2020..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="favorite"
                checked={formData.isFavorite}
                onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <Label htmlFor="favorite" className="cursor-pointer">Add to favorites</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setIsEditDialogOpen(false)
              setSelectedPerson(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEdit : handleAdd}
              disabled={!formData.name}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isEditDialogOpen ? 'Update' : 'Add'} Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReminderDialogOpen(false)
          setSelectedPerson(null)
          setReminderFormData({ title: '', reminderDate: '', notes: '' })
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Create a reminder for {selectedPerson?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reminderTitle">Reminder Title *</Label>
              <Input
                id="reminderTitle"
                value={reminderFormData.title}
                onChange={(e) => setReminderFormData({ ...reminderFormData, title: e.target.value })}
                placeholder="Call about their birthday"
              />
            </div>

            <div>
              <Label htmlFor="reminderDate">Reminder Date *</Label>
              <Input
                id="reminderDate"
                type="date"
                value={reminderFormData.reminderDate}
                onChange={(e) => setReminderFormData({ ...reminderFormData, reminderDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="reminderNotes">Notes</Label>
              <Textarea
                id="reminderNotes"
                value={reminderFormData.notes}
                onChange={(e) => setReminderFormData({ ...reminderFormData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsReminderDialogOpen(false)
              setSelectedPerson(null)
              setReminderFormData({ title: '', reminderDate: '', notes: '' })
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddReminder}
              disabled={!reminderFormData.title || !reminderFormData.reminderDate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

