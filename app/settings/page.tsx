'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, User, Settings as SettingsIcon, LogOut, Camera, Trash2, Check, ArrowLeft, LayoutGrid, Palette, Bell, Database, Shield, Fingerprint } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DashboardTab } from '@/components/settings/dashboard-tab'
import { AppearanceTab } from '@/components/settings/appearance-tab'
import { NotificationsTab } from '@/components/settings/notifications-tab'
import { DataTab } from '@/components/settings/data-tab'
import { PasskeySettings } from '@/components/auth/passkey-settings'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

interface Person {
  id: string
  name: string
  role: 'you' | 'family' | 'friend'
  photo?: string
  email?: string
  isActive: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [activePerson, setActivePerson] = useState<Person | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showManagePeople, setShowManagePeople] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', email: '', role: 'family' as 'family' | 'friend' })
  const [photoFile, setPhotoFile] = useState<string>('')

  useEffect(() => {
    loadPeople()
  }, [])

  const loadPeople = async () => {
    try {
      const settings = await getUserSettings()
      const saved = settings?.people as Person[] | undefined
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setPeople(saved)
        const active = saved.find((p: Person) => p.isActive)
        setActivePerson(active || saved[0])
      } else {
        const defaultPerson: Person = { id: '1', name: 'Me', role: 'you', isActive: true }
        setPeople([defaultPerson])
        setActivePerson(defaultPerson)
        await updateUserSettings({ people: [defaultPerson], activePersonId: '1' })
      }
    } catch (error) {
      console.error('Failed to load people settings:', error)
      // Set default person on error
      const defaultPerson: Person = { id: '1', name: 'Me', role: 'you', isActive: true }
      setPeople([defaultPerson])
      setActivePerson(defaultPerson)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoFile(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddPerson = async () => {
    if (!newPerson.name) {
      alert('Please enter a name')
      return
    }

    const person: Person = {
      id: Date.now().toString(),
      name: newPerson.name,
      role: newPerson.role,
      email: newPerson.email,
      photo: photoFile,
      isActive: false
    }

    const updated = [...people, person]
    setPeople(updated)
    await updateUserSettings({ people: updated })

    setShowAddDialog(false)
    setNewPerson({ name: '', email: '', role: 'family' })
    setPhotoFile('')
  }

  const handleSwitchProfile = async (person: Person) => {
    const updated = people.map(p => ({
      ...p,
      isActive: p.id === person.id
    }))
    setPeople(updated)
    setActivePerson(person)
    await updateUserSettings({ people: updated, activePersonId: person.id })
    alert(`Switched to ${person.name}'s profile`)
  }

  const handleDeletePerson = async (id: string) => {
    if (people.length <= 1) {
      alert('Cannot delete the last person')
      return
    }
    if (!confirm('Are you sure you want to delete this person?')) return

    const updated = people.filter(p => p.id !== id)
    setPeople(updated)
    await updateUserSettings({ people: updated })

    if (activePerson?.id === id) {
      const newActive = updated[0]
      await handleSwitchProfile(newActive)
    }
  }

  const handleUpdatePhoto = async (personId: string, photo: string) => {
    const updated = people.map(p =>
      p.id === personId ? { ...p, photo } : p
    )
    setPeople(updated)
    await updateUserSettings({ people: updated })
    if (activePerson?.id === personId) {
      setActivePerson({ ...activePerson, photo })
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your dashboard, appearance, and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            {/* Switch Profile Card */}
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Switch Profile
                </CardTitle>
                <CardDescription>Manage who's using the app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-teal-500 rounded-xl p-4 bg-teal-50 dark:bg-teal-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activePerson?.photo ? (
                        <img
                          src={activePerson.photo}
                          alt={activePerson.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {activePerson ? getInitials(activePerson.name) : 'M'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{activePerson?.name || 'Me'}</span>
                          <span className="px-2 py-1 bg-teal-600 text-white text-xs rounded-full font-semibold">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span className="capitalize">{activePerson?.role === 'you' ? 'You' : activePerson?.role}</span>
                        </div>
                      </div>
                    </div>
                    <label htmlFor={`photo-${activePerson?.id}`} className="cursor-pointer">
                      <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <input
                        type="file"
                        id={`photo-${activePerson?.id}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && activePerson) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              handleUpdatePhoto(activePerson.id, reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3">Other Profiles</p>
                  <div className="space-y-2">
                    {people.filter(p => !p.isActive).map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => handleSwitchProfile(person)}
                      >
                        <div className="flex items-center gap-3">
                          {person.photo ? (
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                              {getInitials(person.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{person.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{person.role}</p>
                          </div>
                        </div>
                        <Check className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manage People Card */}
            <Card>
              <CardHeader>
                <button
                  onClick={() => setShowManagePeople(!showManagePeople)}
                  className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors p-2 -m-2"
                >
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Manage People
                  </CardTitle>
                  <span className="text-gray-400">›</span>
                </button>
              </CardHeader>

              {showManagePeople && (
                <CardContent className="space-y-3">
                  {people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {person.photo ? (
                          <img
                            src={person.photo}
                            alt={person.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{person.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{person.email || 'No email'}</p>
                        </div>
                      </div>
                      {person.role !== 'you' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePerson(person.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    + Add Person
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* My Profile & Logout Buttons */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">My Profile</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>

                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to logout?')) {
                      try { 
                        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) 
                      } catch (error) {
                        console.error('Logout request failed:', error)
                        // Continue to auth page anyway
                      }
                      router.push('/auth')
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Logout</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground py-4">
              <p>{people.length} person{people.length !== 1 ? 's' : ''}</p>
            </div>
          </TabsContent>

          {/* Security Tab - Face ID / Touch ID */}
          <TabsContent value="security" className="space-y-6">
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-600" />
                  Security
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your security settings including Face ID and Touch ID
                </p>
              </div>
              
              {/* Passkey / Face ID Settings */}
              <PasskeySettings />
              
              {/* Additional security info */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">About Passkeys</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Passkeys are a more secure and convenient way to sign in. They use your device's 
                    built-in biometrics like Face ID on iPhone or Touch ID on Mac.
                  </p>
                  <p>
                    Once set up, you can sign in instantly without typing your password.
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-3">
                    <li><strong>iPhone/iPad:</strong> Uses Face ID or Touch ID</li>
                    <li><strong>Mac:</strong> Uses Touch ID</li>
                    <li><strong>Windows:</strong> Uses Windows Hello</li>
                    <li><strong>Android:</strong> Uses fingerprint or face unlock</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <DataTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Person Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Person</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="flex justify-center">
              <label htmlFor="new-person-photo" className="cursor-pointer">
                {photoFile ? (
                  <img src={photoFile} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </label>
              <input
                type="file"
                id="new-person-photo"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <Input
                placeholder="John Doe"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email (optional)</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Relationship</label>
              <select
                value={newPerson.role}
                onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value as 'family' | 'friend' })}
                className="w-full border-2 rounded-xl p-3 bg-white dark:bg-gray-800"
              >
                <option value="family">Family</option>
                <option value="friend">Friend</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddPerson} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Add Person
              </Button>
              <Button onClick={() => setShowAddDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
