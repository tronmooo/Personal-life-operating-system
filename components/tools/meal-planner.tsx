'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, ShoppingCart, Clock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Meal {
  name: string
  calories: number
  protein: number
  prepTime: string
  ingredients: string[]
}

interface MealPlan {
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  snacks: Meal[]
  totalCalories: number
  totalProtein: number
}

export function MealPlanner() {
  const [goal, setGoal] = useState<'weight-loss' | 'maintenance' | 'muscle-gain'>('maintenance')
  const [diet, setDiet] = useState<'standard' | 'vegetarian' | 'vegan' | 'keto'>('standard')
  const [cookingTime, setCookingTime] = useState<'quick' | 'moderate' | 'any'>('moderate')
  const [includeSnacks, setIncludeSnacks] = useState(true)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)

  const generateMealPlan = () => {
    const calorieTargets = {
      'weight-loss': 1600,
      'maintenance': 2000,
      'muscle-gain': 2400
    }

    const targetCalories = calorieTargets[goal]

    // Sample meal database (in a real app, this would be much larger)
    const meals = {
      breakfast: {
        standard: [
          { name: 'Greek Yogurt Bowl', calories: 350, protein: 25, prepTime: '5 min', ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey'] },
          { name: 'Scrambled Eggs & Toast', calories: 400, protein: 28, prepTime: '10 min', ingredients: ['Eggs', 'Whole wheat toast', 'Avocado', 'Tomatoes'] },
          { name: 'Oatmeal with Protein', calories: 380, protein: 22, prepTime: '8 min', ingredients: ['Oats', 'Protein powder', 'Banana', 'Almond butter'] }
        ],
        vegetarian: [
          { name: 'Veggie Breakfast Burrito', calories: 420, protein: 18, prepTime: '12 min', ingredients: ['Whole wheat tortilla', 'Eggs', 'Black beans', 'Peppers', 'Cheese'] },
          { name: 'Smoothie Bowl', calories: 360, protein: 20, prepTime: '5 min', ingredients: ['Mixed berries', 'Protein powder', 'Spinach', 'Chia seeds', 'Coconut'] }
        ],
        vegan: [
          { name: 'Tofu Scramble', calories: 350, protein: 24, prepTime: '10 min', ingredients: ['Tofu', 'Nutritional yeast', 'Vegetables', 'Whole wheat toast'] },
          { name: 'Chia Pudding', calories: 320, protein: 18, prepTime: '5 min', ingredients: ['Chia seeds', 'Almond milk', 'Berries', 'Maple syrup'] }
        ],
        keto: [
          { name: 'Keto Breakfast Plate', calories: 480, protein: 32, prepTime: '10 min', ingredients: ['Eggs', 'Bacon', 'Avocado', 'Cheese'] },
          { name: 'Bulletproof Coffee & Eggs', calories: 450, protein: 28, prepTime: '8 min', ingredients: ['Coffee', 'MCT oil', 'Butter', 'Eggs', 'Spinach'] }
        ]
      },
      lunch: {
        standard: [
          { name: 'Grilled Chicken Salad', calories: 450, protein: 42, prepTime: '15 min', ingredients: ['Chicken breast', 'Mixed greens', 'Olive oil', 'Vegetables', 'Quinoa'] },
          { name: 'Turkey & Hummus Wrap', calories: 480, protein: 38, prepTime: '10 min', ingredients: ['Whole wheat wrap', 'Turkey', 'Hummus', 'Vegetables'] }
        ],
        vegetarian: [
          { name: 'Quinoa Buddha Bowl', calories: 520, protein: 22, prepTime: '20 min', ingredients: ['Quinoa', 'Chickpeas', 'Roasted vegetables', 'Tahini', 'Avocado'] }
        ],
        vegan: [
          { name: 'Lentil & Veggie Bowl', calories: 480, protein: 24, prepTime: '25 min', ingredients: ['Lentils', 'Brown rice', 'Roasted vegetables', 'Tahini dressing'] }
        ],
        keto: [
          { name: 'Salmon & Asparagus', calories: 520, protein: 38, prepTime: '20 min', ingredients: ['Salmon fillet', 'Asparagus', 'Olive oil', 'Lemon', 'Butter'] }
        ]
      },
      dinner: {
        standard: [
          { name: 'Baked Salmon & Vegetables', calories: 550, protein: 45, prepTime: '30 min', ingredients: ['Salmon', 'Broccoli', 'Sweet potato', 'Olive oil'] },
          { name: 'Chicken Stir Fry', calories: 520, protein: 42, prepTime: '25 min', ingredients: ['Chicken', 'Mixed vegetables', 'Brown rice', 'Soy sauce', 'Ginger'] }
        ],
        vegetarian: [
          { name: 'Vegetable Pasta', calories: 580, protein: 24, prepTime: '25 min', ingredients: ['Whole wheat pasta', 'Marinara sauce', 'Vegetables', 'Parmesan'] }
        ],
        vegan: [
          { name: 'Vegan Curry', calories: 520, protein: 22, prepTime: '30 min', ingredients: ['Chickpeas', 'Coconut milk', 'Vegetables', 'Brown rice', 'Curry spices'] }
        ],
        keto: [
          { name: 'Ribeye & Cauliflower Mash', calories: 650, protein: 48, prepTime: '25 min', ingredients: ['Ribeye steak', 'Cauliflower', 'Butter', 'Garlic', 'Green beans'] }
        ]
      },
      snacks: {
        standard: [
          { name: 'Protein Shake', calories: 200, protein: 25, prepTime: '2 min', ingredients: ['Protein powder', 'Almond milk', 'Banana'] },
          { name: 'Apple & Almond Butter', calories: 220, protein: 8, prepTime: '1 min', ingredients: ['Apple', 'Almond butter'] }
        ],
        keto: [
          { name: 'Cheese & Nuts', calories: 250, protein: 12, prepTime: '1 min', ingredients: ['Cheese cubes', 'Almonds'] }
        ]
      }
    }

    const breakfast = meals.breakfast[diet][0]
    const lunch = meals.lunch[diet][0]
    const dinner = meals.dinner[diet][0]
    const snacks = includeSnacks ? [meals.snacks[diet === 'keto' ? 'keto' : 'standard'][0]] : []

    const totalCalories = breakfast.calories + lunch.calories + dinner.calories + snacks.reduce((sum, s) => sum + s.calories, 0)
    const totalProtein = breakfast.protein + lunch.protein + dinner.protein + snacks.reduce((sum, s) => sum + s.protein, 0)

    setMealPlan({
      breakfast,
      lunch,
      dinner,
      snacks,
      totalCalories,
      totalProtein
    })
  }

  const renderMeal = (meal: Meal, mealTime: string, icon: string) => (
    <Card key={mealTime}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {mealTime}
          </span>
          <Badge variant="secondary">{meal.calories} cal</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="font-semibold text-lg">{meal.name}</div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.prepTime}
            </span>
            <span>{meal.protein}g protein</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Ingredients:</div>
          <div className="flex flex-wrap gap-1">
            {meal.ingredients.map((ing, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{ing}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Select value={goal} onValueChange={(value: any) => setGoal(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight-loss">Weight Loss (1600 cal)</SelectItem>
              <SelectItem value="maintenance">Maintenance (2000 cal)</SelectItem>
              <SelectItem value="muscle-gain">Muscle Gain (2400 cal)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diet">Diet Type</Label>
          <Select value={diet} onValueChange={(value: any) => setDiet(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="keto">Keto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Cooking Time</Label>
          <Select value={cookingTime} onValueChange={(value: any) => setCookingTime(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick (&lt; 15 min)</SelectItem>
              <SelectItem value="moderate">Moderate (15-30 min)</SelectItem>
              <SelectItem value="any">Any Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="snacks"
            checked={includeSnacks}
            onCheckedChange={(checked) => setIncludeSnacks(checked as boolean)}
          />
          <Label htmlFor="snacks" className="cursor-pointer">Include snacks</Label>
        </div>
      </div>

      <Button onClick={generateMealPlan} className="w-full">
        <UtensilsCrossed className="mr-2 h-4 w-4" />
        Generate Meal Plan
      </Button>

      {mealPlan && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">{mealPlan.totalCalories}</div>
                  <p className="text-sm text-muted-foreground">Total Calories</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{mealPlan.totalProtein}g</div>
                  <p className="text-sm text-muted-foreground">Total Protein</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderMeal(mealPlan.breakfast, 'Breakfast', '🍳')}
          {renderMeal(mealPlan.lunch, 'Lunch', '🥗')}
          {renderMeal(mealPlan.dinner, 'Dinner', '🍽️')}
          {mealPlan.snacks.map((snack, idx) => renderMeal(snack, `Snack ${idx + 1}`, '🍎'))}

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <ShoppingCart className="h-5 w-5 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold mb-2">Grocery List</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically generated from all ingredients above. Print or save to your phone for easy shopping!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
