'use client'

import { useState, useEffect } from 'react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  isActive: boolean
  initial: string
}

interface ProfileSwitcherProps {
  onManagePeopleClick: () => void
}

export function ProfileSwitcher({ onManagePeopleClick }: ProfileSwitcherProps) {
  const [activePerson, setActivePerson] = useState<Person | null>(null)
  const [allPeople, setAllPeople] = useState<Person[]>([])

  useEffect(() => {
    loadActivePerson()

    // Listen for profile changes
    const handleProfileChange = () => {
      loadActivePerson()
    }

    window.addEventListener('profile-changed', handleProfileChange)
    return () => window.removeEventListener('profile-changed', handleProfileChange)
  }, [])

  const loadActivePerson = async () => {
    try {
      const settings = await getUserSettings()
      const people: Person[] = settings?.people || []
      if (people.length > 0) {
        setAllPeople(people)
        const active = people.find(p => p.isActive) || people[0]
        setActivePerson(active)
      } else {
        const defaultPerson: Person = { id: 'me', name: 'Me', relationship: 'You', isActive: true, initial: 'M' }
        setActivePerson(defaultPerson)
        setAllPeople([defaultPerson])
        await updateUserSettings({ people: [defaultPerson], activePersonId: 'me' })
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
      // Set default person on error
      const defaultPerson: Person = { id: 'me', name: 'Me', relationship: 'You', isActive: true, initial: 'M' }
      setActivePerson(defaultPerson)
      setAllPeople([defaultPerson])
    }
  }

  const handleSwitchProfile = async (personId: string) => {
    const updatedPeople = allPeople.map(p => ({
      ...p,
      isActive: p.id === personId
    }))
    await updateUserSettings({ people: updatedPeople, activePersonId: personId })
    window.dispatchEvent(new Event('profile-changed'))
    loadActivePerson()
  }

  if (!activePerson) return null

  return (
    <div className="space-y-3">
      {/* Current Profile */}
      <Card className="p-4 border-teal-500">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {activePerson.initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{activePerson.name}</h3>
              <Badge variant="secondary" className="bg-teal-500 text-white">
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {activePerson.relationship}
            </p>
          </div>
        </div>
      </Card>

      {/* Other Profiles (if any) */}
      {allPeople.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">Switch Profile</p>
          {allPeople
            .filter(p => !p.isActive)
            .map(person => (
              <Card
                key={person.id}
                className="p-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSwitchProfile(person.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {person.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{person.name}</h4>
                    <p className="text-xs text-muted-foreground">{person.relationship}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Manage People Button */}
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={onManagePeopleClick}
      >
        <Users className="h-4 w-4 mr-2" />
        Manage People
      </Button>
    </div>
  )
}









