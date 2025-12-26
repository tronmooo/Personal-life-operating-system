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
import { Badge } from '@/components/ui/badge'
import { Plus, Camera, Edit, Trash2, Loader2, Calendar, ChevronDown, ChevronUp, Filter, LayoutGrid, List, Search, X } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, startOfWeek, startOfMonth, parseISO, isSameDay } from 'date-fns'

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
  sugar: number
  photo?: string | null
  createdAt: string
}

type TimeFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month'
type ViewMode = 'cards' | 'table' | 'timeline'
type SortBy = 'newest' | 'oldest' | 'calories-high' | 'calories-low' | 'protein-high'

const MEAL_TYPE_COLORS: Record<string, string> = {
  'Breakfast': 'bg-amber-500',
  'Lunch': 'bg-blue-500',
  'Dinner': 'bg-purple-500',
  'Snack': 'bg-green-500',
  'Other': 'bg-gray-500',
}

const MEAL_TYPE_ICONS: Record<string, string> = {
  'Breakfast': '🌅',
  'Lunch': '☀️',
  'Dinner': '🌙',
  'Snack': '🍎',
  'Other': '🍽️',
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
  
  // Filter & View State
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [mealTypeFilter, setMealTypeFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'Lunch',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
    sugar: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    mealType: 'Lunch',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
    sugar: ''
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
      sugar: findNum(/(\d+(?:\.\d+)?)\s*g\s*sugar/i),
    }
  }

  // Get meals data from DataProvider (automatically reactive to data changes)
  const nutritionData = getData('nutrition')
  const allMeals = useMemo(() => {
    const mealData = nutritionData
      .filter(item => {
        const isMeal = item.metadata?.type === 'meal' || item.metadata?.logType === 'meal'
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
        sugar: Number(item.metadata?.sugar || 0),
        photo: (item.metadata?.attachedDocument as any)?.url || item.metadata?.imageUrl || null,
        createdAt: item.createdAt
      }))
    return mealData
  }, [nutritionData])

  // Apply filters
  const filteredMeals = useMemo(() => {
    let meals = [...allMeals]
    
    // Time filter
    const now = new Date()
    switch (timeFilter) {
      case 'today':
        meals = meals.filter(m => isToday(new Date(m.createdAt)))
        break
      case 'yesterday':
        meals = meals.filter(m => isYesterday(new Date(m.createdAt)))
        break
      case 'week':
        meals = meals.filter(m => isThisWeek(new Date(m.createdAt), { weekStartsOn: 0 }))
        break
      case 'month':
        meals = meals.filter(m => isThisMonth(new Date(m.createdAt)))
        break
    }
    
    // Meal type filter
    if (mealTypeFilter) {
      meals = meals.filter(m => m.mealType === mealTypeFilter)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      meals = meals.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.mealType.toLowerCase().includes(query)
      )
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        meals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        meals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'calories-high':
        meals.sort((a, b) => b.calories - a.calories)
        break
      case 'calories-low':
        meals.sort((a, b) => a.calories - b.calories)
        break
      case 'protein-high':
        meals.sort((a, b) => b.protein - a.protein)
        break
    }
    
    return meals
  }, [allMeals, timeFilter, mealTypeFilter, searchQuery, sortBy])

  // Group meals by day for timeline view
  const mealsByDay = useMemo(() => {
    const grouped: Record<string, Meal[]> = {}
    filteredMeals.forEach(meal => {
      const dateKey = format(new Date(meal.createdAt), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(meal)
    })
    return grouped
  }, [filteredMeals])

  // Calculate totals for filtered meals
  const totals = useMemo(() => {
    return filteredMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
      fiber: acc.fiber + meal.fiber,
      sugar: acc.sugar + meal.sugar,
      count: acc.count + 1
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, count: 0 })
  }, [filteredMeals])

  const toggleDayExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedDays(newExpanded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter a meal name')
      return
    }

    const calories = parseFloat(formData.calories)
    const protein = parseFloat(formData.protein)
    const carbs = parseFloat(formData.carbs)
    const fats = parseFloat(formData.fats)
    const fiber = parseFloat(formData.fiber)
    const sugar = parseFloat(formData.sugar)

    const nonNegative = [calories, protein, carbs, fats, fiber, sugar].every(v => (
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
      fiber: isNaN(fiber) ? 0 : fiber,
      sugar: isNaN(sugar) ? 0 : sugar,
      createdAt: new Date().toISOString()
    }

    try {
      await addData('nutrition', {
        title: `${newMeal.mealType}: ${newMeal.name}`,
        description: `${newMeal.calories} cal | P ${newMeal.protein} / C ${newMeal.carbs} / F ${newMeal.fats} / S ${newMeal.sugar}`,
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
          sugar: newMeal.sugar,
          logType: 'meal'
        }
      })
      setFormData({ name: '', mealType: 'Lunch', calories: '', protein: '', carbs: '', fats: '', fiber: '', sugar: '' })
      setShowAddDialog(false)
      setShowMethodDialog(false)
    } catch (error) {
      console.error('❌ MEALS VIEW: Failed to save meal:', error)
      alert(`Failed to save meal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteMeal = async (id: string) => {
    if (!confirm('Delete this meal?')) return
    setDeletingIds(prev => new Set(prev).add(id))
    try {
      await deleteData('nutrition', id)
    } catch (error) {
      console.error('Failed to delete meal:', error)
      alert('Failed to delete meal. Please try again.')
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const openEditDialog = (meal: Meal) => {
    setEditingMeal(meal)
    setEditFormData({
      name: meal.name,
      mealType: meal.mealType,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fats: String(meal.fats),
      fiber: String(meal.fiber),
      sugar: String(meal.sugar)
    })
    setShowEditDialog(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMeal) return
    
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
          fiber: Number(editFormData.fiber) || 0,
          sugar: Number(editFormData.sugar) || 0
        }
      })
      setShowEditDialog(false)
      setEditingMeal(null)
    } catch (error) {
      console.error('❌ MEALS VIEW: Failed to update meal:', error)
      alert(`Failed to update meal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDocumentSaved = async (doc: UploadedDocument) => {
    const ai = (doc.metadata as any)?.nutritionData
    const parsed = parseMacros(doc.extractedText || '')
    const calories = ai?.nutrition?.calories ?? parsed.calories ?? 0
    const protein = ai?.nutrition?.protein ?? parsed.protein ?? 0
    const carbs = ai?.nutrition?.carbs ?? parsed.carbs ?? 0
    const fats = ai?.nutrition?.fat ?? parsed.fats ?? 0
    const fiber = ai?.nutrition?.fiber ?? parsed.fiber ?? 0
    const sugar = ai?.nutrition?.sugar ?? parsed.sugar ?? 0
    const foods = Array.isArray(ai?.foods) && ai.foods.length > 0
      ? ai.foods.map((f: any) => f.name).join(', ')
      : (doc.extractedText?.split('\n')[0] || doc.name)

    await addData('nutrition', {
      title: `Meal from ${doc.name}`,
      description: `${calories} cal | P ${protein} / C ${carbs} / F ${fats} / S ${sugar}`,
      metadata: {
        type: 'meal',
        logType: 'meal',
        mealType: 'Other',
        name: foods,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        calories, protein, carbs, fats, fiber, sugar,
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
    setShowScanner(false)
  }

  const getDateLabel = (dateKey: string) => {
    const date = parseISO(dateKey)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  const renderMealCard = (meal: Meal, compact = false) => (
    <Card key={meal.id} className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {meal.photo && (
            <img
              src={meal.photo}
              alt={meal.name}
              className={`object-cover rounded-lg border ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${MEAL_TYPE_COLORS[meal.mealType] || 'bg-gray-500'} text-white`}>
                {MEAL_TYPE_ICONS[meal.mealType] || '🍽️'} {meal.mealType}
              </Badge>
              <span className="text-sm text-muted-foreground">{meal.time}</span>
            </div>
            <h4 className={`font-semibold ${compact ? 'text-base' : 'text-xl'}`}>{meal.name}</h4>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`font-bold text-emerald-600 ${compact ? 'text-lg' : 'text-2xl'}`}>{meal.calories}</span>
          <span className="text-sm text-muted-foreground">cal</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openEditDialog(meal)}
            className="text-blue-600 hover:text-blue-700 ml-2"
          >
            <Edit className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => deleteMeal(meal.id)} 
            disabled={deletingIds.has(meal.id)}
            className="text-red-600"
          >
            {deletingIds.has(meal.id) ? (
              <Loader2 className={`animate-spin ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
            ) : (
              <Trash2 className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            )}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-5 gap-2 ${compact ? 'text-sm' : ''}`}>
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className={`font-bold text-blue-600 ${compact ? 'text-lg' : 'text-xl'}`}>{meal.protein}g</p>
          <p className="text-xs text-muted-foreground">Protein</p>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <p className={`font-bold text-green-600 ${compact ? 'text-lg' : 'text-xl'}`}>{meal.carbs}g</p>
          <p className="text-xs text-muted-foreground">Carbs</p>
        </div>
        <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
          <p className={`font-bold text-orange-600 ${compact ? 'text-lg' : 'text-xl'}`}>{meal.fats}g</p>
          <p className="text-xs text-muted-foreground">Fats</p>
        </div>
        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <p className={`font-bold text-purple-600 ${compact ? 'text-lg' : 'text-xl'}`}>{meal.fiber}g</p>
          <p className="text-xs text-muted-foreground">Fiber</p>
        </div>
        <div className="text-center p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
          <p className={`font-bold text-pink-600 ${compact ? 'text-lg' : 'text-xl'}`}>{meal.sugar}g</p>
          <p className="text-xs text-muted-foreground">Sugar</p>
        </div>
      </div>
    </Card>
  )

  const renderTableView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            <th className="text-left p-4 font-semibold">Meal</th>
            <th className="text-left p-4 font-semibold">Type</th>
            <th className="text-right p-4 font-semibold">Cal</th>
            <th className="text-right p-4 font-semibold">Protein</th>
            <th className="text-right p-4 font-semibold">Carbs</th>
            <th className="text-right p-4 font-semibold">Fats</th>
            <th className="text-right p-4 font-semibold">Fiber</th>
            <th className="text-right p-4 font-semibold">Sugar</th>
            <th className="text-center p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMeals.map((meal, idx) => (
            <tr key={meal.id} className={`border-t border-slate-200 dark:border-slate-700 ${idx % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {meal.photo && (
                    <img src={meal.photo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-sm text-muted-foreground">{meal.time}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <Badge className={`${MEAL_TYPE_COLORS[meal.mealType] || 'bg-gray-500'} text-white`}>
                  {meal.mealType}
                </Badge>
              </td>
              <td className="p-4 text-right font-bold text-emerald-600">{meal.calories}</td>
              <td className="p-4 text-right text-blue-600">{meal.protein}g</td>
              <td className="p-4 text-right text-green-600">{meal.carbs}g</td>
              <td className="p-4 text-right text-orange-600">{meal.fats}g</td>
              <td className="p-4 text-right text-purple-600">{meal.fiber}g</td>
              <td className="p-4 text-right text-pink-600">{meal.sugar}g</td>
              <td className="p-4 text-center">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(meal)} className="text-blue-600">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMeal(meal.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100 dark:bg-slate-700 font-semibold">
          <tr>
            <td className="p-4" colSpan={2}>Total ({totals.count} meals)</td>
            <td className="p-4 text-right text-emerald-600">{totals.calories}</td>
            <td className="p-4 text-right text-blue-600">{totals.protein}g</td>
            <td className="p-4 text-right text-green-600">{totals.carbs}g</td>
            <td className="p-4 text-right text-orange-600">{totals.fats}g</td>
            <td className="p-4 text-right text-purple-600">{totals.fiber}g</td>
            <td className="p-4 text-right text-pink-600">{totals.sugar}g</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )

  const renderTimelineView = () => (
    <div className="space-y-4">
      {Object.keys(mealsByDay).sort((a, b) => b.localeCompare(a)).map(dateKey => {
        const dayMeals = mealsByDay[dateKey]
        const dayTotals = dayMeals.reduce((acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fats: acc.fats + m.fats,
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
        const isExpanded = expandedDays.has(dateKey) || Object.keys(mealsByDay).length === 1
        
        return (
          <Card key={dateKey} className="overflow-hidden bg-white/90 dark:bg-slate-800/90">
            <button
              onClick={() => toggleDayExpansion(dateKey)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">{getDateLabel(dateKey)}</h3>
                  <p className="text-sm text-muted-foreground">{dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-bold">{dayTotals.calories} cal</span>
                  <span className="text-blue-600">{dayTotals.protein}g P</span>
                  <span className="text-green-600">{dayTotals.carbs}g C</span>
                  <span className="text-orange-600">{dayTotals.fats}g F</span>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t dark:border-slate-700 p-4 space-y-3">
                {dayMeals.map(meal => renderMealCard(meal, true))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )

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
      
      {/* Method Selection Dialog */}
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

      {/* Add Dialog */}
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
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="450"
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

              <div>
                <Label>Sugar (g)</Label>
                <Input
                  type="number"
                  value={formData.sugar}
                  onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                  placeholder="12"
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

              <div>
                <Label>Sugar (g)</Label>
                <Input
                  type="number"
                  value={editFormData.sugar}
                  onChange={(e) => setEditFormData({ ...editFormData, sugar: e.target.value })}
                  placeholder="12"
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
        {/* Add Meal Button */}
        <Button
          onClick={() => setShowMethodDialog(true)}
          className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-6 w-6 mr-2" />
          Log Meal
        </Button>

        {/* Filter & View Controls */}
        <Card className="p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">View:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map(opt => (
              <Button
                key={opt.id}
                variant={timeFilter === opt.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(opt.id as TimeFilter)}
                className={timeFilter === opt.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Search & Advanced Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>

            {/* More Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-emerald-50 border-emerald-300' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(mealTypeFilter || sortBy !== 'newest') && (
                <Badge className="ml-2 bg-emerald-600 text-white">
                  {[mealTypeFilter, sortBy !== 'newest' ? 1 : 0].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Meal Type</Label>
                <div className="flex gap-1">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                    <Button
                      key={type}
                      variant={mealTypeFilter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMealTypeFilter(mealTypeFilter === type ? null : type)}
                      className={mealTypeFilter === type ? MEAL_TYPE_COLORS[type] : ''}
                    >
                      {MEAL_TYPE_ICONS[type]} {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Sort By</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="p-2 border rounded-md bg-background text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="calories-high">Highest Calories</option>
                  <option value="calories-low">Lowest Calories</option>
                  <option value="protein-high">Highest Protein</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMealTypeFilter(null)
                  setSortBy('newest')
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Summary Card */}
        <Card className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">
                {timeFilter === 'today' ? "Today's" : timeFilter === 'yesterday' ? "Yesterday's" : timeFilter === 'week' ? "This Week's" : timeFilter === 'month' ? "This Month's" : "Total"} Summary
              </h3>
              <p className="text-3xl font-bold">{totals.count} meal{totals.count !== 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">{totals.calories}</p>
                <p className="text-xs opacity-80">Calories</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">{totals.protein}g</p>
                <p className="text-xs opacity-80">Protein</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">{totals.carbs}g</p>
                <p className="text-xs opacity-80">Carbs</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">{totals.fats}g</p>
                <p className="text-xs opacity-80">Fats</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">{totals.sugar}g</p>
                <p className="text-xs opacity-80">Sugar</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Meal List */}
        {filteredMeals.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80">
            <p className="text-muted-foreground text-lg">
              {searchQuery || mealTypeFilter 
                ? 'No meals match your filters' 
                : timeFilter === 'today' 
                  ? "No meals logged today. Start by adding your first meal!" 
                  : "No meals found for this time period"}
            </p>
            {(searchQuery || mealTypeFilter) && (
              <Button 
                variant="link" 
                onClick={() => {
                  setSearchQuery('')
                  setMealTypeFilter(null)
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            {viewMode === 'cards' && (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMeals.map(meal => renderMealCard(meal))}
              </div>
            )}
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'timeline' && renderTimelineView()}
          </>
        )}
      </div>
    </>
  )
}
