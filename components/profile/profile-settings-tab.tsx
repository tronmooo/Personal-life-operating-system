'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, Mail, Phone, MapPin, Globe, Camera, Shield, Bell, 
  Palette, Download, Trash2, Lock, Eye, EyeOff, Save, 
  CheckCircle2, AlertCircle, Moon, Sun, Monitor, FileDown,
  Database, Key, Calendar, Clock, Link as LinkIcon, Upload,
  Loader2, Github, Linkedin
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { 
  useUserProfile, 
  useConnectedAccounts, 
  useDataExport,
  type ProfilePreferences
} from '@/lib/hooks/use-profile'
import { toast } from 'sonner'

export function ProfileSettingsTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Use the real profile hook
  const { 
    profile, 
    loading: profileLoading, 
    updateProfile, 
    updatePreferences 
  } = useUserProfile()
  
  const { 
    accounts: connectedAccounts, 
    loading: accountsLoading, 
    disconnectAccount 
  } = useConnectedAccounts()
  
  const { exporting, requestExport, requestDeletion } = useDataExport()

  // Local form state - synced with profile when loaded
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    bio: '',
    website_url: '',
    linkedin_url: '',
    github_url: '',
    timezone: 'America/New_York',
    current_title: '',
    current_company: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    billReminders: true,
    taskReminders: true,
    weeklyDigest: true
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private' as 'public' | 'private' | 'connections',
    showEmail: false,
    showPhone: false,
    activityTracking: true,
    shareAnalytics: false
  })

  // Password change state
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  
  // Other dialogs
  const [exportDataOpen, setExportDataOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync form data with profile when loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        bio: profile.bio || '',
        website_url: profile.website_url || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        timezone: profile.timezone || 'America/New_York',
        current_title: profile.current_title || '',
        current_company: profile.current_company || ''
      })
      
      // Sync notification settings
      if (profile.preferences?.notifications) {
        setNotificationSettings(profile.preferences.notifications)
      }
      
      // Sync privacy settings
      if (profile.preferences?.privacy) {
        setPrivacySettings(profile.preferences.privacy)
      }
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaveStatus('saving')
    try {
      await updateProfile({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        bio: formData.bio || null,
        website_url: formData.website_url || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        timezone: formData.timezone,
        current_title: formData.current_title || null,
        current_company: formData.current_company || null
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleSaveNotifications = async () => {
    if (!profile) return
    
    setSaveStatus('saving')
    try {
      await updatePreferences({
        notifications: notificationSettings
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleSavePrivacy = async () => {
    if (!profile) return
    
    setSaveStatus('saving')
    try {
      await updatePreferences({
        privacy: privacySettings
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    // In a real app, this would call a Supabase auth method
    toast.success('Password changed successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChangePasswordOpen(false)
  }

  const handleExportData = async () => {
    try {
      await requestExport()
      setExportDataOpen(false)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    try {
      await requestDeletion()
      setDeleteAccountOpen(false)
      setDeleteConfirmation('')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const timezones = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
  ]

  if (!mounted) {
    return null
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your personal details and contact information</CardDescription>
            </div>
            <Button 
              onClick={handleSaveProfile} 
              disabled={saveStatus === 'saving'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : saveStatus === 'saved' ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {formData.first_name?.[0] || formData.email?.[0]?.toUpperCase() || '?'}
              </div>
              <button className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-full border shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upload a profile picture</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Upload className="w-4 h-4 mr-2" /> Upload Image
              </Button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input 
                value={formData.first_name} 
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input 
                value={formData.last_name} 
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> Phone
              </Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> City
              </Label>
              <Input 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>
            <div>
              <Label>State/Province</Label>
              <Input 
                value={formData.state} 
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="California"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input 
                value={formData.country} 
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
              />
            </div>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Current Title</Label>
              <Input 
                value={formData.current_title} 
                onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <Label>Current Company</Label>
              <Input 
                value={formData.current_company} 
                onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label>Bio</Label>
            <Textarea 
              value={formData.bio} 
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="w-4 h-4" /> Website
              </Label>
              <Input 
                value={formData.website_url} 
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yoursite.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Label>
              <Input 
                value={formData.linkedin_url} 
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/you"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Github className="w-4 h-4" /> GitHub
              </Label>
              <Input 
                value={formData.github_url} 
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/you"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Timezone
            </Label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full md:w-1/2 p-2 border rounded-md bg-white dark:bg-slate-800"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Theme</Label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Sun className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Light</p>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Moon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">Dark</p>
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Monitor className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">System</p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </div>
            <Button onClick={handleSaveNotifications} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch 
              checked={notificationSettings.email}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
            </div>
            <Switch 
              checked={notificationSettings.push}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, push: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Bill Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming bills</p>
            </div>
            <Switch 
              checked={notificationSettings.billReminders}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, billReminders: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
            </div>
            <Switch 
              checked={notificationSettings.taskReminders}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, taskReminders: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">Receive weekly summary of your activity</p>
            </div>
            <Switch 
              checked={notificationSettings.weeklyDigest}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyDigest: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your privacy and security settings</CardDescription>
            </div>
            <Button onClick={handleSavePrivacy} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Label className="mb-2 block">Profile Visibility</Label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => setPrivacySettings({ 
                ...privacySettings, 
                profileVisibility: e.target.value as 'public' | 'private' | 'connections' 
              })}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="private">Private - Only you can see your profile</option>
              <option value="connections">Connections - Only your connections can see</option>
              <option value="public">Public - Anyone can see your profile</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Show Email Address</p>
              <p className="text-sm text-muted-foreground">Display email on your public profile</p>
            </div>
            <Switch 
              checked={privacySettings.showEmail}
              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Show Phone Number</p>
              <p className="text-sm text-muted-foreground">Display phone on your public profile</p>
            </div>
            <Switch 
              checked={privacySettings.showPhone}
              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Activity Tracking</p>
              <p className="text-sm text-muted-foreground">Allow tracking for personalized insights</p>
            </div>
            <Switch 
              checked={privacySettings.activityTracking}
              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, activityTracking: checked })}
            />
          </div>
          
          {/* Password Change */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => setChangePasswordOpen(true)} className="w-full sm:w-auto">
              <Key className="w-4 h-4 mr-2" /> Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>Manage your connected services and integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accountsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts connected yet.
            </div>
          ) : (
            connectedAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {account.provider === 'google' && <Globe className="w-5 h-5 text-red-500" />}
                    {account.provider === 'github' && <Github className="w-5 h-5" />}
                    {account.provider === 'linkedin' && <Linkedin className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{account.provider}</p>
                    <p className="text-sm text-muted-foreground">{account.email || 'Connected'}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => disconnectAccount(account.provider)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setExportDataOpen(true)}>
              <Download className="w-4 h-4 mr-2" /> Export My Data
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setDeleteAccountOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>New Password</Label>
              <Input 
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={exportDataOpen} onOpenChange={setExportDataOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              Export Your Data
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Download a copy of all your data including profile, career information, skills, goals, and achievements.
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Your export will include:
              </p>
              <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 space-y-1">
                <li>• Profile information</li>
                <li>• Work experiences</li>
                <li>• Skills and certifications</li>
                <li>• Career goals and milestones</li>
                <li>• Achievements</li>
                <li>• Education history</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDataOpen(false)}>Cancel</Button>
            <Button onClick={handleExportData} disabled={exporting} className="bg-blue-600 hover:bg-blue-700">
              {exporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Download JSON</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                Warning: This action cannot be undone!
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                All your data will be permanently deleted, including:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-300 mt-2 space-y-1">
                <li>• Profile and account information</li>
                <li>• All work experiences and career data</li>
                <li>• Skills, goals, and achievements</li>
                <li>• Connected accounts</li>
              </ul>
            </div>
            <div>
              <Label>Type DELETE to confirm</Label>
              <Input 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
