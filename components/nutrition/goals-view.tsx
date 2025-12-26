'use client'

import { useState, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Target, Save } from 'lucide-react'

export function GoalsView() {
  const { getData, addData, updateData } = useData()
  const [isEditing, setIsEditing] = useState(false)
  
  // Get existing goals from nutrition domain
  const nutritionData = getData('nutrition')
  const existingGoals = useMemo(() => {
    const goalsItem = nutritionData.find((item: any) => {
      const meta = item.metadata || {}
      return String(meta.itemType ?? meta.type ?? '').toLowerCase() === 'nutrition-goals'
    })
    
    if (goalsItem) {
      const meta = goalsItem.metadata || {}
      return {
        id: goalsItem.id,
        caloriesGoal: Number(meta.caloriesGoal ?? 2000),
        proteinGoal: Number(meta.proteinGoal ?? 150),
        carbsGoal: Number(meta.carbsGoal ?? 250),
        fatsGoal: Number(meta.fatsGoal ?? 65),
        fiberGoal: Number(meta.fiberGoal ?? 30),
        sugarGoal: Number(meta.sugarGoal ?? 50),
        waterGoal: Number(meta.waterGoal ?? 64),
      }
    }
    
    return {
      id: null,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatsGoal: 65,
      fiberGoal: 30,
      sugarGoal: 50,
      waterGoal: 64,
    }
  }, [nutritionData])

  const [formData, setFormData] = useState(existingGoals)

  // Update form when goals change
  useMemo(() => {
    setFormData(existingGoals)
  }, [existingGoals])

  const handleSave = async () => {
    try {
      const goalData = {
        title: 'Nutrition Goals',
        description: `Daily targets: ${formData.caloriesGoal} cal, ${formData.proteinGoal}g protein, <${formData.sugarGoal}g sugar, ${formData.waterGoal}oz water`,
        metadata: {
          itemType: 'nutrition-goals',
          type: 'nutrition-goals',
          caloriesGoal: formData.caloriesGoal,
          proteinGoal: formData.proteinGoal,
          carbsGoal: formData.carbsGoal,
          fatsGoal: formData.fatsGoal,
          fiberGoal: formData.fiberGoal,
          sugarGoal: formData.sugarGoal,
          waterGoal: formData.waterGoal,
        }
      }

      if (existingGoals.id) {
        // Update existing goals
        await updateData('nutrition', existingGoals.id, goalData)
      } else {
        // Create new goals
        await addData('nutrition', goalData)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save goals:', error)
      alert('Failed to save goals. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData(existingGoals)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-8 bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
        <div className="text-center">
          <Target className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Daily Nutrition Goals</h2>
          <p className="text-lg text-purple-100">
            Set your daily targets to track your progress
          </p>
        </div>
      </Card>

      {/* Goals Form */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Your Goals</h3>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Edit Goals
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calories */}
            <div>
              <Label htmlFor="calories" className="text-lg font-semibold mb-2 block">
                Calories (kcal)
              </Label>
              {isEditing ? (
                <Input
                  id="calories"
                  type="number"
                  value={formData.caloriesGoal}
                  onChange={(e) => setFormData({ ...formData, caloriesGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-600">{formData.caloriesGoal}</span>
                  <span className="ml-2 text-muted-foreground">kcal/day</span>
                </div>
              )}
            </div>

            {/* Protein */}
            <div>
              <Label htmlFor="protein" className="text-lg font-semibold mb-2 block">
                Protein (g)
              </Label>
              {isEditing ? (
                <Input
                  id="protein"
                  type="number"
                  value={formData.proteinGoal}
                  onChange={(e) => setFormData({ ...formData, proteinGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-600">{formData.proteinGoal}</span>
                  <span className="ml-2 text-muted-foreground">g/day</span>
                </div>
              )}
            </div>

            {/* Carbs */}
            <div>
              <Label htmlFor="carbs" className="text-lg font-semibold mb-2 block">
                Carbohydrates (g)
              </Label>
              {isEditing ? (
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbsGoal}
                  onChange={(e) => setFormData({ ...formData, carbsGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-green-600">{formData.carbsGoal}</span>
                  <span className="ml-2 text-muted-foreground">g/day</span>
                </div>
              )}
            </div>

            {/* Fats */}
            <div>
              <Label htmlFor="fats" className="text-lg font-semibold mb-2 block">
                Fats (g)
              </Label>
              {isEditing ? (
                <Input
                  id="fats"
                  type="number"
                  value={formData.fatsGoal}
                  onChange={(e) => setFormData({ ...formData, fatsGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-orange-600">{formData.fatsGoal}</span>
                  <span className="ml-2 text-muted-foreground">g/day</span>
                </div>
              )}
            </div>

            {/* Fiber */}
            <div>
              <Label htmlFor="fiber" className="text-lg font-semibold mb-2 block">
                Fiber (g)
              </Label>
              {isEditing ? (
                <Input
                  id="fiber"
                  type="number"
                  value={formData.fiberGoal}
                  onChange={(e) => setFormData({ ...formData, fiberGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-purple-600">{formData.fiberGoal}</span>
                  <span className="ml-2 text-muted-foreground">g/day</span>
                </div>
              )}
            </div>

            {/* Sugar */}
            <div>
              <Label htmlFor="sugar" className="text-lg font-semibold mb-2 block">
                Sugar (g) - Max
              </Label>
              {isEditing ? (
                <Input
                  id="sugar"
                  type="number"
                  value={formData.sugarGoal}
                  onChange={(e) => setFormData({ ...formData, sugarGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-pink-600">{formData.sugarGoal}</span>
                  <span className="ml-2 text-muted-foreground">g/day max</span>
                </div>
              )}
            </div>

            {/* Water */}
            <div>
              <Label htmlFor="water" className="text-lg font-semibold mb-2 block">
                Water (oz)
              </Label>
              {isEditing ? (
                <Input
                  id="water"
                  type="number"
                  value={formData.waterGoal}
                  onChange={(e) => setFormData({ ...formData, waterGoal: parseInt(e.target.value) || 0 })}
                  className="h-12 text-lg"
                  min="0"
                />
              ) : (
                <div className="h-12 px-4 flex items-center bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <span className="text-2xl font-bold text-cyan-600">{formData.waterGoal}</span>
                  <span className="ml-2 text-muted-foreground">oz/day</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 mt-8">
              <Button 
                onClick={handleSave}
                className="flex-1 h-14 bg-gradient-to-r from-green-600 to-teal-600 text-white text-lg font-semibold"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Goals
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="flex-1 h-14 text-lg font-semibold"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">
          💡 Tip: Personalize Your Goals
        </h4>
        <p className="text-blue-800 dark:text-blue-200">
          Your nutrition goals should be tailored to your personal health objectives, activity level, and dietary needs. 
          Consider consulting with a nutritionist or healthcare provider for personalized recommendations.
        </p>
      </Card>
    </div>
  )
}

