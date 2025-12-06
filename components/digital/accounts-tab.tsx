'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Laptop, Eye, EyeOff, Copy, Loader2 } from 'lucide-react'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { toast } from 'sonner'

interface Account {
  id: string
  serviceName: string
  username: string
  email: string
  password: string
  website?: string
  category: string
  twoFactor: boolean
  notes?: string
}

export function AccountsTab() {
  // ✅ Use modern hook for real-time updates
  const { entries, isLoading, createEntry, deleteEntry } = useDomainEntries('digital')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Account>>({
    twoFactor: false
  })
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  // ✅ Filter accounts in real-time from entries
  const accounts = entries
    .filter(item => item.metadata?.itemType === 'account')
    .map(item => {
      const meta = item.metadata || {}
      return {
        id: item.id,
        serviceName: String(item.title || meta.serviceName || ''),
        username: String(meta.username || ''),
        email: String(meta.email || ''),
        password: String(meta.password || ''),
        website: meta.website ? String(meta.website) : undefined,
        category: String(meta.category || 'Other'),
        twoFactor: !!meta.twoFactor,
        notes: meta.notes ? String(meta.notes) : undefined
      }
    })

  const handleAdd = async () => {
    if (!formData.serviceName || !formData.username) {
      toast.error('Please enter service name and username')
      return
    }

    const accountData = {
      itemType: 'account',
      serviceName: formData.serviceName,
      username: formData.username,
      email: formData.email || '',
      password: formData.password || '',
      website: formData.website,
      category: formData.category || 'Other',
      twoFactor: formData.twoFactor || false,
      notes: formData.notes
    }

    try {
      // ✅ Use createEntry for instant real-time updates
      await createEntry({
        domain: 'digital',
        title: accountData.serviceName,
        description: `${accountData.category} account`,
        metadata: accountData
      })
      
      setFormData({ twoFactor: false })
      setShowAddForm(false)
      toast.success('Account added successfully!')
    } catch (error) {
      console.error('Failed to add account:', error)
      toast.error('Failed to add account. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account?')) return
    
    try {
      // ✅ Use deleteEntry for instant real-time updates (no manual reload needed)
      await deleteEntry(id)
      toast.success('Account deleted successfully!')
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account. Please try again.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Accounts & Passwords</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Secure storage for {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Service Name *</Label>
                <Input
                  placeholder="Gmail, GitHub, AWS..."
                  value={formData.serviceName || ''}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.category || 'Other'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Social Media">Social Media</option>
                  <option value="Email">Email</option>
                  <option value="Banking">Banking</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Cloud Services">Cloud Services</option>
                  <option value="Development">Development</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Username *</Label>
                <Input
                  placeholder="username123"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  placeholder="https://example.com"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="twoFactor"
                checked={formData.twoFactor || false}
                onChange={(e) => setFormData({ ...formData, twoFactor: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="twoFactor" className="cursor-pointer">Two-Factor Authentication Enabled</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Recovery codes, security questions, etc."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Account</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Laptop className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">No accounts yet. Add your first account!</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Laptop className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{account.serviceName}</h3>
                        <p className="text-sm text-muted-foreground">{account.category}</p>
                        {account.twoFactor && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                            2FA Enabled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-20">Username:</span>
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">{account.username}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(account.username)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {account.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Email:</span>
                          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">{account.email}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(account.email)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {account.password && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Password:</span>
                          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">
                            {showPasswords[account.id] ? account.password : '••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPasswords({ ...showPasswords, [account.id]: !showPasswords[account.id] })}
                          >
                            {showPasswords[account.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(account.password)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {account.website && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-20">Website:</span>
                          <a
                            href={account.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex-1"
                          >
                            {account.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {account.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{account.notes}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}

