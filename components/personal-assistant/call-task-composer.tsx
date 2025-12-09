'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Phone, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CallTaskComposerProps {
  onTaskCreated?: (task: any) => void
  existingContacts?: Array<{ id: string; name: string; phone_number: string }>
}

export function CallTaskComposer({ onTaskCreated, existingContacts = [] }: CallTaskComposerProps) {
  const [instruction, setInstruction] = useState('')
  const [contactId, setContactId] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [tone, setTone] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [priority, setPriority] = useState<string>('normal')
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [showClarification, setShowClarification] = useState(false)

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      toast.error('Please enter what you want the assistant to do')
      return
    }

    setLoading(true)
    setAiResponse(null)
    setShowClarification(false)

    try {
      const response = await fetch('/api/call-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_instruction: instruction,
          contact_id: contactId || undefined,
          phone_number: phoneNumber || undefined,
          tone: tone || undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          priority: priority || 'normal'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create call task')
      }

      setAiResponse(data)

      if (data.requires_clarification) {
        setShowClarification(true)
        toast.info('The assistant needs more information before calling')
      } else {
        toast.success('Call task created and ready!')
        if (onTaskCreated) {
          onTaskCreated(data.call_task)
        }
        // Reset form
        resetForm()
      }

    } catch (error: any) {
      console.error('Error creating call task:', error)
      toast.error(error.message || 'Failed to create call task')
    } finally {
      setLoading(false)
    }
  }

  const handleProvideClarification = async () => {
    if (!aiResponse?.call_task?.id) return

    setLoading(true)

    try {
      const updates: any = {}
      if (phoneNumber) updates.target_phone_number = phoneNumber
      if (maxPrice) updates.max_price = parseFloat(maxPrice)
      if (tone) updates.tone = tone
      if (contactId) updates.contact_id = contactId

      const response = await fetch(`/api/call-tasks/${aiResponse.call_task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update call task')
      }

      toast.success('Information updated! Call task is now ready.')
      
      if (onTaskCreated) {
        onTaskCreated(data.call_task)
      }

      resetForm()
      setShowClarification(false)
      setAiResponse(null)

    } catch (error: any) {
      console.error('Error updating call task:', error)
      toast.error(error.message || 'Failed to update call task')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setInstruction('')
    setContactId('')
    setPhoneNumber('')
    setTone('')
    setMaxPrice('')
    setPriority('normal')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Create Call Task
          </CardTitle>
          <CardDescription>
            Tell the AI assistant what you need, and it will make the call for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Instruction */}
          <div className="space-y-2">
            <Label htmlFor="instruction">
              What should the assistant do? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Example: Call my dentist and schedule the earliest appointment this week"
              rows={3}
              disabled={loading || showClarification}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want. The AI will ask clarifying questions if needed.
            </p>
          </div>

          {/* Optional: Contact Selection */}
          {existingContacts.length > 0 && !showClarification && (
            <div className="space-y-2">
              <Label htmlFor="contact">Contact (Optional)</Label>
              <Select value={contactId} onValueChange={setContactId} disabled={loading}>
                <SelectTrigger id="contact">
                  <SelectValue placeholder="Select a contact or enter phone manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None - I'll provide phone number</SelectItem>
                  {existingContacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} - {contact.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Optional: Phone Number */}
          {!contactId && !showClarification && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>
          )}

          {/* Optional: Advanced Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone} disabled={loading || showClarification}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Friendly (default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="firm">Firm</SelectItem>
                  <SelectItem value="assertive">Assertive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority} disabled={loading || showClarification}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Maximum Price (Optional)</Label>
            <Input
              id="maxPrice"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="100.00"
              disabled={loading || showClarification}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              AI will notify you if the price exceeds this amount
            </p>
          </div>

          {/* Submit Button */}
          {!showClarification && (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !instruction.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Create Call Task
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* AI Response / Clarification Needed */}
      {aiResponse && showClarification && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HelpCircle className="h-5 w-5" />
              More Information Needed
            </CardTitle>
            <CardDescription>
              The AI assistant needs clarification before making the call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show AI Plan */}
            {aiResponse.ai_plan && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Goal:</h4>
                  <p className="text-sm text-muted-foreground">{aiResponse.ai_plan.goal}</p>
                </div>

                {aiResponse.ai_plan.missingInfo && aiResponse.ai_plan.missingInfo.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Missing Information:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiResponse.ai_plan.missingInfo.map((info: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Clarification Form */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-medium">Provide Missing Details:</h4>
              
              <div className="space-y-2">
                <Label htmlFor="clarify-phone">Phone Number</Label>
                <Input
                  id="clarify-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={loading}
                />
              </div>

              {aiResponse.ai_plan?.missingInfo?.some((info: string) => 
                info.toLowerCase().includes('price') || info.toLowerCase().includes('budget')
              ) && (
                <div className="space-y-2">
                  <Label htmlFor="clarify-price">Maximum Price</Label>
                  <Input
                    id="clarify-price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="100.00"
                    disabled={loading}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <Button 
                onClick={handleProvideClarification}
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Information
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {aiResponse && !showClarification && aiResponse.status === 'ready_to_call' && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Task Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Your call task has been created and is ready to be initiated.
            </p>
            {aiResponse.ai_plan && (
              <div className="space-y-2">
                <Badge variant="outline">Goal: {aiResponse.ai_plan.goal}</Badge>
                {aiResponse.call_task?.status && (
                  <Badge variant="secondary">Status: {aiResponse.call_task.status}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


























