/**
 * Fitness Calculation Utilities
 * 
 * Provides conversion and estimation functions for fitness tracking:
 * - Miles <-> Steps conversions
 * - Calorie burn estimation
 * - Activity metrics
 */

export interface UserProfile {
  weight?: number // in pounds
  height?: number // in inches
  age?: number
  gender?: 'male' | 'female' | 'other'
  strideLength?: number // in feet (optional, will be calculated from height)
}

export interface ActivityMetrics {
  steps?: number
  distance?: number // in miles
  calories?: number
  duration: number // in minutes
  activityType: string
}

/**
 * Calculate average stride length from height
 * Formula: stride length (feet) = height (inches) × 0.413 / 12
 * 
 * Default assumptions if height not provided:
 * - Average male: 5'9" (69 inches) → ~2.37 feet
 * - Average female: 5'4" (64 inches) → ~2.20 feet
 */
export function calculateStrideLength(heightInches?: number, gender: 'male' | 'female' | 'other' = 'male'): number {
  if (heightInches) {
    return (heightInches * 0.413) / 12
  }
  
  // Default stride lengths
  const defaults = {
    male: 2.37,
    female: 2.20,
    other: 2.28 // Average of both
  }
  
  return defaults[gender] || defaults.other
}

/**
 * Convert miles to steps
 * 
 * @param miles - Distance in miles
 * @param strideLength - Stride length in feet (optional, uses default)
 * @returns Estimated step count
 */
export function milesToSteps(miles: number, strideLength?: number): number {
  const stride = strideLength || 2.3 // Default ~5'6" person
  const feetPerMile = 5280
  const steps = (miles * feetPerMile) / stride
  return Math.round(steps)
}

/**
 * Convert steps to miles
 * 
 * @param steps - Number of steps
 * @param strideLength - Stride length in feet (optional)
 * @returns Distance in miles
 */
export function stepsToMiles(steps: number, strideLength?: number): number {
  const stride = strideLength || 2.3
  const feetPerMile = 5280
  const miles = (steps * stride) / feetPerMile
  return parseFloat(miles.toFixed(2))
}

/**
 * Estimate calories burned for an activity
 * 
 * Uses MET (Metabolic Equivalent of Task) values
 * Formula: Calories = MET × weight(kg) × duration(hours)
 * 
 * @param activityType - Type of activity
 * @param durationMinutes - Duration in minutes
 * @param weightPounds - User weight in pounds (default 165)
 * @returns Estimated calories burned
 */
export function estimateCaloriesBurned(
  activityType: string, 
  durationMinutes: number, 
  weightPounds: number = 165
): number {
  // MET values for common activities
  const MET_VALUES: Record<string, number> = {
    // Cardio
    'running': 11.0,          // ~8 mph (moderate pace)
    'running-fast': 14.5,     // ~10 mph
    'running-slow': 8.0,      // ~5 mph
    'jogging': 7.0,
    'walking': 3.5,           // ~3.5 mph (brisk)
    'walking-slow': 2.5,      // ~2 mph
    'hiking': 6.0,
    'cycling': 8.0,           // ~12-14 mph
    'cycling-fast': 12.0,     // ~16-19 mph
    'cycling-slow': 5.5,      // ~10 mph
    'swimming': 9.0,          // moderate freestyle
    'swimming-fast': 12.0,    // vigorous
    'elliptical': 5.0,
    'rowing': 7.0,
    'stairclimber': 9.0,
    
    // Sports
    'basketball': 8.0,
    'tennis': 7.3,
    'soccer': 10.0,
    'football': 8.0,
    'volleyball': 4.0,
    'golf': 4.8,
    'baseball': 5.0,
    'skiing': 7.0,
    'snowboarding': 5.3,
    
    // Fitness Classes
    'yoga': 3.0,
    'pilates': 3.0,
    'aerobics': 7.3,
    'zumba': 8.8,
    'spinning': 8.5,
    'crossfit': 10.0,
    
    // Strength Training
    'strength training': 6.0,
    'weightlifting': 6.0,
    'weight training': 6.0,
    'bodyweight': 5.0,
    'calisthenics': 5.0,
    
    // Other
    'dancing': 4.8,
    'martial arts': 10.0,
    'boxing': 12.0,
    'jump rope': 12.0,
    'other': 5.0
  }
  
  // Normalize activity type
  const normalizedType = activityType.toLowerCase().trim()
  
  // Find matching MET value
  let metValue = MET_VALUES[normalizedType] || MET_VALUES['other']
  
  // Check for partial matches if exact match not found
  if (metValue === MET_VALUES['other']) {
    for (const [key, value] of Object.entries(MET_VALUES)) {
      if (normalizedType.includes(key)) {
        metValue = value
        break
      }
    }
  }
  
  // Convert weight to kg
  const weightKg = weightPounds * 0.453592
  
  // Convert duration to hours
  const durationHours = durationMinutes / 60
  
  // Calculate calories
  const calories = metValue * weightKg * durationHours
  
  return Math.round(calories)
}

