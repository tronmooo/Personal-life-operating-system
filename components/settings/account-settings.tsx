'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/supabase/auth-provider'
import { 
  User, 
  LogIn, 
  LogOut, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export function AccountSettings() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  const handleSignOut = async () => {
    setSigningOut(true)
    setError('')
    
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign out')
    } finally {
      setSigningOut(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Account
          </CardTitle>
          <CardDescription>
            Manage your LifeHub account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're not signed in. Sign in to enable cloud sync and access your data from any device.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" className="flex-1">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Currently using:</strong> Local storage only
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your data is stored securely in your browser and is completely private. 
              Sign in to enable cloud backup and multi-device sync.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Account
        </CardTitle>
        <CardDescription>
          Manage your LifeHub account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signed In
              </Badge>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>

            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Member since:</span>
              <span className="font-medium">
                {new Date(user.created_at || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Storage:</strong> Cloud + Local
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your data is synced to the cloud and stored locally for offline access. 
            Use the Cloud Sync settings below to manage your data.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}






