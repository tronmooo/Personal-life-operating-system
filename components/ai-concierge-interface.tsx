'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Send,
  Mic,
  Sparkles,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
  ListTodo,
  Settings,
  Navigation,
  Star,
  Search,
  Building2,
  Heart,
  History,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  Volume2,
  Trash2
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CallTask {
  id: string
  business: string
  phone: string
  address: string
  rating?: number
  distance?: number
  status: 'pending' | 'calling' | 'completed' | 'failed'
  callId?: string
  error?: string
  transcript?: TranscriptEntry[]
  isFavorite?: boolean
}

interface TranscriptEntry {
  speaker: 'ai' | 'human'
  message: string
  timestamp: Date
}

interface CallHistoryEntry {
  id: string
  business: string
  phone: string
  address: string
  rating?: number
  status: 'completed' | 'failed' | 'no-answer'
  timestamp: Date
  duration?: number
  transcript?: TranscriptEntry[]
  isFavorite: boolean
}

interface BusinessOption {
  id: string
  placeId: string
  name: string
  phone?: string
  formattedPhone?: string
  address: string
  rating?: number
  distance?: number
  imageUrl?: string
}

interface DetectedRequest {
  intent: string
  businessCount: number
  specificBusiness?: string
  description: string
  userRequest?: string
}

interface LocationData {
  latitude: number
  longitude: number
  city?: string
  state?: string
  country?: string
  displayName?: string
}

interface AIConciergeInterfaceProps {
  initialMessage?: string
  initialIntent?: string
  initialDetails?: any
}

