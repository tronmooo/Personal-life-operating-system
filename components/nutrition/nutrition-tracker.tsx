'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Upload, Plus, Trash2, TrendingUp, Target, Edit, Save, X } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'
import Image from 'next/image'

interface FoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  confidence?: number
}

interface Meal {
  id: string
  mealType: string
  foodItems: FoodItem[]
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  imageUrl?: string
  timestamp: string
}

export function NutritionTracker() {
  const { data, addData, updateData, deleteData } = useData()
  const [meals, setMeals] = useState<Meal[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Meal>>({})
  const [dailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load meals from data
    const nutritionData = data.nutrition || []
    const mealData = nutritionData
      .filter(item => item.metadata?.logType === 'meal')
      .map(item => ({
        id: item.id,
        mealType: String(item.metadata?.mealType || 'meal'),
        foodItems: (item.metadata?.foodItems || []) as FoodItem[],
        totalNutrition: (item.metadata?.totalNutrition || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        }) as { calories: number; protein: number; carbs: number; fat: number; fiber: number },
        imageUrl: item.metadata?.imageUrl as string | undefined,
        timestamp: item.createdAt
      }))
    setMeals(mealData)
  }, [data])

  const handlePhotoUpload = async (file: File, isCamera: boolean = false) => {
    if (!file) return

    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Save meal to nutrition domain
        const mealData = {
          id: `meal-${Date.now()}`,
          title: `${result.mealType.charAt(0).toUpperCase() + result.mealType.slice(1)} - ${format(new Date(), 'h:mm a')}`,
          description: `${result.foodItems.map((f: FoodItem) => f.name).join(', ')}`,
          type: 'meal',
          metadata: {
            logType: 'meal',
            mealType: result.mealType,
            foodItems: result.foodItems,
            totalNutrition: result.totalNutrition,
            imageUrl: result.imagePreview,
            source: isCamera ? 'camera' : 'upload',
            timestamp: result.timestamp
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        addData('nutrition', mealData)
        
        alert(`✅ Meal logged!\n\n🍽️ ${result.foodItems.length} items found\n🔥 ${result.totalNutrition.calories} calories\n🥩 ${result.totalNutrition.protein}g protein`)
      } else {
        alert('Failed to analyze food photo. Please try again.')
      }
    } catch (error) {
      console.error('Error analyzing food:', error)
      alert('Error analyzing food photo')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoUpload(file, false)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoUpload(file, true)
    }
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMealId(meal.id)
    setEditForm({
      mealType: meal.mealType,
      totalNutrition: { ...meal.totalNutrition }
    })
  }

  const handleSaveEdit = async (meal: Meal) => {
    try {
      const updated = {
        ...meal,
        mealType: editForm.mealType || meal.mealType,
        totalNutrition: {
          ...meal.totalNutrition,
          ...editForm.totalNutrition
        }
      }

      await updateData('nutrition', meal.id, {
        metadata: {
          ...meal,
          mealType: updated.mealType,
          totalNutrition: updated.totalNutrition
        }
      })

      setEditingMealId(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating meal:', error)
      alert('Failed to update meal')
    }
  }

  const handleCancelEdit = () => {
    setEditingMealId(null)
    setEditForm({})
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Delete this meal? This action cannot be undone.')) return
    
    try {
      await deleteData('nutrition', mealId)
      console.log('✅ Meal deleted successfully')
      // Trigger a re-render by dispatching a nutrition data update event
      window.dispatchEvent(new CustomEvent('nutrition-data-updated'))
    } catch (error) {
      console.error('❌ Failed to delete meal:', error)
      alert('Failed to delete meal')
    }
  }

  // Calculate today's totals
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const todaysMeals = meals.filter(meal => 
    new Date(meal.timestamp) >= todayStart
  )

  const todaysTotals = todaysMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.totalNutrition?.calories || 0),
    protein: acc.protein + (meal.totalNutrition?.protein || 0),
    carbs: acc.carbs + (meal.totalNutrition?.carbs || 0),
    fat: acc.fat + (meal.totalNutrition?.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const percentages = {
    calories: Math.round((todaysTotals.calories / dailyGoals.calories) * 100),
    protein: Math.round((todaysTotals.protein / dailyGoals.protein) * 100),
    carbs: Math.round((todaysTotals.carbs / dailyGoals.carbs) * 100),
    fat: Math.round((todaysTotals.fat / dailyGoals.fat) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Nutrition Tracker</h2>
        <p className="text-muted-foreground">Snap photos of your meals for instant nutrition tracking</p>
      </div>

      {/* Photo Upload Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Log a Meal</CardTitle>
          <CardDescription>Take a photo or upload an image to analyze nutrition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              onClick={() => cameraInputRef.current?.click()}
              disabled={analyzing}
              className="h-20"
            >
              <Camera className="h-6 w-6 mr-2" />
              {analyzing ? 'Analyzing...' : 'Take Photo'}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="h-20"
            >
              <Upload className="h-6 w-6 mr-2" />
              Upload Photo
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Nutrition
          </CardTitle>
          <CardDescription>{format(new Date(), 'MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Calories */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Calories</span>
                <span className="text-sm text-muted-foreground">
                  {todaysTotals.calories} / {dailyGoals.calories}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(percentages.calories, 100)}%` }}
                />
              </div>
              <div className="text-right text-xs mt-1 text-muted-foreground">
                {percentages.calories}%
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Protein</div>
                <div className="text-2xl font-bold">{Math.round(todaysTotals.protein)}g</div>
                <div className="text-xs text-muted-foreground">{percentages.protein}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Carbs</div>
                <div className="text-2xl font-bold">{Math.round(todaysTotals.carbs)}g</div>
                <div className="text-xs text-muted-foreground">{percentages.carbs}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fat</div>
                <div className="text-2xl font-bold">{Math.round(todaysTotals.fat)}g</div>
                <div className="text-xs text-muted-foreground">{percentages.fat}%</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {todaysMeals.length} meals logged today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal History */}
      <Card>
        <CardHeader>
          <CardTitle>Meal History</CardTitle>
          <CardDescription>Your recent meals</CardDescription>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No meals logged yet</p>
              <p className="text-sm">Take a photo of your food to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.slice(0, 10).map((meal) => {
                const isEditing = editingMealId === meal.id
                return (
                  <div
                    key={meal.id}
                    className="flex gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    {meal.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={meal.imageUrl}
                          alt={meal.mealType}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Meal Type</Label>
                            <Input
                              value={editForm.mealType || meal.mealType}
                              onChange={(e) => setEditForm({ ...editForm, mealType: e.target.value })}
                              className="h-8"
                            />
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs">Calories</Label>
                              <Input
                                type="number"
                                value={editForm.totalNutrition?.calories ?? meal.totalNutrition.calories}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  totalNutrition: { 
                                    ...meal.totalNutrition,
                                    ...editForm.totalNutrition,
                                    calories: parseFloat(e.target.value) 
                                  }
                                })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Protein</Label>
                              <Input
                                type="number"
                                value={editForm.totalNutrition?.protein ?? meal.totalNutrition.protein}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  totalNutrition: { 
                                    ...meal.totalNutrition,
                                    ...editForm.totalNutrition,
                                    protein: parseFloat(e.target.value) 
                                  }
                                })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Carbs</Label>
                              <Input
                                type="number"
                                value={editForm.totalNutrition?.carbs ?? meal.totalNutrition.carbs}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  totalNutrition: { 
                                    ...meal.totalNutrition,
                                    ...editForm.totalNutrition,
                                    carbs: parseFloat(e.target.value) 
                                  }
                                })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fat</Label>
                              <Input
                                type="number"
                                value={editForm.totalNutrition?.fat ?? meal.totalNutrition.fat}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  totalNutrition: { 
                                    ...meal.totalNutrition,
                                    ...editForm.totalNutrition,
                                    fat: parseFloat(e.target.value) 
                                  }
                                })}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(meal)}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {meal.mealType}
                              </Badge>
                              <div className="font-semibold">
                                {meal.foodItems.map(f => f.name).join(', ')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(meal.timestamp), 'MMM d, h:mm a')}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <div className="text-xl font-bold">{meal.totalNutrition.calories}</div>
                                <div className="text-xs text-muted-foreground">calories</div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEditMeal(meal)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteMeal(meal.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              P: {Math.round(meal.totalNutrition.protein)}g
                            </span>
                            <span className="text-muted-foreground">
                              C: {Math.round(meal.totalNutrition.carbs)}g
                            </span>
                            <span className="text-muted-foreground">
                              F: {Math.round(meal.totalNutrition.fat)}g
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






















