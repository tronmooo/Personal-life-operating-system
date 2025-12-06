'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Stethoscope } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Consultation {
  id: string
  question: string
  response: string
  timestamp: string
}

interface AIVetTabProps {
  pet: any
}

export function AIVetTab({ pet }: AIVetTabProps) {
  const { getData, addData } = useData()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadConsultations()
    
    const handleUpdate = () => loadConsultations()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('pets-data-updated', handleUpdate)
    }
  }, [pet.id])

  const loadConsultations = () => {
    const petsData = getData('pets')
    const petConsultations = petsData
      .filter(item => 
        item.metadata?.petId === pet.id && 
        item.metadata?.itemType === 'ai-consultation'
      )
      .map(item => ({
        id: item.id,
        question: String(item.metadata?.question || ''),
        response: String(item.metadata?.response || ''),
        timestamp: String(item.metadata?.timestamp || item.createdAt)
      }))
      .sort((a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime())
    
    setConsultations(petConsultations)
  }

  const generateAIResponse = (question: string): string => {
    // Simple AI simulation - in production, this would call an actual AI API
    const responses = [
      `Based on ${pet.name}'s profile (${pet.species}, ${pet.age || 'unknown age'}), here's my assessment:

Common causes could include environmental factors, diet changes, or seasonal allergies. 

Recommendations:
• Monitor for 24-48 hours
• Ensure adequate hydration
• Maintain regular feeding schedule
• Keep environment stress-free

When to see a vet:
• If symptoms worsen
• If accompanied by lethargy or loss of appetite
• If persists beyond 48 hours
• If you notice any severe distress

Remember: This is general guidance only. For serious concerns, always consult your licensed veterinarian.`,
      
      `Thank you for your question about ${pet.name}.

For a ${pet.species} of ${pet.age || 'this age'}, this is ${Math.random() > 0.5 ? 'fairly common' : 'something to monitor'}.

Key points to consider:
• Species-specific behavior patterns
• Age-related factors
• Environmental influences
• Recent changes in routine

I recommend:
1. Document when this occurs
2. Note any patterns or triggers
3. Keep a log of frequency
4. Monitor for changes

Seek immediate veterinary care if:
• Behavior is severe or sudden
• Accompanied by other symptoms
• Interfering with normal activities
• Causing distress

Note: AI Vet provides general guidance only. Always consult a licensed veterinarian for serious concerns or emergencies.`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      alert('Please enter your question')
      return
    }

    setIsLoading(true)

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const response = generateAIResponse(question)

      await addData('pets', {
        title: 'AI Vet Consultation',
        description: question.substring(0, 100),
        metadata: {
          itemType: 'ai-consultation',
          petId: pet.id,
          question,
          response,
          timestamp: new Date().toISOString()
        }
      })

      console.log('✅ AI consultation saved to database')
      loadConsultations()

      setQuestion('')
      setIsLoading(false)
      setShowDialog(false)
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert('Failed to save consultation')
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ask AI Vet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="question">Describe your concern</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., My dog has been scratching more than usual..."
                rows={5}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be as specific as possible for better guidance
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? 'AI Vet is thinking...' : 'Get AI Guidance'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Disclaimer */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <p className="text-sm">
            <strong>Note:</strong> AI Vet provides general guidance only. For serious concerns or emergencies, always consult a licensed veterinarian.
          </p>
        </Card>

        <Button
          onClick={() => setShowDialog(true)}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Stethoscope className="h-4 w-4 mr-2" />
          Ask AI Vet
        </Button>

        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No consultations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <Card key={consultation.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(consultation.timestamp).toLocaleString()}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <p className="font-medium mb-2">Your Question:</p>
                      <p className="text-sm">{consultation.question}</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                    <p className="font-medium mb-2 text-teal-700 dark:text-teal-400">AI Vet Response:</p>
                    <p className="text-sm whitespace-pre-wrap">{consultation.response}</p>
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

