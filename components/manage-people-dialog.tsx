'use client'

import { useState, useEffect, useRef } from 'react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Pencil, Trash2, X } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  isActive: boolean
  initial: string
}

interface ManagePeopleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManagePeopleDialog({ open, onOpenChange }: ManagePeopleDialogProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonRelationship, setNewPersonRelationship] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Load people from user settings
  useEffect(() => {
    (async () => {
      try {
        const settings = await getUserSettings()
        // If settings is empty, user might not be authenticated
        if (!settings || Object.keys(settings).length === 0) {
          // Set default without trying to save to DB
          const initialPeople: Person[] = [{ id: 'me', name: 'Me', relationship: 'You', isActive: true, initial: 'M' }]
          setPeople(initialPeople)
          return
        }
        
        const ppl = settings?.people as Person[] | undefined
        if (ppl && ppl.length > 0) {
          setPeople(ppl)
        } else {
          const initialPeople: Person[] = [{ id: 'me', name: 'Me', relationship: 'You', isActive: true, initial: 'M' }]
          setPeople(initialPeople)
          await updateUserSettings({ people: initialPeople, activePersonId: 'me' })
        }
      } catch (error) {
        // Silently handle auth errors, only log other errors
        if (error && !String(error).includes('authenticated') && !String(error).includes('JWT')) {
          console.error('Failed to load people settings:', error)
        }
        // Set default person on error
        const initialPeople: Person[] = [{ id: 'me', name: 'Me', relationship: 'You', isActive: true, initial: 'M' }]
        setPeople(initialPeople)
      }
    })()
  }, [])

  const savePeople = async (updatedPeople: Person[]) => {
    setPeople(updatedPeople)
    await updateUserSettings({ people: updatedPeople })
  }

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return

    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName,
      relationship: newPersonRelationship || 'Family Member',
      isActive: false,
      initial: newPersonName.charAt(0).toUpperCase()
    }

    savePeople([...people, newPerson])
    setNewPersonName('')
    setNewPersonRelationship('')
    setIsAddingPerson(false)
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setNewPersonName(person.name)
    setNewPersonRelationship(person.relationship)
    // Focus the name input after state updates
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
  }

  const handleUpdatePerson = () => {
    if (!editingPerson || !newPersonName.trim()) return

    const updatedPeople = people.map(p =>
      p.id === editingPerson.id
        ? { ...p, name: newPersonName, relationship: newPersonRelationship, initial: newPersonName.charAt(0).toUpperCase() }
        : p
    )

    savePeople(updatedPeople)
    setEditingPerson(null)
    setNewPersonName('')
    setNewPersonRelationship('')
  }

  const handleDeletePerson = (id: string) => {
    if (id === 'me') {
      alert("You cannot delete yourself!")
      return
    }

    if (confirm('Are you sure you want to remove this person?')) {
      savePeople(people.filter(p => p.id !== id))
    }
  }

  const handleSwitchProfile = async (id: string) => {
    const updatedPeople = people.map(p => ({
      ...p,
      isActive: p.id === id
    }))
    await savePeople(updatedPeople)
    await updateUserSettings({ activePersonId: id })
    window.dispatchEvent(new Event('profile-changed'))
    onOpenChange(false)
  }

  // Focus the name input when adding a person
  useEffect(() => {
    if (isAddingPerson && nameInputRef.current) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isAddingPerson])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset state when closing
        setIsAddingPerson(false)
        setEditingPerson(null)
        setNewPersonName('')
        setNewPersonRelationship('')
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent 
        className="max-w-2xl"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking inside inputs
          e.preventDefault()
        }}
        onInteractOutside={(e) => {
          // Prevent closing when interacting with inputs
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6" />
            Manage People
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add, edit, or remove family members and manage their data separately
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add New Person Button */}
          {!isAddingPerson && !editingPerson && (
            <Button
              onClick={() => setIsAddingPerson(true)}
              className="w-full h-16 bg-teal-500 hover:bg-teal-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Person
            </Button>
          )}

          {/* Add/Edit Person Form */}
          {(isAddingPerson || editingPerson) && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingPerson ? 'Edit Person' : 'Add New Person'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => {
                    setIsAddingPerson(false)
                    setEditingPerson(null)
                    setNewPersonName('')
                    setNewPersonRelationship('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="person-name">Name</Label>
                  <Input
                    ref={nameInputRef}
                    id="person-name"
                    name="person-name"
                    type="text"
                    autoComplete="off"
                    value={newPersonName}
                    onChange={(e) => {
                      e.stopPropagation()
                      setNewPersonName(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      // Allow typing and prevent dialog from closing on Enter
                      e.stopPropagation()
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        // Move focus to relationship input
                        document.getElementById('person-relationship')?.focus()
                      }
                    }}
                    placeholder="e.g., Sarah, John, Mom"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="person-relationship">Relationship</Label>
                  <Input
                    id="person-relationship"
                    name="person-relationship"
                    type="text"
                    autoComplete="off"
                    value={newPersonRelationship}
                    onChange={(e) => {
                      e.stopPropagation()
                      setNewPersonRelationship(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (editingPerson) {
                          handleUpdatePerson()
                        } else {
                          handleAddPerson()
                        }
                      }
                    }}
                    placeholder="e.g., Spouse, Child, Parent"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={editingPerson ? handleUpdatePerson : handleAddPerson}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {editingPerson ? 'Update' : 'Add'} Person
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingPerson(false)
                      setEditingPerson(null)
                      setNewPersonName('')
                      setNewPersonRelationship('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* People List */}
          <div className="space-y-3">
            {people.map((person) => (
              <div
                key={person.id}
                className={`border rounded-lg p-4 flex items-center justify-between ${
                  person.isActive ? 'border-teal-500 bg-teal-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {person.initial}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{person.name}</h4>
                      {person.isActive && (
                        <Badge variant="secondary" className="bg-teal-500 text-white">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {person.relationship}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!person.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchProfile(person.id)}
                    >
                      Switch
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPerson(person)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {person.id !== 'me' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePerson(person.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}









