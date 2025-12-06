'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Camera, Upload, Utensils, Loader2, CheckCircle, X, 
  Apple, Beef, Coffee, Pizza, Salad, IceCream, Clock
} from 'lucide-react'
import { format } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface MealLoggerProps {
  open: boolean
  onClose: () => void
}

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
}

interface FoodItem {
  name: string
  quantity: string
  calories: number
  confidence: number
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-orange-500' },
  { value: 'lunch', label: 'Lunch', icon: Utensils, color: 'text-blue-500' },
  { value: 'dinner', label: 'Dinner', icon: Pizza, color: 'text-purple-500' },
  { value: 'snack', label: 'Snack', icon: Apple, color: 'text-green-500' },
]

export function MealLogger({ open, onClose }: MealLoggerProps) {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [mealType, setMealType] = useState('lunch')
  const [mealName, setMealName] = useState('')
  const [notes, setNotes] = useState('')
  const [detectedFoods, setDetectedFoods] = useState<FoodItem[]>([])
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addData } = useData()
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setAnalyzed(false)
    }
  }

  const analyzeImage = async () => {
    if (!image) return

    setAnalyzing(true)
    
    try {
      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(image)
      })
      
      const base64Image = await base64Promise

      // Call Google Vision API
      const response = await fetch('/api/analyze-food-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      // Use the real AI results
      setDetectedFoods(data.foods)
      setNutrition(data.nutrition)
      setMealName(data.foods.slice(0, 3).map((f: FoodItem) => f.name).join(', '))
      setAnalyzed(true)

      toast({
        title: '🍽️ Meal Analyzed with Google Vision AI!',
        description: `Found ${data.foods.length} food items. Total: ${data.nutrition.calories} calories.`,
      })
    } catch (error: any) {
      console.error('Error analyzing image:', error)
      
      // Fallback to basic estimation
      const fallbackFoods: FoodItem[] = [
        { name: 'Mixed Meal', quantity: '1 serving', calories: 400, confidence: 0.5 },
      ]
      const fallbackNutrition: NutritionData = {
        calories: 400,
        protein: 20,
        carbs: 45,
        fat: 15,
        fiber: 5,
        sugar: 8,
      }
      
      setDetectedFoods(fallbackFoods)
      setNutrition(fallbackNutrition)
      setMealName('Mixed Meal')
      setAnalyzed(true)

      toast({
        title: '⚠️ Using Basic Estimation',
        description: error.message || 'Could not analyze image, using fallback estimation.',
        variant: 'destructive'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    const mealData = {
      title: mealName || `${MEAL_TYPES.find(t => t.value === mealType)?.label} Meal`,
      type: 'meal',
      mealType,
      timestamp: new Date().toISOString(),
      date: format(new Date(), 'yyyy-MM-dd'),
      metadata: {
        logType: 'meal',
        mealType,
        foods: detectedFoods,
        nutrition,
        notes,
        hasImage: !!image,
        imageName: image?.name,
      },
    }

    await addData('nutrition' as any, mealData)

    // Dispatch event for UI updates (no need to save to IndexedDB as Supabase handles persistence)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrition-data-updated', {
        detail: { domain: 'nutrition', entry: mealData }
      }))
    }

    toast({
      title: '✅ Meal Logged!',
      description: `${mealData.title} saved successfully.`,
    })

    resetForm()
    onClose()
  }

  const resetForm = () => {
    setImage(null)
    setImagePreview('')
    setAnalyzing(false)
    setAnalyzed(false)
    setMealName('')
    setNotes('')
    setDetectedFoods([])
    setNutrition({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Utensils className="h-6 w-6 text-orange-500" />
            Log Your Meal
          </DialogTitle>
          <DialogDescription>
            Take or upload a photo of your food to automatically track nutrition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meal Type Selection */}
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={mealType === type.value ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3"
                    onClick={() => setMealType(type.value)}
                  >
                    <Icon className={cn('h-5 w-5 mb-1', type.color)} />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Image Upload/Capture */}
          {!imagePreview ? (
            <Card>
              <CardContent className="p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-5 w-5" />
                      Take Photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = fileInputRef.current
                        if (input) {
                          input.removeAttribute('capture')
                          input.click()
                          // Re-add capture for next time
                          setTimeout(() => input.setAttribute('capture', 'environment'), 100)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-5 w-5" />
                      Upload Photo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    AI will automatically identify the food and calculate nutrition
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Meal preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImage(null)
                    setImagePreview('')
                    setAnalyzed(false)
                    setDetectedFoods([])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Analyze Button */}
              {!analyzed && !analyzing && (
                <Button
                  onClick={analyzeImage}
                  className="w-full"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Analyze Food with AI
                </Button>
              )}

              {/* Analyzing State */}
              {analyzing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-center">
                        <p className="font-medium">Analyzing your meal...</p>
                        <p className="text-sm text-muted-foreground">
                          Identifying food items and calculating nutrition
                        </p>
                      </div>
                      <Progress value={60} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Results */}
              {analyzed && (
                <div className="space-y-4">
                  {/* Detected Foods */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Detected Foods
                      </h4>
                      <div className="space-y-2">
                        {detectedFoods.map((food, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{food.name}</p>
                              <p className="text-xs text-muted-foreground">{food.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{food.calories} cal</Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(food.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nutrition Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Nutrition Summary</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{nutrition.calories}</p>
                          <p className="text-xs text-muted-foreground">Calories</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{nutrition.protein}g</p>
                          <p className="text-xs text-muted-foreground">Protein</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{nutrition.carbs}g</p>
                          <p className="text-xs text-muted-foreground">Carbs</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">{nutrition.fat}g</p>
                          <p className="text-xs text-muted-foreground">Fat</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{nutrition.fiber}g</p>
                          <p className="text-xs text-muted-foreground">Fiber</p>
                        </div>
                        <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-pink-600">{nutrition.sugar}g</p>
                          <p className="text-xs text-muted-foreground">Sugar</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Meal Name */}
                  <div className="space-y-2">
                    <Label htmlFor="meal-name">Meal Name (optional)</Label>
                    <Input
                      id="meal-name"
                      placeholder="e.g., Grilled Chicken with Rice"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="How did it taste? Where did you eat? How did you feel?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose() }}>
            Cancel
          </Button>
          {analyzed && (
            <Button onClick={handleSave}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Log Meal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