/**
 * Estimate steps from activity type and duration
 * Only applicable for activities that involve stepping
 * 
 * @param activityType - Type of activity
 * @param durationMinutes - Duration in minutes
 * @returns Estimated steps (0 if non-stepping activity)
 */
export function estimateStepsFromActivity(
  activityType: string, 
  durationMinutes: number
): number {
  const normalizedType = activityType.toLowerCase().trim()
  
  // Steps per minute for different activities
  const STEPS_PER_MINUTE: Record<string, number> = {
    'running': 180,           // ~9 min/mile
    'running-fast': 190,      // ~7 min/mile
    'running-slow': 160,      // ~11 min/mile
    'jogging': 160,
    'walking': 110,           // ~3.5 mph
    'walking-slow': 90,       // ~2 mph
    'hiking': 120,
    'elliptical': 140,
    'stairclimber': 130,
    'basketball': 140,
    'soccer': 150,
    'tennis': 130,
    'aerobics': 120,
    'zumba': 130,
    'dancing': 110
  }
  
  // Find matching steps per minute
  let stepsPerMin = 0
  
  for (const [key, value] of Object.entries(STEPS_PER_MINUTE)) {
    if (normalizedType.includes(key)) {
      stepsPerMin = value
      break
    }
  }
  
  return Math.round(stepsPerMin * durationMinutes)
}

/**
 * Enrich activity data with calculated metrics
 * This is the main function to use - it fills in missing data automatically
 * 
 * @param activity - Partial activity data
 * @param userProfile - User profile for personalized calculations
 * @returns Complete activity with all metrics filled in
 */
export function enrichActivityData(
  activity: Partial<ActivityMetrics>,
  userProfile?: UserProfile
): ActivityMetrics {
  const {
    activityType = 'Other',
    duration = 0,
    distance,
    steps,
    calories
  } = activity
  
  const weight = userProfile?.weight || 165 // Default weight
  const strideLength = userProfile?.strideLength || 
                       calculateStrideLength(userProfile?.height, userProfile?.gender)
  
  // Calculate missing metrics
  let calculatedSteps = steps
  let calculatedDistance = distance
  let calculatedCalories = calories
  
  // If distance provided but no steps, calculate steps
  if (distance && !steps) {
    calculatedSteps = milesToSteps(distance, strideLength)
  }
  
  // If steps provided but no distance, calculate distance
  if (steps && !distance) {
    calculatedDistance = stepsToMiles(steps, strideLength)
  }
  
  // If neither steps nor distance, estimate from activity type
  if (!steps && !distance && duration > 0) {
    calculatedSteps = estimateStepsFromActivity(activityType, duration)
    if (calculatedSteps > 0) {
      calculatedDistance = stepsToMiles(calculatedSteps, strideLength)
    }
  }
  
  // Calculate calories if not provided
  if (!calories && duration > 0) {
    calculatedCalories = estimateCaloriesBurned(activityType, duration, weight)
  }
  
  return {
    activityType,
    duration,
    steps: calculatedSteps,
    distance: calculatedDistance,
    calories: calculatedCalories
  }
}

/**
 * Calculate activity pace (min/mile) from distance and duration
 * 
 * @param distanceMiles - Distance in miles
 * @param durationMinutes - Duration in minutes
 * @returns Pace in minutes per mile
 */
export function calculatePace(distanceMiles: number, durationMinutes: number): number {
  if (distanceMiles <= 0) return 0
  return durationMinutes / distanceMiles
}

/**
 * Format pace as "MM:SS" per mile
 * 
 * @param paceMinPerMile - Pace in minutes per mile
 * @returns Formatted pace string (e.g., "8:30")
 */
export function formatPace(paceMinPerMile: number): string {
  if (paceMinPerMile <= 0) return '--:--'
  
  const minutes = Math.floor(paceMinPerMile)
  const seconds = Math.round((paceMinPerMile - minutes) * 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Calculate estimated finish time for a race
 * 
 * @param paceMinPerMile - Current pace
 * @param raceDistance - Race distance in miles
 * @returns Estimated finish time in minutes
 */
export function estimateRaceTime(paceMinPerMile: number, raceDistance: number): number {
  return paceMinPerMile * raceDistance
}

/**
 * Common race distances
 */
export const RACE_DISTANCES = {
  '5K': 3.10686,
  '10K': 6.21371,
  'Half Marathon': 13.1094,
  'Marathon': 26.2188
}
















