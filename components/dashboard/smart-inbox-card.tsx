'use client'

/**
 * Smart Inbox Card Component
 * 
 * Displays AI-parsed email suggestions with one-click approval
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Loader2,
  DollarSign,
  Calendar,
  Wrench,
  ShoppingBag,
  Shield,
  Inbox
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'

interface EmailSuggestion {
  id: string
  email_subject: string
  email_from: string
  email_date: string
  classification: string
  extracted_data: any
  suggestion_text: string
  status: string
}

export function SmartInboxCard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions()
  }, [])

  /**
   * Load pending suggestions from API
   */
  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gmail/suggestions')
      
      // If not authenticated, silently fail (no error shown)
      if (response.status === 401) {
        console.log('👤 Not authenticated - skipping Gmail suggestions')
        setSuggestions([])
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sync with Gmail to get new emails
   */
  const syncWithGmail = async () => {
    try {
      setSyncing(true)
      
      // #region agent log
      console.log('🔍 DEBUG: syncWithGmail started', new Date().toISOString());
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'smart-inbox-card.tsx:87',message:'syncWithGmail started',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Get current session with provider token
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('👤 Not signed in - skipping Gmail sync')
        alert('🔑 Gmail Sync Requires Sign-In\n\nPlease sign in with Google to sync your emails.')
        return
      }

      // If no provider token, try refreshing the session first
      if (!session.provider_token) {
        console.log('🔄 No provider token, refreshing session...')
        const { data: refreshData } = await supabase.auth.refreshSession()
        if (refreshData.session) {
          session = refreshData.session
          console.log('✅ Session refreshed, provider token:', session.provider_token ? 'Present' : 'Still missing')
        }
        
        // If still no token after refresh, user needs to re-authenticate
        if (!session.provider_token) {
          console.log('⚠️ No provider token available - Gmail sync requires re-auth')
          alert('🔄 Gmail Re-authentication Required\n\nTo enable Gmail sync:\n\n1. Click your profile icon (top right)\n2. Sign out\n3. Sign back in with Google\n4. Accept all permissions when prompted\n\nThis will grant the app access to read your emails for smart suggestions.')
          return
        }
      }

      // #region agent log
      console.log('🔍 DEBUG: About to call /api/gmail/sync, hasToken:', !!session.provider_token);
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'smart-inbox-card.tsx:115',message:'About to call /api/gmail/sync',data:{hasProviderToken:!!session.provider_token},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
      // Send provider token in request body
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: session.provider_token
        })
      })

      // #region agent log
      const responseText = await response.clone().text();
      console.log('🔍 DEBUG: Gmail sync response:', response.status, responseText.substring(0, 200));
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'smart-inbox-card.tsx:128',message:'Gmail sync response received',data:{status:response.status,statusText:response.statusText,responsePreview:responseText.substring(0,200),isJson:responseText.startsWith('{')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      // Handle non-JSON responses (e.g., timeouts, HTML error pages)
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('ℹ️ Gmail sync returned non-JSON response:', responseText.substring(0, 200));
        if (response.status === 504) {
          throw new Error('Request timed out. Gmail sync is taking too long. Try again later.');
        }
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
      }
      
      // If we get 401/403, try refreshing session once before giving up
      if (response.status === 401 || response.status === 403) {
        console.log('⚠️ Got 401/403, attempting to refresh session...')
        
        // Try refreshing session one more time
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshData.session?.provider_token && !refreshError) {
          console.log('✅ Session refreshed successfully, retrying sync...')
          
          // Retry the request with new token
          const retryResponse = await fetch('/api/gmail/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              accessToken: refreshData.session.provider_token
            })
          })
          
          const retryData = await retryResponse.json()
          
          if (retryResponse.ok && retryData.success) {
            // Success after retry!
            await loadSuggestions()
            if (retryData.newSuggestions > 0) {
              alert(`✨ Found ${retryData.newSuggestions} new suggestions!`)
            } else {
              alert('📭 No new suggestions found')
            }
            return
          }
        }
        
        // If refresh failed or retry failed, show re-auth message
        console.log('ℹ️ Gmail sync unavailable - token refresh failed')
        alert('🔄 Gmail Re-authentication Required\n\nYour Gmail access token has expired.\n\nPlease sign out and sign back in with Google to refresh your permissions.')
        return
      }
      
      if (data.success) {
        // Reload suggestions
        await loadSuggestions()
        
        if (data.newSuggestions > 0) {
          alert(`✨ Found ${data.newSuggestions} new suggestions!`)
        } else {
          alert('📭 No new suggestions found')
        }
      } else {
        // Show specific error from API
        const errorMsg = data.error || 'Unknown error'
        const hint = data.hint || ''
        console.error('Gmail sync error:', errorMsg)
        alert(`⚠️ Gmail Sync Issue\n\n${errorMsg}${hint ? `\n\n${hint}` : ''}`)
      }
    } catch (error: any) {
      // #region agent log
      console.log('🔍 DEBUG: Gmail sync catch error:', error?.message);
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'smart-inbox-card.tsx:185',message:'Gmail sync catch block error',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      // Log errors and show status message
      console.error('ℹ️ Gmail sync error:', error.message)
      alert(`⚠️ Gmail Sync Failed\n\n${error.message}\n\nTry signing out and back in with Google.`)
    } finally {
      setSyncing(false)
    }
  }

  /**
   * Approve a suggestion
   */
  const approveSuggestion = async (suggestionId: string) => {
    try {
      setProcessingId(suggestionId)
      
      const response = await fetch('/api/gmail/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      })

      const data = await response.json()
      
      if (data.success) {
        // Remove from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        router.refresh() // Refresh to show new item in domains
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error approving suggestion:', error)
      alert(`Failed to approve: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  /**
   * Reject a suggestion
   */
  const rejectSuggestion = async (suggestionId: string) => {
    try {
      setProcessingId(suggestionId)
      
      const response = await fetch('/api/gmail/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      })

      const data = await response.json()
      
      if (data.success) {
        // Remove from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error)
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  /**
   * Get icon for classification
   */
  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'bill':
        return <DollarSign className="w-4 h-4" />
      case 'appointment':
        return <Calendar className="w-4 h-4" />
      case 'service_reminder':
        return <Wrench className="w-4 h-4" />
      case 'receipt':
        return <ShoppingBag className="w-4 h-4" />
      case 'insurance':
        return <Shield className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  /**
   * Get color for classification
   */
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'bill':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'appointment':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'service_reminder':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'receipt':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'insurance':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            <span className="text-lg">Smart Inbox</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{suggestions.length}</Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={syncWithGmail}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No pending suggestions</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={syncWithGmail}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Sync Gmail
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 rounded-lg border transition-all ${
                  processingId === suggestion.id
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getClassificationColor(suggestion.classification)}`}>
                    {getClassificationIcon(suggestion.classification)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      {suggestion.suggestion_text}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      From: {suggestion.email_from}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(suggestion.email_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => approveSuggestion(suggestion.id)}
                      disabled={processingId === suggestion.id}
                      title="Approve"
                    >
                      {processingId === suggestion.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => rejectSuggestion(suggestion.id)}
                      disabled={processingId === suggestion.id}
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {suggestions.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                +{suggestions.length - 5} more suggestions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

