'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Share2, Users, Mail, Copy, Check, X, Eye, Edit, Shield,
  Link as LinkIcon, UserPlus, Crown
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { idbGet, idbSet, idbDel } from '@/lib/utils/idb-cache'

interface SharedUser {
  id: string
  email: string
  name: string
  role: 'viewer' | 'editor' | 'admin'
  addedAt: string
}

interface ShareManagerProps {
  domainId: string
  domainName: string
}

export function ShareManager({ domainId, domainName }: ShareManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer')
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [linkSharing, setLinkSharing] = useState(false)

  // Load sharing data from Supabase (with IndexedDB fallback)
  useEffect(() => {
    const loadSharingData = async () => {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Load from Supabase user_settings
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single()

        if (userSettings?.settings?.sharing) {
          const domainSharing = userSettings.settings.sharing[domainId]
          if (domainSharing) {
            setSharedUsers(domainSharing.users || [])
            if (domainSharing.link) {
              setShareLink(domainSharing.link.link || '')
              setLinkSharing(!!domainSharing.link.link)
            }
          }
        }
      } else {
        // Fallback to IndexedDB
        const users = await idbGet<SharedUser[]>(`lifehub-shared-users-${domainId}`, [])
        setSharedUsers(users || [])
        
        const linkData = await idbGet<any>(`lifehub-share-link-${domainId}`, null)
        if (linkData) {
          setShareLink(linkData.link || '')
          setLinkSharing(true)
        }
      }
    }
    loadSharingData()
  }, [domainId])

  const generateShareLink = async () => {
    const token = Math.random().toString(36).substring(2, 15)
    const link = `${window.location.origin}/shared/${domainId}?token=${token}`
    setShareLink(link)
    setLinkSharing(true)
    
    // Save to Supabase (with IndexedDB fallback)
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get current settings
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()

      const sharing = currentSettings?.settings?.sharing || {}
      sharing[domainId] = {
        ...sharing[domainId],
        link: { link, token, createdAt: new Date().toISOString(), permissions: selectedRole }
      }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { ...currentSettings?.settings, sharing }
        })
    } else {
      // Fallback to IndexedDB
      idbSet(`lifehub-share-link-${domainId}`, {
        link,
        token,
        createdAt: new Date().toISOString(),
        permissions: selectedRole,
      })
    }
  }

  const copyShareLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const inviteByEmail = async () => {
    if (!emailInput.trim()) return

    const newUser: SharedUser = {
      id: `user-${Date.now()}`,
      email: emailInput,
      name: emailInput.split('@')[0],
      role: selectedRole,
      addedAt: new Date().toISOString(),
    }

    const updated = [...sharedUsers, newUser]
    setSharedUsers(updated)
    
    // Save to Supabase (with IndexedDB fallback)
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()

      const sharing = currentSettings?.settings?.sharing || {}
      sharing[domainId] = {
        ...sharing[domainId],
        users: updated
      }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { ...currentSettings?.settings, sharing }
        })
    } else {
      // Fallback to IndexedDB
      idbSet(`lifehub-shared-users-${domainId}`, updated)
    }

    setEmailInput('')
    
    // In a real app, this would send an actual email invitation
    alert(`📧 Invitation sent to ${emailInput}!`)
  }

  const removeUser = async (userId: string) => {
    const updated = sharedUsers.filter(u => u.id !== userId)
    setSharedUsers(updated)
    
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()

      const sharing = currentSettings?.settings?.sharing || {}
      sharing[domainId] = { ...sharing[domainId], users: updated }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { ...currentSettings?.settings, sharing }
        })
    } else {
      idbSet(`lifehub-shared-users-${domainId}`, updated)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    const updated = sharedUsers.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    )
    setSharedUsers(updated)
    
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()

      const sharing = currentSettings?.settings?.sharing || {}
      sharing[domainId] = { ...sharing[domainId], users: updated }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { ...currentSettings?.settings, sharing }
        })
    } else {
      idbSet(`lifehub-shared-users-${domainId}`, updated)
    }
  }

  const disableLinkSharing = async () => {
    setLinkSharing(false)
    setShareLink('')
    
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()

      const sharing = currentSettings?.settings?.sharing || {}
      if (sharing[domainId]) {
        delete sharing[domainId].link
      }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { ...currentSettings?.settings, sharing }
        })
    } else {
      idbDel(`lifehub-share-link-${domainId}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{domainName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite by Email */}
          <div className="space-y-3">
            <Label>Invite People</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && inviteByEmail()}
                />
              </div>
              <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={inviteByEmail} disabled={!emailInput.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 mt-0.5" />
              <div>
                <div><strong>Viewer:</strong> Can view data only</div>
                <div><strong>Editor:</strong> Can view and modify data</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Share Link */}
          <div className="space-y-3">
            <Label>Share Link</Label>
            {!linkSharing ? (
              <Button onClick={generateShareLink} variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate Shareable Link
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button onClick={copyShareLink} variant="outline">
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Anyone with the link can {selectedRole === 'viewer' ? 'view' : 'edit'}
                  </span>
                  <Button 
                    onClick={disableLinkSharing} 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Disable
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Shared Users */}
          {sharedUsers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>People with Access ({sharedUsers.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sharedUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={user.role} 
                          onValueChange={(v: any) => updateUserRole(user.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3 w-3" />
                                Viewer
                              </div>
                            </SelectItem>
                            <SelectItem value="editor">
                              <div className="flex items-center gap-2">
                                <Edit className="h-3 w-3" />
                                Editor
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-3 w-3" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeUser(user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Collaboration Features
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>✓ Real-time updates across all devices</div>
              <div>✓ Activity history and change tracking</div>
              <div>✓ Granular permission controls</div>
              <div>✓ Revoke access anytime</div>
              <Badge variant="secondary" className="mt-2">
                💎 Premium Feature
              </Badge>
            </CardContent>
          </Card>

          {/* Activity Feed (if there are shared users) */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Recent Activity</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3 w-3" />
                  <span>{sharedUsers[0].name} was added as {sharedUsers[0].role}</span>
                </div>
                <div className="text-xs text-muted-foreground">Just now</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}






























