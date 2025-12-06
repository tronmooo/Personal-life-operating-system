import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'

// Google Cloud credentials
const credentials = {
  type: "service_account",
  project_id: "petpal-wellness-votzr",
  private_key_id: "fb107db783eeb81088c06673e063198e97e6d6b2",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQP/lrjizrDa5U\nqlC2SzaWvD0ZlJnQmrLANF0tFroUSHsdcjEQoQh6MzRrD+aWqNJroukMI0/bot77\n7WqPSVYEDz8MWSPNwH2YpavO216fJDm/NUHYNzU8BQK38o0fJTkVXgCdiSC667eG\n4qJDbv8eMfohlw3Vk+aFMglyjlrzojHD51/mmKxs471MRiXEzR18RbSIfdPtTioy\npW8XsKlEzMv1lz1+t2ah1pFvu+PJ9GdchkccIQHreCizCU9A/71D9ziQ7ce0efgq\nuw9NqPQgXBJiWbDS4hA5ZeVZsa6ti1PIHDQgeQbELezUl9yDhBbxFRarjE2F0eUv\neN2Jv6VLAgMBAAECggEAOPSGPshPuKmxOC6sjG7dqzQoccqWltr4cGDh6ucAVXPN\nWCxXBvlD3EgM2gsrQaFCi3Wuz0cJHETbP4ObVTz1bX7N+46VoDw5HXqSFq0gn93E\nfWsPaxcOVC/6olyQBCimCBYBjRRoAzdcpmNthYvh8lww0OcDPZqJvXwF4XLVpTQE\nhDksMHexFfuIMDhFimBrNSy8FSvEjGFJvj6yYtNb15GeHS5U2xPfI+tUiJDJXCSp\neKReMiffDn7piH8SK2sYU0XloajfYMuaWoToch4zFRZ9N68DBJ9HxpDKAt85QpyT\nvIV0k1JbnsqQ6JAvLFdLJnKmnsYnGvpHNErfdREO4QKBgQDxWvSJiO3Mi1EjMTzF\ncfwHjNVCkZO/obiNtbDqmcC3FPGf9E1J6Du3woXq5BDmh1XkZoHpTdsisCZYVVm5\nINbYTtjhBmhCDyUsA7eXTXsvQjBn1428GN779BaEeo2hbSHAtv719vqypGYZnfY6\nbLNgzWelbzieAXjfa8lWEhZnzwKBgQDc4shw4SAj9NESQPbl6bn7hLiVISK6UC+L\n7VLjMSEncpAxcxXvHI6eXV2rddNLr8QUgoflgsZIfRr39y+TsMuMJLu49EpvSLzm\nksV/U8eLzhg1gjlST5paoPBOQIevTbKNn7Gmsva3g5zeFJ+UirJwlk/ZE+zEd7PF\nZjDus8/NxQKBgAeH/Atyn2D7k+uSNMBAf0nJBjqOilq3dCfP3JZld9L+r097cxH0\nUjC4vC8JMNHQtUhsPm+GQ2lAr+GfwC37rViQlUnoRkaRbGqELy1keIyP9yy2WDDf\nYc3g3vcBT/wSiLQXwbrxGv+KC7mO6UkHbU1++1X5M34Ss6/dECpEZDiXAoGAbL08\nHc3GK81Oy2St5ztrsnWBBPFeDkiBT6pSnsPF5YyRjbZxOthdIXsnLMyBa4YoykwE\nKKl7gZ4NE7tdcaCcY+6Fd6TTq/sr+3qPvYH5/0pDQrxMCchkXW9TPcKoyVU/rFbM\ndxstN+ST6gRPFyo8dA6bWmtjqMig+HG5bxmYGF0CgYBdH3eTFAuZdJVtq949EuFg\n3mIBIHiBI9fvgBjnyXf/sobwe2PS4kgzY/8uzJU/Kyd+PNwat9gzMNlT5VOPy7tP\nA25JNSjjEQfFKwtgA1MQImnaWLl5GI8keiTmJIhBicN2ngGjwVijYcrBu4absK0+\nNiTgoI5aGz0wTd2z01ifVQ==\n-----END PRIVATE KEY-----\n",
  client_email: "api-credentials-service-accoun@petpal-wellness-votzr.iam.gserviceaccount.com",
  client_id: "109363687951001546687",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/api-credentials-service-accoun%40petpal-wellness-votzr.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
}

// Initialize Vision API client
const client = new vision.ImageAnnotatorClient({
  credentials,
  projectId: credentials.project_id
})

