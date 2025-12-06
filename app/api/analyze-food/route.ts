import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    console.log('🍽️ Analyzing food photo:', image.name)

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // For now, return a simulated AI analysis
    // In production, you'd call OpenAI Vision API or Google Cloud Vision
    
    // Simulate AI analysis with realistic data
    const foodItems = [
      {
        name: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        confidence: 0.92
      },
      {
        name: 'Brown Rice',
        calories: 218,
        protein: 4.5,
        carbs: 45.8,
        fat: 1.6,
        fiber: 3.5,
        confidence: 0.88
      },
      {
        name: 'Steamed Broccoli',
        calories: 55,
        protein: 3.7,
        carbs: 11.2,
        fat: 0.6,
        fiber: 5.1,
        confidence: 0.85
      }
    ]

    const totalNutrition = {
      calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      protein: foodItems.reduce((sum, item) => sum + item.protein, 0),
      carbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
      fat: foodItems.reduce((sum, item) => sum + item.fat, 0),
      fiber: foodItems.reduce((sum, item) => sum + item.fiber, 0)
    }

    console.log(`✅ Found ${foodItems.length} food items, ${totalNutrition.calories} calories`)

    return NextResponse.json({
      success: true,
      foodItems,
      totalNutrition,
      mealType: determineMealType(),
      imagePreview: `data:image/${image.type.split('/')[1]};base64,${base64Image}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Food analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze food photo',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function determineMealType(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}






















