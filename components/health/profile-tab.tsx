/**
 * Health Profile Tab
 * User demographics, emergency contacts, medical information
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealthProfile } from '@/lib/hooks/use-health-profile'
import { User, Heart, Phone, Briefcase, FileText, Loader2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ProfileTab() {
  const { profile, loading, createOrUpdateProfile, age } = useHealthProfile()
  const [saving, setSaving] = useState(false)
  
  // Form state
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
    preferred_pharmacy: '',
    pharmacy_phone: '',
    pharmacy_address: '',
  })

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Insurance Information
          </CardTitle>
          <CardDescription>Health insurance provider and policy details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insurance">Insurance Provider</Label>
            <Input
              id="insurance"
              placeholder="Blue Cross Blue Shield"
              value={formData.insurance_provider}
              onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy">Policy Number</Label>
            <Input
              id="policy"
              placeholder="POL123456789"
              value={formData.insurance_policy_number}
              onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group">Group Number</Label>
            <Input
              id="group"
              placeholder="GRP12345"
              value={formData.insurance_group_number}
              onChange={(e) => setFormData({ ...formData, insurance_group_number: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferred Pharmacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Preferred Pharmacy
          </CardTitle>
          <CardDescription>Your regular pharmacy for prescriptions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacy">Pharmacy Name</Label>
            <Input
              id="pharmacy"
              placeholder="CVS Pharmacy"
              value={formData.preferred_pharmacy}
              onChange={(e) => setFormData({ ...formData, preferred_pharmacy: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pharmacy_phone">Phone</Label>
            <Input
              id="pharmacy_phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.pharmacy_phone}
              onChange={(e) => setFormData({ ...formData, pharmacy_phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pharmacy_address">Address</Label>
            <Input
              id="pharmacy_address"
              placeholder="123 Main St, City, ST 12345"
              value={formData.pharmacy_address}
              onChange={(e) => setFormData({ ...formData, pharmacy_address: e.target.value })}
            />
          </div>
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
    </div>
  )
}