export function AIConciergeInterface({
  initialMessage,
  initialIntent: _initialIntent,
  initialDetails: _initialDetails
}: AIConciergeInterfaceProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [callsSubTab, setCallsSubTab] = useState<'favorites' | 'recent' | 'all'>('recent')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationState, setConversationState] = useState<any>(null)
  const [tasks, setTasks] = useState<CallTask[]>([])
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [detectedRequest, setDetectedRequest] = useState<DetectedRequest | null>(null)
  
  // Call history states
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([])
  const [favorites, setFavorites] = useState<CallHistoryEntry[]>([])
  
  // Live transcription states
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  // Business selection states
  const [isSearchingBusinesses, setIsSearchingBusinesses] = useState(false)
  const [businessOptions, setBusinessOptions] = useState<BusinessOption[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessOption | null>(null)
  const [showBusinessPicker, setShowBusinessPicker] = useState(false)
  const [showCallConfirmation, setShowCallConfirmation] = useState(false)
  const [pendingCallRequest, setPendingCallRequest] = useState<DetectedRequest | null>(null)
  const [manualPhoneNumber, setManualPhoneNumber] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const transcriptPollingRef = useRef<NodeJS.Timeout | null>(null)

  // Use Supabase-backed preferences instead of localStorage
  const { 
    value: savedAddress, 
    setValue: saveAddress,
    loading: addressLoading
  } = useUserPreferences<string>('concierge_manual_address', '')
  
  const { 
    value: savedCallHistory, 
    setValue: saveCallHistory,
    loading: historyLoading
  } = useUserPreferences<CallHistoryEntry[]>('concierge_call_history', [])
  
  const { 
    value: savedFavorites, 
    setValue: saveFavorites,
    loading: favoritesLoading
  } = useUserPreferences<CallHistoryEntry[]>('concierge_favorites', [])

  // Track if initial load from preferences has completed
  const initialLoadRef = useRef(false)

  // Load saved address from preferences
  useEffect(() => {
    if (!addressLoading && savedAddress && !initialLoadRef.current) {
      setManualAddress(savedAddress)
    }
  }, [savedAddress, addressLoading])

  // Load call history from preferences
  useEffect(() => {
    if (!historyLoading && savedCallHistory && savedCallHistory.length > 0 && !initialLoadRef.current) {
      const parsed = savedCallHistory.map((h: any) => ({ 
        ...h, 
        timestamp: new Date(h.timestamp) 
      }))
      setCallHistory(parsed)
    }
  }, [savedCallHistory, historyLoading])

  // Load favorites from preferences
  useEffect(() => {
    if (!favoritesLoading && savedFavorites && savedFavorites.length > 0 && !initialLoadRef.current) {
      const parsed = savedFavorites.map((f: any) => ({ 
        ...f, 
        timestamp: new Date(f.timestamp) 
      }))
      setFavorites(parsed)
    }
    // Mark initial load as complete after first favorites load
    if (!favoritesLoading && !initialLoadRef.current) {
      initialLoadRef.current = true
    }
  }, [savedFavorites, favoritesLoading])

  // Save call history when it changes (debounced to avoid excessive writes)
  const callHistorySaveRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!initialLoadRef.current || callHistory.length === 0) return
    
    // Debounce saves to Supabase
    if (callHistorySaveRef.current) {
      clearTimeout(callHistorySaveRef.current)
    }
    callHistorySaveRef.current = setTimeout(() => {
      saveCallHistory(callHistory)
    }, 500)
    
    return () => {
      if (callHistorySaveRef.current) {
        clearTimeout(callHistorySaveRef.current)
      }
    }
  }, [callHistory, saveCallHistory])

  // Save favorites when they change (debounced)
  const favoritesSaveRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!initialLoadRef.current || favorites.length === 0) return
    
    // Debounce saves to Supabase
    if (favoritesSaveRef.current) {
      clearTimeout(favoritesSaveRef.current)
    }
    favoritesSaveRef.current = setTimeout(() => {
      saveFavorites(favorites)
    }, 500)
    
    return () => {
      if (favoritesSaveRef.current) {
        clearTimeout(favoritesSaveRef.current)
      }
    }
  }, [favorites, saveFavorites])

  // Save address on change (debounced)
  const addressSaveRef = useRef<NodeJS.Timeout | null>(null)
  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setManualAddress(newValue)
    
    // Debounce save to Supabase
    if (addressSaveRef.current) {
      clearTimeout(addressSaveRef.current)
    }
    addressSaveRef.current = setTimeout(() => {
      saveAddress(newValue)
    }, 500)
  }

  // Reverse geocode to get city/state from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city?: string; state?: string; country?: string; displayName?: string }> => {
    try {
      // Use free BigDataCloud API for reverse geocoding
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
      if (response.ok) {
        const data = await response.json()
        return {
          city: data.city || data.locality || data.principalSubdivisionCode,
          state: data.principalSubdivision,
          country: data.countryName,
          displayName: data.city 
            ? `${data.city}, ${data.principalSubdivisionCode || data.principalSubdivision}` 
            : `${data.principalSubdivision}, ${data.countryCode}`
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err)
    }
    return {}
  }

  // Get user location on mount
  useEffect(() => {
    detectLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const detectLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true)
      toast.info('Detecting your location...')
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          
          console.log('📍 Raw GPS coordinates:', coords)
          
          // Get city/state via reverse geocoding
          const geoData = await reverseGeocode(coords.latitude, coords.longitude)
          
          const fullLocation: LocationData = {
            ...coords,
            ...geoData
          }
          
          setLocation(fullLocation)
          setIsDetectingLocation(false)
          
          console.log('📍 Full location detected:', fullLocation)
          toast.success(`Location detected: ${fullLocation.displayName || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}`)
          
          // Save to database for persistent use
          try {
            await fetch('/api/user-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: geoData.city,
                state: geoData.state
              })
            })
            console.log('✅ Location saved to database')
          } catch (err) {
            console.warn('Failed to save location to database:', err)
          }
        },
        (error) => {
          console.warn('Location access denied:', error.message, 'Code:', error.code)
          setLocation(null)
          setIsDetectingLocation(false)
          
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location permission denied. Please enable in browser settings or enter address manually.')
            setIsLocationDialogOpen(true)
          } else if (error.code === error.TIMEOUT) {
            toast.error('Location detection timed out. Please try again or enter manually.')
            setIsLocationDialogOpen(true)
          } else {
            toast.error('Location detection failed. Please enter manually.')
            setIsLocationDialogOpen(true)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000 // Allow cached position up to 30 seconds old
        }
      )
    } else {
      console.warn('Geolocation not supported by browser')
      setLocation(null)
      setIsDetectingLocation(false)
      toast.error('Geolocation not supported by your browser.')
      setIsLocationDialogOpen(true)
    }
  }, [])

  // Toggle favorite
  const toggleFavorite = (call: CallHistoryEntry | CallTask) => {
    const historyEntry: CallHistoryEntry = {
      id: call.id,
      business: call.business,
      phone: call.phone,
      address: call.address,
      rating: call.rating,
      status: 'status' in call && call.status !== 'pending' && call.status !== 'calling' 
        ? call.status as 'completed' | 'failed' | 'no-answer'
        : 'completed',
      timestamp: new Date(),
      isFavorite: true
    }
    
    const existingIndex = favorites.findIndex(f => f.business === call.business && f.phone === call.phone)
    
    if (existingIndex >= 0) {
      // Remove from favorites
      setFavorites(prev => prev.filter((_, i) => i !== existingIndex))
      toast.success(`Removed ${call.business} from favorites`)
    } else {
      // Add to favorites
      setFavorites(prev => [historyEntry, ...prev])
      toast.success(`Added ${call.business} to favorites`)
    }
  }

  const isFavorited = (call: CallTask | CallHistoryEntry) => {
    return favorites.some(f => f.business === call.business && f.phone === call.phone)
  }

  // Add to call history
  const addToCallHistory = (call: CallTask) => {
    const historyEntry: CallHistoryEntry = {
      id: call.id,
      business: call.business,
      phone: call.phone,
      address: call.address,
      rating: call.rating,
      status: call.status === 'completed' ? 'completed' : call.status === 'failed' ? 'failed' : 'no-answer',
      timestamp: new Date(),
      transcript: call.transcript,
      isFavorite: isFavorited(call)
    }
    
    setCallHistory(prev => [historyEntry, ...prev.slice(0, 99)]) // Keep last 100 calls
  }

  // Poll for live transcription updates
  const startTranscriptPolling = useCallback((callId: string) => {
    setActiveCallId(callId)
    setIsTranscribing(true)
    setLiveTranscript([])
    
    // Poll every 2 seconds for transcript updates
    transcriptPollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice/status?callSid=${callId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.transcript && data.transcript.length > 0) {
            setLiveTranscript(data.transcript.map((t: any) => ({
              ...t,
              timestamp: new Date(t.timestamp)
            })))
          }
          
          // Update task status
          if (data.status === 'completed' || data.status === 'failed') {
            stopTranscriptPolling()
            
            // Update the task with final transcript
            setTasks(prev => prev.map(task => 
              task.callId === callId 
                ? { ...task, status: data.status, transcript: data.transcript }
                : task
            ))
          }
        }
      } catch (error) {
        console.error('Error fetching transcript:', error)
      }
    }, 2000)
  }, [])

  const stopTranscriptPolling = useCallback(() => {
    if (transcriptPollingRef.current) {
      clearInterval(transcriptPollingRef.current)
      transcriptPollingRef.current = null
    }
    setIsTranscribing(false)
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (transcriptPollingRef.current) {
        clearInterval(transcriptPollingRef.current)
      }
    }
  }, [])

  // #region agent log - Debug H2: Track component mount and dialog states
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-concierge-interface.tsx:mount',message:'AIConciergeInterface mounted',data:{activeTab,showCallConfirmation,showBusinessPicker,callHistoryLength:callHistory.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  }, []);
  useEffect(() => {
    if (activeTab === 'calls') {
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-concierge-interface.tsx:calls-tab',message:'Calls tab activated',data:{callHistoryLength:callHistory.length,favoritesLength:favorites.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    }
  }, [activeTab, callHistory.length, favorites.length]);
  // #endregion

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage)
    }
  }, [initialMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Keyword detection fallback
  const detectRequestFromMessage = (userMsg: string, aiResponse: string, state: any): DetectedRequest | null => {
    const lowerMsg = userMsg.toLowerCase()
    const lowerResponse = aiResponse.toLowerCase()

    // Check if AI confirmed they'll make calls
    const confirmationPhrases = ['calling', "i'll call", 'calling now', 'initiating', 'searching for']
    const hasConfirmation = confirmationPhrases.some(phrase => lowerResponse.includes(phrase))

    if (!hasConfirmation) return null

    // Extract business count from user message
    const countMatch = lowerMsg.match(/(\d+)\s*(places|businesses|shops|locations)/i)
    const businessCount = countMatch ? parseInt(countMatch[1]) : 3

    // Detect intent and description
    let intent = state?.intent || ''
    let description = ''

    // Food intents
    if (lowerMsg.match(/pizza|burger|chinese|sushi|thai|mexican|indian|food|restaurant|order/)) {
      intent = 'food'
      if (lowerMsg.includes('pizza')) description = 'order pizza'
      else if (lowerMsg.includes('burger')) description = 'order burgers'
      else if (lowerMsg.includes('chinese')) description = 'order Chinese food'
      else if (lowerMsg.includes('sushi')) description = 'order sushi'
      else description = 'order food'
    }
    // Auto intents
    else if (lowerMsg.match(/oil change|tire|mechanic|auto|car repair|brake|transmission/)) {
      intent = 'auto'
      if (lowerMsg.includes('oil change')) description = 'schedule an oil change'
      else if (lowerMsg.includes('tire')) description = 'tire service'
      else description = 'auto service'
    }
    // Home intents
    else if (lowerMsg.match(/plumber|electrician|hvac|handyman|roofer|painter/)) {
      intent = 'home'
      if (lowerMsg.includes('plumber')) description = 'plumbing service'
      else if (lowerMsg.includes('electrician')) description = 'electrical service'
      else description = 'home service'
    }
    // Personal services
    else if (lowerMsg.match(/dentist|doctor|haircut|massage|salon|spa/)) {
      intent = 'personal'
      if (lowerMsg.includes('dentist')) description = 'dental appointment'
      else if (lowerMsg.includes('haircut')) description = 'haircut appointment'
      else description = 'personal service'
    }

    if (intent) {
      return { intent, businessCount, description }
    }

    return null
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim()) return

    // #region agent log
    console.log('🔍 [DEBUG-CHAT] handleSendMessage called:', {text: text.substring(0,50), hasLocation: !!location, manualAddress});
    // #endregion

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Call chat API
      const response = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          state: conversationState,
          locationAddress: manualAddress
        })
      })

      const data = await response.json()
      // #region agent log
      console.log('🔍 [DEBUG-CHAT] Chat API response:', {readyToCall: data.readyToCall, intent: data.intent, hasState: !!data.state, response: data.response?.substring(0,100)});
      // #endregion

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

      // Update conversation state
      if (data.state) {
        setConversationState(data.state)
      }

      // If AI is ready to call, SEARCH for businesses first (don't call immediately)
      if (data.readyToCall && data.intent) {
        // #region agent log
        console.log('🔍 [DEBUG-CHAT] readyToCall triggered! Searching businesses:', {intent: data.intent, businessCount: data.businessCount});
        // #endregion
        const request: DetectedRequest = {
          intent: data.intent,
          businessCount: data.businessCount || 3,
          specificBusiness: data.specificBusiness,
          description: data.state?.details?.userRequest || `${data.intent} service`,
          userRequest: data.state?.details?.userRequest
        }
        setPendingCallRequest(request)
        await searchBusinesses(request)
      }
      // FALLBACK: Keyword detection if AI didn't trigger
      else {
        const detected = detectRequestFromMessage(text, data.response, data.state)
        if (detected) {
          console.log('🔍 Keyword detection found request:', detected)
          setDetectedRequest(detected)
          toast.info('Found what you\'re looking for! Click "Search Nearby" to see options.')
        }
      }
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message)
    } finally {
      setIsTyping(false)
    }
  }

  // NEW: Search for businesses and show picker
  const searchBusinesses = async (request: DetectedRequest) => {
    // #region agent log
    console.log('🔍 [DEBUG-SEARCH] searchBusinesses called:', {intent: request.intent, hasLocation: !!location, manualAddress, specificBusiness: request.specificBusiness});
    // #endregion
    if (!location && !manualAddress) {
      // #region agent log
      console.log('🔍 [DEBUG-SEARCH] No location available - showing dialog');
      // #endregion
      toast.error('Location not available. Please set your location.')
      setIsLocationDialogOpen(true)
      return
    }

    setIsSearchingBusinesses(true)
    toast.info(`Searching for ${request.specificBusiness || request.intent} near you...`)

    try {
      const response = await fetch('/api/concierge/search-businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: request.intent,
          specificBusiness: request.specificBusiness,
          userLocation: location,
          locationAddress: manualAddress,
          maxResults: 5
        })
      })

      const data = await response.json()
      // #region agent log
      console.log('🔍 [DEBUG-SEARCH] Search API response:', {success: data.success, businessCount: data.businesses?.length, needsGooglePlaces: data.needsGooglePlaces, error: data.error});
      // #endregion

      if (data.success && data.businesses?.length > 0) {
        setBusinessOptions(data.businesses)
        setShowBusinessPicker(true)
        
        // Auto-select the nearest one (first in list)
        setSelectedBusiness(data.businesses[0])
        
        // Add message about found businesses
        const foundMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📍 Found ${data.businesses.length} ${request.specificBusiness || request.intent} locations near you! The nearest is ${data.businesses[0].name} (${data.businesses[0].distance?.toFixed(1) || '?'} mi away). Please select one to call.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, foundMessage])
      } else {
        if (data.needsGooglePlaces) {
          toast.error('Google Places is not configured (or key is invalid). Add GOOGLE_PLACES_API_KEY and restart the server.')
          const msg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⚠️ I can’t search for nearby businesses yet because Google Places is not configured (or the key is invalid).\n\nFix: set GOOGLE_PLACES_API_KEY (or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) in .env.local with billing enabled for Places + Geocoding, then restart your dev server.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, msg])
          return
        }

        toast.error(data.error || 'No businesses found nearby')
        
        const noResultsMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `😕 I couldn't find any ${request.specificBusiness || request.intent} locations near you. Try checking your location settings or search for something else.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noResultsMessage])
      }
    } catch (error: any) {
      toast.error('Error searching for businesses: ' + error.message)
    } finally {
      setIsSearchingBusinesses(false)
    }
  }

  // NEW: Handle business selection and show confirmation
  const handleSelectBusiness = (business: BusinessOption) => {
    setSelectedBusiness(business)
  }

  // NEW: Confirm and initiate call to selected business
  const confirmAndCall = () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first')
      return
    }
    
    // If business has no phone, check for manual entry
    const phoneToUse = selectedBusiness.phone || manualPhoneNumber.trim()
    if (!phoneToUse) {
      toast.error('Please enter a phone number for this business')
      return
    }
    
    // Update the selected business with manual phone if needed
    if (!selectedBusiness.phone && manualPhoneNumber.trim()) {
      setSelectedBusiness({
        ...selectedBusiness,
        phone: manualPhoneNumber.trim()
      })
    }
    
    setShowCallConfirmation(true)
  }

  // NEW: Actually initiate the call after confirmation
  const executeCall = async () => {
    if (!selectedBusiness || !pendingCallRequest) {
      toast.error('Missing business or request information')
      return
    }

    setShowCallConfirmation(false)
    setShowBusinessPicker(false)
    setActiveTab('tasks')
    toast.info(`Calling ${selectedBusiness.name}...`)

    // #region agent log
    console.log('🔍 [DEBUG-B] UI executeCall started:', {business: selectedBusiness?.name, phone: selectedBusiness?.phone, intent: pendingCallRequest?.intent});
    // #endregion

    try {
      const response = await fetch('/api/concierge/initiate-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: pendingCallRequest.intent,
          businessCount: 1, // Only call the selected one
          specificBusiness: selectedBusiness.name,
          userLocation: location ? { latitude: location.latitude, longitude: location.longitude } : null,
          locationAddress: manualAddress,
          details: {
            ...conversationState?.details,
            userRequest: pendingCallRequest.userRequest || pendingCallRequest.description,
            selectedBusinessPhone: selectedBusiness.phone,
            selectedBusinessAddress: selectedBusiness.address
          }
        })
      })

      const data = await response.json()
      // #region agent log
      console.log('🔍 [DEBUG-B] API response received:', {success: data.success, callsCount: data.calls?.length, error: data.error});
      // #endregion

      if (data.success && data.calls) {
        // Convert API response to tasks
        const newTasks: CallTask[] = data.calls.map((call: any, idx: number) => ({
          id: `task-${Date.now()}-${idx}`,
          business: call.business,
          phone: call.phone,
          address: call.address,
          rating: call.rating,
          distance: selectedBusiness.distance,
          status: call.status === 'initiated' ? 'calling' : call.status === 'failed' ? 'failed' : 'pending',
          callId: call.callId,
          error: call.error,
          isFavorite: false
        }))
        setTasks(newTasks)
        toast.success(`Calling ${selectedBusiness.name}!`)

        // Start live transcription polling for active calls
        const activeCall = newTasks.find(t => t.callId && t.status === 'calling')
        if (activeCall?.callId) {
          startTranscriptPolling(activeCall.callId)
        }

        // Add status message to chat
        const statusMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📞 Calling ${selectedBusiness.name} now! Check the Tasks tab to see live transcription and call progress.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, statusMessage])
        
        // Auto-add to call history after a delay (when call completes)
        setTimeout(() => {
          newTasks.forEach(task => {
            if (task.status !== 'pending') {
              addToCallHistory(task)
            }
          })
        }, 30000) // Add to history after 30 seconds
      } else {
        toast.error(data.error || 'Failed to initiate call')
        
        // Add error to task list for visibility
        const errorTask: CallTask = {
          id: `task-${Date.now()}`,
          business: selectedBusiness.name,
          phone: selectedBusiness.phone || 'Unknown',
          address: selectedBusiness.address,
          rating: selectedBusiness.rating,
          distance: selectedBusiness.distance,
          status: 'failed',
          error: data.error || 'Failed to initiate call',
          isFavorite: false
        }
        setTasks([errorTask])
        
        // Add failed call to history
        addToCallHistory(errorTask)
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-concierge-interface.tsx:executeCall_catch',message:'executeCall caught error',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      toast.error('Error initiating call: ' + error.message)
    }

    // Reset states
    setPendingCallRequest(null)
    setSelectedBusiness(null)
    setBusinessOptions([])
    setManualPhoneNumber('')
  }

  // Legacy: Direct call initiation (for backward compatibility)
  const initiateCalls = async (intent: string, businessCount: number, specificBusiness?: string) => {
    const request: DetectedRequest = {
      intent,
      businessCount,
      specificBusiness,
      description: `${intent} service`
    }
    setPendingCallRequest(request)
    await searchBusinesses(request)
    setDetectedRequest(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'calling':
        return <Phone className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Unknown distance'
    if (distance < 0.1) return 'Very close!'
    return `${distance.toFixed(1)} mi away`
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0f1729]">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-purple-500/20">
        <div className="relative">
          <Sparkles className="h-8 w-8 text-purple-400" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Concierge</h2>
          <p className="text-sm text-gray-400">Your intelligent life assistant</p>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-500/30 text-red-300 hover:bg-red-500/20"
              onClick={() => {
                setMessages([])
                setConversationState(null)
                setDetectedRequest(null)
                setBusinessOptions([])
                setSelectedBusiness(null)
                setShowBusinessPicker(false)
                setShowCallConfirmation(false)
                setPendingCallRequest(null)
                toast.success('Chat cleared')
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          )}
          
          <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
              <Settings className="h-4 w-4 mr-2" />
              {manualAddress || location ? 'Edit Location' : 'Set Location'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f2e] border-purple-500/30 text-white" aria-describedby="location-dialog-description">
            <DialogHeader>
              <DialogTitle>Set Location</DialogTitle>
              <DialogDescription id="location-dialog-description" className="text-gray-400">
                The concierge needs your location to find nearby businesses accurately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <Label>Auto-Detect</Label>
                <Button 
                  onClick={() => {
                    detectLocation()
                    setIsLocationDialogOpen(false)
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Detect Current Location
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-700 flex-1" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="h-px bg-gray-700 flex-1" />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Manual Location</Label>
                <Input 
                  placeholder="Enter exact delivery address (e.g. 123 Main St, City, State)"
                  value={manualAddress}
                  onChange={handleManualAddressChange}
                  className="bg-[#0f1729] border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This exact address will be used for delivery and finding the nearest businesses.
                </p>
              </div>
              
              {location && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded space-y-2">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <Navigation className="h-4 w-4 flex-shrink-0" />
                    <span>GPS Active</span>
                  </p>
                  {location.displayName && (
                    <p className="text-sm text-white font-medium">{location.displayName}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  {location.city && location.state && (
                    <p className="text-xs text-gray-400">
                      {location.city}, {location.state}
                    </p>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="w-full mt-2"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-detect Location
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsLocationDialogOpen(false)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>

        {isDetectingLocation ? (
          <Badge variant="outline" className="ml-2 border-blue-500/30 text-blue-400 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Detecting...
          </Badge>
        ) : location || manualAddress ? (
          <Badge 
            variant="outline" 
            className="ml-2 border-green-500/30 text-green-400 max-w-[200px] truncate cursor-pointer hover:bg-green-500/10"
            onClick={() => setIsLocationDialogOpen(true)}
            title={manualAddress || location?.displayName || `${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}`}
          >
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {manualAddress 
                ? manualAddress.split(',')[0] 
                : location?.displayName || `${location?.latitude?.toFixed(4)}, ${location?.longitude?.toFixed(4)}`}
            </span>
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className="ml-2 border-yellow-500/30 text-yellow-400 cursor-pointer hover:bg-yellow-500/10"
            onClick={() => setIsLocationDialogOpen(true)}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Set Location
          </Badge>
        )}
      </div>

      {/* Business Picker Dialog */}
      <Dialog open={showBusinessPicker} onOpenChange={setShowBusinessPicker}>
        <DialogContent className="bg-[#1a1f2e] border-purple-500/30 text-white max-w-lg max-h-[85vh] overflow-hidden flex flex-col" aria-describedby="business-picker-description">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              Select a Business to Call
            </DialogTitle>
            <DialogDescription id="business-picker-description" className="text-gray-400">
              Choose from the nearest locations. The closest one is pre-selected.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {isSearchingBusinesses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="ml-3 text-gray-400">Searching nearby businesses...</span>
              </div>
            ) : (
              <RadioGroup 
                value={selectedBusiness?.id || ''} 
                onValueChange={(id) => {
                  const biz = businessOptions.find(b => b.id === id)
                  if (biz) setSelectedBusiness(biz)
                }}
                className="space-y-3"
              >
                {businessOptions.map((business, index) => (
                  <div 
                    key={business.id}
                    className={`relative flex items-start p-4 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                      selectedBusiness?.id === business.id 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-gray-700 hover:border-purple-500/50'
                    }`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <RadioGroupItem value={business.id} id={business.id} className="mt-1 flex-shrink-0" />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label htmlFor={business.id} className="font-semibold text-white cursor-pointer truncate">
                          {business.name}
                        </Label>
                        {index === 0 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs flex-shrink-0">
                            Nearest
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 text-sm">
                        <p className="text-gray-400 flex items-center gap-1">
                          <Navigation className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDistance(business.distance)}</span>
                        </p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{business.address}</span>
                        </p>
                        {business.phone ? (
                          <p className="text-green-400 flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{business.phone}</span>
                          </p>
                        ) : (
                          <p className="text-yellow-400 flex items-center gap-1 text-xs">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>No phone available</span>
                          </p>
                        )}
                        {business.rating && (
                          <p className="text-yellow-400 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 flex-shrink-0" />
                            <span>{business.rating.toFixed(1)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Business Image (if available) */}
                    {business.imageUrl && (
                      <div className="w-16 h-16 flex-shrink-0 ml-3 rounded-lg overflow-hidden bg-gray-800">
                        <img 
                          src={business.imageUrl} 
                          alt={business.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image on error
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
          
          {/* Manual phone input when selected business has no phone */}
          {selectedBusiness && !selectedBusiness.phone && (
            <div className="px-4 py-3 bg-yellow-500/10 border-t border-yellow-500/20">
              <p className="text-sm text-yellow-400 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No phone number found for {selectedBusiness.name}. Enter it manually:
              </p>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={manualPhoneNumber}
                onChange={(e) => setManualPhoneNumber(e.target.value)}
                className="bg-[#0f1729] border-yellow-500/30 text-white placeholder:text-gray-500"
              />
            </div>
          )}
          
          <DialogFooter className="gap-2 flex-shrink-0 pt-4 border-t border-purple-500/20">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBusinessPicker(false)
                setBusinessOptions([])
                setPendingCallRequest(null)
                setManualPhoneNumber('')
              }}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAndCall}
              disabled={!selectedBusiness || (!selectedBusiness.phone && !manualPhoneNumber.trim())}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              <span className="truncate max-w-[150px]">Call {selectedBusiness?.name || 'Selected'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Confirmation Dialog */}
      <AlertDialog open={showCallConfirmation} onOpenChange={setShowCallConfirmation}>
        <AlertDialogContent className="bg-[#1a1f2e] border-purple-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-400" />
              Confirm Call
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to call <span className="text-white font-semibold">{selectedBusiness?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Moved outside AlertDialogDescription to avoid div-in-p nesting */}
          <div className="mt-3 p-3 bg-[#0f1729] rounded-lg text-sm">
            <p className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-4 w-4 text-gray-500" />
              {selectedBusiness?.address}
            </p>
            <p className="flex items-center gap-2 text-green-400 mt-1">
              <Phone className="h-4 w-4 text-green-500" />
              {selectedBusiness?.phone || manualPhoneNumber || 'No phone'}
            </p>
            {selectedBusiness?.distance && (
              <p className="flex items-center gap-2 text-green-400 mt-1">
                <Navigation className="h-4 w-4" />
                {formatDistance(selectedBusiness.distance)}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeCall}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Yes, Call Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="w-full justify-start gap-1 bg-transparent border-b border-purple-500/20 rounded-none p-0 h-auto flex-shrink-0 overflow-x-auto">
          <TabsTrigger
            value="chat"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-3 py-2"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-3 py-2"
          >
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks
            {tasks.filter(t => t.status === 'calling').length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-green-500/30 text-green-300 border-none animate-pulse">
                {tasks.filter(t => t.status === 'calling').length} Active
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="calls"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-3 py-2"
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            Calls
            {callHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-purple-500/30 text-purple-300 border-none">
                {callHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-4 max-w-full">
              {messages.length === 0 && (
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">
                      👋 Welcome! I&apos;m your AI Concierge
                    </h3>
                    <p className="text-sm text-gray-300 mb-4">
                      I can help you with tasks like:
                    </p>
                    <ul className="text-sm text-gray-400 space-y-2">
                      <li>🍕 Ordering food from restaurants</li>
                      <li>🔧 Booking service appointments</li>
                      <li>📞 Calling businesses on your behalf</li>
                      <li>🗓️ Scheduling and reminders</li>
                    </ul>
                    {!location && !manualAddress && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <p className="text-sm text-yellow-400">
                          ⚠️ Location access is required to find nearby businesses. Please enable location in your browser settings or enter your address manually.
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-4">
                      Try: &quot;Find me the nearest Pizza Hut&quot; or &quot;I need a plumber&quot;
                    </p>
                  </CardContent>
                </Card>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#1a1f2e] text-gray-200 border border-purple-500/20'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-60 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1f2e] border border-purple-500/20 rounded-lg p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  </div>
                </div>
              )}

              {/* Search/Call Button for detected requests */}
              {detectedRequest && (
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Search className="h-6 w-6 text-purple-400" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">Ready to Search</h4>
                        <p className="text-sm text-gray-300">
                          I&apos;ll find {detectedRequest.specificBusiness || detectedRequest.intent} places near you
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetectedRequest(null)}
                          className="border-gray-500/30 text-gray-300 hover:bg-gray-700/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            initiateCalls(
                              detectedRequest.intent,
                              detectedRequest.businessCount,
                              detectedRequest.specificBusiness
                            )
                          }}
                          disabled={isSearchingBusinesses}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isSearchingBusinesses ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          Search Nearby
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-purple-500/20">
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Ask me anything... (e.g. 'Order a pizza')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="flex-1 bg-[#1a1f2e] border-purple-500/30 text-white placeholder:text-gray-500 min-h-[60px] resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-[#1a1f2e] border-purple-500/30 hover:bg-purple-500/20"
                >
                  <Mic className="h-4 w-4 text-purple-400" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 m-0 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Live Transcription Panel (shows when call is active) */}
            {isTranscribing && liveTranscript.length > 0 && (
              <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-green-400">Live Transcription</span>
                  <Volume2 className="h-4 w-4 text-green-400 animate-pulse" />
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {liveTranscript.map((entry, idx) => (
                      <div key={idx} className={`flex gap-2 ${entry.speaker === 'ai' ? 'text-blue-300' : 'text-gray-300'}`}>
                        <span className="text-xs font-mono opacity-60">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-xs font-semibold uppercase">
                          {entry.speaker === 'ai' ? '🤖 AI' : '👤 Human'}:
                        </span>
                        <span className="text-sm flex-1">{entry.message}</span>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <ScrollArea className="flex-1 p-6">
              {tasks.length === 0 ? (
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-6 text-center">
                    <ListTodo className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">No Active Tasks</h3>
                    <p className="text-sm text-gray-400">
                      Start a conversation in the Chat tab to create tasks
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id} className="bg-[#1a1f2e] border-purple-500/20 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white truncate">{task.business}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => toggleFavorite(task)}
                              >
                                <Heart className={`h-4 w-4 ${isFavorited(task) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 truncate">📞 {task.phone}</p>
                            <p className="text-sm text-gray-400 truncate">📍 {task.address}</p>
                            {task.distance && (
                              <p className="text-sm text-green-400">
                                <Navigation className="h-3 w-3 inline mr-1" />
                                {formatDistance(task.distance)}
                              </p>
                            )}
                            {task.rating && (
                              <p className="text-sm text-yellow-400">⭐ {task.rating}</p>
                            )}
                            {task.callId && (
                              <p className="text-xs text-gray-500 mt-2 font-mono truncate">ID: {task.callId}</p>
                            )}
                            {task.error && (
                              <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {task.error}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={`
                                ${task.status === 'completed' ? 'border-green-500/30 text-green-400' : ''}
                                ${task.status === 'failed' ? 'border-red-500/30 text-red-400' : ''}
                                ${task.status === 'calling' ? 'border-blue-500/30 text-blue-400 animate-pulse' : ''}
                                ${task.status === 'pending' ? 'border-gray-500/30 text-gray-400' : ''}
                              `}
                            >
                              {task.status === 'calling' && <Phone className="h-3 w-3 mr-1 animate-bounce" />}
                              {task.status}
                            </Badge>
                            {task.status === 'completed' || task.status === 'failed' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => addToCallHistory(task)}
                              >
                                Save to History
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Show transcript summary if available */}
                        {task.transcript && task.transcript.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-500/10">
                            <p className="text-xs text-gray-500 mb-2">Transcript Summary:</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {task.transcript.slice(-5).map((t, i) => (
                                <p key={i} className={`text-xs ${t.speaker === 'ai' ? 'text-blue-300' : 'text-gray-300'}`}>
                                  <span className="font-semibold">{t.speaker === 'ai' ? 'AI' : 'Caller'}:</span> {t.message}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Calls History Tab */}
        <TabsContent value="calls" className="flex-1 m-0 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Sub-tabs for Favorites, Recent, All */}
            <div className="flex gap-2 p-4 border-b border-purple-500/20 flex-shrink-0">
              <Button
                variant={callsSubTab === 'favorites' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCallsSubTab('favorites')}
                className={callsSubTab === 'favorites' ? 'bg-purple-600' : ''}
              >
                <Heart className={`h-4 w-4 mr-2 ${callsSubTab === 'favorites' ? 'fill-white' : ''}`} />
                Favorites
                {favorites.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-500/30 text-red-300 border-none text-xs">
                    {favorites.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={callsSubTab === 'recent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCallsSubTab('recent')}
                className={callsSubTab === 'recent' ? 'bg-purple-600' : ''}
              >
                <History className="h-4 w-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={callsSubTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCallsSubTab('all')}
                className={callsSubTab === 'all' ? 'bg-purple-600' : ''}
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                All Calls
                {callHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-purple-500/30 text-purple-300 border-none text-xs">
                    {callHistory.length}
                  </Badge>
                )}
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {/* Favorites Tab Content */}
              {callsSubTab === 'favorites' && (
                <>
                  {favorites.length === 0 ? (
                    <Card className="bg-purple-500/10 border-purple-500/20">
                      <CardContent className="p-6 text-center">
                        <Heart className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">No Favorites Yet</h3>
                        <p className="text-sm text-gray-400">
                          Click the heart icon on a call to add it to favorites
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {favorites.map((call) => (
                        <CallHistoryCard 
                          key={call.id} 
                          call={call} 
                          onToggleFavorite={() => toggleFavorite(call)}
                          isFavorite={true}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Recent Calls Tab Content */}
              {callsSubTab === 'recent' && (
                <>
                  {callHistory.length === 0 ? (
                    <Card className="bg-purple-500/10 border-purple-500/20">
                      <CardContent className="p-6 text-center">
                        <History className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">No Recent Calls</h3>
                        <p className="text-sm text-gray-400">
                          Your recent calls will appear here
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {callHistory.slice(0, 10).map((call) => (
                        <CallHistoryCard 
                          key={call.id} 
                          call={call} 
                          onToggleFavorite={() => toggleFavorite(call)}
                          isFavorite={isFavorited(call)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* All Calls Tab Content */}
              {callsSubTab === 'all' && (
                <>
                  {callHistory.length === 0 ? (
                    <Card className="bg-purple-500/10 border-purple-500/20">
                      <CardContent className="p-6 text-center">
                        <PhoneCall className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">No Call History</h3>
                        <p className="text-sm text-gray-400">
                          Start making calls to build your history
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {callHistory.map((call) => (
                        <CallHistoryCard 
                          key={call.id} 
                          call={call} 
                          onToggleFavorite={() => toggleFavorite(call)}
                          isFavorite={isFavorited(call)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Call History Card Component
function CallHistoryCard({ 
  call, 
  onToggleFavorite, 
  isFavorite 
}: { 
  call: CallHistoryEntry
  onToggleFavorite: () => void
  isFavorite: boolean
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 border-green-500/30'
      case 'failed': return 'text-red-400 border-red-500/30'
      case 'no-answer': return 'text-yellow-400 border-yellow-500/30'
      default: return 'text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Card className="bg-[#1a1f2e] border-purple-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Phone className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white truncate">{call.business}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={onToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
              </Button>
            </div>
            <p className="text-sm text-gray-400 truncate">{call.phone}</p>
            <p className="text-xs text-gray-500 truncate">{call.address}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">
                {call.timestamp.toLocaleDateString()} {call.timestamp.toLocaleTimeString()}
              </span>
              {call.duration && (
                <span className="text-xs text-gray-500">
                  Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
              {call.rating && (
                <span className="text-xs text-yellow-400">⭐ {call.rating}</span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(call.status)}>
            {call.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