// Nutrition database (simplified - you can expand this)
const NUTRITION_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number }> = {
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1 },
  'broccoli': { calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 2.4, sugar: 2.2 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.8 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.1, sugar: 0.8 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 },
  'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6 },
  'lettuce': { calories: 5, protein: 0.5, carbs: 1, fat: 0.1, fiber: 0.5, sugar: 0.4 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7 },
  'onion': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sugar: 4.2 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2 },
  'pepper': { calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7, sugar: 2.4 },
  'avocado': { calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, sugar: 0.7 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9 },
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.5, sugar: 3.8 },
  'burger': { calories: 295, protein: 17, carbs: 32, fat: 11, fiber: 1.5, sugar: 6 },
  'sandwich': { calories: 230, protein: 10, carbs: 27, fat: 9, fiber: 2, sugar: 4 },
  'salad': { calories: 150, protein: 5, carbs: 15, fat: 8, fiber: 4, sugar: 5 },
  'soup': { calories: 100, protein: 4, carbs: 15, fat: 2, fiber: 2, sugar: 3 },
}

function getNutritionForFood(foodName: string, quantity: string = '1 serving') {
  const lowerFood = foodName.toLowerCase()
  
  // Find closest match in database
  for (const [key, nutrition] of Object.entries(NUTRITION_DATABASE)) {
    if (lowerFood.includes(key) || key.includes(lowerFood)) {
      // Adjust for quantity (simplified - assumes serving size)
      let multiplier = 1
      if (quantity.toLowerCase().includes('large') || quantity.includes('2')) {
        multiplier = 1.5
      } else if (quantity.toLowerCase().includes('small') || quantity.includes('half')) {
        multiplier = 0.5
      }
      
      return {
        calories: Math.round(nutrition.calories * multiplier),
        protein: Math.round(nutrition.protein * multiplier),
        carbs: Math.round(nutrition.carbs * multiplier),
        fat: Math.round(nutrition.fat * multiplier),
        fiber: Math.round(nutrition.fiber * multiplier),
        sugar: Math.round(nutrition.sugar * multiplier),
      }
    }
  }
  
  // Default fallback
  return { calories: 200, protein: 10, carbs: 25, fat: 8, fiber: 2, sugar: 3 }
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '')
    
    // Call Google Vision API
    const [result] = await client.labelDetection({
      image: { content: base64Image }
    })
    
    const labels = result.labelAnnotations || []
    
    // Also get web detection for more food context
    const [webResult] = await client.webDetection({
      image: { content: base64Image }
    })
    
    const webLabels = webResult.webDetection?.webEntities || []
    
    // Combine labels
    const allLabels = [
      ...labels.map(l => ({ description: l.description || '', score: l.score || 0 })),
      ...webLabels.map(l => ({ description: l.description || '', score: l.score || 0 }))
    ]
    
    // Filter for food-related labels
    const foodLabels = allLabels
      .filter(label => {
        const desc = label.description.toLowerCase()
        const isFoodRelated = 
          desc.includes('food') ||
          desc.includes('dish') ||
          desc.includes('meal') ||
          desc.includes('cuisine') ||
          desc.includes('ingredient') ||
          desc.includes('vegetable') ||
          desc.includes('fruit') ||
          desc.includes('meat') ||
          desc.includes('drink') ||
          desc.includes('beverage') ||
          Object.keys(NUTRITION_DATABASE).some(food => desc.includes(food))
        return isFoodRelated
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8) // Top 8 food items
    
    // Generate food items from labels
    const detectedFoods = foodLabels.map((label, index) => {
      const foodName = label.description
      const quantity = index === 0 ? '1 serving' : '1 portion'
      const nutrition = getNutritionForFood(foodName, quantity)
      
      return {
        name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
        quantity,
        calories: nutrition.calories,
        confidence: Math.round((label.score || 0.7) * 100) / 100
      }
    })
    
    // If no food items detected, provide a generic meal
    if (detectedFoods.length === 0) {
      detectedFoods.push({
        name: 'Mixed Meal',
        quantity: '1 serving',
        calories: 400,
        confidence: 0.5
      })
    }
    
    // Calculate total nutrition
    const totalNutrition = detectedFoods.reduce((total, food) => {
      const nutrition = getNutritionForFood(food.name, food.quantity)
      return {
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
        carbs: total.carbs + nutrition.carbs,
        fat: total.fat + nutrition.fat,
        fiber: total.fiber + nutrition.fiber,
        sugar: total.sugar + nutrition.sugar,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 })
    
    return NextResponse.json({
      success: true,
      foods: detectedFoods,
      nutrition: totalNutrition,
      rawLabels: labels.slice(0, 10).map(l => l.description) // For debugging
    })
    
  } catch (error: any) {
    console.error('Error analyzing food:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze image', 
        details: error.message,
        fallback: true
      },
      { status: 500 }
    )
  }
}

