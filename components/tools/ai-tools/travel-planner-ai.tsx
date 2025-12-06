'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Plane, Hotel, Calendar, MapPin, Loader2, Sparkles } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { toast } from '@/lib/utils/toast'

interface TravelPlan {
  id: string
  trip_name: string
  destination: string
  start_date: string
  end_date: string
  itinerary: Array<{
    day: number
    activities: string[]
    notes: string
  }>
  budget: number
  notes: string
  created_at?: string
}

export function TravelPlannerAI() {
  const [plans, setPlans] = useState<TravelPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    trip_name: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    preferences: ''
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/ai-tools/travel', { credentials: 'include' })
      if (response.ok) {
        const result = await response.json()
        setPlans(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load travel plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateItinerary = async () => {
    if (!formData.trip_name || !formData.destination || !formData.start_date) {
      toast.error('Missing Information', 'Please fill in trip name, destination, and start date')
      return
    }

    setGenerating(true)
    try {
      // Calculate number of days
      const start = new Date(formData.start_date)
      const end = formData.end_date ? new Date(formData.end_date) : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Generate AI itinerary
      const aiResponse = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Create a detailed ${days}-day travel itinerary for ${formData.destination}. Budget: $${formData.budget || 'flexible'}. Preferences: ${formData.preferences || 'general tourism'}. Include daily activities, must-see attractions, local food recommendations, and practical tips. Return ONLY valid JSON with this structure: { "itinerary": [{ "day": 1, "activities": ["activity 1", "activity 2"], "notes": "notes" }] }`,
          type: 'itinerary',
          format: 'json'
        })
      })

      const aiResult = await aiResponse.json()
      let generatedItinerary = []
      try {
        const parsed = JSON.parse(aiResult.analysis)
        generatedItinerary = parsed.itinerary || []
      } catch (e) {
        console.error('Failed to parse AI itinerary', e)
        // Fallback or empty
      }
      
      if (generatedItinerary.length === 0) {
         // Basic fallback if parsing fails completely
         generatedItinerary = Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          activities: [`Explore ${formData.destination}`],
          notes: ''
        }))
      }

      // Save to database
      const saveResponse = await fetch('/api/ai-tools/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_name: formData.trip_name,
          destination: formData.destination,
          start_date: formData.start_date,
          end_date: formData.end_date || new Date(end).toISOString().split('T')[0],
          budget: parseFloat(formData.budget) || 0,
          itinerary: generatedItinerary,
          notes: formData.preferences
        })
      })

      if (saveResponse.ok) {
        const saved = await saveResponse.json()
        setPlans([saved.data, ...plans])
        setShowForm(false)
        setFormData({ trip_name: '', destination: '', start_date: '', end_date: '', budget: '', preferences: '' })
        toast.success('Itinerary Generated!', `Created ${days}-day plan for ${formData.destination}`)
      }
    } catch (error: any) {
      toast.error('Generation Failed', error.message || 'Could not generate itinerary')
    } finally {
      setGenerating(false)
    }
  }

  const parseItinerary = (text: string, days: number) => {
    const itinerary = []
    const lines = text.split('\n').filter(l => l.trim())

    for (let i = 1; i <= days; i++) {
      const dayActivities = lines
        .filter(l => l.toLowerCase().includes(`day ${i}`) || l.toLowerCase().includes(`day${i}`))
        .map(l => l.replace(/^day \d+:?\s*/i, '').trim())
        .filter(l => l.length > 0)

      itinerary.push({
        day: i,
        activities: dayActivities.length > 0 ? dayActivities : [`Explore ${formData.destination}`],
        notes: ''
      })
    }

    return itinerary.length > 0 ? itinerary : Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      activities: [`Day ${i + 1} activities`],
      notes: ''
    }))
  }

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this travel plan?')) return

    try {
      const response = await fetch(`/api/ai-tools/travel?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setPlans(plans.filter(p => p.id !== id))
        toast.success('Deleted', 'Travel plan removed')
      }
    } catch (error) {
      toast.error('Delete Failed', 'Could not delete travel plan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">✈️ AI Travel Planner</h2>
          <p className="text-muted-foreground">Generate detailed travel itineraries with AI</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Trip
        </Button>
      </div>

      {/* New Plan Form */}
      {showForm && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Create New Travel Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trip Name</Label>
                <Input
                  placeholder="Summer Vacation 2025"
                  value={formData.trip_name}
                  onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  placeholder="Paris, France"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget (USD)</Label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferences (Optional)</Label>
              <Textarea
                placeholder="E.g., Museums, local cuisine, outdoor activities, family-friendly..."
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={generateItinerary} disabled={generating} className="gap-2">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading travel plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Travel Plans Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI-generated itinerary!</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Plan Your Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {plan.trip_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.destination} • {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.itinerary?.length || 0} days</span>
                  </div>
                  {plan.budget > 0 && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>${plan.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {plan.itinerary && plan.itinerary.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Itinerary</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {plan.itinerary.map((day, idx) => (
                        <div key={idx} className="border-l-2 border-primary pl-3">
                          <div className="font-medium">Day {day.day}</div>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {day.activities.map((activity, aidx) => (
                              <li key={aidx}>{activity}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
