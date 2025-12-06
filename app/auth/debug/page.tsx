'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthDebugPage() {
  const [status, setStatus] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    setStatus({
      hasSession: !!session,
      user: session?.user,
      error: error,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>🔍 Auth Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={checkAuth} className="w-full">
              Refresh Auth Status
            </Button>
          </div>
          
          {status && (
            <div className="space-y-2">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">Session Status:</h3>
                <p className="text-sm">
                  {status.hasSession ? (
                    <span className="text-green-600">✅ AUTHENTICATED</span>
                  ) : (
                    <span className="text-red-600">❌ NOT AUTHENTICATED</span>
                  )}
                </p>
                
                {status.user && (
                  <div className="mt-4">
                    <h4 className="font-semibold">User Info:</h4>
                    <pre className="text-xs mt-2 p-2 bg-white dark:bg-gray-900 rounded overflow-auto">
                      {JSON.stringify(status.user, null, 2)}
                    </pre>
                  </div>
                )}
                
                {status.error && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-600">Error:</h4>
                    <pre className="text-xs mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      {JSON.stringify(status.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                Last checked: {new Date(status.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

