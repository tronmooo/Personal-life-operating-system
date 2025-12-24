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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Inbox,
  Reply,
  FileImage,
  ScanLine,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { AIEmailComposer } from './ai-email-composer'
import { useToast } from '@/components/ui/use-toast'

interface EmailSuggestion {
  id: string
  email_id: string
  email_subject: string
  email_from: string
  email_date: string
  classification: string
  extracted_data: any
  suggestion_text: string
  status: string
  has_attachments?: boolean
}

interface ReceiptOCRResult {
  vendor?: string
  total?: number
  date?: string
  items?: Array<{ name: string; price: number; quantity?: number }>
  category?: string
  confidence?: number
}

export function SmartInboxCard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Receipt extraction state
  const [extractingReceipt, setExtractingReceipt] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptOCRResult | null>(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  
  // AI Reply state  
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailSuggestion | null>(null)
  
  // Gmail auth state
  const [needsGmailAuth, setNeedsGmailAuth] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [grantingAccess, setGrantingAccess] = useState(false)

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions()
  }, [])
  
  // Auto-sync Gmail when inbox is empty (after initial load completes)
  useEffect(() => {
    if (!loading && suggestions.length === 0 && !syncing && !needsGmailAuth) {
      console.log('📬 Auto-syncing Gmail (inbox is empty)...')
      syncWithGmail()
    }
  }, [loading]) // Only trigger when loading state changes

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
   * Server handles token refresh automatically - no re-auth popups needed!
   */
  const syncWithGmail = async () => {
    try {
      setSyncing(true)
      
      // Check if user is signed in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('👤 Not signed in - skipping Gmail sync')
        toast({
          title: "Sign in required",
          description: "Please sign in with Google to sync your emails.",
          variant: "destructive"
        })
        return
      }

      // Call API - server handles token refresh automatically
      // Send provider_token if available (helps on first login), but server will use stored tokens too
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: session.provider_token || undefined
        })
      })

      // Handle non-JSON responses (timeouts, HTML error pages)
      const responseText = await response.text()
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('ℹ️ Gmail sync returned non-JSON response:', responseText.substring(0, 200));
        if (response.status === 504) {
          throw new Error('Request timed out. Try again later.');
        }
        throw new Error(`Server error (${response.status})`);
      }
      
      // Handle success
      if (data.success) {
        await loadSuggestions()
        
        if (data.newSuggestions > 0) {
          toast({
            title: "Gmail synced!",
            description: `Found ${data.newSuggestions} new suggestion${data.newSuggestions > 1 ? 's' : ''}.`,
          })
        } else {
          toast({
            title: "Gmail synced",
            description: "No new suggestions found.",
          })
        }
        return
      }
      
      // Handle errors - detect scope issues vs other auth issues
      const errorMsg = data.error || 'Unknown error'
      const isScopeError = errorMsg.toLowerCase().includes('scope') || 
                           errorMsg.toLowerCase().includes('permission') ||
                           data.actualScopes !== undefined
      
      if (data.requiresReauth || isScopeError) {
        // Don't auto-redirect - show a button instead so users who signed in
        // with email/password aren't automatically sent to Google OAuth
        console.log('📧 Gmail access not configured - showing prompt')
        setNeedsGmailAuth(true)
        setAuthError(errorMsg)
        return
      }
      
      // Show other errors as toast
      console.error('Gmail sync error:', errorMsg)
      toast({
        title: "Gmail sync issue",
        description: errorMsg,
        variant: "destructive"
      })
    } catch (error: any) {
      console.error('ℹ️ Gmail sync error:', error.message)
      toast({
        title: "Gmail sync failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  /**
   * Grant Gmail access - redirects to Google OAuth with Gmail scopes
   */
  const grantGmailAccess = async () => {
    try {
      setGrantingAccess(true)
      
      // Get the OAuth URL from our API
      const response = await fetch('/api/auth/add-gmail-scopes')
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Google OAuth to grant Gmail permissions
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to get authorization URL')
      }
    } catch (error: any) {
      console.error('Error initiating Gmail auth:', error)
      toast({
        title: "Authorization Failed",
        description: error.message || "Could not start Gmail authorization",
        variant: "destructive"
      })
      setGrantingAccess(false)
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
   * Extract receipt from email attachment
   */
  const extractReceiptFromEmail = async (suggestion: EmailSuggestion) => {
    try {
      setExtractingReceipt(suggestion.id)
      
      const response = await fetch('/api/gmail/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messageId: suggestion.email_id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to extract receipt')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setReceiptData(result.data)
        setSelectedEmail(suggestion)
        setReceiptDialogOpen(true)
        
        toast({
          title: "Receipt Extracted!",
          description: `Found receipt from ${result.data.vendor || 'vendor'}`,
        })
      } else {
        toast({
          title: "No Receipt Found",
          description: "Could not find a receipt attachment in this email.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error extracting receipt:', error)
      toast({
        title: "Extraction Failed",
        description: error.message || "Could not extract receipt from email.",
        variant: "destructive"
      })
    } finally {
      setExtractingReceipt(null)
    }
  }

  /**
   * Open AI reply dialog for an email
   */
  const openReplyDialog = (suggestion: EmailSuggestion) => {
    setSelectedEmail(suggestion)
    setReplyDialogOpen(true)
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
        ) : needsGmailAuth ? (
          // Gmail authorization needed UI
          <div className="text-center py-6 px-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
              Gmail Access Required
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {authError || 'Smart Inbox needs permission to read your emails.'}
            </p>
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={grantGmailAccess}
              disabled={grantingAccess}
            >
              {grantingAccess ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Grant Gmail Access
                </>
              )}
            </Button>
            <p className="text-[10px] text-gray-400 mt-2">
              You'll be redirected to Google to approve access
            </p>
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
                    
                    {/* Show amount for receipts and bills */}
                    {(suggestion.classification === 'receipt' || suggestion.classification === 'bill') && 
                     suggestion.extracted_data?.amount && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(suggestion.extracted_data.amount)}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 truncate">
                      From: {suggestion.email_from}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(suggestion.email_date).toLocaleDateString()}
                    </p>
                    
                    {/* Action buttons for receipts and replies */}
                    <div className="flex gap-1 mt-2">
                      {suggestion.classification === 'receipt' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => extractReceiptFromEmail(suggestion)}
                          disabled={extractingReceipt === suggestion.id}
                        >
                          {extractingReceipt === suggestion.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <ScanLine className="w-3 h-3 mr-1" />
                          )}
                          Scan Receipt
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => openReplyDialog(suggestion)}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        AI Reply
                      </Button>
                    </div>
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

      {/* Receipt OCR Result Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-green-500" />
              Extracted Receipt Data
            </DialogTitle>
          </DialogHeader>
          
          {receiptData && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                {receiptData.vendor && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vendor</span>
                    <span className="font-medium">{receiptData.vendor}</span>
                  </div>
                )}
                {receiptData.date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="font-medium">{receiptData.date}</span>
                  </div>
                )}
                {receiptData.total !== undefined && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(receiptData.total)}
                    </span>
                  </div>
                )}
                {receiptData.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="secondary">{receiptData.category}</Badge>
                  </div>
                )}
              </div>

              {receiptData.items && receiptData.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <div className="bg-muted/30 rounded-lg divide-y">
                    {receiptData.items.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between p-2 text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                          {item.name}
                        </span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                    {receiptData.items.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{receiptData.items.length - 5} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {receiptData.confidence && (
                <p className="text-xs text-muted-foreground text-center">
                  Confidence: {Math.round(receiptData.confidence * 100)}%
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setReceiptDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (selectedEmail) {
                      approveSuggestion(selectedEmail.id)
                      setReceiptDialogOpen(false)
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Finance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Email Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-blue-500" />
              AI-Powered Reply
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <AIEmailComposer
              originalEmail={{
                subject: selectedEmail.email_subject,
                from: selectedEmail.email_from,
                body: selectedEmail.suggestion_text,
                messageId: selectedEmail.email_id
              }}
              onEmailSent={() => {
                setReplyDialogOpen(false)
                toast({
                  title: "Reply Sent!",
                  description: "Your email has been sent via Gmail.",
                })
              }}
              className="border-0 shadow-none"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

