'use client'

import { useState } from 'react'
import { usePasskeys, PasskeyCredential } from '@/lib/hooks/use-passkeys'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Pencil, 
  Smartphone, 
  Laptop, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PasskeySettingsProps {
  className?: string
}

export function PasskeySettings({ className }: PasskeySettingsProps) {
  const {
    credentials,
    loading,
    registering,
    error,
    isSupported,
    isPlatformAuthenticatorAvailable,
    registerPasskey,
    removePasskey,
    renamePasskey,
  } = usePasskeys()

  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [credentialToDelete, setCredentialToDelete] = useState<PasskeyCredential | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [credentialToRename, setCredentialToRename] = useState<PasskeyCredential | null>(null)
  const [newName, setNewName] = useState('')

  const handleRegister = async () => {
    const success = await registerPasskey(deviceName || undefined)
    
    if (success) {
      toast.success('Passkey registered successfully!', {
        description: 'You can now use Face ID / Touch ID to sign in.',
      })
      setRegisterDialogOpen(false)
      setDeviceName('')
    } else if (error) {
      toast.error('Registration failed', { description: error })
    }
  }

  const handleDelete = async () => {
    if (!credentialToDelete) return
    
    const success = await removePasskey(credentialToDelete.id)
    
    if (success) {
      toast.success('Passkey removed')
      setDeleteDialogOpen(false)
      setCredentialToDelete(null)
    } else if (error) {
      toast.error('Failed to remove passkey', { description: error })
    }
  }

  const handleRename = async () => {
    if (!credentialToRename || !newName.trim()) return
    
    const success = await renamePasskey(credentialToRename.id, newName.trim())
    
    if (success) {
      toast.success('Passkey renamed')
      setRenameDialogOpen(false)
      setCredentialToRename(null)
      setNewName('')
    } else if (error) {
      toast.error('Failed to rename passkey', { description: error })
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'singleDevice') {
      return <Smartphone className="h-5 w-5" />
    }
    return <Laptop className="h-5 w-5" />
  }

  // Not supported message
  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Face ID / Touch ID
          </CardTitle>
          <CardDescription>
            Sign in quickly with biometrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser or device doesn't support passkeys. 
              Try using Safari on iOS/macOS, Chrome on Android, or a modern browser.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Face ID / Touch ID
          </CardTitle>
          <CardDescription>
            Sign in quickly and securely using your device's biometrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          {isPlatformAuthenticatorAvailable ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your device supports Face ID / Touch ID authentication
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Set up a passkey to enable quick sign-in with biometrics
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              {/* Registered passkeys list */}
              {credentials.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Registered Passkeys
                  </Label>
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(cred.device_type)}
                        <div>
                          <p className="font-medium">{cred.device_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cred.last_used_at 
                              ? `Last used ${formatDistanceToNow(new Date(cred.last_used_at))} ago`
                              : `Added ${formatDistanceToNow(new Date(cred.created_at))} ago`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCredentialToRename(cred)
                            setNewName(cred.device_name)
                            setRenameDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setCredentialToDelete(cred)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add passkey button */}
              <Button
                onClick={() => setRegisterDialogOpen(true)}
                disabled={registering}
                className="w-full"
                variant={credentials.length > 0 ? 'outline' : 'default'}
              >
                {registering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {credentials.length > 0 ? 'Add Another Passkey' : 'Set Up Face ID / Touch ID'}
                  </>
                )}
              </Button>

              {credentials.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Once set up, you can sign in instantly with just your face or fingerprint
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Set Up Passkey
            </DialogTitle>
            <DialogDescription>
              Your device will prompt you to authenticate with Face ID or Touch ID. 
              This creates a secure passkey stored on your device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name (optional)</Label>
              <Input
                id="device-name"
                placeholder="e.g., iPhone 15 Pro, MacBook Pro"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This helps you identify which device this passkey is from
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={registering}>
              {registering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Continue with Face ID
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Passkey?</DialogTitle>
            <DialogDescription>
              This will remove the passkey for "{credentialToDelete?.device_name}". 
              You won't be able to sign in with Face ID from this device anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove Passkey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Passkey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Device Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

