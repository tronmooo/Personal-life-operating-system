/**
 * Enhanced Health Profile Tab
 * Demographics, emergency contacts, family history, immunizations, allergies, conditions
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useHealthProfile } from '@/lib/hooks/use-health-profile'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { User, Heart, Phone, Briefcase, FileText, Loader2, Save, Users, Shield, AlertTriangle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { FamilyHistoryDialog } from './family-history-dialog'

export function ProfileTabEnhanced() {
  const { profile, loading, createOrUpdateProfile, age } = useHealthProfile()
  const { items: healthEntries, create, remove } = useDomainCRUD('health')
  const [saving, setSaving] = useState(false)
  const [familyHistoryOpen, setFamilyHistoryOpen] = useState(false)
  
  // Form state (same as before)
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    blood_type: '',
    height_ft: '',
    height_in: '',
    target_weight_lbs: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    primary_physician: '',
    physician_phone: '',
    physician_email: '',
    medical_record_number: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_group_number: '',
    insurance_effective_date: '',
    preferred_pharmacy: '',
    pharmacy_phone: '',
    pharmacy_address: '',
  })

  // Get medical data from entries
  const familyHistory = healthEntries.filter(e => e.metadata?.logType === 'family_history')
  const immunizations = healthEntries.filter(e => e.metadata?.logType === 'immunization')
  const allergies = healthEntries.filter(e => e.metadata?.logType === 'allergy')
  const conditions = healthEntries.filter(e => e.metadata?.logType === 'condition')

  useEffect(() => {
    if (profile) {
      setFormData({
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        blood_type: profile.blood_type || '',
        height_ft: profile.height_ft?.toString() || '',
        height_in: profile.height_in?.toString() || '',
        target_weight_lbs: profile.target_weight_lbs?.toString() || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relationship: profile.emergency_contact_relationship || '',
        primary_physician: profile.primary_physician || '',
        physician_phone: profile.physician_phone || '',
        physician_email: profile.physician_email || '',
        medical_record_number: profile.medical_record_number || '',
        insurance_provider: profile.insurance_provider || '',
        insurance_policy_number: profile.insurance_policy_number || '',
        insurance_group_number: profile.insurance_group_number || '',
        insurance_effective_date: profile.insurance_effective_date || '',
        preferred_pharmacy: profile.preferred_pharmacy || '',
        pharmacy_phone: profile.pharmacy_phone || '',
        pharmacy_address: profile.pharmacy_address || '',
      })
    }
  }, [profile])

  async function handleSave() {
    try {
      setSaving(true)
      await createOrUpdateProfile({
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_type: formData.blood_type || null,
        height_ft: formData.height_ft ? parseInt(formData.height_ft) : null,
        height_in: formData.height_in ? parseInt(formData.height_in) : null,
        target_weight_lbs: formData.target_weight_lbs ? parseFloat(formData.target_weight_lbs) : null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        primary_physician: formData.primary_physician || null,
        physician_phone: formData.physician_phone || null,
        physician_email: formData.physician_email || null,
        medical_record_number: formData.medical_record_number || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_group_number: formData.insurance_group_number || null,
        insurance_effective_date: formData.insurance_effective_date || null,
        preferred_pharmacy: formData.preferred_pharmacy || null,
        pharmacy_phone: formData.pharmacy_phone || null,
        pharmacy_address: formData.pharmacy_address || null,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {age && (
        <div className="flex gap-4">
          <Badge variant="outline" className="text-base py-2 px-4">
            <User className="w-4 h-4 mr-2" />
            Age: {age} years
          </Badge>
          {formData.blood_type && (
            <Badge variant="outline" className="text-base py-2 px-4 bg-red-50 text-red-700 border-red-200">
              <Heart className="w-4 h-4 mr-2" />
              Blood Type: {formData.blood_type}
            </Badge>
          )}
          {formData.height_ft && formData.height_in && (
            <Badge variant="outline" className="text-base py-2 px-4">
              Height: {formData.height_ft}'{formData.height_in}"
            </Badge>
          )}
        </div>
      )}

      {/* Personal Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Demographics
          </CardTitle>
          <CardDescription>Basic health information and physical stats</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blood_type">Blood Type</Label>
            <Select value={formData.blood_type} onValueChange={(value) => setFormData({ ...formData, blood_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Height</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Feet"
                  type="number"
                  value={formData.height_ft}
                  onChange={(e) => setFormData({ ...formData, height_ft: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Inches"
                  type="number"
                  value={formData.height_in}
                  onChange={(e) => setFormData({ ...formData, height_in: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_weight">Target Weight (lbs)</Label>
            <Input
              id="target_weight"
              type="number"
              placeholder="e.g., 165"
              value={formData.target_weight_lbs}
              onChange={(e) => setFormData({ ...formData, target_weight_lbs: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" />
            Emergency Contact
          </CardTitle>
          <CardDescription>Person to contact in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ec_name">Full Name</Label>
            <Input
              id="ec_name"
              placeholder="John Doe"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ec_phone">Phone Number</Label>
            <Input
              id="ec_phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ec_relationship">Relationship</Label>
            <Input
              id="ec_relationship"
              placeholder="Spouse, Parent, etc."
              value={formData.emergency_contact_relationship}
              onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary Physician */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            Primary Physician
          </CardTitle>
          <CardDescription>Your primary care provider information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="physician">Physician Name</Label>
            <Input
              id="physician"
              placeholder="Dr. Sarah Smith"
              value={formData.primary_physician}
              onChange={(e) => setFormData({ ...formData, primary_physician: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="physician_phone">Phone</Label>
            <Input
              id="physician_phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.physician_phone}
              onChange={(e) => setFormData({ ...formData, physician_phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="physician_email">Email</Label>
            <Input
              id="physician_email"
              type="email"
              placeholder="doctor@clinic.com"
              value={formData.physician_email}
              onChange={(e) => setFormData({ ...formData, physician_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mrn">Medical Record #</Label>
            <Input
              id="mrn"
              placeholder="MRN123456"
              value={formData.medical_record_number}
              onChange={(e) => setFormData({ ...formData, medical_record_number: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card className="bg-red-50 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
            <FileText className="w-5 h-5" />
            Insurance Information
          </CardTitle>
          <CardDescription>Health insurance provider and policy details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insurance_provider">Insurance Provider</Label>
            <Input
              id="insurance_provider"
              placeholder="Blue Cross Blue Shield"
              value={formData.insurance_provider}
              onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_group_number">Group Number</Label>
            <Input
              id="insurance_group_number"
              placeholder="GRP-45678"
              value={formData.insurance_group_number}
              onChange={(e) => setFormData({ ...formData, insurance_group_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_policy_number">Subscriber ID</Label>
            <Input
              id="insurance_policy_number"
              placeholder="SUB-987654"
              value={formData.insurance_policy_number}
              onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_effective_date">Effective Date</Label>
            <Input
              id="insurance_effective_date"
              type="date"
              value={formData.insurance_effective_date}
              onChange={(e) => setFormData({ ...formData, insurance_effective_date: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Family Health History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <CardTitle>Family Health History</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFamilyHistoryOpen(true)}>
              + Add History
            </Button>
          </div>
          <CardDescription>Track hereditary health conditions in your family</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {familyHistory.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No family health history recorded</p>
              <Button variant="outline" size="sm" onClick={() => setFamilyHistoryOpen(true)}>Add Family Health History</Button>
            </div>
          ) : (
            familyHistory.map(entry => {
              const metadata = entry.metadata || {}
              const relation = String(metadata.relation || 'Father')
              const ageAtDiagnosis = metadata.ageAtDiagnosis ? String(metadata.ageAtDiagnosis) : '65'
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div>
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-sm text-gray-600">{relation}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Age at diagnosis</p>
                      <p className="font-semibold">{ageAtDiagnosis}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => remove(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Immunization Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <CardTitle>Immunization Records</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => {/* TODO: Open add dialog */}}>
              + Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {immunizations.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No immunization records</p>
            </div>
          ) : (
            immunizations.map(entry => {
              const metadata = entry.metadata || {}
              const lastDate = String(metadata.lastDate || '9/14/2024')
              const nextDue = String(metadata.nextDue || '9/14/2025')
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-sm text-gray-600">Last: {lastDate}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Next Due</p>
                      <p className="font-medium text-red-600">{nextDue}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => remove(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <CardTitle>Allergies</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => {/* TODO: Open add dialog */}}>
              + Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allergies.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No allergies recorded</p>
            </div>
          ) : (
            allergies.map(entry => {
              const metadata = entry.metadata || {}
              const severity = String(metadata.severity || 'Moderate')
              const reaction = String(metadata.reaction || 'Hives, swelling')
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{entry.title}</p>
                      <Badge className={
                        severity === 'Severe' ? 'bg-red-500' :
                        severity === 'Moderate' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }>
                        {severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Reaction: {reaction}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => remove(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-600" />
              <CardTitle>Medical Conditions</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => {/* TODO: Open add dialog */}}>
              + Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {conditions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No medical conditions recorded</p>
            </div>
          ) : (
            conditions.map(entry => {
              const metadata = entry.metadata || {}
              const diagnosedDate = String(metadata.diagnosedDate || '8/21/2019')
              const status = String(metadata.status || 'Managed')
              return (
                <div key={entry.id} className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-lg">{entry.title}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => remove(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Diagnosed</p>
                      <p className="font-medium text-red-600">
                        {diagnosedDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Status</p>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Dialogs */}
      <FamilyHistoryDialog open={familyHistoryOpen} onOpenChange={setFamilyHistoryOpen} />
    </div>
  )
}

