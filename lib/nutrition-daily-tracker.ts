/**
 * Nutrition Daily Tracker
 * Manages daily nutrition data with automatic reset at midnight
 * NOW USING DATABASE VIA DATAPROVIDER (NO localStorage)
 */

export interface DailyNutrition {
  date: string // YYYY-MM-DD format
  calories: number
  protein: number
  carbs: number
  fats: number
  water: number // in oz
  meals: number
  logs: any[] // All nutrition logs for the day
}

// History now stored in database via DataProvider
const MAX_HISTORY_DAYS = 90 // Keep 3 months of history

/**
 * Get today's date in YYYY-MM-DD format (LOCAL timezone, not UTC)
 */
export function getTodayDate(): string {
  const now = new Date()
  // Use local timezone instead of UTC
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Check if nutrition data is from today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate()
}

/**
 * Get today's nutrition data (resets daily)
 */
export function getTodayNutrition(allNutritionData: any[]): any[] {
  const today = getTodayDate()
  return allNutritionData.filter(item => {
    // Handle multiple possible date fields (createdAt vs created_at)
    const rawDate = item.metadata?.date || item.createdAt || item.created_at
    if (!rawDate) return false
    
    // Parse and compare in LOCAL timezone
    const itemDate = new Date(rawDate)
    const itemLocalDate = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`
    
    return itemLocalDate === today
  })
}

/**
 * Calculate nutrition totals for today
 */
export function calculateTodayTotals(allNutritionData: any[]): {
  calories: number
  protein: number
  carbs: number
  fats: number
  water: number
  meals: number
} {
  const today = getTodayDate()
  const todayData = getTodayNutrition(allNutritionData)
  
  console.log(`🥗 [Nutrition] Today is: ${today}`)
  console.log(`🥗 [Nutrition] Total entries: ${allNutritionData.length}, Today's entries: ${todayData.length}`)
  
  if (allNutritionData.length > 0 && todayData.length === 0) {
    console.log('🥗 [Nutrition] ⚠️ No entries for today! Sample dates from all entries:',
      allNutritionData.slice(0, 3).map(item => {
        const date = item.metadata?.date || item.createdAt
        return { title: item.title, date: date ? date.split('T')[0] : 'NO DATE' }
      })
    )
  }
  
  const totals = todayData.reduce((totals, item) => {
    // 🔧 FIX: Handle nested metadata.metadata structure
    const metadata = item.metadata?.metadata || item.metadata || {}
    
    // 🔧 FIX: Check for water entry using BOTH type AND itemType field names
    const isWaterEntry = metadata.type === 'water' || 
                         metadata.itemType === 'water' || 
                         metadata.logType === 'water'
    
    // Calculate water: check if this is a water entry
    let waterAmount = 0
    if (isWaterEntry) {
      // Water entries may use value, amount, or water field
      waterAmount = Number(metadata.value || metadata.amount || metadata.water || 0)
    } else {
      // Legacy water entries might use metadata.water or metadata.waterOz
      waterAmount = Number(metadata.water || metadata.waterOz || 0)
    }
    
    // 🔧 FIX: Count meals using both type and itemType
    const isMealEntry = metadata.mealType || 
                        metadata.type === 'meal' || 
                        metadata.itemType === 'meal' ||
                        metadata.logType === 'meal'
    
    return {
      calories: totals.calories + (Number(metadata.calories) || 0),
      protein: totals.protein + (Number(metadata.protein) || 0),
      carbs: totals.carbs + (Number(metadata.carbs) || 0),
      fats: totals.fats + (Number(metadata.fats) || 0),
      water: totals.water + waterAmount,
      meals: totals.meals + (isMealEntry ? 1 : 0)
    }
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    meals: 0
  })
  
  console.log('🥗 [Nutrition] Today\'s totals:', totals)
  
  return totals
}

/**
 * Get nutrition history from DataProvider nutrition domain items
 * @param nutritionData - All nutrition data from DataProvider
 */
export function getDailyNutritionHistory(nutritionData: any[]): DailyNutrition[] {
  try {
    // Filter for nutrition-history items
    const historyItems = nutritionData.filter(item => 
      item.metadata?.itemType === 'nutrition-history'
    )
    
    // Transform to DailyNutrition format
    return historyItems
      .map(item => ({
        date: item.metadata?.date || '',
        calories: item.metadata?.calories || 0,
        protein: item.metadata?.protein || 0,
        carbs: item.metadata?.carbs || 0,
        fats: item.metadata?.fats || 0,
        water: item.metadata?.water || 0,
        meals: item.metadata?.meals || 0,
        logs: item.metadata?.logs || []
      }))
      .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
      .slice(0, MAX_HISTORY_DAYS)
  } catch (error) {
    console.error('Failed to load nutrition history:', error)
    return []
  }
}

/**
 * NOTE: saveDailyNutritionToHistory is no longer needed as a separate function.
 * History is automatically saved via DataProvider when you call addData('nutrition', {...})
 * with itemType: 'nutrition-history'
 */

/**
 * Get nutrition data for a specific date range
 * @param nutritionData - All nutrition data from DataProvider
 */
export function getNutritionForDateRange(nutritionData: any[], startDate: string, endDate: string): DailyNutrition[] {
  const history = getDailyNutritionHistory(nutritionData)
  return history.filter(entry => entry.date >= startDate && entry.date <= endDate)
}

/**
 * Get weekly nutrition average
 * @param nutritionData - All nutrition data from DataProvider
 */
export function getWeeklyNutritionAverage(nutritionData: any[]): {
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFats: number
  avgWater: number
} {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  const startDate = sevenDaysAgo.toISOString().split('T')[0]
  const endDate = getTodayDate()
  
  const weekData = getNutritionForDateRange(nutritionData, startDate, endDate)
  
  if (weekData.length === 0) {
    return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFats: 0, avgWater: 0 }
  }
  
  const totals = weekData.reduce((acc, day) => ({
    totalCalories: acc.totalCalories + day.calories,
    totalProtein: acc.totalProtein + day.protein,
    totalCarbs: acc.totalCarbs + day.carbs,
    totalFats: acc.totalFats + day.fats,
    totalWater: acc.totalWater + day.water
  }), {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    totalWater: 0
  })
  
  const days = weekData.length
  
  return {
    avgCalories: Math.round(totals.totalCalories / days),
    avgProtein: Math.round(totals.totalProtein / days),
    avgCarbs: Math.round(totals.totalCarbs / days),
    avgFats: Math.round(totals.totalFats / days),
    avgWater: Math.round(totals.totalWater / days)
  }
}

/**
 * Archive yesterday's nutrition data
 * Returns the data payload to save via DataProvider
 * Call this function when day changes
 * @returns Data to save via addData('nutrition', returnedValue)
 */
export function archiveTodayNutrition(allNutritionData: any[]): { title: string; description: string; metadata: any } | null {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().split('T')[0]
  
  const yesterdayData = allNutritionData.filter(item => {
    const itemDate = item.metadata?.date || item.createdAt
    if (!itemDate) return false
    return itemDate.split('T')[0] === yesterdayDate
  })
  
  if (yesterdayData.length === 0) return null
  
  const totals = yesterdayData.reduce((acc, item) => {
    const metadata = item.metadata || {}
    
    // 🔧 FIX: Check for water entry using BOTH type AND itemType field names
    const isWaterEntry = metadata.type === 'water' || 
                         metadata.itemType === 'water' || 
                         metadata.logType === 'water'
    
    // Calculate water: check if this is a water entry
    let waterAmount = 0
    if (isWaterEntry) {
      // Water entries may use value, amount, or water field
      waterAmount = Number(metadata.value || metadata.amount || metadata.water || 0)
    } else {
      // Legacy water entries might use metadata.water or metadata.waterOz
      waterAmount = Number(metadata.water || metadata.waterOz || 0)
    }
    
    // 🔧 FIX: Count meals using both type and itemType
    const isMealEntry = metadata.mealType || 
                        metadata.type === 'meal' || 
                        metadata.itemType === 'meal' ||
                        metadata.logType === 'meal'
    
    return {
      calories: acc.calories + (Number(metadata.calories) || 0),
      protein: acc.protein + (Number(metadata.protein) || 0),
      carbs: acc.carbs + (Number(metadata.carbs) || 0),
      fats: acc.fats + (Number(metadata.fats) || 0),
      water: acc.water + waterAmount,
      meals: acc.meals + (isMealEntry ? 1 : 0)
    }
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
    meals: 0
  })
  
  // Return data payload to save via DataProvider
  return {
    title: `Nutrition History - ${yesterdayDate}`,
    description: `Daily nutrition summary for ${yesterdayDate}`,
    metadata: {
      itemType: 'nutrition-history',
      date: yesterdayDate,
      ...totals,
      logs: yesterdayData.map(item => item.id) // Store references to log IDs
    }
  }
}

