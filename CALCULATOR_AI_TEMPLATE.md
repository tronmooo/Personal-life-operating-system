# Calculator AI Enhancement Template

This guide shows how to add AI-powered insights to ANY calculator in the app.

## Quick Start

Follow these 5 steps to add AI to any calculator:

### Step 1: Add Imports

```typescript
// Add these to your existing imports
import { Sparkles } from 'lucide-react'
import { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'
import { CalculatorAIInsightsComponent } from './calculator-ai-insights'
```

### Step 2: Add AI Hook to Component

```typescript
export function YourCalculator() {
  // ... existing state ...
  
  // Add AI Insights hook
  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()
  
  // ... rest of component ...
}
```

### Step 3: Make Calculate Function Async

```typescript
// Change from:
const calculate = () => {
  // ... calculation logic ...
  setResult(resultData)
}

// To:
const calculate = async () => {
  // ... calculation logic ...
  setResult(resultData)
  
  // Generate AI insights
  await generateInsights({
    calculatorType: 'TYPE_HERE', // e.g., 'bmi', 'mortgage', 'calorie'
    inputData: {
      // All input values used in calculation
      field1: parseFloat(field1),
      field2: parseFloat(field2),
      // ... etc
    },
    result: resultData
  })
}
```

### Step 4: Update Calculate Button

```typescript
// Change from:
<Button onClick={calculate} className="w-full">
  Calculate
</Button>

// To:
<Button onClick={calculate} className="w-full">
  <Sparkles className="w-4 h-4 mr-2" />
  Calculate with AI Insights
</Button>
```

### Step 5: Add AI Insights Component

```typescript
// Add at the end, before the closing div
{result && (
  <CalculatorAIInsightsComponent
    insights={insights}
    loading={aiLoading}
    error={aiError}
    onRefresh={() => generateInsights({
      calculatorType: 'TYPE_HERE',
      inputData: { /* same as step 3 */ },
      result
    })}
  />
)}
```

## Complete Example: BMI Calculator

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Activity, Sparkles } from 'lucide-react'
import { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'
import { CalculatorAIInsightsComponent } from './calculator-ai-insights'

export function BMICalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bmi, setBmi] = useState<number | null>(null)
  
  // AI Insights
  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()

  const calculate = async () => {
    const w = parseFloat(weight)
    const h = parseFloat(height) / 100
    const bmiValue = w / (h * h)
    
    setBmi(bmiValue)
    
    // Generate AI insights
    await generateInsights({
      calculatorType: 'bmi',
      inputData: {
        weight: w,
        height: parseFloat(height),
        heightUnit: 'cm',
        weightUnit: 'kg'
      },
      result: {
        bmi: bmiValue,
        category: getBMICategory(bmiValue).label
      }
    })
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' }
    if (bmi < 25) return { label: 'Normal weight', color: 'text-green-600' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' }
    return { label: 'Obese', color: 'text-red-600' }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            BMI Calculator
          </CardTitle>
          <CardDescription>
            Calculate your Body Mass Index with AI insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Calculate BMI with AI Insights
          </Button>

          {/* Results display */}
          {bmi !== null && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{bmi.toFixed(1)}</p>
                  <p className={`text-lg font-semibold mt-2 ${getBMICategory(bmi).color}`}>
                    {getBMICategory(bmi).label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      {bmi !== null && (
        <CalculatorAIInsightsComponent
          insights={insights}
          loading={aiLoading}
          error={aiError}
          onRefresh={() => generateInsights({
            calculatorType: 'bmi',
            inputData: {
              weight: parseFloat(weight),
              height: parseFloat(height),
              heightUnit: 'cm',
              weightUnit: 'kg'
            },
            result: {
              bmi,
              category: getBMICategory(bmi).label
            }
          })}
        />
      )}
    </div>
  )
}
```

## Calculator Types

Use these `calculatorType` values for best results:

### Health & Fitness
- `bmi` - BMI Calculator
- `calorie` - Calorie/TDEE Calculator
- `health` - General health metrics
- `fitness` - Fitness/workout calculations

### Financial
- `mortgage` - Mortgage/home loan
- `retirement` - Retirement planning
- `debt` - Debt payoff
- `compound` - Compound interest
- `savings` - Savings goals
- `investment` - Investment calculations
- `loan` - General loans
- `budget` - Budget planning
- `tax` - Tax calculations

### Business
- `business` - Business calculations (ROI, markup, etc.)

### Property
- `property` - Home improvement calculations

### Generic
- `generic` - For any other calculator

## API Integration

The AI insights are powered by:
1. **Primary**: Gemini API (Google, FREE)
2. **Fallback**: OpenAI GPT-4 (requires `OPENAI_API_KEY`)

Both are configured in `lib/services/ai-service.ts`.

## What the AI Provides

The AI generates:
- **Summary**: Brief overview of results
- **Insights**: 3-5 key takeaways
- **Recommendations**: Actionable advice
- **Warnings**: Important considerations (optional)
- **Comparisons**: Benchmarks vs. norms (optional)
- **Next Steps**: Follow-up actions (optional)

## Testing

1. Add `OPENAI_API_KEY` to `.env.local`
2. Run calculator and click "Calculate with AI Insights"
3. AI insights appear below results in ~2-3 seconds
4. Click "Regenerate Insights" to get new analysis

## Benefits

✅ **Consistent UX**: Same insights experience across all calculators
✅ **Type-Safe**: Full TypeScript support
✅ **Loading States**: Automatic loading indicators
✅ **Error Handling**: Graceful fallbacks
✅ **No Backend Changes**: Uses existing AI service
✅ **5-Minute Integration**: Quick to add to any calculator

## Need Help?

- See `components/tools/bmi-calculator.tsx` for working example
- See `components/tools/mortgage-calculator.tsx` for financial example
- See `lib/hooks/use-calculator-ai.ts` for hook documentation
- See `app/api/calculators/ai-insights/route.ts` for API logic

