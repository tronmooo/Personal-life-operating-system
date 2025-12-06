'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, Check, X } from 'lucide-react'
import { analyzeMealPhoto } from '@/lib/services/ai-meal-analyzer'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

export function MealPhotoAnalyzer() {
  const { addData } = useData()
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [isSaved, setIsSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImage(base64)
      setAnalysis(null)
      setIsSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) return

    setIsAnalyzing(true)
    try {
      // Extract base64 from data URL
      const base64 = image.split(',')[1]
      const result = await analyzeMealPhoto(base64)
      setAnalysis(result)
    } catch (error) {
      alert('Failed to analyze meal. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = () => {
    if (!analysis) return

    // Save to nutrition domain
    addData('nutrition', {
      title: `${analysis.mealType || 'Meal'} - ${new Date().toLocaleDateString()}`,
      description: `${analysis.items.map((i: any) => i.name).join(', ')} - ${analysis.totalCalories} calories`,
      metadata: {
        type: 'meal-photo',
        mealType: analysis.mealType,
        imageUrl: image,
        items: analysis.items,
        totalCalories: analysis.totalCalories,
        totalProtein: analysis.totalProtein,
        totalCarbs: analysis.totalCarbs,
        totalFat: analysis.totalFat,
        totalFiber: analysis.totalFiber,
        analyzedAt: analysis.analyzedAt,
        logType: 'meal'
      }
    })

    setIsSaved(true)
    setTimeout(() => {
      setImage(null)
      setAnalysis(null)
      setIsSaved(false)
    }, 2000)
  }

  const handleReset = () => {
    setImage(null)
    setAnalysis(null)
    setIsSaved(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-500" />
            AI Meal Analyzer
          </CardTitle>
          <CardDescription>
            Take a photo of your meal and let AI identify the food and calculate nutrition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Options */}
          {!image && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8" />
                <span>Choose Photo</span>
              </Button>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Image Preview */}
          {image && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={image}
                  alt="Meal"
                  className="w-full rounded-lg object-cover max-h-96"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!analysis && !isAnalyzing && (
                <Button onClick={handleAnalyze} className="w-full" size="lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze with AI
                </Button>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-3 p-6 bg-accent rounded-lg">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-lg font-medium">AI analyzing your meal...</span>
                </div>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isSaved && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">AI Analysis Complete</h3>
                </div>
                
                {/* Meal Type */}
                <div className="mb-4">
                  <Badge className="text-lg px-3 py-1 capitalize">
                    {analysis.mealType}
                  </Badge>
                </div>

                {/* Nutrition Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analysis.totalCalories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.totalProtein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analysis.totalCarbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analysis.totalFat}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                </div>

                {/* Food Items */}
                <div className="space-y-2">
                  <h4 className="font-medium">Detected Items:</h4>
                  {analysis.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({item.quantity})</span>
                      </div>
                      <div className="text-sm font-medium">{item.calories} cal</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} className="w-full" size="lg">
                <Check className="h-5 w-5 mr-2" />
                Save to Nutrition Domain
              </Button>
            </div>
          )}

          {/* Success Message */}
          {isSaved && (
            <div className="flex items-center justify-center gap-3 p-6 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
              <Check className="h-6 w-6 text-green-600" />
              <span className="text-lg font-medium text-green-600">Meal saved successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

























