'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, Edit, Trash2, Users, Baby, User, School, GraduationCap,
  Heart, Calendar, Cake, Phone, Mail
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

export interface FamilyMember {
  id: string
  name: string
  relationship: 'child' | 'spouse' | 'parent' | 'sibling' | 'other'
  birthday?: string
  phone?: string
  email?: string
  school?: string
  grade?: string
  medicalInfo?: string
  emergencyContact?: string
  photoUrl?: string
}

interface FamilyMemberSwitcherProps {
  onMemberSelected?: (member: FamilyMember | null) => void
  selectedMemberId?: string
  filterByRelationship?: string // e.g., 'child' to show only children
}

const RELATIONSHIP_ICONS = {
  child: Baby,
  spouse: Heart,
  parent: Users,
  sibling: User,
  other: Users
}

const RELATIONSHIP_COLORS = {
  child: 'text-blue-600',
  spouse: 'text-pink-600',
  parent: 'text-purple-600',
  sibling: 'text-green-600',
  other: 'text-gray-600'
}

export function FamilyMemberSwitcher({ 
  onMemberSelected, 
  selectedMemberId,
  filterByRelationship 
}: FamilyMemberSwitcherProps) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    relationship: 'child'
  })
  const { getData, addData, updateData, deleteData } = useData()

  // Load members from unified domain data
  useEffect(() => {
    const domainItems = getData('relationships') || []
    const mapped = domainItems
      .filter((item: any) => item?.metadata)
      .map((item: any) => ({
        id: item.id,
        name: item.title || item.metadata?.name || 'Unnamed',
        relationship: (item.metadata?.relationshipType || item.metadata?.relationship || 'other').toLowerCase(),
        birthday: item.metadata?.birthday,
        phone: item.metadata?.phone,
        email: item.metadata?.email,
        school: item.metadata?.school,
        grade: item.metadata?.grade,
        medicalInfo: item.metadata?.medicalInfo,
        emergencyContact: item.metadata?.emergencyContact,
      }))

    const filtered = filterByRelationship
      ? mapped.filter((m: FamilyMember) => m.relationship === filterByRelationship)
      : mapped

    setMembers(filtered)

    if (filtered.length > 0) {
      const memberToSelect = selectedMemberId
        ? filtered.find((m: FamilyMember) => m.id === selectedMemberId)
        : filtered[0]
      setSelectedMember(memberToSelect || filtered[0])
    } else {
      setSelectedMember(null)
    }
  }, [getData, selectedMemberId, filterByRelationship])

  // Notify parent when member changes
  useEffect(() => {
    if (onMemberSelected) {
      onMemberSelected(selectedMember)
    }
  }, [selectedMember, onMemberSelected])

  // Add new member
  const handleAddMember = () => {
    if (!newMember.name) {
      alert('Please enter a name')
      return
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name,
      relationship: newMember.relationship as FamilyMember['relationship'] || 'child',
      birthday: newMember.birthday,
      phone: newMember.phone,
      email: newMember.email,
      school: newMember.school,
      grade: newMember.grade,
      medicalInfo: newMember.medicalInfo,
      emergencyContact: newMember.emergencyContact,
    }

    // Persist via domain_entries
    addData('relationships', {
      title: member.name,
      description: member.relationship,
      metadata: {
        relationshipType: member.relationship,
        birthday: member.birthday,
        phone: member.phone,
        email: member.email,
        school: member.school,
        grade: member.grade,
        medicalInfo: member.medicalInfo,
        emergencyContact: member.emergencyContact,
      }
    })

    const updatedMembers = [...members, member]
    setMembers(updatedMembers)
    setSelectedMember(member)
    setIsAddingMember(false)
    setNewMember({ relationship: 'child' })
  }

  // Delete member
  const handleDeleteMember = (memberId: string) => {
    if (!confirm('Are you sure you want to delete this family member profile?')) return

    // Remove from domain_entries
    deleteData('relationships', memberId)

    const updatedMembers = members.filter(m => m.id !== memberId)
    setMembers(updatedMembers)

    if (selectedMember?.id === memberId) {
      setSelectedMember(updatedMembers[0] || null)
    }
  }

  // Calculate age
  const calculateAge = (birthday?: string) => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--
    }
    return years
  }

  const MemberIcon = selectedMember ? RELATIONSHIP_ICONS[selectedMember.relationship] : Users
  const memberColor = selectedMember ? RELATIONSHIP_COLORS[selectedMember.relationship] : 'text-purple-600'

  const title = filterByRelationship === 'child' ? 'Children Profiles' : 'Family Members'

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {title}
          </div>
          <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add {filterByRelationship === 'child' ? 'Child' : 'Member'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="e.g., Emma Johnson"
                    value={newMember.name || ''}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Relationship *</Label>
                  <Select
                    value={newMember.relationship}
                    onValueChange={(value) => setNewMember({ ...newMember, relationship: value as FamilyMember['relationship'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">👶 Child</SelectItem>
                      <SelectItem value="spouse">❤️ Spouse/Partner</SelectItem>
                      <SelectItem value="parent">👨‍👩‍👦 Parent</SelectItem>
                      <SelectItem value="sibling">👫 Sibling</SelectItem>
                      <SelectItem value="other">👥 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Birthday</Label>
                  <Input
                    type="date"
                    value={newMember.birthday || ''}
                    onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newMember.phone || ''}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>

                {newMember.relationship === 'child' && (
                  <>
                    <div>
                      <Label>School</Label>
                      <Input
                        placeholder="e.g., Lincoln Elementary"
                        value={newMember.school || ''}
                        onChange={(e) => setNewMember({ ...newMember, school: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Grade/Year</Label>
                      <Input
                        placeholder="e.g., 5th Grade"
                        value={newMember.grade || ''}
                        onChange={(e) => setNewMember({ ...newMember, grade: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Medical Info / Allergies</Label>
                  <Input
                    placeholder="e.g., Peanut allergy, Type 1 Diabetes"
                    value={newMember.medicalInfo || ''}
                    onChange={(e) => setNewMember({ ...newMember, medicalInfo: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Emergency Contact</Label>
                  <Input
                    placeholder="Name & Phone"
                    value={newMember.emergencyContact || ''}
                    onChange={(e) => setNewMember({ ...newMember, emergencyContact: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddMember} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Family Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No family members yet. Add one!</p>
            <Button 
              onClick={() => setIsAddingMember(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {filterByRelationship === 'child' ? 'Child' : 'Family Member'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Member Selector */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Select Member
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => {
                  const Icon = RELATIONSHIP_ICONS[member.relationship]
                  const isSelected = selectedMember?.id === member.id
                  return (
                    <Button
                      key={member.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`h-auto py-3 flex flex-col items-center gap-2 ${
                        !isSelected && RELATIONSHIP_COLORS[member.relationship]
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{member.name}</span>
                      {member.school && (
                        <span className="text-xs opacity-70">{member.school}</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Selected Member Details */}
            {selectedMember && (
              <Card className="bg-white dark:bg-gray-900">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${memberColor}`}>
                        <MemberIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedMember.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedMember.relationship}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteMember(selectedMember.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedMember.birthday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cake className="h-4 w-4 text-pink-600" />
                      <span className="font-medium">Age:</span>
                      <span className="text-muted-foreground">
                        {calculateAge(selectedMember.birthday)} years old
                      </span>
                    </div>
                  )}

                  {selectedMember.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Phone:</span>
                      <a 
                        href={`tel:${selectedMember.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedMember.phone}
                      </a>
                    </div>
                  )}

                  {selectedMember.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <a 
                        href={`mailto:${selectedMember.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedMember.email}
                      </a>
                    </div>
                  )}

                  {selectedMember.school && (
                    <div className="flex items-center gap-2 text-sm">
                      <School className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">School:</span>
                      <span className="text-muted-foreground">{selectedMember.school}</span>
                    </div>
                  )}

                  {selectedMember.grade && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Grade:</span>
                      <span className="text-muted-foreground">{selectedMember.grade}</span>
                    </div>
                  )}

                  {selectedMember.medicalInfo && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                      <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                        ⚠️ Medical Info:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {selectedMember.medicalInfo}
                      </p>
                    </div>
                  )}

                  {selectedMember.emergencyContact && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
                      <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                        🚨 Emergency Contact:
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {selectedMember.emergencyContact}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
