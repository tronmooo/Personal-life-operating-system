'use client'

import { useState, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DocumentUploadScanner, UploadedDocument } from '@/components/universal/document-upload-scanner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Camera, Edit, Trash2, Loader2 } from 'lucide-react'

interface Meal {
  id: string
  name: string
  mealType: string
  time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  photo?: string | null
}

export function MealsView() {
  const { getData, addData, updateData, deleteData } = useData()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [showMethodDialog, setShowMethodDialog] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerAutoCamera, setScannerAutoCamera] = useState(false)
  const [scannerAutoPicker, setScannerAutoPicker] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'Lunch',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    mealType: 'Lunch',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: ''
  })

  // Parse macros from arbitrary text (OCR from receipts/PDF)
  const parseMacros = (text: string) => {
    const findNum = (re: RegExp) => {
      const m = text.match(re)
      return m ? parseFloat(m[1]) : 0
    }
    return {
      calories: findNum(/(\d+(?:\.\d+)?)\s*(?:k?cal|calories?)/i),
      protein: findNum(/(\d+(?:\.\d+)?)\s*g\s*protein/i),
      carbs: findNum(/(\d+(?:\.\d+)?)\s*g\s*carb/i),
      fats: findNum(/(\d+(?:\.\d+)?)\s*g\s*(?:fat|fats)/i),
      fiber: findNum(/(\d+(?:\.\d+)?)\s*g\s*fiber/i),
    }
  }

  // Get meals data from DataProvider (automatically reactive to data changes)
  const nutritionData = getData('nutrition')
  const meals = useMemo(() => {
    console.log('🥗 MEALS VIEW: Loading meals from nutrition domain...')
    console.log('🥗 MEALS VIEW: Raw nutrition data count:', nutritionData.length)
    
    const mealData = nutritionData
      .filter(item => {
        const isMeal = item.metadata?.type === 'meal' || item.metadata?.logType === 'meal'
        if (!isMeal && nutritionData.length < 20) {
          console.log('🥗 MEALS VIEW: Filtering out non-meal item:', item.id, 'type:', item.metadata?.type, 'logType:', item.metadata?.logType)
        }
        return isMeal
      })
      .map(item => ({
        id: item.id,
        name: String(item.metadata?.name || item.title || ''),
        mealType: String(item.metadata?.mealType || 'Other'),
        time: String(item.metadata?.time || new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })),
        calories: Number(item.metadata?.calories || 0),
        protein: Number(item.metadata?.protein || 0),
        carbs: Number(item.metadata?.carbs || 0),
        fats: Number(item.metadata?.fats || 0),
        fiber: Number(item.metadata?.fiber || 0),
        photo: (item.metadata?.attachedDocument as any)?.url || item.metadata?.imageUrl || null
      }))
      .sort((a, b) => b.id.localeCompare(a.id)) // Sort by newest first
    
    console.log('✅ MEALS VIEW: Loaded', mealData.length, 'meals')
    return mealData
  }, [nutritionData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🥗 MEALS VIEW: Starting meal submission...')

    // Validation: name and numeric macros
    if (!formData.name.trim()) {
      alert('Please enter a meal name')
      return
    }

    const calories = parseFloat(formData.calories)
    const protein = parseFloat(formData.protein)
    const carbs = parseFloat(formData.carbs)
    const fats = parseFloat(formData.fats)
    const fiber = parseFloat(formData.fiber)

    const nonNegative = [calories, protein, carbs, fats, fiber].every(v => (
      isNaN(v) || v >= 0
    ))
    if (!nonNegative) {
      alert('Nutrition values must be positive numbers')
      return
    }

    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: formData.name,
      mealType: formData.mealType,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      calories: isNaN(calories) ? 0 : calories,
      protein: isNaN(protein) ? 0 : protein,
      carbs: isNaN(carbs) ? 0 : carbs,
      fats: isNaN(fats) ? 0 : fats,
      fiber: isNaN(fiber) ? 0 : fiber
    }

    console.log('🥗 MEALS VIEW: Meal object created:', {
      id: newMeal.id,
      name: newMeal.name,
      mealType: newMeal.mealType,
      calories: newMeal.calories,
      domain: 'nutrition'
    })

    try {
      console.log('🥗 MEALS VIEW: Calling addData("nutrition", ...)')
      // Save to DataProvider (nutrition domain)
      await addData('nutrition', {
        title: `${newMeal.mealType}: ${newMeal.name}`,
        description: `${newMeal.calories} cal | P ${newMeal.protein} / C ${newMeal.carbs} / F ${newMeal.fats}`,
        metadata: {
          type: 'meal',
          mealType: newMeal.mealType,
          name: newMeal.name,
          time: newMeal.time,
          calories: newMeal.calories,
          protein: newMeal.protein,
          carbs: newMeal.carbs,
          fats: newMeal.fats,
          fiber: newMeal.fiber,
          logType: 'meal'
        }
      })
      console.log('✅ MEALS VIEW: Meal saved successfully!')

      // UI will auto-update via useMemo dependency on nutritionData
      setFormData({ name: '', mealType: 'Lunch', calories: '', protein: '', carbs: '', fats: '', fiber: '' })
      setShowAddDialog(false)
      setShowMethodDialog(false)
      
      console.log('🎉 MEALS VIEW: Dialog closed, form reset complete')
    } catch (error) {
      console.error('❌ MEALS VIEW: Failed to save meal:', error)
      alert(`Failed to save meal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteMeal = async (id: string) => {
    if (!confirm('Delete this meal?')) return
    
    // Mark as deleting (UI feedback)
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await deleteData('nutrition', id)
      // UI will auto-update via useMemo dependency on nutritionData
    } catch (error) {
      console.error('Failed to delete meal:', error)
      alert('Failed to delete meal. Please try again.')
    } finally {
      // Clear disabled state
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Open edit dialog for a meal
  const openEditDialog = (meal: Meal) => {
    setEditingMeal(meal)
    setEditFormData({
      name: meal.name,
      mealType: meal.mealType,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fats: String(meal.fats),
      fiber: String(meal.fiber)
    })
    setShowEditDialog(true)
  }

  // Save edited meal
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeal) return
    
    console.log('✏️ MEALS VIEW: Updating meal:', editingMeal.id)
    
    try {
      await updateData('nutrition', editingMeal.id, {
        title: editFormData.name,
        metadata: {
          type: 'meal',
          logType: 'meal',
          mealType: editFormData.mealType,
          name: editFormData.name,
          time: editingMeal.time,
          calories: Number(editFormData.calories) || 0,
          protein: Number(editFormData.protein) || 0,
          carbs: Number(editFormData.carbs) || 0,
          fats: Number(editFormData.fats) || 0,
          fiber: Number(editFormData.fiber) || 0
        }
      })
      
      console.log('✅ MEALS VIEW: Meal updated successfully!')
      setShowEditDialog(false)
      setEditingMeal(null)
    } catch (error) {
      console.error('❌ MEALS VIEW: Failed to update meal:', error)
      alert(`Failed to update meal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Save meal from a scanned/uploaded document
  const handleDocumentSaved = async (doc: UploadedDocument) => {
    // Prefer structured nutrition returned by scanner -> /api/analyze-food-vision
    const ai = (doc.metadata as any)?.nutritionData
    const parsed = parseMacros(doc.extractedText || '')
    const calories = ai?.nutrition?.calories ?? parsed.calories ?? 0
    const protein = ai?.nutrition?.protein ?? parsed.protein ?? 0
    const carbs = ai?.nutrition?.carbs ?? parsed.carbs ?? 0
    const fats = ai?.nutrition?.fat ?? parsed.fats ?? 0
    const fiber = ai?.nutrition?.fiber ?? parsed.fiber ?? 0
    // Prefer detected foods as the displayed meal name/title instead of the raw filename
    const foods = Array.isArray(ai?.foods) && ai.foods.length > 0
      ? ai.foods.map((f: any) => f.name).join(', ')
      : (doc.extractedText?.split('\n')[0] || doc.name)

    await addData('nutrition', {
      title: `Meal from ${doc.name}`,
      description: `${calories} cal | P ${protein} / C ${carbs} / F ${fats}`,
      metadata: {
        type: 'meal',
        logType: 'meal',
        mealType: 'Other',
        name: foods,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        calories, protein, carbs, fats, fiber,
        attachedDocument: {
          id: doc.id,
          name: doc.name,
          uploadedAt: doc.uploadDate,
          expiresAt: doc.expirationDate,
          extractedText: doc.extractedText,
          size: doc.metadata.size,
          type: doc.metadata.type,
          url: doc.fileUrl,
          foods: ai?.foods || null,
          nutrition: ai?.nutrition || null,
        }
      }
    })

    // Close scanner - UI will auto-update via useMemo dependency on nutritionData
    setShowScanner(false)
  }

  return (
    <>
      {/* Scanner for Photo/PDF with OCR */}
      <DocumentUploadScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onDocumentSaved={handleDocumentSaved}
        category="nutrition-meal"
        title="Add Meal via Photo or PDF"
        description="Upload a food photo or PDF receipt; we will extract macros automatically."
        autoStartCamera={scannerAutoCamera}
        autoOpenFilePicker={scannerAutoPicker}
      />
      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Meal</DialogTitle>
            <DialogDescription>
              Log a meal with photo or manual entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => { 
                setShowMethodDialog(false)
                setScannerAutoCamera(true)
                setScannerAutoPicker(false)
                setShowScanner(true)
                // reset flags after open so subsequent opens work as expected
                setTimeout(() => { setScannerAutoCamera(false) }, 0)
              }}
              className="w-full h-24 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xl"
            >
              <Camera className="h-8 w-8 mr-3" />
              <div className="text-left">
                <div className="font-bold">Take a Photo</div>
                <div className="text-sm text-green-100">AI will analyze your meal</div>
              </div>
            </Button>

            <Button
              onClick={() => { 
                setShowMethodDialog(false)
                setScannerAutoCamera(false)
                setScannerAutoPicker(true)
                setShowScanner(true)
                setTimeout(() => { setScannerAutoPicker(false) }, 0)
              }}
              className="w-full h-24 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl"
            >
              <Plus className="h-8 w-8 mr-3" />
              <div className="text-left">
                <div className="font-bold">Upload Photo/PDF</div>
                <div className="text-sm text-indigo-100">Choose file to analyze</div>
              </div>
            </Button>

            <Button
              onClick={() => { setShowMethodDialog(false); setShowAddDialog(true); }}
              className="w-full h-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl"
            >
              <Plus className="h-8 w-8 mr-3" />
              <div className="text-left">
                <div className="font-bold">Manual Entry</div>
                <div className="text-sm text-blue-100">Enter details yourself</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Meal Details</DialogTitle>
            <DialogDescription>
              Enter the details of your meal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Meal Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grilled Chicken Salad"
                required
              />
            </div>

            <div>
              <Label>Meal Type</Label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="450"
                  required
                />
              </div>

              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="35"
                />
              </div>

              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="25"
                />
              </div>

              <div>
                <Label>Fats (g)</Label>
                <Input
                  type="number"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  placeholder="22"
                />
              </div>

              <div>
                <Label>Fiber (g)</Label>
                <Input
                  type="number"
                  value={formData.fiber}
                  onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                  placeholder="8"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600">
              Add Meal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Meal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>
              Update your meal details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Meal Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Grilled Chicken Salad"
                required
              />
            </div>

            <div>
              <Label>Meal Type</Label>
              <select
                value={editFormData.mealType}
                onChange={(e) => setEditFormData({ ...editFormData, mealType: e.target.value })}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={editFormData.calories}
                  onChange={(e) => setEditFormData({ ...editFormData, calories: e.target.value })}
                  placeholder="450"
                  required
                />
              </div>

              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={editFormData.protein}
                  onChange={(e) => setEditFormData({ ...editFormData, protein: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={editFormData.carbs}
                  onChange={(e) => setEditFormData({ ...editFormData, carbs: e.target.value })}
                  placeholder="45"
                />
              </div>

              <div>
                <Label>Fats (g)</Label>
                <Input
                  type="number"
                  value={editFormData.fats}
                  onChange={(e) => setEditFormData({ ...editFormData, fats: e.target.value })}
                  placeholder="22"
                />
              </div>

              <div>
                <Label>Fiber (g)</Label>
                <Input
                  type="number"
                  value={editFormData.fiber}
                  onChange={(e) => setEditFormData({ ...editFormData, fiber: e.target.value })}
                  placeholder="8"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Button
          onClick={() => setShowMethodDialog(true)}
          className="w-full h-16 bg-gradient-to-r from-green-600 to-teal-600 text-white text-lg"
        >
          <Plus className="h-6 w-6 mr-2" />
          Add Meal
        </Button>
        {/* Removed duplicate button that did the same action as the method dialog */}

        {meals.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80">
            <p className="text-muted-foreground">No meals logged yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <Card key={meal.id} className="p-6 bg-white/80 dark:bg-slate-800/80">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {meal.photo && (
                      <img
                        src={meal.photo}
                        alt={meal.name}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold">{meal.mealType}</h3>
                      <h4 className="text-xl font-semibold mt-1">{meal.name}</h4>
                      <p className="text-sm text-muted-foreground">{meal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">{meal.calories} cal</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(meal)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Edit meal"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMeal(meal.id)} 
                      disabled={deletingIds.has(meal.id)}
                      className="text-red-600"
                    >
                      {deletingIds.has(meal.id) ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{meal.protein}g</p>
                    <p className="text-sm text-muted-foreground">Protein</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{meal.carbs}g</p>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{meal.fats}g</p>
                    <p className="text-sm text-muted-foreground">Fats</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{meal.fiber}g</p>
                    <p className="text-sm text-muted-foreground">Fiber</p>
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

