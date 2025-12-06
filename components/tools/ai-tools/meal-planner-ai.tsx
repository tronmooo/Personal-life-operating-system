'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Utensils, Plus, Trash2, Loader2, Sparkles, ShoppingCart } from 'lucide-react'
import { toast } from '@/lib/utils/toast'

interface MealPlan {
  id: string
  week_start: string
  meals: Record<string, { breakfast: string; lunch: string; dinner: string }>
  grocery_list: string[]
  dietary_preferences: string[]
}

export function MealPlannerAI() {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [preferences, setPreferences] = useState('')

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/ai-tools/meals', { credentials: 'include' })
      if (response.ok) {
        const result = await response.json()
        setPlans(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Create a healthy 7-day meal plan with breakfast, lunch, and dinner for each day. Dietary preferences: ${preferences || 'balanced diet'}. Include a grocery shopping list. Return ONLY valid JSON with this structure: { "meals": { "monday": { "breakfast": "...", "lunch": "...", "dinner": "..." }, ... }, "grocery_list": ["item1", "item2"] }`,
          type: 'meal_plan',
          format: 'json'
        })
      })

      const result = await response.json()
      let parsedData = {}
      try {
        parsedData = JSON.parse(result.analysis)
      } catch (e) {
        console.error('Failed to parse AI response', e)
      }
      
      const meals = (parsedData as any).meals || {}
      const groceryList = (parsedData as any).grocery_list || []

      const saveResponse = await fetch('/api/ai-tools/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          week_start: new Date().toISOString().split('T')[0],
          meals,
          grocery_list: groceryList,
          dietary_preferences: preferences.split(',').map(p => p.trim()).filter(Boolean)
        })
      })

      if (saveResponse.ok) {
        const saved = await saveResponse.json()
        setPlans([saved.data, ...plans])
        toast.success('Meal Plan Generated!', 'Your week is planned!')
      }
    } catch (error: any) {
      toast.error('Generation Failed', error.message)
    } finally {
      setGenerating(false)
    }
  }

  const parseMealPlan = (text: string) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const meals: Record<string, any> = {}

    days.forEach(day => {
      meals[day] = {
        breakfast: `${day.charAt(0).toUpperCase() + day.slice(1)} breakfast`,
        lunch: `${day.charAt(0).toUpperCase() + day.slice(1)} lunch`,
        dinner: `${day.charAt(0).toUpperCase() + day.slice(1)} dinner`
      }
    })

    return meals
  }

  const extractGroceryList = (text: string) => {
    return ['Fruits & Vegetables', 'Proteins', 'Grains', 'Dairy', 'Pantry Items']
  }

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this meal plan?')) return

    try {
      const response = await fetch(`/api/ai-tools/meals?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setPlans(plans.filter(p => p.id !== id))
        toast.success('Deleted', 'Meal plan removed')
      }
    } catch (error) {
      toast.error('Delete Failed', 'Could not delete meal plan')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🍽️ AI Meal Planner</h2>
          <p className="text-muted-foreground">Generate weekly meal plans with grocery lists</p>
        </div>
      </div>

      <Card className="border-2 border-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Dietary Preferences</Label>
            <Input
              placeholder="E.g., vegetarian, gluten-free, low-carb..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
          <Button onClick={generatePlan} disabled={generating} className="gap-2 w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate 7-Day Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Meal Plans Yet</h3>
            <p className="text-muted-foreground">Generate your first AI meal plan!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Week of {new Date(plan.week_start).toLocaleDateString()}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {plan.dietary_preferences?.map((pref, idx) => (
                        <Badge key={idx} variant="secondary">{pref}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.meals && Object.entries(plan.meals).map(([day, meals]: [string, any]) => (
                  <div key={day} className="border-l-2 border-primary pl-3">
                    <div className="font-medium capitalize">{day}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>🥐 {meals.breakfast}</div>
                      <div>🥗 {meals.lunch}</div>
                      <div>🍝 {meals.dinner}</div>
                    </div>
                  </div>
                ))}
                {plan.grocery_list && plan.grocery_list.length > 0 && (
                  <div>
                    <div className="font-medium flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-4 w-4" />
                      Grocery List
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {plan.grocery_list.map((item, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground">• {item}</div>
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
