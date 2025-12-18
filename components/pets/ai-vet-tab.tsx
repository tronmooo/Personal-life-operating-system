'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Stethoscope, Loader2, AlertCircle } from 'lucide-react'

interface Consultation {
  id: string
  question: string
  response: string
  created_at: string
}

interface AIVetTabProps {
  pet: {
    id: string
    name: string
    species: string
    breed?: string
    age?: string
  }
}

export function AIVetTab({ pet }: AIVetTabProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConsultations()
    
    const handleUpdate = () => loadConsultations()
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('pets-data-updated', handleUpdate)
    }
  }, [pet.id])

  const loadConsultations = async () => {
    try {
      setIsLoadingConsultations(true)
      setError(null)
      
      const response = await fetch(`/api/pets/ai-consultations?petId=${pet.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to load consultations')
      }
      
      const data = await response.json()
      setConsultations(data.consultations || [])
    } catch (err) {
      console.error('Error loading consultations:', err)
      setError('Failed to load previous consultations')
    } finally {
      setIsLoadingConsultations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setError('Please enter your question')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pets/ai-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          petId: pet.id,
          question: question.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      // Add new consultation to the top of the list
      setConsultations(prev => [data.consultation, ...prev])
      
      setQuestion('')
      setShowDialog(false)
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('pets-data-updated'))
    } catch (err) {
      console.error('Error creating consultation:', err)
      setError(err instanceof Error ? err.message : 'Failed to get AI response')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              Ask AI Vet about {pet.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="question">Describe your concern</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`e.g., My ${pet.species.toLowerCase()} has been scratching more than usual...`}
                rows={5}
                disabled={isLoading}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be as specific as possible for better guidance
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI Vet is thinking...
                </>
              ) : (
                'Get AI Guidance'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Disclaimer */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm">
            <strong>Note:</strong> AI Vet provides general guidance only. For serious concerns or emergencies, always consult a licensed veterinarian.
          </p>
        </Card>

        <Button
          onClick={() => {
            setError(null)
            setShowDialog(true)
          }}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Stethoscope className="h-4 w-4 mr-2" />
          Ask AI Vet
        </Button>

        {isLoadingConsultations ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
            <p className="text-muted-foreground">Loading consultations...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No consultations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask AI Vet a question about {pet.name}&apos;s health
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <Card key={consultation.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(consultation.created_at).toLocaleString()}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <p className="font-medium mb-2">Your Question:</p>
                      <p className="text-sm">{consultation.question}</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                    <p className="font-medium mb-2 text-teal-700 dark:text-teal-400">AI Vet Response:</p>
                    <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                      {consultation.response}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
